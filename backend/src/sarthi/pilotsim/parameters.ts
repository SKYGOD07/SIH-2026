import type {
  AssuranceStatus,
  Challenge,
  ChallengeResponse,
  ReadinessLevel,
  Startup,
} from '@prisma/client';
import { scoreMatch } from '../../workflow/matching';
import type {
  CompanyParameters,
  ModelAssumptions,
  ParameterProvenance,
  ParameterisedCompany,
  PilotDesign,
} from './types';

/**
 * Turning a company record into model parameters.
 *
 * This is the honest part of the model and the part most worth arguing with.
 * Five numbers decide how a company performs in simulation, and each one is
 * derived from named stored fields — never from a hunch, never from a hidden
 * constant, and never from an average over the cohort.
 *
 * **Absence scores pessimistically.** A company that has not declared its team
 * size does not get the cohort's median team size; it gets the floor. Imputing
 * a plausible average would let a blank profile outrank a company that filed
 * honest but modest figures, which is precisely backwards — and it is the rule
 * `matching.ts` already applies when it scores absence as zero.
 *
 * Every parameter carries provenance so the interface can show *why* a company
 * was modelled the way it was. A number an officer cannot take apart is a
 * number they cannot defend.
 */

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const norm = (s: string) => s.trim().toLowerCase();

/**
 * Assurance ladders, worst-first.
 *
 * Typed as exhaustive `Record`s over the enums rather than loose string maps:
 * if a value is ever added to `AssuranceStatus` or `ReadinessLevel`, this file
 * stops compiling until someone decides what it is worth. A string map would
 * have scored the new value zero in silence, quietly penalising every company
 * that held it.
 *
 * `SELF_DECLARED` sits well below `VERIFIED` on purpose. A company's own
 * statement about itself is a claim, not assurance — the same distinction the
 * evidence chain draws between filed and accepted.
 */
const READINESS_RANK: Record<ReadinessLevel, number> = {
  NOT_ASSESSED: 0,
  LOW: 0.25,
  MODERATE: 0.6,
  HIGH: 1,
};

const ASSURANCE_RANK: Record<AssuranceStatus, number> = {
  NOT_PROVIDED: 0,
  SELF_DECLARED: 0.35,
  PARTIALLY_VERIFIED: 0.7,
  VERIFIED: 1,
};

const readiness = (v: ReadinessLevel | null | undefined) => (v ? READINESS_RANK[v] : 0);
const assurance = (v: AssuranceStatus | null | undefined) => (v ? ASSURANCE_RANK[v] : 0);

/**
 * Mobilisation: days before the first unit is deployed.
 *
 * A procurement-ready company with compliance in hand starts in days; one that
 * has assessed none of it spends a third of a 90-day pilot getting permission
 * to begin. That delay is the most commonly underestimated cost in a real
 * pilot, which is why it is modelled explicitly rather than folded into a
 * general "readiness" fudge.
 */
function mobilisation(
  s: Startup,
  a: ModelAssumptions,
): { value: number; p: ParameterProvenance } {
  const prepared =
    readiness(s.procurementReadiness) * 0.5 +
    assurance(s.complianceStatus) * 0.3 +
    assurance(s.cybersecurityStatus) * 0.2;

  // Fully prepared → 3 days. Nothing declared → the ceiling.
  const value = Math.round(3 + (1 - prepared) * (a.maxMobilisationDays - 3));

  return {
    value,
    p: {
      parameter: 'mobilisationDays',
      value,
      from: ['procurementReadiness', 'complianceStatus', 'cybersecurityStatus'],
      note:
        prepared > 0.7
          ? 'Procurement and assurance largely in place; short mobilisation.'
          : prepared > 0.3
            ? 'Partial assurance on file; mobilisation carries a delay.'
            : 'Little or no assurance declared, so mobilisation is modelled at the ceiling.',
    },
  };
}

