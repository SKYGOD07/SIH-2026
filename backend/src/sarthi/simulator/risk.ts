import {
  FailureCause,
  PilotRecord,
  RiskSeverity,
  SimulatedRisk,
  SimulationRequest,
} from '../domain/types';

/**
 * The risk register (part of BE-03).
 *
 * The most valuable thing the simulator produces. It reads the failure causes
 * recorded against comparable pilots and converts each into a **precondition**
 * — a contractual condition to be met before award.
 *
 * That conversion is the point. "Pilots like this sometimes fail on repair
 * capacity" is trivia; "the department confirms repair throughput of eight
 * excavations per week, in writing, before M1" is something an officer can put
 * in a contract. It is the difference between a department discovering a
 * constraint in month four and writing it into the agreement in month zero.
 */

export interface RiskTemplate {
  /** The finding, in plain language. */
  risk: string;
  /** The condition it becomes. Written to be pasted into an agreement. */
  precondition: (request: SimulationRequest) => string;
  /** Severity when this cause appears at all; escalated by frequency below. */
  baseSeverity: RiskSeverity;
}

/**
 * One entry per `FailureCause`. Adding a cause to the vocabulary without adding
 * it here would silently drop it from every register, so the map is exhaustive
 * by type — TypeScript will refuse to compile if a cause is missed.
 */
export const RISK_LIBRARY: Record<FailureCause, RiskTemplate> = {
  INSUFFICIENT_BASELINE: {
    risk: 'The baseline period is too short to separate the intervention from normal variation',
    precondition: (q) =>
      `A minimum ${Math.max(30, q.proposed.baselineDays)}-day baseline is captured and signed off before any outcome claim becomes contractable.`,
    baseSeverity: 'HIGH',
  },
  DELIVERY_CAPACITY: {
    risk: 'Departmental delivery capacity, not the technology, becomes the binding constraint',
    precondition: () =>
      'The department confirms in writing, before M1, the crew and equipment throughput required to act on what the solution detects.',
    baseSeverity: 'HIGH',
  },
  COVERAGE_SHORTFALL: {
    risk: 'Sensing or survey coverage falls below the level the target assumes',
    precondition: () =>
      'A minimum 80% of the planned coverage is verified before any target claim is contractable; below that, the milestone is measured on coverage alone.',
    baseSeverity: 'HIGH',
  },
  DATA_QUALITY: {
    risk: 'Existing departmental data is not good enough to attribute the outcome',
    precondition: () =>
      'Source data is audited and any gaps remediated before the baseline period opens, with the audit filed as M1 evidence.',
    baseSeverity: 'HIGH',
  },
  SEASONAL_WINDOW: {
    risk: 'The pilot calendar overlaps a season that suppresses the measurement',
    precondition: (q) =>
      q.context.monsoonOverlapMonths
        ? `The ${q.context.monsoonOverlapMonths}-month monsoon overlap is either excluded from the calendar or the duration is extended by the same period.`
        : 'The pilot calendar excludes the monsoon window, or the duration extends by the length of the overlap.',
    baseSeverity: 'MEDIUM',
  },
  INTEGRATION_GAP: {
    risk: 'The solution cannot reach the departmental systems it has to feed',
    precondition: () =>
      'Integration points and responsible owners are named in Schedule I, with a signed connectivity test before M2.',
    baseSeverity: 'MEDIUM',
  },
  SCOPE_TOO_WIDE: {
    risk: 'Scope outruns the delivery capacity available inside the window',
    precondition: () =>
      'Scope is bounded to the band comparable pilots delivered against, with expansion available only after M2 evidence is approved.',
    baseSeverity: 'MEDIUM',
  },
  TAXONOMY_MISMATCH: {
    risk: 'Participating bodies classify the same thing differently, so results cannot be pooled',
    precondition: () =>
      'A common data dictionary is agreed and signed by every participating body before the baseline period opens.',
    baseSeverity: 'MEDIUM',
  },
};

/**
 * Frequency escalates severity.
 *
 * A cause seen in most of the comparable set is a near-certainty for this pilot
 * and should be read as such, whatever its base severity.
 */
function escalate(base: RiskSeverity, observed: number, total: number): RiskSeverity {
  if (total === 0) return base;
  const rate = observed / total;
  if (rate >= 0.5) return 'HIGH';
  if (rate >= 0.25) return base === 'LOW' ? 'MEDIUM' : base;
  return base;
}

/**
 * Builds the register from what actually went wrong in the comparable set.
 *
 * Ordered by severity then frequency, so the conditions a department must act
 * on first are at the top.
 */
export function buildRiskRegister(
  request: SimulationRequest,
  comparables: PilotRecord[],
): SimulatedRisk[] {
  if (comparables.length === 0) return [];

  // Group the comparable pilots by each cause recorded against them.
  const byCause = new Map<FailureCause, PilotRecord[]>();
  comparables.forEach((record) => {
    record.failureCauses.forEach((cause) => {
      const bucket = byCause.get(cause);
      if (bucket) bucket.push(record);
      else byCause.set(cause, [record]);
    });
  });

  const total = comparables.length;
  const severityRank: Record<RiskSeverity, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

  return [...byCause.entries()]
    .map(([cause, records], index) => {
      const template = RISK_LIBRARY[cause];
      const observed = records.length;

      return {
        id: `R-${String(index + 1).padStart(2, '0')}`,
        cause,
        risk: template.risk,
        observedIn: `${observed} of ${total} comparable pilot${total === 1 ? '' : 's'}`,
        observedCount: observed,
        comparableCount: total,
        severity: escalate(template.baseSeverity, observed, total),
        precondition: template.precondition(request),
        sources: records.map((r) => r.id),
      } satisfies SimulatedRisk;
    })
    .sort(
      (a, b) =>
        severityRank[a.severity] - severityRank[b.severity] ||
        b.observedCount - a.observedCount,
    )
    // Re-number after sorting so R-01 is genuinely the first risk to act on.
    .map((risk, i) => ({ ...risk, id: `R-${String(i + 1).padStart(2, '0')}` }));
}
