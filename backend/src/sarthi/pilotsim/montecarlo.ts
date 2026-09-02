import { FailureCause } from '@prisma/client';
import { mixSeed, seedFromString } from '../../utils/rng';
import { simulateOnce } from './trajectory';
import type {
  CompanyAggregate,
  CompanyParameters,
  ModelAssumptions,
  PilotDesign,
} from './types';

/**
 * Many runs of one pilot, summarised.
 *
 * The point of running a pilot thousands of times is the **spread**, not the
 * average. Two companies with the same median outcome are not equivalent if one
 * lands within a hand's breadth of it every time and the other swings from
 * triumph to nothing — the second is a procurement risk the median conceals.
 * So p10 and p90 are first-class outputs, not diagnostics.
 *
 * Counts are kept as counts. `runsMetTarget` is stored beside `runsTotal` and
 * never divided down, because "142 of 200 runs" is a statement about the model
 * that a reader can check, while "71%" reads as a probability about a company
 * and is not supported by anything here.
 */

const quantile = (sorted: number[], q: number): number => {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
};

export function runCohortMember(
  startupId: string,
  design: PilotDesign,
  params: CompanyParameters,
  assumptions: ModelAssumptions,
  runSeed: number,
  captureTrajectory: boolean,
): CompanyAggregate {
  const n = assumptions.runsPerCompany;

  // The company's seed is derived from its id, not its position in the cohort.
  // Row order is not something Postgres promises, and a ranking that shifted
  // when the query planner changed its mind would be indefensible.
  const base = mixSeed(runSeed, seedFromString(startupId));

  const achieved: number[] = [];
  const coverage: number[] = [];
  const causes = new Map<FailureCause, number>();
  let met = 0;
  let partial = 0;

  // The median curve is taken from the median run rather than by averaging
  // curves: an average of trajectories is a shape no single pilot ever had.
  let curves: { achieved: number; daily: number[] }[] | null = captureTrajectory ? [] : null;

  for (let i = 0; i < n; i += 1) {
    const r = simulateOnce(design, params, assumptions, mixSeed(base, i), captureTrajectory);

    achieved.push(r.achieved);
    coverage.push(r.coverageFraction);
    if (r.metTarget) met += 1;
    else if (r.partial) partial += 1;

    if (r.binding !== 'NONE') causes.set(r.binding, (causes.get(r.binding) ?? 0) + 1);
    if (curves && r.daily) curves.push({ achieved: r.achieved, daily: r.daily });
  }

  const sortedAchieved = [...achieved].sort((a, b) => a - b);
  const sortedCoverage = [...coverage].sort((a, b) => a - b);

  let trajectory: number[] | null = null;
  if (curves && curves.length > 0) {
    curves.sort((a, b) => a.achieved - b.achieved);
    trajectory = curves[Math.floor(curves.length / 2)].daily;
    curves = null;
  }

  const dominantCause =
    [...causes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    startupId,
    runsMetTarget: met,
    runsPartial: partial,
    runsMissed: n - met - partial,
    runsTotal: n,
    medianAchieved: quantile(sortedAchieved, 0.5),
    p10: quantile(sortedAchieved, 0.1),
    p90: quantile(sortedAchieved, 0.9),
    medianCoverage: quantile(sortedCoverage, 0.5),
    medianMobilisationDays: params.mobilisationDays,
    dominantCause,
    trajectory,
  };
}

/**
 * The ranking rule.
 *
 * Primary key is how often the target was met. Ties break on the median result
 * and then on the p10 — between two companies that met target equally often,
 * prefer the one whose bad days are less bad. Deliberately *not* a composite
 * score: a single blended number would hide which of the three actually
 * separated two candidates, and that is the first thing anyone asks.
 */
export function rankAggregates(rows: CompanyAggregate[], design: PilotDesign): CompanyAggregate[] {
  const better = (a: number, b: number) =>
    design.target <= design.baseline ? a - b : b - a;

  return [...rows].sort(
    (x, y) =>
      y.runsMetTarget - x.runsMetTarget ||
      better(x.medianAchieved, y.medianAchieved) ||
      better(x.p10, y.p10),
  );
}