/**
 * Coverage rate: scope units brought online per day.
 *
 * Delivery capacity, not technology, is the usual binding constraint in a real
 * municipal pilot — a solution that works perfectly in one ward still fails a
 * three-ward target if the team can only staff one. Team size is the primary
 * signal; prior deployments evidence that the team has actually done it before.
 */
function coverage(
  s: Startup,
  a: ModelAssumptions,
): { value: number; p: ParameterProvenance } {
  const team = s.teamSize ?? 0;
  const deployments = s.deploymentCount ?? 0;

  // Diminishing returns: the twentieth engineer adds less than the second.
  const teamFactor = team > 0 ? Math.min(1, Math.log10(1 + team) / Math.log10(51)) : 0;
  const experience = Math.min(1, deployments / 8);
  const capacity = teamFactor * 0.65 + experience * 0.35;

  const value = clamp(capacity * a.maxCoverageRate, 0.01, a.maxCoverageRate);

  return {
    value,
    p: {
      parameter: 'coverageRate',
      value: Number(value.toFixed(4)),
      from: ['teamSize', 'deploymentCount'],
      note:
        team === 0
          ? 'No team size declared, so delivery capacity is modelled at the floor.'
          : `Team of ${team}${deployments ? ` with ${deployments} prior deployment(s)` : ' with no prior deployments recorded'}.`,
    },
  };
}

/** Fraction of `wanted` that appears in `offered`. */
function overlapFraction(wanted: string[], offered: string[]): number {
  const want = wanted.map(norm).filter(Boolean);
  if (want.length === 0) return 0;
  const have = new Set(offered.map(norm).filter(Boolean));
  return want.filter((w) => have.has(w)).length / want.length;
}

/**
 * Fit from the company profile alone.
 *
 * `scoreMatch` is the authoritative fit signal — but it is built for
 * *applicants*, and most of its weight sits on the challenge response: the
 * deployment approach, the pilot approach, the evidence references. This
 * feature simulates the entire cohort, and in a real cohort almost nobody has
 * applied. Scored by `scoreMatch` alone, 176 of 178 eligible companies come out
 * at an identical 0.110 — every difference between them lives in fields that
 * are blank for all of them, so the ranking degenerates into Monte Carlo noise
 * dressed as analysis.
 *
 * So fit is computed from what the whole cohort actually has: what they build,
 * what they work on, and whether their own description speaks to the metric the
 * department is trying to move. Where a response *does* exist, `scoreMatch` is
 * blended back in at equal weight — it is strictly better evidence, because the
 * company wrote it about this specific problem.
 *
 * Not penalising non-applicants is deliberate. The question here is "who could
 * deliver this?", asked of a market; answering it by docking everyone who has
 * not yet filled in a form would rank the form, not the market.
 */
function profileFit(s: Startup, challenge: Challenge): number {
  const tech = overlapFraction(challenge.technologies, s.technologies);
  const capability = overlapFraction(challenge.technologies, s.capabilities);
  const sectorMatch = norm(s.sector) === norm(challenge.domain) ? 1 : 0;

  // Does the company's own writing mention what the department measures?
  const words = [...challenge.targetMetric.split(/\s+/), challenge.domain]
    .map(norm)
    .filter((w) => w.length > 3);
  const text = norm(
    [s.description, s.problemSolved, s.solutionSummary, s.productSummary]
      .filter(Boolean)
      .join(' '),
  );
  const keyword = words.length === 0 ? 0 : words.filter((w) => text.includes(w)).length / words.length;

  return clamp(tech * 0.35 + capability * 0.25 + sectorMatch * 0.2 + keyword * 0.2, 0, 1);
}

/**
 * Efficacy: how much of the baseline→target gap is reachable at full coverage.
 *
 * The mapping is calibrated so the *decision-relevant* region sits inside the
 * cohort's real range of fit. Reaching the target requires an effect fraction
 * of exactly 1.0, so a mapping whose whole range falls below that produces a
 * cohort in which nobody ever succeeds — which is not conservatism, it is a
 * model with no discriminating power, ranking on noise. Here a weak fit clearly
 * misses, a strong fit clearly meets, and the middle is decided by coverage,
 * timing and measurement — which is what a pilot actually turns on.
 *
 * The ceiling exceeds 1.0 deliberately: a genuinely strong fit can overshoot a
 * conservatively-set target, and a model that could never beat target would
 * misrepresent what good pilots do.
 */
