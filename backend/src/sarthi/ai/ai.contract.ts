import { z } from 'zod';

/**
 * The contract between the platform and the model.
 *
 * Everything in this file exists to enforce one sentence from the project's
 * rules: the database is authoritative and the model is advisory. That is easy
 * to state and easy to lose, because a fluent paragraph reads as authoritative
 * whatever its provenance. So the boundary is made mechanical here —
 *
 *   1. a fixed set of tasks, so a caller cannot invent a new authority for the
 *      model by writing a new prompt at a call site;
 *   2. one output shape for every task, validated before it is returned;
 *   3. a grounding pass that drops any evidence the model cites which was not
 *      in the context it was given.
 *
 * (3) is the one that matters. A model asked to summarise a dossier will,
 * occasionally and confidently, cite a certificate that does not exist. The
 * schema cannot catch that — a fabricated title is a perfectly valid string.
 * Comparing citations against the supplied index can, and does.
 */

/* ------------------------------------------------------------------ tasks */

/**
 * Every place the model is allowed to speak.
 *
 * Ten surfaces, each one an explanation, summary or draft. There is no task for
 * scoring, ranking, eligibility, or deciding — those are computed, and a task
 * name is the only way to reach the model, so the absence of one is the
 * enforcement rather than a convention.
 */
export const AI_TASKS = [
  'CHALLENGE_BRIEFING',
  'STARTUP_SUMMARY',
  'MATCH_EXPLANATION',
  'EVIDENCE_SUMMARY',
  'EVALUATION_DRAFT',
  'PILOT_PLAN_DRAFT',
  'PILOT_PROGRESS_ANALYSIS',
  'KPI_EXPLANATION',
  'PILOT_OUTCOME_SUMMARY',
  'SCALE_RECOMMENDATION_EXPLANATION',
] as const;

export type AiTask = (typeof AI_TASKS)[number];

/** Human-readable label, for the audit trail and the interface. */
export const AI_TASK_LABELS: Record<AiTask, string> = {
  CHALLENGE_BRIEFING: 'Challenge briefing',
  STARTUP_SUMMARY: 'Company summary',
  MATCH_EXPLANATION: 'Why this company was matched',
  EVIDENCE_SUMMARY: 'Evidence summary',
  EVALUATION_DRAFT: 'Evaluation draft',
  PILOT_PLAN_DRAFT: 'Pilot plan draft',
  PILOT_PROGRESS_ANALYSIS: 'Pilot progress analysis',
  KPI_EXPLANATION: 'KPI and evidence explanation',
  PILOT_OUTCOME_SUMMARY: 'Pilot outcome summary',
  SCALE_RECOMMENDATION_EXPLANATION: 'Scale recommendation explanation',
};

export function isAiTask(v: unknown): v is AiTask {
  return typeof v === 'string' && (AI_TASKS as readonly string[]).includes(v);
}

/* ----------------------------------------------------------------- output */

/**
 * One shape for every task.
 *
 * A single schema rather than ten is deliberate: the interface renders AI
 * output the same way everywhere, so a reader learns once what they are looking
 * at. `missingEvidence` and `questions` are the two fields that make the output
 * useful to an officer rather than decorative — what is absent, and what to ask
 * — and they are in the schema so a model cannot quietly skip the awkward half.
 */
export const AiOutputSchema = z.object({
  /** Two or three sentences. What this is, in plain language. */
  summary: z.string().min(1),
  /** Points in favour, each traceable to something in the context. */
  strengths: z.array(z.string()).default([]),
  /** Points against, and gaps. */
  limitations: z.array(z.string()).default([]),
  /** Titles of records the model actually used. Checked against the index. */
  evidenceUsed: z.array(z.string()).default([]),
  /** What the officer would need before this could be decided. */
  missingEvidence: z.array(z.string()).default([]),
  /** Questions to put to the company or the department. */
  questions: z.array(z.string()).default([]),
  /**
   * Why the deterministic recommendation says what it says — an explanation of
   * a computed result, never a recommendation of the model's own.
   */
  recommendationExplanation: z.string().default(''),
});

export type AiOutput = z.infer<typeof AiOutputSchema>;

/**
 * What a caller gets back.
 *
 * `assisted` is the field the interface keys on. False means the model was not
 * used — switched off, unreachable, too slow, or its answer failed validation —
 * and the content is the deterministic summary the platform can always produce.
 * There is no third state: an AI surface either has a model behind it or has
 * the database behind it, and the reader is told which.
 */
