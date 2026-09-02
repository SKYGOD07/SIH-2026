import { Router, Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { env, isOllamaCloud, ollamaReadiness, aiEncryptionReadiness } from '../../config/env';
import { authenticate, requireVerifiedEmail, requireRole } from '../../auth/authenticate';
import { sendSuccess } from '../../utils/response';
import { AI_DISCLOSURE, AI_TASKS, AI_TASK_LABELS } from './ai.contract';
import {
  analysePilotProgress,
  briefChallenge,
  draftEvaluation,
  draftPilotPlan,
  explainKpis,
  explainMatch,
  explainScaleRecommendation,
  lastAiRequestAt,
  summariseEvidence,
  summarisePilotOutcome,
  summariseStartup,
} from './ai.service';
import {
  FIELD_TAXONOMY,
  browsableFields,
  discoverStartups,
  filterOptions,
  suggestFields,
  compareStartups,
  portfolioOverview,
} from './discovery.service';

/**
 * AI routes.
 *
 * Two groups with different guards, and the difference is the point.
 *
 * The `/discover/*` routes below are deterministic queries over the company
 * table. They do not call a model and they are left open, because they are what
 * the public-facing discovery surface reads.
 *
 * Everything that reaches a model is authenticated and email-verified. That is
 * not ceremony: a generation endpoint is an unmetered call to a paid host and a
 * writer to the audit trail, and an anonymous caller can be neither billed nor
 * recorded. The previous version of this file accepted an unauthenticated
 * analyse request and wrote the resulting audit row against a zero UUID, which
 * put un-attributable rows in the one table whose value is attribution.
 */

const router = Router();

/** The model-facing guard, applied per route rather than to the whole router. */
const requiresAi = [authenticate, requireVerifiedEmail];

/** Configuration and connectivity are internal detail: officers and admins. */
const requiresOfficer = [
  authenticate,
  requireVerifiedEmail,
  requireRole(UserRole.GOVERNMENT_OFFICER, UserRole.EVALUATOR, UserRole.ADMIN),
];

/** Wrap an async handler so a rejection reaches the error handler. */
const h =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

/** A required string from the body, or a 422 the caller can act on. */
function required(req: Request, field: string): string {
  const v = req.body?.[field];
  if (typeof v !== 'string' || !v.trim()) {
    const err = new Error(`${field} is required`) as Error & { statusCode?: number };
    err.statusCode = 422;
    throw err;
  }
  return v.trim();
}

/* ------------------------------------------------------------ GET /ai/status */

/**
 * What the AI layer is doing, without any secret material.
 *
 * Two audiences in one payload. Everything at the top level is what a
 * government officer needs — is it working, which model, when was it last used.
 * `configuration` is the implementation detail, and it is present only for
 * admins, because a base URL and an environment variable name are a developer's
 * concern and putting them on an officer's settings page is how a settings page
 * stops being useful.
 *
 * The key itself is never returned in either case. Only whether one exists.
 */
router.get(
  '/status',
  ...requiresAi,
  h(async (req, res) => {
    const readiness = ollamaReadiness();
    const isAdmin = req.profile?.role === UserRole.ADMIN;

    return sendSuccess(res, {
      enabled: env.AI_ENABLED,
      ready: readiness.ready,
      reason: readiness.reason ?? null,
      provider: 'Ollama',
      mode: readiness.mode,
      model: env.OLLAMA_MODEL || null,
      embedModel: env.OLLAMA_EMBED_MODEL || null,
      lastRequestAt: await lastAiRequestAt(),
      disclosure: AI_DISCLOSURE,
      tasks: AI_TASKS.map((t) => ({ task: t, label: AI_TASK_LABELS[t] })),

      // Admin-only. Absent, not nulled, for everyone else.
      configuration: isAdmin
        ? {
            baseUrl: env.OLLAMA_BASE_URL,
            hosted: isOllamaCloud(),
            apiKeyConfigured: Boolean(env.OLLAMA_API_KEY),
            timeoutMs: env.OLLAMA_TIMEOUT_MS,
            perUserCredentialStorage: aiEncryptionReadiness(),
            environment: env.NODE_ENV,
          }
        : undefined,
    });
  }),
);

/* -------------------------------------------------------------- GET /ai/policy */

/**
 * The rules this layer operates under, served as data.
 *
 * The interface has a "View AI policy" control and it should show the actual
 * policy rather than a copy of it maintained separately in a component — a
 * second copy is a copy that will disagree after the first change.
 */
router.get('/policy', ...requiresAi, (_req: Request, res: Response) =>
  sendSuccess(res, {
    disclosure: AI_DISCLOSURE,
    deterministic: [
      'Eligibility rules',
      'Match and score calculation',
      'Role permissions',
      'Pilot state transitions',
      'Evidence acceptance state',
      'Milestone and payment state',
      'Scale decision authority',
    ],
    assisted: [
      'Explanation of computed results',
      'Summarisation of stored records',
      'Drafting for a human to edit',
      'Identifying missing information',
      'Generating questions for the officer',
    ],
    guarantees: [
      'The model is given a constructed context, never a database dump.',
      'Its response must match a fixed schema or it is discarded.',
      'Citations not present in the supplied context are removed and reported.',
      'It cannot create an approval, a verification status, a financial fact, a certification or a pilot result.',
      'If it is unavailable, every surface falls back to a deterministic reading of the same records.',
      'Each generation is recorded in the audit trail as AI_ANALYSIS_GENERATED — never as a human evaluation.',
    ],
  }),
);

/* --------------------------------------------------------------- POST /ai/test */

/**
 * A live connectivity check against the configured host.
 *
 * Lists models, which is the cheapest call that proves the endpoint is both
 * reachable and authenticated. The key is never accepted from the request — the
 * backend uses only what is in its own environment, so this endpoint cannot be
 * used to probe an arbitrary host with an arbitrary credential.
 */
router.post(
  '/test',
  ...requiresOfficer,
  h(async (_req, res) => {
    const readiness = ollamaReadiness();

    if (!readiness.ready) {
      return res.status(400).json({ success: false, error: readiness.reason ?? 'Ollama is not configured' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (env.OLLAMA_API_KEY) headers['Authorization'] = `Bearer ${env.OLLAMA_API_KEY}`;

    try {
      const response = await fetch(`${env.OLLAMA_BASE_URL.replace(/\/$/, '')}/api/tags`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        return res.status(502).json({
          success: false,
          error: `Ollama returned ${response.status}${body ? `: ${body.slice(0, 200)}` : ''}`,
        });
      }

      const data = (await response.json().catch(() => ({ models: [] }))) as {
        models?: { name?: string }[];
      };
      const models = (data.models ?? []).map((m) => m.name ?? '').filter(Boolean);

      return sendSuccess(res, {
        connected: true,
        mode: readiness.mode,
        models,
        configuredModelPresent: models.some((m) => m.startsWith(env.OLLAMA_MODEL)),
        configuredEmbedModelPresent: models.some((m) => m.startsWith(env.OLLAMA_EMBED_MODEL)),
      });
    } catch (err: unknown) {
      clearTimeout(timeout);
      const message = err instanceof Error ? err.message : String(err);
      const isTimeout = message.includes('abort') || message.includes('timeout');
      return res.status(502).json({
        success: false,
        error: isTimeout ? 'Connection timed out — is the model host reachable?' : `Connection failed: ${message}`,
      });
    }
  }),
);

/* ----------------------------------------------------------------- surfaces */

/*
 * The ten assistance surfaces.
 *
 * Every one of these returns 200 with an envelope even when the model is
 * unreachable: `assisted: false` and the deterministic reading of the same
 * records. A caller never has to handle "AI is down" as an error path, which is
 * what keeps the workflow independent of the model rather than coupled to it.
 */

/** A. Challenge briefing. */
router.post(
  '/brief-challenge',
  ...requiresAi,
  h(async (req, res) => sendSuccess(res, await briefChallenge(req.profile!, required(req, 'challengeId')))),
);

/** B. Company summary. */
router.post(
  '/summarise-startup',
  ...requiresAi,
  h(async (req, res) => sendSuccess(res, await summariseStartup(req.profile!, required(req, 'startupId')))),
);

/** C. Why this company was matched. */
router.post(
  '/explain-match',
  ...requiresAi,
  h(async (req, res) =>
    sendSuccess(res, await explainMatch(req.profile!, required(req, 'challengeId'), required(req, 'startupId'))),
  ),
);

/** D. Evidence summary. */
router.post(
  '/summarise-evidence',
  ...requiresAi,
  h(async (req, res) => sendSuccess(res, await summariseEvidence(req.profile!, required(req, 'startupId')))),
);

/** E. Evaluation draft. Evaluators and officers only — it is a working document. */
router.post(
  '/draft-evaluation',
  ...requiresOfficer,
  h(async (req, res) =>
    sendSuccess(res, await draftEvaluation(req.profile!, required(req, 'challengeId'), required(req, 'startupId'))),
  ),
);

/** F. Pilot plan draft. */
router.post(
  '/draft-pilot-plan',
  ...requiresOfficer,
  h(async (req, res) =>
    sendSuccess(res, await draftPilotPlan(req.profile!, required(req, 'challengeId'), required(req, 'startupId'))),
  ),
);

/** G. Pilot progress analysis. */
router.post(
  '/analyse-pilot',
  ...requiresAi,
  h(async (req, res) => sendSuccess(res, await analysePilotProgress(req.profile!, required(req, 'pilotId')))),
);

/** H. KPI and evidence explanation. */
router.post(
  '/explain-kpis',
  ...requiresAi,
  h(async (req, res) => sendSuccess(res, await explainKpis(req.profile!, required(req, 'pilotId')))),
);

/** I. Pilot outcome summary. */
router.post(
  '/summarise-outcome',
  ...requiresAi,
  h(async (req, res) => sendSuccess(res, await summarisePilotOutcome(req.profile!, required(req, 'pilotId')))),
);

/** J. What the evidence supports about scaling. Explanation, never a decision. */
router.post(
  '/explain-scale',
  ...requiresAi,
  h(async (req, res) => sendSuccess(res, await explainScaleRecommendation(req.profile!, required(req, 'pilotId')))),
);

/**
 * The original endpoint, kept working for the existing analyse button.
 *
 * @deprecated Use /summarise-startup or /explain-match.
 */
router.post(
  '/analyze-startup',
  ...requiresAi,
  h(async (req, res) => {
    const startupId = required(req, 'startupId');
    const challengeId = typeof req.body?.challengeId === 'string' ? req.body.challengeId : undefined;
    return sendSuccess(
      res,
      challengeId
        ? await explainMatch(req.profile!, challengeId, startupId)
        : await summariseStartup(req.profile!, startupId),
    );
  }),
);

/* ------------------------------------------------------------------- */
/* Discovery: problem statement -> field -> companies                   */
/*                                                                      */
/* Deterministic queries. No model is involved in choosing or ranking a  */
/* company; `suggest-fields` is the one place a model reads text, and it */
/* classifies a problem statement into the taxonomy — it never picks a   */
/* company.                                                             */
/* ------------------------------------------------------------------- */

/** The taxonomy, and which fields the platform can actually serve. */
router.get('/discover/fields', async (_req: Request, res: Response) => {
  try {
    return sendSuccess(res, {
      taxonomy: FIELD_TAXONOMY.map((f) => ({ field: f.field, label: f.label })),
      browsable: await browsableFields(),
      note: 'A working taxonomy for this demonstration. Not derived from published funding statistics.',
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: (e as Error).message });
  }
});

/** Read a stated problem and propose fields. The model classifies; it never picks companies. */
router.post('/discover/fields', async (req: Request, res: Response) => {
  try {
    const problem = String(req.body?.problem ?? '').trim();
    if (problem.length < 10) {
      return res.status(422).json({
        success: false,
        error: 'Describe the problem in a sentence or two so it can be classified.',
      });
    }
    return sendSuccess(res, await suggestFields(problem));
  } catch (e) {
    return res.status(500).json({ success: false, error: (e as Error).message });
  }
});

/** Companies in a field, narrowed by filters. Deterministic; no model involved. */
router.post('/discover/startups', async (req: Request, res: Response) => {
  try {
    return sendSuccess(res, await discoverStartups({
      field: req.body?.field,
      technologies: req.body?.technologies,
      minReadiness: req.body?.minReadiness,
      cybersecurityProvided: req.body?.cybersecurityProvided,
      minDeployments: req.body?.minDeployments,
      maxPilotDurationDays: req.body?.maxPilotDurationDays,
      maxPilotBudget: req.body?.maxPilotBudget,
      city: req.body?.city,
      stage: req.body?.stage,
      limit: req.body?.limit,
      offset: req.body?.offset,
      sort: req.body?.sort,
    }));
  } catch (e) {
    return res.status(500).json({ success: false, error: (e as Error).message });
  }
});

/** The filter vocabulary, built from the data rather than hardcoded. */
router.get('/discover/filters', async (req: Request, res: Response) => {
  try {
    return sendSuccess(res, await filterOptions(req.query.field as string | undefined));
  } catch (e) {
    return res.status(500).json({ success: false, error: (e as Error).message });
  }
});

/** Compare 2–5 companies on company-level axes. Not challenge-specific. */
router.post('/discover/compare', async (req: Request, res: Response) => {
  try {
    const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids : [];
    return sendSuccess(res, await compareStartups(ids));
  } catch (e) {
    return res.status(422).json({ success: false, error: (e as Error).message });
  }
});

/** Aggregate counts for the government dashboard. Deterministic, no model. */
router.get('/discover/overview', async (_req: Request, res: Response) => {
  try {
    return sendSuccess(res, await portfolioOverview());
  } catch (e) {
    return res.status(500).json({ success: false, error: (e as Error).message });
  }
});

export default router;