function efficacy(
  fit: number,
  hasResponse: boolean,
  a: ModelAssumptions,
): { value: number; p: ParameterProvenance } {
  const value = clamp(0.55 + fit * 0.95, 0.1, a.maxEfficacy);
  return {
    value,
    p: {
      parameter: 'efficacy',
      value: Number(value.toFixed(4)),
      from: hasResponse
        ? ['scoreMatch (filed response)', 'technologies', 'capabilities', 'sector', 'description']
        : ['technologies', 'capabilities', 'sector', 'description'],
      note: hasResponse
        ? `Fit ${(fit * 100).toFixed(0)}/100, blending the filed response's match score with the company profile.`
        : `Fit ${(fit * 100).toFixed(0)}/100 from the company profile. No response was filed for this challenge, so nothing the company wrote about *this* problem is in evidence.`,
    },
  };
}

/**
 * Data penalty: the multiplier on measurement noise.
 *
 * A pilot measured against a weak baseline produces a noisy reading, and a
 * noisy reading can miss a target the intervention actually hit — or claim one
 * it did not. Both directions matter, so this widens the distribution rather
 * than shifting it.
 */
function dataQuality(
  s: Startup,
  design: PilotDesign,
): { value: number; p: ParameterProvenance } {
  const baselinePenalty =
    design.baselineQuality === 'GOOD' ? 0.6 : design.baselineQuality === 'PARTIAL' ? 1 : 1.7;
  const privacy = assurance(s.dataPrivacyStatus);
  const value = clamp(baselinePenalty * (1.35 - privacy * 0.35), 0.4, 2.2);

  return {
    value,
    p: {
      parameter: 'dataPenalty',
      value: Number(value.toFixed(3)),
      from: ['pilot baselineQuality', 'dataPrivacyStatus'],
      note: `${design.baselineQuality.toLowerCase()} baseline; data-privacy assurance ${s.dataPrivacyStatus?.toLowerCase().replace(/_/g, ' ') ?? 'not provided'}.`,
    },
  };
}

/**
 * Integration risk: the chance rollout freezes on a systems boundary.
 *
 * A company that has written down its dependencies and deployment requirements
 * has usually thought about them. One that has left both blank has not
 * necessarily failed to — but nothing on the record says otherwise, and the
 * model does not award credit for silence.
 */
function integration(s: Startup): { value: number; p: ParameterProvenance } {
  const declaredDependencies = (s.implementationDependencies ?? '').trim().length > 40;
  const declaredRequirements = (s.deploymentRequirements ?? '').trim().length > 40;
  const declared = (declaredDependencies ? 1 : 0) + (declaredRequirements ? 1 : 0);
  const value = [0.32, 0.18, 0.08][declared];

  return {
    value,
    p: {
      parameter: 'integrationRisk',
      value,
      from: ['implementationDependencies', 'deploymentRequirements'],
      note:
        declared === 2
          ? 'Dependencies and deployment requirements both documented.'
          : declared === 1
            ? 'Only one of dependencies / deployment requirements is documented.'
            : 'Neither dependencies nor deployment requirements are documented.',
    },
  };
}

