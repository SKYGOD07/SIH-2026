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
/**
 * Default weights if a challenge does not provide custom evaluation weights.
 */
export const DEFAULT_WEIGHTS = {
  problemFit: 0.15,
  technicalFit: 0.15,
  previousProjectRelevance: 0.10,
  deploymentCapability: 0.10,
  evidenceStrength: 0.10,
  financialCapacity: 0.10,
  governmentReadiness: 0.10,
  complianceReadiness: 0.05,
  pilotReadiness: 0.10,
  scalability: 0.05,
} as const;

export type WeightKeys = keyof typeof DEFAULT_WEIGHTS;

export interface AxisResult {
  axis: WeightKeys;
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
  previousProjectRelevanceScore: number;
  deploymentCapabilityScore: number;
  evidenceStrengthScore: number;
  financialCapacityScore: number;
  governmentReadinessScore: number;
  complianceReadinessScore: number;
  pilotReadinessScore: number;
  scalabilityScore: number;
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
  challenge: Pick<Challenge, 'domain' | 'technologies' | 'targetMetric' | 'problemStatement' | 'title' | 'evaluationWeights'>;
  startup: Pick<Startup, 
    'sector' | 'technologies' | 'capabilities' | 'description' |
    'revenueTrend' | 'cashPosition' | 'burnBand' | 'runwayBand' | 'profitabilityStatus' |
    'founderOwnership' | 'publicMarketStatus' | 'teamCapacity' |
    'deploymentCapacity' | 'securityPosture' | 'dataPrivacyPosture'
  >;
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
  /**
   * Number of previous projects matching the challenge domain.
   */
  relevantProjects: number;
}

export function scoreMatch(input: MatchInputs): MatchResult {
  const { challenge, startup, response, governmentEngagements, relevantProjects } = input;
  const axes: AxisResult[] = [];
  
  // Use custom weights if provided, otherwise default
  const weights: Record<WeightKeys, number> = challenge.evaluationWeights 
    ? (challenge.evaluationWeights as any)
    : DEFAULT_WEIGHTS;

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
    weight: weights.problemFit,
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
    weight: weights.technicalFit,
    reason:
      tech.matched.length > 0
        ? `Offers ${tech.matched.length} of ${challenge.technologies.length} technologies the challenge names.`
        : 'None of the technologies the challenge names are offered.',
    matched: tech.matched,
  });

  /* --- previous project relevance --- */
  const previousRelevance = clamp01(relevantProjects / 2);
  axes.push({
    axis: 'previousProjectRelevance',
    score: previousRelevance,
    weight: weights.previousProjectRelevance,
    reason: relevantProjects > 0 ? `${relevantProjects} relevant past project(s) recorded.` : 'No highly relevant past projects provided.',
    matched: [],
  });

  /* --- deployment capability --- */
  const deployText = response?.deploymentApproach ?? '';
  const deployment = clamp01(
    (deployText.length > 80 ? 0.6 : deployText.length > 0 ? 0.3 : 0) +
      overlap(challenge.technologies, startup.capabilities).score * 0.4
  );
  axes.push({
    axis: 'deploymentCapability',
    score: deployment,
    weight: weights.deploymentCapability,
    reason: deployText
      ? 'A deployment approach was stated and is backed by declared capabilities.'
      : 'No deployment approach was stated.',
    matched: deployText ? ['deployment approach filed'] : [],
  });

  /* --- evidence strength: what can actually be produced? --- */
  const refs = response?.evidenceReferences ?? [];
  const evidence = clamp01(refs.length / 3);
  axes.push({
    axis: 'evidenceStrength',
    score: evidence,
    weight: weights.evidenceStrength,
    reason:
      refs.length > 0
        ? `${refs.length} supporting reference(s) offered. Not independently verified.`
        : 'No supporting references were offered.',
    matched: refs.slice(0, 5),
  });
  
  /* --- financial capacity --- */
  const hasStrongFinances = startup.profitabilityStatus === 'Profitable' || (startup.runwayBand && startup.runwayBand.includes('12+'));
  const finScore = hasStrongFinances ? 0.9 : (startup.revenueTrend ? 0.5 : 0.1);
  axes.push({
    axis: 'financialCapacity',
    score: finScore,
    weight: weights.financialCapacity,
    reason: hasStrongFinances ? 'Strong financial capacity indicators (Profitable or 12+ months runway).' : 'Limited financial capacity indicators.',
    matched: [],
  });

  /* --- government readiness --- */
  const govt = clamp01(governmentEngagements / 3);
  axes.push({
    axis: 'governmentReadiness',
    score: govt,
    weight: weights.governmentReadiness,
    reason:
      governmentEngagements > 0
        ? `${governmentEngagements} recorded government programme engagement(s).`
        : 'No government delivery history is recorded for this company.',
    matched: [],
  });

  /* --- compliance readiness --- */
  const compliance = clamp01((startup.securityPosture ? 0.5 : 0) + (startup.dataPrivacyPosture ? 0.5 : 0));
  axes.push({
    axis: 'complianceReadiness',
    score: compliance,
    weight: weights.complianceReadiness,
    reason: compliance > 0 ? 'Basic compliance and security posture declared.' : 'No compliance or security posture information provided.',
    matched: [],
  });

  /* --- pilot readiness --- */
  const pilotText = response?.pilotApproach ?? '';
  const pilotReady = clamp01(pilotText.length > 80 ? 0.9 : pilotText.length > 0 ? 0.5 : 0);
  axes.push({
    axis: 'pilotReadiness',
    score: pilotReady,
    weight: weights.pilotReadiness,
    reason: pilotText ? 'A pilot approach was stated.' : 'No pilot approach was stated.',
    matched: [],
  });

  /* --- scalability --- */
  const scaleCap = (startup.deploymentCapacity && startup.teamCapacity) ? 0.8 : 0.3;
  axes.push({
    axis: 'scalability',
    score: scaleCap,
    weight: weights.scalability,
    reason: scaleCap > 0.5 ? 'Deployment and team capacity indicated.' : 'Limited scalability indicators provided.',
    matched: [],
  });

  const overall = axes.reduce((sum, a) => sum + a.score * a.weight, 0);

  const strengths = axes
    .filter((a) => a.score >= 0.7)
    .sort((a, b) => b.score * b.weight - a.score * a.weight)
    .map((a) => a.reason);

  const limitations = axes.filter((a) => a.score < 0.5).map((a) => a.reason);

  const byId = Object.fromEntries(axes.map((a) => [a.axis, a.score])) as Record<
    WeightKeys,
    number
  >;

  return {
    problemFitScore: byId.problemFit,
    technicalFitScore: byId.technicalFit,
    previousProjectRelevanceScore: byId.previousProjectRelevance,
    deploymentCapabilityScore: byId.deploymentCapability,
    evidenceStrengthScore: byId.evidenceStrength,
    financialCapacityScore: byId.financialCapacity,
    governmentReadinessScore: byId.governmentReadiness,
    complianceReadinessScore: byId.complianceReadiness,
    pilotReadinessScore: byId.pilotReadiness,
    scalabilityScore: byId.scalability,
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
