import { PilotCorpusRepository } from '../corpus/pilotCorpus.repository';
import { ComparablePilot, PilotRecord, SimulationRequest } from '../domain/types';
import { scorePilot, toComparable } from './similarity';

/**
 * Comparable-pilot retrieval (BE-02).
 *
 * Returns the prior pilots every downstream recommendation is derived from,
 * along with the per-axis breakdown that produced each score. The breakdown is
 * not decoration: an officer asked to justify a design change needs to be able
 * to say *why* the platform considered a given pilot comparable, and "the model
 * said so" is not an answer that survives a procurement review.
 */

/** Below this, a prior pilot is too different to reason from. */
const SIMILARITY_FLOOR = 0.45;

/** More than this and the set stops being comparable and starts being the corpus. */
const MAX_RESULTS = 8;

export interface RetrievalResult {
  comparables: ComparablePilot[];
  /** Full records, for the engines that need the underlying numbers. */
  records: PilotRecord[];
  corpusSize: number;
}

export class RetrievalService {
  constructor(private readonly corpus: PilotCorpusRepository) {}

  async findComparables(
    request: SimulationRequest,
    limit = 5,
  ): Promise<RetrievalResult> {
    const corpusSize = await this.corpus.count();

    // Domain is a hard gate in scoring, so filtering on it first is equivalent
    // and avoids scoring the whole corpus. A SQL-backed implementation would
    // push exactly this predicate down into the query.
    const candidates = await this.corpus.findByDomain(request.domain);

    const scored = candidates
      .map((record) => ({ record, ...scorePilot(record, request) }))
      .filter((s) => s.similarity >= SIMILARITY_FLOOR)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, Math.min(limit, MAX_RESULTS));

    return {
      comparables: scored.map((s) => toComparable(s.record, request)),
      records: scored.map((s) => s.record),
      corpusSize,
    };
  }
}
