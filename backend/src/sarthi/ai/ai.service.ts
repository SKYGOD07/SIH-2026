import { UserProfile } from '@prisma/client';
import { prisma } from '../../workflow/repositories';
import { env, ollamaReadiness } from '../../config/env';
import { defaultAIProvider, AIProvider } from './ollama.provider';
import { challengeContext, matchContext, pilotContext, startupContext, AiContext } from './ai.context';
import {
  AI_DISCLOSURE,
  AI_SYSTEM_PROMPT,
  AI_TASK_LABELS,
  AiEnvelope,
  AiOutputSchema,
  AiTask,
  groundOutput,
} from './ai.contract';

/**
 * The assistance layer.
 *
 * One function does the work — `runTask` — and ten thin wrappers name the
 * surfaces it serves. The shape is deliberate: every AI feature in the platform
 * goes through the same five steps, in the same order, so there is exactly one
 * place where the rules can be enforced and exactly one place they can be
 * broken.
 *
 *   1. build the context deterministically, including the answer to give
 *      without a model;
 *   2. return that answer immediately if there is no model to call;
 *   3. call the model with the context and nothing else;
 *   4. validate the shape, then drop citations that were not supplied;
 *   5. record that a model spoke, as an advisory event.
 *
 * Step 2 is what makes the platform robust rather than dependent. Ollama being
 * down degrades a summary from prose to a structured reading of the same rows;
 * it never blocks a procurement action, because no procurement action asks this
 * file anything.
 */

/* ------------------------------------------------------------------- core */

/** Which context builder answers which task. */
type ContextArgs =
  | { kind: 'challenge'; challengeId: string }
  | { kind: 'startup'; startupId: string }
  | { kind: 'match'; challengeId: string; startupId: string }
  | { kind: 'pilot'; pilotId: string };

async function buildContext(args: ContextArgs): Promise<AiContext> {
  switch (args.kind) {
    case 'challenge':
      return challengeContext(args.challengeId);
    case 'startup':
      return startupContext(args.startupId);
    case 'match':
      return matchContext(args.challengeId, args.startupId);
    case 'pilot':
      return pilotContext(args.pilotId);
  }
}

/**
 * What to ask, per task.
 *
 * The instruction, not the facts — the facts are appended once by `runTask`, so
 * no task can smuggle in a different context or a different set of rules.
 */
const TASK_INSTRUCTION: Record<AiTask, string> = {
  CHALLENGE_BRIEFING:
    'Brief a government officer on this challenge before they begin discovery. Say what the department is asking for, what it has specified, and what it has left unspecified. Do not name or suggest any company.',
  STARTUP_SUMMARY:
    'Summarise this company for an officer who has not seen it before. What it does, who it is for, and how much of the profile is actually backed by filed records.',
  MATCH_EXPLANATION:
    'Explain why the platform ranked this company against this challenge as it did. Explain the computed scores, especially the weakest axis. Do not propose different scores and do not recommend selection.',
  EVIDENCE_SUMMARY:
    'Summarise the evidence this company has filed. Group what is present, state plainly what is absent, and say what an officer still cannot verify from this dossier.',
  EVALUATION_DRAFT:
    'Draft the factual section of an evaluation note for a human evaluator to edit. Set out what the evidence shows and what it does not. Do not state a recommendation — the evaluator decides that.',
  PILOT_PLAN_DRAFT:
    'Draft pilot design considerations from the challenge and the company profile: what the pilot would need to establish, what the baseline must capture, and what would make the result uninterpretable.',
  PILOT_PROGRESS_ANALYSIS:
    'Analyse where this pilot stands. Use the computed milestone, metric and evidence counts as given. Identify what is late, unmeasured or unreviewed.',
  KPI_EXPLANATION:
    'Explain the KPIs on this pilot: what each measures, how it is measured, and how far the measured value is from target. A metric with no achieved value has not been measured — say so rather than treating it as zero.',
  PILOT_OUTCOME_SUMMARY:
    'Summarise how this pilot ended and how well the outcome is supported by its baseline and its accepted evidence.',
  SCALE_RECOMMENDATION_EXPLANATION:
    'Explain what the recorded evidence supports regarding scale, extension or stop. If a scale decision has been recorded by an officer, explain the basis it rests on. Do not make a decision.',
};

/**
 * Run one task end to end.
 *
 * Never throws for a model problem. It throws only when the subject does not
 * exist, because "there is no such pilot" is a caller error while "the model
 * timed out" is a runtime condition the interface is built to show.
 */
