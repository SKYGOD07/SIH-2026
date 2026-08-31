import { RetrievalService } from '../retrieval/retrieval.service';
import { SimulationRequest, SimulationResult } from '../domain/types';
import { buildDesignRecommendations } from './design';
import { buildRiskRegister } from './risk';
import { buildConfidence, buildSensitivity } from './confidence';

/**
 * The Pilot Design & Risk Simulator (BE-03).
 *
 * Orchestration only: retrieve the comparable set once, then hand the same set
 * to three pure engines. Keeping the engines pure and the retrieval in one place
 * means every output on a response is derived from an identical evidence base —
 * a design recommendation and a risk can never end up citing different pilots.
 *
 * The disclaimer travels on the response rather than living in the UI, so the
 * boundary of the claim cannot be lost by a caller that renders the data
 * somewhere else.
 */

export const SIMULATOR_DISCLAIMER =
  'The simulator informs pilot design. It does not score startups, does not predict success, and produces no procurement decision. Every figure is derived from the comparable pilots cited beside it. The corpus is demonstration data.';

export class SimulatorService {
  constructor(private readonly retrieval: RetrievalService) {}

  async simulate(request: SimulationRequest): Promise<SimulationResult> {
    const { comparables, records, corpusSize } = await this.retrieval.findComparables(request);

    return {
      challengeId: request.challengeId,
      generatedAt: new Date().toISOString(),
      comparables,
      corpusSize,
      design: buildDesignRecommendations(request, records),
      risks: buildRiskRegister(request, records),
      confidence: buildConfidence(records),
      sensitivity: buildSensitivity(records),
      disclaimer: SIMULATOR_DISCLAIMER,
    };
  }
}
