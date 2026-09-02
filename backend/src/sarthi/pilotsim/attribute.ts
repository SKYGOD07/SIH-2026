import type { FailureCause } from '@prisma/client';
import { RISK_LIBRARY } from '../simulator/risk';
import type { SimulationRequest } from '../domain/types';
import type { PilotDesign } from './types';

/**
 * A cause, turned into a clause.
 *
 * This is the output worth having. "This company's runs mostly failed on
 * delivery capacity" is a curiosity; "the department confirms crew throughput
 * in writing before M1" is something an officer can put in the agreement — and
 * a pilot that would have failed on capacity then does not.
 *
 * The wording is not written here. It comes from `RISK_LIBRARY` in
 * `simulator/risk.ts`, which already holds one precondition per `FailureCause`
 * and is exhaustive by type. Two libraries of contract language would drift,
 * and the drift would only show up in a signed document.
 */

export function preconditionFor(cause: FailureCause, design: PilotDesign): string {
  // `RISK_LIBRARY` templates take the retrospective simulator's request shape.
  // Only the few fields its preconditions read are populated; the rest of that
  // interface is irrelevant here and is not invented.
  const request = {
    proposed: {
      baselineDays: Math.round(design.durationDays / 3),
      scopeUnits: design.scopeUnits,
      durationDays: design.durationDays,
    },
    context: {},
  } as unknown as SimulationRequest;

  return RISK_LIBRARY[cause].precondition(request);
}

export function riskStatementFor(cause: FailureCause): string {
  return RISK_LIBRARY[cause].risk;
}