async function runTask(
  user: UserProfile | null,
  task: AiTask,
  args: ContextArgs,
  provider: AIProvider = defaultAIProvider,
): Promise<AiEnvelope> {
  const ctx = await buildContext(args);

  const base = {
    task,
    taskLabel: AI_TASK_LABELS[task],
    generatedAt: new Date().toISOString(),
    disclosure: AI_DISCLOSURE,
  };

  /* --- 2. no model, deterministic answer -------------------------------- */

  const readiness = ollamaReadiness();
  if (!readiness.ready) {
    return {
      ...base,
      output: ctx.fallback,
      assisted: false,
      provider: 'DETERMINISTIC',
      model: null,
      fallbackReason: readiness.reason ?? 'AI provider not ready',
      warnings: [],
    };
  }

  /* --- 3. ask ----------------------------------------------------------- */

  const prompt = [
    TASK_INSTRUCTION[task],
    '',
    'FACTS:',
    JSON.stringify(ctx.facts, null, 2),
  ].join('\n');

  let raw: unknown = null;
  let failure: string | null = null;
  try {
    raw = await provider.generateStructured(prompt, AiOutputSchema, AI_SYSTEM_PROMPT);
  } catch (err) {
    failure = err instanceof Error ? err.message : String(err);
  }

  if (!raw) {
    return {
      ...base,
      output: ctx.fallback,
      assisted: false,
      provider: 'DETERMINISTIC',
      model: null,
      fallbackReason:
        failure ?? 'The model did not return a usable response; showing the platform reading of the same records.',
      warnings: [],
    };
  }

  /* --- 4. ground -------------------------------------------------------- */

  const parsed = AiOutputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ...base,
      output: ctx.fallback,
      assisted: false,
      provider: 'DETERMINISTIC',
      model: null,
      fallbackReason: 'The model response did not match the required shape.',
      warnings: [],
    };
  }

  const { output, warnings } = groundOutput(parsed.data, ctx.index);

  /* --- 5. record -------------------------------------------------------- */

  // Best-effort: an audit write failing must not lose the officer's analysis.
  // The event is advisory, and the analysis is regenerable from the same rows.
  if (user) {
    await prisma.auditEvent
      .create({
        data: {
          actorUserId: user.id,
          subjectType: ctx.subject.type,
          subjectId: ctx.subject.id,
          action: 'AI_ANALYSIS_GENERATED',
          detail: `${AI_TASK_LABELS[task]} generated for ${ctx.subject.label} (${env.OLLAMA_MODEL}, ${readiness.mode})${
            warnings.length ? ` — ${warnings.length} ungrounded citation(s) removed` : ''
          }`,
        },
      })
      .catch(() => undefined);
  }

  return {
    ...base,
    output,
    assisted: true,
    provider: 'OLLAMA',
    model: env.OLLAMA_MODEL,
    warnings,
  };
}

/* --------------------------------------------------------------- surfaces */

/** A. Brief the officer on a challenge before discovery. */
export const briefChallenge = (u: UserProfile | null, challengeId: string) =>
  runTask(u, 'CHALLENGE_BRIEFING', { kind: 'challenge', challengeId });

/** B. Summarise a company profile. */
export const summariseStartup = (u: UserProfile | null, startupId: string) =>
  runTask(u, 'STARTUP_SUMMARY', { kind: 'startup', startupId });

/** C. Explain a computed match. */
export const explainMatch = (u: UserProfile | null, challengeId: string, startupId: string) =>
  runTask(u, 'MATCH_EXPLANATION', { kind: 'match', challengeId, startupId });

/** D. Summarise a company's filed evidence. */
export const summariseEvidence = (u: UserProfile | null, startupId: string) =>
  runTask(u, 'EVIDENCE_SUMMARY', { kind: 'startup', startupId });

/** E. Draft the factual half of an evaluation note. */
export const draftEvaluation = (u: UserProfile | null, challengeId: string, startupId: string) =>
  runTask(u, 'EVALUATION_DRAFT', { kind: 'match', challengeId, startupId });

/** F. Draft pilot design considerations. */
export const draftPilotPlan = (u: UserProfile | null, challengeId: string, startupId: string) =>
  runTask(u, 'PILOT_PLAN_DRAFT', { kind: 'match', challengeId, startupId });

/** G. Analyse a running pilot. */
export const analysePilotProgress = (u: UserProfile | null, pilotId: string) =>
  runTask(u, 'PILOT_PROGRESS_ANALYSIS', { kind: 'pilot', pilotId });

/** H. Explain the KPIs and their evidence. */
export const explainKpis = (u: UserProfile | null, pilotId: string) =>
  runTask(u, 'KPI_EXPLANATION', { kind: 'pilot', pilotId });

/** I. Summarise how a pilot ended. */
export const summarisePilotOutcome = (u: UserProfile | null, pilotId: string) =>
  runTask(u, 'PILOT_OUTCOME_SUMMARY', { kind: 'pilot', pilotId });

/** J. Explain what the evidence supports about scaling. */
export const explainScaleRecommendation = (u: UserProfile | null, pilotId: string) =>
  runTask(u, 'SCALE_RECOMMENDATION_EXPLANATION', { kind: 'pilot', pilotId });

/* ---------------------------------------------------------------- status */

