import { DesignRecommendation, PilotRecord, SimulationRequest } from '../domain/types';

/**
 * Pilot design recommendations (part of BE-03).
 *
 * Every recommendation is descriptive statistics over the comparable set. None
 * of them predicts anything: each says "pilots like this one that met their
 * target were designed this way, and yours is not". That is a claim a
 * department can act on and defend, which a forecast is not.
 *
 * Pure functions throughout — no repository, no clock, no randomness — so the
 * same comparable set always yields the same advice and the engine is testable
 * without a fixture server.
 */

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const ids = (records: PilotRecord[]): string[] => records.map((r) => r.id);

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** Pilots that hit what they contracted for. The design reference class. */
const succeeded = (records: PilotRecord[]) => records.filter((r) => r.outcome === 'TARGET_MET');

/**
 * Duration and baseline.
 *
 * Treated as one recommendation because they are one decision: a pilot's
 * length is only meaningful net of the baseline capture it has to fund first.
 * A 90-day pilot with a 30-day baseline has 60 days of measurement, and it is
 * the measurement window that has to clear the bar.
 */
function recommendDuration(
  request: SimulationRequest,
  comparables: PilotRecord[],
): DesignRecommendation[] {
  const winners = succeeded(comparables);
  const out: DesignRecommendation[] = [];

  if (winners.length === 0) return out;

  const baselineRef = Math.round(median(winners.map((r) => r.baselineDays)));
  const measurementRef = Math.round(
    median(winners.map((r) => r.durationDays - r.baselineDays)),
  );

  /* --- baseline --- */
  const baselineShort = request.proposed.baselineDays < baselineRef;
  out.push({
    field: 'Baseline period',
    proposed: `${request.proposed.baselineDays} days`,
    recommended: `${baselineRef} days`,
    rationale: baselineShort
      ? `${winners.length} comparable ${plural(winners.length, 'pilot', 'pilots')} met target, and the median ran ${baselineRef} days of baseline capture before any outcome claim was contractable. The proposal allows ${request.proposed.baselineDays}.`
      : `The proposed baseline already meets or exceeds the ${baselineRef} days the comparable pilots that met target used.`,
    sources: ids(winners),
    changed: baselineShort,
  });

  /* --- total duration --- */
  const recommendedDuration = baselineRef + measurementRef;
  const durationShort = request.proposed.durationDays < recommendedDuration;
  const proposedMeasurement = request.proposed.durationDays - request.proposed.baselineDays;

  out.push({
    field: 'Duration',
    proposed: `${request.proposed.durationDays} days`,
    recommended: `${recommendedDuration} days`,
    rationale: durationShort
      ? `Net of baseline, the proposal leaves ${proposedMeasurement} days of measurement against the ${measurementRef} observed as sufficient in comparable pilots that met target.`
      : `Net of baseline the proposal leaves ${proposedMeasurement} days of measurement, at or above the ${measurementRef} observed as sufficient.`,
    sources: ids(winners),
    changed: durationShort,
  });

  return out;
}

/**
 * Scope.
 *
 * Bounded by what comparable pilots that met target actually covered. Over-wide
 * scope is a recorded failure mode in this corpus, and under-wide scope tends to
 * produce a result too thin to scale from.
 */
function recommendScope(
  request: SimulationRequest,
  comparables: PilotRecord[],
): DesignRecommendation | null {
  const winners = succeeded(comparables);
  if (winners.length === 0) return null;

  const units = winners.map((r) => r.scopeUnits);
  const low = Math.min(...units);
  const high = Math.max(...units);
  const proposed = request.proposed.scopeUnits;
  const label = request.proposed.scopeUnitLabel;
  const outside = proposed < low || proposed > high;

  const clamped = Math.min(Math.max(proposed, low), high);

  return {
    field: 'Scope',
    proposed: `${proposed} ${label}`,
    recommended: outside ? `${clamped} ${label}` : `${proposed} ${label}`,
    rationale: outside
      ? `Comparable pilots that met target covered ${low}-${high} ${label}. A scope of ${proposed} sits outside that band, where the corpus offers no evidence either way.`
      : `Comparable pilots that met target covered ${low}-${high} ${label}. The proposed scope sits inside that band and needs no adjustment.`,
    sources: ids(winners),
    changed: outside,
  };
}

