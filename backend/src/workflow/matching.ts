import type { Challenge, ChallengeResponse, Startup } from '@prisma/client';

/**
 * Challenge-specific matching.
 *
 * Three properties this engine is built to have, each because the alternative
 * fails a procurement review:
 *
 *   **Deterministic.** The same inputs always produce the same ranking. An
 *   officer who reruns matching and sees a different order cannot defend
 *   either result, and a language model in this position would produce exactly
 *   that. An LLM may later *explain* a score; it never computes one.
 *
 *   **Inspectable.** Every axis records which inputs moved it and by how much.
 *   A number an officer cannot take apart is a number they cannot justify, and
 *   `WHY THIS MATCH?` has to be answerable from stored data rather than
 *   regenerated prose.
 *
 *   **Challenge-specific.** Nothing here is a property of the company. A
 *   startup excellent for a water-distribution challenge is irrelevant to a
 *   transit one; a stored "startup quality" score would be read as the former
 *   while meaning neither, so scores exist only for a (challenge, startup) pair.
 *
 * Scores are 0–1 internally and presented as 0–100. Absence is scored as zero
 * rather than imputed: a startup that has claimed nothing gets no credit, and
 * never a plausible average that would read as evidence.
 */

/** How much each axis contributes. Stated here, once, rather than inline. */
export const WEIGHTS = {
  problemFit: 0.25,
  technicalFit: 0.22,
  deploymentReadiness: 0.16,
  governmentExperience: 0.15,
  evidenceStrength: 0.12,
  pilotReadiness: 0.10,
} as const;

export interface AxisResult {
  axis: keyof typeof WEIGHTS;
  score: number;
  weight: number;
  /** What moved this axis, in a reader's words. */
  reason: string;
  /** The specific inputs matched, so a reader can check the claim. */
  matched: string[];
}

export interface MatchResult {
  problemFitScore: number;
  technicalFitScore: number;
  deploymentReadinessScore: number;
  governmentExperienceScore: number;
  evidenceStrengthScore: number;
  pilotReadinessScore: number;
  overallScore: number;
  breakdown: {
    axes: AxisResult[];
    strengths: string[];
    limitations: string[];
    /** Restated on every match so the caveat travels with the numbers. */
    disclaimer: string;
  };
  rationale: string;
}

const norm = (s: string) => s.trim().toLowerCase();
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Overlap of two tag sets, as a fraction of what the challenge asked for. */
function overlap(required: string[], offered: string[]): { score: number; matched: string[] } {
  const want = required.map(norm).filter(Boolean);
  if (want.length === 0) return { score: 0, matched: [] };
  const have = new Set(offered.map(norm).filter(Boolean));
  const matched = want.filter((w) => have.has(w));
  return { score: matched.length / want.length, matched };
}

/**
 * Keyword presence of the challenge's target metric in what the startup wrote.
 *
 * A blunt lexical check, and deliberately so: it is explainable to a
 * non-technical reader and cannot silently drift the way an embedding
 * similarity can. It is the weakest signal here, which is why problem fit also
 * counts capability overlap.
 */
function mentionScore(haystack: string, needles: string[]): { score: number; matched: string[] } {
  const hay = norm(haystack);
  const hits = needles.map(norm).filter((n) => n.length > 3 && hay.includes(n));
  if (needles.length === 0) return { score: 0, matched: [] };
  return { score: clamp01(hits.length / needles.length), matched: hits };
}

export interface MatchInputs {
  challenge: Pick<Challenge, 'domain' | 'technologies' | 'targetMetric' | 'problemStatement' | 'title'>;
  startup: Pick<Startup, 'sector' | 'technologies' | 'capabilities' | 'description'>;
  response: Pick<
    ChallengeResponse,
    | 'solutionSummary'
    | 'capabilities'
    | 'technologies'
    | 'deploymentApproach'
    | 'expectedResult'
    | 'pilotApproach'
    | 'constraints'
    | 'evidenceReferences'
  > | null;
  /**
   * Prior government delivery, counted from real participation records.
   * Passed in rather than queried so this module stays pure and testable.
   */
  governmentEngagements: number;
}

