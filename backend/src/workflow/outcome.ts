import { PilotOutcome } from '@prisma/client';

/**
 * The rule that decides whether a pilot met its target.
 *
 * This lives on its own because two callers need it and they must never
 * disagree: `closePilot` applies it to a real measured pilot, and the pilot
 * simulator applies it to every simulated run. If the simulator judged a run by
 * even slightly different arithmetic, its ranking would be measuring something
 * other than the thing the platform actually contracts against — and the
 * discrepancy would only surface when a real pilot closed with an outcome the
 * simulation said was unlikely.
 *
 * Direction is inferred rather than configured. A target below the baseline is
 * an improvement to be driven *down* (leakage, delay, cost); a target above it
 * is one to be driven *up* (coverage, uptime, collection rate). Storing a
 * separate "direction" flag would let it contradict the numbers beside it.
 */

/** How far a measurement travelled from baseline toward target, 0–1+. */
export function progressFraction(
  baseline: number,
  target: number,
  achieved: number,
): number {
  const span = Math.abs(baseline - target) || 1;
  return Math.abs(baseline - achieved) / span;
}

/** Whether the measurement reached the target, in the target's own direction. */
export function targetMet(baseline: number, target: number, achieved: number): boolean {
  const improvingDownward = baseline >= target;
  return improvingDownward ? achieved <= target : achieved >= target;
}

/**
 * Met, partially met, or missed.
 *
 * "Partially met" is deliberately generous at exactly half the distance: a
 * pilot that moved the metric halfway has demonstrated the mechanism works and
 * failed on scale, which is a different finding from one that moved nothing —
 * and the two must not collapse into a single "failed", because only the first
 * is worth redesigning and rerunning.
 */
export function classifyOutcome(
  baseline: number,
  target: number,
  achieved: number,
): PilotOutcome {
  if (targetMet(baseline, target, achieved)) return PilotOutcome.TARGET_MET;
  return progressFraction(baseline, target, achieved) >= 0.5
    ? PilotOutcome.PARTIALLY_MET
    : PilotOutcome.TARGET_MISSED;
}