export function parameterise(
  startup: Startup,
  challenge: Challenge,
  response: ChallengeResponse | null,
  governmentEngagements: number,
  design: PilotDesign,
  assumptions: ModelAssumptions,
): ParameterisedCompany {
  const match = scoreMatch({
    challenge,
    startup,
    response,
    governmentEngagements,
  });

  // `scoreMatch` is better evidence where it exists, because the company wrote
  // it about this specific problem — but it is mostly blank without a response,
  // so the profile carries the signal for the rest of the cohort.
  const profile = profileFit(startup, challenge);
  const fit = response ? profile * 0.5 + match.overallScore * 0.5 : profile;

  const mob = mobilisation(startup, assumptions);
  const cov = coverage(startup, assumptions);
  const eff = efficacy(fit, response !== null, assumptions);
  const data = dataQuality(startup, design);
  const integ = integration(startup);

  const params: CompanyParameters = {
    mobilisationDays: mob.value,
    coverageRate: cov.value,
    efficacy: eff.value,
    dataPenalty: data.value,
    integrationRisk: integ.value,
  };

  return {
    startupId: startup.id,
    name: startup.displayName ?? startup.legalName,
    params,
    provenance: [mob.p, cov.p, eff.p, data.p, integ.p],
    matchScore: match.overallScore,
  };
}

/**
 * Apply a perturbation to one parameter.
 *
 * Used by the sensitivity sweep. Kept here, beside the derivations, so that a
 * new parameter cannot be added without someone deciding how it perturbs.
 */
export function perturb(
  params: CompanyParameters,
  parameter: keyof CompanyParameters,
  factor: number,
): CompanyParameters {
  return { ...params, [parameter]: params[parameter] * factor };
}

export const PERTURBABLE: (keyof CompanyParameters)[] = [
  'mobilisationDays',
  'coverageRate',
  'efficacy',
  'dataPenalty',
  'integrationRisk',
];

/** One parameter setting to re-rank the cohort under. */
export interface Perturbation {
  /** Shown while it runs, so the officer sees what is being tested. */
  label: string;
  shifts: { parameter: keyof CompanyParameters; factor: number }[];
}

/**
 * The sensitivity plan: every parameter setting the cohort is re-ranked under.
 *
 * Two kinds, and the second is the one worth the time.
 *
 * **Single** — each parameter moved alone, at four magnitudes each way. This
 * answers "how wrong would we have to be about delivery capacity for this
 * ranking to change?", and the magnitude is the answer.
 *
 * **Pairwise** — two parameters moved together. One-at-a-time sensitivity has a
 * well-known blind spot: it cannot see interactions, and being slightly wrong
 * about two things at once is both commoner and more damaging than being badly
 * wrong about one. A ranking that survives every single-parameter shift can
 * still inv­ert when mobilisation and coverage are both optimistic — which is
 * exactly the case where a department's own delay compounds a vendor's.
 *
 * The plan is generated rather than listed so it stays exhaustive as parameters
 * are added, and it is deterministic in order so two runs test the same
 * settings in the same sequence.
 */
export function perturbationPlan(): Perturbation[] {
  const plan: Perturbation[] = [];
  // Eight magnitudes per parameter, four each way. The spread is what makes the
  // output actionable: "the ranking holds until delivery capacity is 30% below
  // assumption" is a usable finding, where a single ±20% test can only say
  // "held" or "did not".
  const magnitudes = [0.5, 0.6, 0.7, 0.8, 1.2, 1.3, 1.4, 1.5];

  for (const parameter of PERTURBABLE) {
    for (const factor of magnitudes) {
      plan.push({
        label: `${parameter} ×${factor}`,
        shifts: [{ parameter, factor }],
      });
    }
  }

  for (let i = 0; i < PERTURBABLE.length; i += 1) {
    for (let j = i + 1; j < PERTURBABLE.length; j += 1) {
      for (const [fa, fb] of [
        [0.8, 0.8],
        [0.8, 1.2],
        [1.2, 0.8],
        [1.2, 1.2],
      ]) {
        plan.push({
          label: `${PERTURBABLE[i]} ×${fa} + ${PERTURBABLE[j]} ×${fb}`,
          shifts: [
            { parameter: PERTURBABLE[i], factor: fa },
            { parameter: PERTURBABLE[j], factor: fb },
          ],
        });
      }
    }
  }

  return plan;
}

/** Apply a whole setting at once. */
export function applyPerturbation(
  params: CompanyParameters,
  p: Perturbation,
): CompanyParameters {
  return p.shifts.reduce((acc, s) => perturb(acc, s.parameter, s.factor), params);
}
