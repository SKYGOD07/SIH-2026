import type { FailureCause } from '@prisma/client';

/**
 * The pilot simulation model.
 *
 * ## What this is
 *
 * A forward simulation. Given a challenge and a company, it runs a synthetic
 * 90-day pilot thousands of times and counts how often the contracted target
 * was met. Across a cohort it produces a ranking, and — more usefully — a
 * statement about how much that ranking depends on assumptions that might be
 * wrong.
 *
 * ## What its numbers mean, and do not
 *
 * `src/sarthi/simulator/confidence.ts` argues that a ratio over a handful of
 * real pilots must never be dressed as a probability, and it is right. This
 * module does not break that rule, because it measures a different thing:
 *
 *   NOT  "AquaSense has a 71% chance of succeeding."
 *        A claim about a company in the world. Nothing here supports it.
 *
 *   BUT  "Under this model, AquaSense met the target in 142 of 200 runs."
 *        A claim about the model — reproducible, and every parameter traceable
 *        to a named field on the company record.
 *
 * So counts are carried with their denominators everywhere, all the way to the
 * screen. `runsMetTarget` is never divided down to a rate in storage, because
 * the rate is what invites the misreading.
 *
 * ## Determinism
 *
 * Same `(seed, modelVersion, cohort)` produces byte-identical output on any
 * machine. There is no `Math.random()` and no clock read inside the model. A
 * ranking an officer cannot reproduce is a ranking they cannot defend.
 */

/**
 * Bumped whenever the model's behaviour changes.
 *
 * Stored on every run. A result read later against a different model would be
 * quietly wrong, and the version is what makes that detectable.
 */
export const MODEL_VERSION = 'pilotsim-1.0.0';

export const SIMULATION_DISCLAIMER =
  'Simulated under a stated model using demonstration company records. Counts describe model runs, not the probability that any company will succeed. This is not a government decision, a procurement outcome, or an assessment of any company.';

/** Model constants. Stored on the run so a result is readable against them. */
export interface ModelAssumptions {
  runsPerCompany: number;
  perturbationPasses: number;
  /** Days for a covered unit to reach ~63% of its steady-state effect. */
  rampTauDays: number;
  /** Measurement noise, as a fraction of the baseline→target gap. */
  noiseSigma: number;
  /** A window in which the measurement is suppressed (monsoon, holidays). */
  seasonal: { startDay: number; endDay: number; suppression: number } | null;
  /** Ceilings that keep derived parameters inside a defensible range. */
  maxMobilisationDays: number;
  maxCoverageRate: number;
  maxEfficacy: number;
  /** Coverage below this fraction is read as a coverage shortfall. */
  coverageAdequacy: number;
}

/** Where a parameter's value came from. Shown beside the number in the UI. */
export interface ParameterProvenance {
  parameter: keyof CompanyParameters | string;
  value: number;
  /** The stored fields that moved it, named so a reader can check. */
  from: string[];
  note: string;
}

/**
 * One company's model parameters.
 *
 * Every one is derived from stored fields. Absence scores pessimistically and
 * is never imputed to a cohort average — the rule `matching.ts` already sets:
 * a company that has declared nothing reads as silent, not as adequate.
 */
export interface CompanyParameters {
  /** Days before anything is deployed at all. */
  mobilisationDays: number;
  /** Scope units brought online per day, once mobilised. */
  coverageRate: number;
  /** Fraction of the baseline→target gap reachable at full coverage. */
  efficacy: number;
  /** Multiplier on measurement noise. 1 = clean, higher = noisier. */
  dataPenalty: number;
  /** Probability an integration failure freezes rollout mid-pilot. */
  integrationRisk: number;
}

export interface ParameterisedCompany {
  startupId: string;
  name: string;
  params: CompanyParameters;
  provenance: ParameterProvenance[];
  /** The deterministic match score this company got, reused not recomputed. */
  matchScore: number;
}

/** What limited a single run. Mapped onto the schema's controlled vocabulary. */
export type BindingConstraint = FailureCause | 'NONE';

export interface RunOutcome {
  achieved: number;
  coverageFraction: number;
  /** Day the last unit came online, or -1 if some never did. */
  fullCoverageDay: number;
  binding: BindingConstraint;
  metTarget: boolean;
  partial: boolean;
}

/** The aggregate over all runs for one company in one pass. */
export interface CompanyAggregate {
  startupId: string;
  runsMetTarget: number;
  runsPartial: number;
  runsMissed: number;
  runsTotal: number;
  medianAchieved: number;
  p10: number;
  p90: number;
  medianCoverage: number;
  medianMobilisationDays: number;
  dominantCause: FailureCause | null;
  /** The median daily curve. Captured only where it will be shown. */
  trajectory: number[] | null;
}

/** The fixed facts of the pilot being simulated. */
export interface PilotDesign {
  baseline: number;
  target: number;
  durationDays: number;
  scopeUnits: number;
  scopeUnitLabel: string;
  /** Feeds the data penalty: a weak baseline cannot support a strong claim. */
  baselineQuality: 'NONE' | 'PARTIAL' | 'GOOD';
}