export interface AiEnvelope {
  task: AiTask;
  taskLabel: string;
  output: AiOutput;
  assisted: boolean;
  provider: 'OLLAMA' | 'DETERMINISTIC';
  model: string | null;
  /** Why the model was not used, when it was not. */
  fallbackReason?: string;
  /** Grounding failures, kept rather than hidden. Empty is the normal case. */
  warnings: string[];
  generatedAt: string;
  /** Shown verbatim wherever this output is rendered. */
  disclosure: string;
}

/**
 * The disclosure line.
 *
 * Required by the platform's own rules to appear wherever model output appears,
 * so it travels with the payload rather than being the responsibility of each
 * component that renders one. A disclosure a client can forget to add is a
 * disclosure that will be missing on exactly one screen.
 */
export const AI_DISCLOSURE =
  'AI-assisted analysis. Generated from stored records only. AI assists analysis; Government retains decision authority.';

/* --------------------------------------------------------------- grounding */

/**
 * The set of things a model may cite for one request.
 *
 * Built by the context builder from the same records that go into the prompt,
 * so the permitted citations and the supplied facts cannot drift apart.
 */
export interface GroundingIndex {
  /** Document titles, metric names, milestone titles — anything citable. */
  citable: string[];
}

/** Loose comparison: case, punctuation and spacing are not the point. */
function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Drop citations that were not in the context.
 *
 * Matching is deliberately generous — a model that writes "KYC pack" for a
 * document titled "KYC Document Pack" has cited a real record and should not be
 * penalised for paraphrase. What it catches is the other case: a citation with
 * no counterpart at all in what was supplied, which is a fabricated source and
 * is removed from the output and reported in `warnings`.
 *
 * Removal rather than rejection is the right response. One invented citation in
 * an otherwise sound summary should cost the citation, not the summary.
 */
export function groundOutput(
  output: AiOutput,
  index: GroundingIndex,
): { output: AiOutput; warnings: string[] } {
  const warnings: string[] = [];

  if (index.citable.length === 0) {
    // Nothing was citable, so nothing may be cited.
    if (output.evidenceUsed.length > 0) {
      warnings.push(
        `Dropped ${output.evidenceUsed.length} citation(s): no documents or measurements were supplied for this request.`,
      );
    }
    return { output: { ...output, evidenceUsed: [] }, warnings };
  }

  const haystack = index.citable.map(normalise).filter(Boolean);

  const kept: string[] = [];
  for (const cited of output.evidenceUsed) {
    const needle = normalise(cited);
    if (!needle) continue;

    const matched = haystack.some((h) => h.includes(needle) || needle.includes(h));
    if (matched) kept.push(cited);
    else warnings.push(`Dropped citation "${cited}" — no such record was supplied to the model.`);
  }

  return { output: { ...output, evidenceUsed: kept }, warnings };
}

/* ----------------------------------------------------------------- prompt */

/**
 * The system prompt, shared by every task.
 *
 * The prohibitions are stated as facts about the platform rather than as
 * instructions to be polite about, because the failure being guarded against is
 * not disobedience but helpfulness: a model asked about a company with a thin
 * dossier will fill the gap unless told that the gap is the answer.
 */
export const AI_SYSTEM_PROMPT = `You are an analysis assistant inside Sarthi, a public procurement platform for the Government of Maharashtra.

YOUR ROLE
You explain, summarise and draft. You do not decide. Eligibility, scores, rankings, match results, evidence acceptance, payment state and scale decisions are all computed by the platform before you are called, and are supplied to you as facts. Never contradict a supplied number, and never produce one of your own.

USE ONLY THE SUPPLIED FACTS
Everything you may refer to is in the FACTS block. If something is not there, it is not known. Do not invent, infer or assume:
- companies, customers, contracts or deployments
- certifications, approvals, registrations or statutory identifiers
- funding amounts, valuations or revenue
- pilot results, measurements or dates
- government experience or departmental relationships

MISSING INFORMATION IS THE USEFUL ANSWER
When evidence is absent, say it is absent and put it in missingEvidence. An officer needs to know what they do not have. A confident summary of a thin dossier is worse than no summary.

PROVENANCE
Records are marked DEMO, VERIFIED or USER_ENTERED. DEMO records belong to a demonstration dataset and are not real government data — never describe a DEMO record as verified, funded or government-approved. USER_ENTERED means the company said so itself and nobody has checked.

CITATIONS
evidenceUsed must contain only titles that appear in the FACTS block. Any other citation will be removed.

OUTPUT
Reply with one JSON object and nothing else. No markdown fence, no preamble.
{
  "summary": "2-3 sentences",
  "strengths": ["..."],
  "limitations": ["..."],
  "evidenceUsed": ["exact title from FACTS"],
  "missingEvidence": ["..."],
  "questions": ["a question for the company or department"],
  "recommendationExplanation": "why the platform's computed result reads as it does, or empty"
}`;
