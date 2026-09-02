import { FailureCause } from '@prisma/client';
import { gaussian, rng } from '../../utils/rng';
import { classifyOutcome, targetMet } from '../../workflow/outcome';
import type {
  BindingConstraint,
  CompanyParameters,
  ModelAssumptions,
  PilotDesign,
  RunOutcome,
} from './types';

/**
 * One simulated pilot.
 *
 * The model steps **per scope unit per day**, not in aggregate, because
 * coverage shortfall is a per-unit phenomenon and aggregating it away would
 * erase the most common real failure. A ward brought online on day 78 of a
 * 90-day pilot has had twelve days to show an effect; averaging it with a ward
 * live since day 12 would credit it with effect it never had time to produce.
 * That distinction is the difference between a model that ranks on capability
 * and one that ranks on *deliverable* capability inside the contracted window.
 *
 * Every random draw comes from a seeded generator passed in by the caller. The
 * same seed reproduces the same pilot exactly, on any machine, forever.
 */

/** Effect a unit has produced by now, as a fraction of its steady state. */
const ramp = (daysLive: number, tau: number) =>
  daysLive <= 0 ? 0 : 1 - Math.exp(-daysLive / tau);

export function simulateOnce(
  design: PilotDesign,
  params: CompanyParameters,
  assumptions: ModelAssumptions,
  seed: number,
  captureDaily = false,
): RunOutcome & { daily: number[] | null } {
  const next = rng(seed);
  const { baseline, target, durationDays, scopeUnits } = design;
  const gap = target - baseline;

  // Day each unit came online; -1 while it has not.
  const liveOn = new Array<number>(scopeUnits).fill(-1);
  const daily: number[] | null = captureDaily ? [] : null;

  // An integration failure is decided once, up front, and freezes further
  // rollout from the day it fires. Deciding it per-day would make long pilots
  // implausibly certain to hit one.
  const integrationFires = next() < params.integrationRisk;
  const integrationDay = integrationFires
    ? Math.floor(params.mobilisationDays + next() * (durationDays - params.mobilisationDays))
    : Number.POSITIVE_INFINITY;

  let frozen = false;
  let effectFraction = 0;

  for (let day = 1; day <= durationDays; day += 1) {
    if (day >= integrationDay) frozen = true;

    if (day > params.mobilisationDays && !frozen) {
      // Each still-dark unit has an independent chance of coming online. This
      // yields a naturally decelerating rollout — the easy sites go first.
      const perUnit = params.coverageRate / scopeUnits;
      for (let u = 0; u < scopeUnits; u += 1) {
        if (liveOn[u] === -1 && next() < perUnit) liveOn[u] = day;
      }
    }

    // Effect is summed across units, each ramping from its own start day.
    let effect = 0;
    for (let u = 0; u < scopeUnits; u += 1) {
      if (liveOn[u] !== -1) effect += ramp(day - liveOn[u], assumptions.rampTauDays);
    }
    effectFraction = (effect / scopeUnits) * params.efficacy;

    // A seasonal window suppresses what can be measured, not what was built.
    const s = assumptions.seasonal;
    if (s && day >= s.startDay && day <= s.endDay) effectFraction *= 1 - s.suppression;

    if (daily) daily.push(baseline + gap * effectFraction);
  }

  // Measurement noise lands once, on the final reading — that is the figure a
  // pilot is actually judged on.
  const noise = gaussian(next) * assumptions.noiseSigma * params.dataPenalty * Math.abs(gap);
  const achieved = baseline + gap * effectFraction + noise;

  const covered = liveOn.filter((d) => d !== -1).length;
  const coverageFraction = covered / scopeUnits;
  const fullCoverageDay = covered === scopeUnits ? Math.max(...liveOn) : -1;

  const met = targetMet(baseline, target, achieved);
  const outcome = classifyOutcome(baseline, target, achieved);

  return {
    achieved,
    coverageFraction,
    fullCoverageDay,
    binding: met
      ? 'NONE'
      : bindingConstraint({
          design,
          params,
          assumptions,
          coverageFraction,
          frozen,
          noise,
          gap,
        }),
    metTarget: met,
    partial: outcome === 'PARTIALLY_MET',
    daily,
  };
}

/**
 * What actually stopped this run.
 *
 * Ordered by precedence rather than magnitude: a rollout that froze on an
 * integration boundary is an integration gap even if coverage also ended low,
 * because the coverage shortfall was the *symptom*. Attributing to the symptom
 * would send a department to fix the wrong thing — and each of these causes
 * becomes a contractual precondition, so getting the cause wrong writes the
 * wrong clause into an agreement.
 */
function bindingConstraint(ctx: {
  design: PilotDesign;
  params: CompanyParameters;
  assumptions: ModelAssumptions;
  coverageFraction: number;
  frozen: boolean;
  noise: number;
  gap: number;
}): BindingConstraint {
  const { design, params, assumptions, coverageFraction, frozen, noise, gap } = ctx;

  if (frozen) return FailureCause.INTEGRATION_GAP;

  // A baseline too weak to attribute the result: the reading is dominated by
  // noise rather than by anything the pilot did.
  if (design.baselineQuality === 'NONE' && Math.abs(noise) > Math.abs(gap) * 0.2) {
    return FailureCause.INSUFFICIENT_BASELINE;
  }
  if (params.dataPenalty > 1.4 && Math.abs(noise) > Math.abs(gap) * 0.15) {
    return FailureCause.DATA_QUALITY;
  }

  // Mobilisation ate a third of the window before anything was deployed.
  if (params.mobilisationDays > design.durationDays / 3) {
    return FailureCause.DELIVERY_CAPACITY;
  }

  if (coverageFraction < assumptions.coverageAdequacy) {
    // Distinguish "could never have covered this" from "ran out of time".
    const reachable = params.coverageRate * (design.durationDays - params.mobilisationDays);
    return reachable < design.scopeUnits
      ? FailureCause.SCOPE_TOO_WIDE
      : FailureCause.COVERAGE_SHORTFALL;
  }

  const s = assumptions.seasonal;
  if (s && s.endDay >= design.durationDays * 0.5) return FailureCause.SEASONAL_WINDOW;

  // Covered, on time, integrated, well measured — and still short. The solution
  // does not move this metric far enough across this much ground.
  //
  // The controlled vocabulary has no "solution underdelivers" entry, and
  // `COVERAGE_SHORTFALL` would be the wrong label: coverage was met. Every cause
  // becomes a contract clause, and the clause for a coverage shortfall is a
  // coverage guarantee — which this pilot already satisfied and which would
  // therefore change nothing. `SCOPE_TOO_WIDE` carries the clause that would
  // actually have helped: bound the scope to what the solution can move.
  return FailureCause.SCOPE_TOO_WIDE;
}