/**
 * When a model was last asked anything.
 *
 * Read from the audit trail rather than from a counter, so it survives a
 * restart and cannot drift from what was actually recorded.
 */
export async function lastAiRequestAt(): Promise<string | null> {
  const row = await prisma.auditEvent.findFirst({
    where: { action: 'AI_ANALYSIS_GENERATED' },
    orderBy: { at: 'desc' },
    select: { at: true },
  });
  return row?.at.toISOString() ?? null;
}

/* --------------------------------------------------------- compatibility */

/**
 * The original single-purpose entry point, kept so existing callers do not
 * break. New work should use the named surfaces above.
 *
 * @deprecated Use `summariseStartup` or `explainMatch`.
 */
export async function analyzeStartupWithAI(
  u: UserProfile,
  startupId: string,
  challengeId?: string,
): Promise<AiEnvelope> {
  return challengeId ? explainMatch(u, challengeId, startupId) : summariseStartup(u, startupId);
}

/* ---------------------------------------------------------------- Phase 2 */

import { z } from 'zod';

const DraftChallengeSchema = z.object({
  title: z.string().default(''),
  problemStatement: z.string().default(''),
  desiredOutcome: z.string().default(''),
  currentBaseline: z.string().default(''),
  targetMetric: z.string().default(''),
  targetValue: z.number().default(0),
  targetTolerance: z.string().default(''),
  measurementMethod: z.string().default(''),
  measurementOwner: z.string().default(''),
  operatingConstraints: z.string().default(''),
  geographicScope: z.string().default(''),
  eligibilityRequirements: z.array(z.string()).default([]),
  requiredCapabilities: z.array(z.string()).default([]),
  dataRequirements: z.string().default(''),
  cybersecurityRequirements: z.string().default(''),
  deploymentRequirements: z.string().default(''),
  ipDataConstraints: z.string().default(''),
  evaluationCriteria: z.array(z.string()).default([]),
  // Plus the AiEnvelope fields for the UI rendering
  summary: z.string().default(''),
  questions: z.array(z.string()).default([]),
  missingEvidence: z.array(z.string()).default([]),
});

export async function draftChallengeProposal(
  u: UserProfile | null,
  problem: string,
  provider: AIProvider = defaultAIProvider
) {
  const readiness = ollamaReadiness();
  if (!env.AI_ENABLED || !readiness.ready) {
    return {
      assisted: false,
      draft: {
        title: problem.slice(0, 60) + (problem.length > 60 ? '...' : ''),
        problemStatement: problem,
        summary: "AI drafting is unavailable.",
        questions: ["What is the specific baseline?"],
        missingEvidence: ["Historical data"]
      }
    };
  }

  const prompt = `You are an AI assistant in the Sarthi public procurement platform.
The user has provided a plain-language operational problem.
You must draft an outcome-based challenge specification from it.

PROBLEM:
"""
${problem}
"""

Return a single JSON object matching this structure exactly:
{
  "title": "A concise, professional title",
  "problemStatement": "Expanded, clear statement of the problem",
  "desiredOutcome": "What success looks like",
  "currentBaseline": "What is the current state (if implicit, say 'Needs definition')",
  "targetMetric": "The primary KPI (e.g., 'Efficiency Gain (%)')",
  "targetValue": 20,
  "targetTolerance": "e.g., +/- 5%",
  "measurementMethod": "How the metric will be measured",
  "measurementOwner": "Who measures it",
  "operatingConstraints": "Any implied constraints",
  "geographicScope": "Implied scope",
  "eligibilityRequirements": ["Requirement 1"],
  "requiredCapabilities": ["Capability 1"],
  "dataRequirements": "Data needs",
  "cybersecurityRequirements": "Cyber needs",
  "deploymentRequirements": "Deployment context",
  "ipDataConstraints": "IP considerations",
  "evaluationCriteria": ["Criterion 1"],
  "summary": "2 sentences explaining what you drafted",
  "questions": ["A question about missing context"],
  "missingEvidence": ["Missing data needed before pilot"]
}`;

  try {
    const response = await provider.generate(prompt);
    const parsed = DraftChallengeSchema.parse(response);
    
    // Audit the action
    if (u) {
      await prisma.auditEvent.create({
        data: {
          actorUserId: u.id,
          action: 'AI_ANALYSIS_GENERATED',
          detail: 'Generated Challenge Draft',
          subjectType: 'CHALLENGE_DRAFT',
          subjectId: 'new', // It's a new draft so there's no DB ID yet
        },
      });
    }

    return {
      assisted: true,
      draft: parsed
    };
  } catch (e) {
    console.error('Failed to parse draft AI response', e);
    return {
      assisted: false,
      draft: {
        title: problem.slice(0, 60) + (problem.length > 60 ? '...' : ''),
        problemStatement: problem,
        summary: "Failed to parse AI output.",
      }
    };
  }
}
