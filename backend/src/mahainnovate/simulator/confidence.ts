import { ConfidenceBand, PilotRecord, SensitivityFinding } from '../domain/types';

/**
 * The confidence band and sensitivity findings (part of BE-03).
 *
 * This is the output most likely to be misread, so it is built defensively.
 *
 *  - It reports a **ratio with its denominator**, never a probability. "2 of 5"
 *    is honest; "40% likely to succeed" is not, because the five are not a
 *    random sample and the sixth pilot is not a draw from the same urn.
 *  - The caveat is a required field on the type, not an optional note, so it
 *    cannot be dropped by a caller that finds it inconvenient.
 *  - Below a minimum comparable count the band is flagged, so the interface can
 *    suppress the number rather than dress up noise as a finding.
 *
 * It describes how comparable pilots were *designed and run*. It says nothing
 * about this startup.
 */

/** Under this many comparables, the ratio is noise. */
const REPORTING_THRESHOLD = 4;

export function buildConfidence(comparables: PilotRecord[]): ConfidenceBand {
  const met = comparables.filter((r) => r.outcome === 'TARGET_MET').length;
  const partial = comparables.filter((r) => r.outcome === 'PARTIALLY_MET').length;
  const missed = comparables.filter((r) => r.outcome === 'TARGET_MISSED').length;
  const total = comparables.length;

  const belowReportingThreshold = total < REPORTING_THRESHOLD;

  const statement =
    total === 0
      ? 'No comparable pilots were found, so no band can be reported.'
      : `Pilots with this profile met their contracted target in ${met} of ${total} comparable case${total === 1 ? '' : 's'}` +
        (partial > 0 ? `, and partially met it in ${partial} more.` : '.');

  const caveat = belowReportingThreshold
    ? `Only ${total} comparable pilot${total === 1 ? '' : 's'} were found — too few to read as a rate. Treat this as context, not as a finding.`
    : `${total} comparable pilots is a small base. This is a band, not a probability, and it describes past pilot design — not this startup.`;

  return { met, partial, missed, total, statement, caveat, belowReportingThreshold };
}

/**
 * Which design variables actually separated the pilots that met target from
 * those that did not.
 *
 * Each finding compares the mean of one variable across the two groups and is
 * reported only where the gap is material. Where a variable does not separate
 * the groups, it is left out rather than reported as "no effect" — a list of
 * non-findings reads as analysis and is not.
 */
export function buildSensitivity(comparables: PilotRecord[]): SensitivityFinding[] {
  const winners = comparables.filter((r) => r.outcome === 'TARGET_MET');
  const rest = comparables.filter((r) => r.outcome !== 'TARGET_MET');

  // With nothing to contrast, there is no sensitivity to report.
  if (winners.length === 0 || rest.length === 0) return [];

  const mean = (records: PilotRecord[], pick: (r: PilotRecord) => number) =>
    records.reduce((sum, r) => sum + pick(r), 0) / records.length;

  const rank = (gap: number): SensitivityFinding['effect'] =>
    gap >= 2 ? 'Strongest' : gap >= 1.5 ? 'Strong' : gap >= 1.2 ? 'Moderate' : 'Weak';

  const sources = comparables.map((r) => r.id);
  const findings: SensitivityFinding[] = [];

  /* --- baseline length --- */
  const baselineWin = mean(winners, (r) => r.baselineDays);
  const baselineRest = mean(rest, (r) => r.baselineDays);
  if (baselineRest > 0 ? baselineWin / baselineRest >= 1.2 : baselineWin > 0) {
    const gap = baselineRest > 0 ? baselineWin / baselineRest : 3;
    findings.push({
      variable: 'Baseline period length',
      effect: rank(gap),
      finding: `Pilots that met target ran ${Math.round(baselineWin)} days of baseline on average, against ${Math.round(baselineRest)} for those that did not.`,
      detail: `≥ ${Math.round(baselineWin)} days`,
      sources,
    });
  }

  /* --- scope --- */
  const scopeWin = mean(winners, (r) => r.scopeUnits);
  const scopeRest = mean(rest, (r) => r.scopeUnits);
  if (scopeWin > 0 && scopeRest / scopeWin >= 1.2) {
    findings.push({
      variable: 'Scope width',
      effect: rank(scopeRest / scopeWin),
      finding: `Pilots that missed target covered wider scope on average (${scopeRest.toFixed(1)} units against ${scopeWin.toFixed(1)}), outrunning delivery capacity.`,
      detail: `≤ ${Math.ceil(scopeWin)} units`,
      sources,
    });
  }

  /* --- measurement window net of baseline --- */
  const windowWin = mean(winners, (r) => r.durationDays - r.baselineDays);
  const windowRest = mean(rest, (r) => r.durationDays - r.baselineDays);
  if (windowRest > 0 && windowWin / windowRest >= 1.2) {
    findings.push({
      variable: 'Measurement window',
      effect: rank(windowWin / windowRest),
      finding: `Net of baseline, pilots that met target had ${Math.round(windowWin)} days to measure against ${Math.round(windowRest)}.`,
      detail: `≥ ${Math.round(windowWin)} days`,
      sources,
    });
  }

  const order: Record<SensitivityFinding['effect'], number> = {
    Strongest: 0,
    Strong: 1,
    Moderate: 2,
    Weak: 3,
  };
  return findings.sort((a, b) => order[a.effect] - order[b.effect]);
}