export function scoreMatch(input: MatchInputs): MatchResult {
  const { challenge, startup, response, governmentEngagements } = input;
  const axes: AxisResult[] = [];

  /* --- problem fit: does the stated solution address this problem? --- */
  const domainHit = norm(startup.sector) === norm(challenge.domain);
  const targetWords = challenge.targetMetric.split(/\s+/);
  const claim = [response?.solutionSummary, response?.expectedResult, startup.description]
    .filter(Boolean)
    .join(' ');
  const mention = mentionScore(claim, [...targetWords, challenge.domain]);
  const problemFit = clamp01((domainHit ? 0.5 : 0) + mention.score * 0.5);
  axes.push({
    axis: 'problemFit',
    score: problemFit,
    weight: WEIGHTS.problemFit,
    reason: domainHit
      ? 'Operates in the challenge domain, and the stated outcome refers to the target measure.'
      : 'Sector differs from the challenge domain; scored on the stated outcome alone.',
    matched: [...(domainHit ? [challenge.domain] : []), ...mention.matched],
  });

  /* --- technical fit: do the technologies asked for appear? --- */
  const tech = overlap(challenge.technologies, [
    ...startup.technologies,
    ...(response?.technologies ?? []),
  ]);
  axes.push({
    axis: 'technicalFit',
    score: tech.score,
    weight: WEIGHTS.technicalFit,
    reason:
      tech.matched.length > 0
        ? `Offers ${tech.matched.length} of ${challenge.technologies.length} technologies the challenge names.`
        : 'None of the technologies the challenge names are offered.',
    matched: tech.matched,
  });

  /* --- deployment readiness: is there a concrete field plan? --- */
  const deployText = response?.deploymentApproach ?? '';
  const deployment = clamp01(
    (deployText.length > 80 ? 0.6 : deployText.length > 0 ? 0.3 : 0) +
      overlap(challenge.technologies, startup.capabilities).score * 0.4,
  );
  axes.push({
    axis: 'deploymentReadiness',
    score: deployment,
    weight: WEIGHTS.deploymentReadiness,
    reason: deployText
      ? 'A deployment approach was stated and is backed by declared capabilities.'
      : 'No deployment approach was stated.',
    matched: deployText ? ['deployment approach filed'] : [],
  });

  /* --- government experience: counted, never claimed --- */
  const govt = clamp01(governmentEngagements / 3);
  axes.push({
    axis: 'governmentExperience',
    score: govt,
    weight: WEIGHTS.governmentExperience,
    reason:
      governmentEngagements > 0
        ? `${governmentEngagements} recorded government programme engagement(s).`
        : 'No government delivery history is recorded for this company.',
    matched: [],
  });

  /* --- evidence strength: what can actually be produced? --- */
  const refs = response?.evidenceReferences ?? [];
  const evidence = clamp01(refs.length / 3);
  axes.push({
    axis: 'evidenceStrength',
    score: evidence,
    weight: WEIGHTS.evidenceStrength,
    reason:
      refs.length > 0
        ? `${refs.length} supporting reference(s) offered. Not independently verified.`
        : 'No supporting references were offered.',
    matched: refs.slice(0, 5),
  });

  /* --- pilot readiness: is there a plan for running the pilot itself? --- */
  const pilotText = response?.pilotApproach ?? '';
  const pilotReady = clamp01(pilotText.length > 80 ? 0.9 : pilotText.length > 0 ? 0.5 : 0);
  axes.push({
    axis: 'pilotReadiness',
    score: pilotReady,
    weight: WEIGHTS.pilotReadiness,
    reason: pilotText ? 'A pilot approach was stated.' : 'No pilot approach was stated.',
    matched: [],
  });

  const overall = axes.reduce((sum, a) => sum + a.score * a.weight, 0);

  const strengths = axes
    .filter((a) => a.score >= 0.7)
    .sort((a, b) => b.score * b.weight - a.score * a.weight)
    .map((a) => a.reason);

  const limitations = axes.filter((a) => a.score < 0.5).map((a) => a.reason);

  const byId = Object.fromEntries(axes.map((a) => [a.axis, a.score])) as Record<
    keyof typeof WEIGHTS,
    number
  >;

  return {
    problemFitScore: byId.problemFit,
    technicalFitScore: byId.technicalFit,
    deploymentReadinessScore: byId.deploymentReadiness,
    governmentExperienceScore: byId.governmentExperience,
    evidenceStrengthScore: byId.evidenceStrength,
    pilotReadinessScore: byId.pilotReadiness,
    overallScore: overall,
    breakdown: {
      axes,
      strengths,
      limitations,
      disclaimer:
        'AI-assisted recommendation computed from declared capabilities and recorded history. It is not a government decision and not an assessment of the company.',
    },
    rationale:
      strengths.length > 0
        ? `Ranked on: ${strengths[0]}${limitations.length > 0 ? ` Principal limitation: ${limitations[0]}` : ''}`
        : `No axis scored strongly. ${limitations[0] ?? 'Insufficient information to rank this candidate.'}`,
  };
}