/**
 * Milestone split.
 *
 * Deployment carries the least outcome risk and the most cash-flow pressure on
 * the startup; validation carries the most outcome risk. Weighting the later
 * tranches keeps payment tied to evidence without starving delivery — and the
 * weighting used is the one comparable successful pilots actually contracted.
 */
function recommendMilestoneSplit(
  request: SimulationRequest,
  comparables: PilotRecord[],
): DesignRecommendation | null {
  const winners = succeeded(comparables).filter(
    (r) => r.milestoneSplit.length === request.proposed.milestoneSplit.length,
  );
  if (winners.length === 0) return null;

  const size = request.proposed.milestoneSplit.length;
  const referenceRaw = Array.from({ length: size }, (_, i) =>
    median(winners.map((r) => r.milestoneSplit[i])),
  );

  // Medians taken per position will not sum to exactly 1; renormalise so the
  // recommendation is a valid split rather than an approximate one.
  const total = referenceRaw.reduce((a, b) => a + b, 0);
  const reference = referenceRaw.map((v) => v / total);

  const asPercent = (split: number[]) => split.map((v) => Math.round(v * 100)).join(' / ');
  const proposedPct = asPercent(request.proposed.milestoneSplit);
  const referencePct = asPercent(reference);
  const changed = proposedPct !== referencePct;

  return {
    field: 'Milestone split',
    proposed: proposedPct,
    recommended: referencePct,
    rationale: changed
      ? `Comparable pilots that met target weighted their tranches ${referencePct}, holding more of the value behind validation while keeping deployment funded.`
      : `The proposed split already matches what comparable pilots that met target contracted.`,
    sources: ids(winners),
    changed,
  };
}

/**
 * Success threshold.
 *
 * A binary target discards evidence. Where the corpus contains a pilot that
 * produced usable infrastructure and a real partial improvement but was still
 * recorded as a miss, a partial-credit floor is recommended so the next one is
 * not written off the same way.
 */
function recommendThreshold(
  request: SimulationRequest,
  comparables: PilotRecord[],
): DesignRecommendation | null {
  const nearMisses = comparables.filter(
    (r) =>
      r.outcome !== 'TARGET_MET' &&
      r.achievedValue > 0 &&
      r.achievedValue >= r.targetValue * 0.4,
  );

  const target = request.proposed.targetValue;
  if (nearMisses.length === 0) {
    return {
      field: 'Success threshold',
      proposed: `${target}%`,
      recommended: `${target}%`,
      rationale:
        'No comparable pilot in the corpus produced a substantial partial result that was recorded as a failure, so no partial-credit floor is indicated.',
      sources: ids(comparables),
      changed: false,
    };
  }

  const floor = Math.round(target * 0.75);
  const example = nearMisses[0];

  return {
    field: 'Success threshold',
    proposed: `${target}%`,
    recommended: `${target}% with a ${floor}% floor`,
    rationale: `${example.id} reached ${example.achievedValue}% against a ${example.targetValue}% target and was recorded as a failure despite producing usable infrastructure. A partial-credit floor preserves that evidence rather than discarding it.`,
    sources: ids(nearMisses),
    changed: true,
  };
}

/** All design recommendations for one proposed pilot. */
export function buildDesignRecommendations(
  request: SimulationRequest,
  comparables: PilotRecord[],
): DesignRecommendation[] {
  if (comparables.length === 0) return [];

  return [
    ...recommendDuration(request, comparables),
    recommendScope(request, comparables),
    recommendMilestoneSplit(request, comparables),
    recommendThreshold(request, comparables),
  ].filter((r): r is DesignRecommendation => r !== null);
}
