import { Router, Request, Response } from 'express';
import { env, ollamaReadiness } from '../../config/env';

/**
 * AI-provider routes.
 *
 * Two read-only endpoints that let the frontend display the current Ollama
 * configuration and test the connection. Neither endpoint returns the API key
 * or any other secret — it only returns metadata about the current state.
 *
 * POST /ai/test intentionally does not accept a key from the request body.
 * The key is never accepted from or returned to the caller; it lives solely
 * in the backend environment.
 */
import { sendSuccess } from '../../utils/response';
import {
  FIELD_TAXONOMY,
  browsableFields,
  discoverStartups,
  filterOptions,
  suggestFields,
  compareStartups,
  portfolioOverview,
} from './discovery.service';

const router = Router();

/* ------------------------------------------------------------------ GET /ai/status */

/**
 * Return the current AI provider configuration without any secret material.
 *
 * mode:    "local"  — talking to http://localhost:11434, no key needed
 *          "cloud"  — talking to a remote Ollama host, key required
 * ready:   true if the provider can be called (key present when required)
 * reason:  human-readable explanation when ready is false
 */
router.get('/status', (_req: Request, res: Response) => {
  const readiness = ollamaReadiness();

  res.json({
    success: true,
    data: {
      mode: readiness.mode,
      ready: readiness.ready,
      reason: readiness.reason ?? null,
      baseUrl: env.OLLAMA_BASE_URL,
      model: env.OLLAMA_MODEL || null,
      embedModel: env.OLLAMA_EMBED_MODEL || null,
      // Never return the key itself — only whether one is configured.
      apiKeyConfigured: Boolean(env.OLLAMA_API_KEY),
    },
  });
});

/* ------------------------------------------------------------------ POST /ai/test */

/**
 * Attempt a live connection to the configured Ollama endpoint.
 *
 * Uses the list-models endpoint which is cheap, requires no prompt, and
 * is the canonical way to check that the API is reachable and authenticated.
 *
 * On success, returns the list of available model names so the UI can let
 * the user confirm the right model is installed.
 *
 * The API key is NEVER accepted from the request; the backend uses only what
 * is in process.env.
 */
router.post('/test', async (_req: Request, res: Response) => {
  const readiness = ollamaReadiness();

  if (!readiness.ready) {
    return res.status(400).json({
      success: false,
      error: readiness.reason ?? 'Ollama is not configured',
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (env.OLLAMA_API_KEY) {
      headers['Authorization'] = `Bearer ${env.OLLAMA_API_KEY}`;
    }

    // Ollama local: GET /api/tags  |  Ollama Cloud: GET /api/tags
    const tagsUrl = readiness.mode === 'local'
      ? `${env.OLLAMA_BASE_URL}/api/tags`
      : `${env.OLLAMA_BASE_URL}/api/tags`;

    const response = await fetch(tagsUrl, {
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

    const data = await response.json().catch(() => ({ models: [] })) as { models?: { name?: string }[] };
    const models: string[] = (data?.models ?? []).map((m) => m.name ?? '').filter(Boolean);

    return res.json({
      success: true,
      data: {
        connected: true,
        mode: readiness.mode,
        baseUrl: env.OLLAMA_BASE_URL,
        models,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = message.includes('abort') || message.includes('timeout');

    return res.status(502).json({
      success: false,
      error: isTimeout
        ? 'Connection timed out — is Ollama running?'
        : `Connection failed: ${message}`,
    });
  }
});

/* ------------------------------------------------------------------ POST /ai/analyze-startup */

/**
 * Trigger AI-assisted analysis for a startup profile using Ollama.
 *
 * Authenticated or demo endpoint. Uses database facts as truth, ground prompt strictly.
 * Returns structured analysis or fallback explanation if Ollama is unreachable.
 */
router.post('/analyze-startup', async (req: Request, res: Response) => {
  const { startupId, challengeId } = req.body as { startupId?: string; challengeId?: string };

  if (!startupId) {
    return res.status(400).json({ success: false, error: 'startupId is required' });
  }

  try {
    const { analyzeStartupWithAI } = await import('./ai.service');
    const dummyUser = req.profile ?? { id: '00000000-0000-0000-0000-000000000000' } as any;

    const analysis = await analyzeStartupWithAI(dummyUser, startupId, challengeId);

    return res.json({
      success: true,
      data: analysis,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({
      success: false,
      error: `AI analysis request failed: ${message}`,
    });
  }
});


/* ------------------------------------------------------------------ */
/* Discovery: problem statement -> field -> companies                  */
/* ------------------------------------------------------------------ */

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
