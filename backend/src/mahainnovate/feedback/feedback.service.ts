import { AppError } from '../../middleware/errorHandler';
import { PilotCorpusRepository } from '../corpus/pilotCorpus.repository';
import { PilotRecord } from '../domain/types';

/**
 * The outcome feedback loop (BE-06).
 *
 * When a pilot closes, its record — including its failure causes — is written
 * back into the corpus. The next department to run a comparable challenge is
 * then advised from a larger evidence base than this one was.
 *
 * This is the part of the product that compounds, and the reason the platform is
 * worth building rather than the analysis being run once in a spreadsheet. It is
 * also why a failed pilot is not a write-off: the causes recorded here become
 * preconditions on somebody else's contract.
 *
 * Closing is deliberately strict. A record admitted without failure causes when
 * the target was missed would quietly weaken every future risk register, so the
 * service refuses it rather than accepting a record it cannot reason from.
 */
export class FeedbackService {
  constructor(private readonly corpus: PilotCorpusRepository) {}

  async close(record: PilotRecord): Promise<{ record: PilotRecord; corpusSize: number }> {
    const existing = await this.corpus.findById(record.id);
    if (existing) {
      throw new AppError(`Pilot ${record.id} is already closed and in the corpus`, 409);
    }

    // A missed or partial outcome with no cause recorded teaches nothing, and
    // silently dilutes the denominator of every future confidence band.
    if (record.outcome !== 'TARGET_MET' && record.failureCauses.length === 0) {
      throw new AppError(
        'A pilot that did not meet its target must record at least one failure cause',
        422,
        {
          hint: 'The cause is what becomes a precondition on the next comparable challenge.',
        },
      );
    }

    const split = record.milestoneSplit.reduce((a, b) => a + b, 0);
    if (Math.abs(split - 1) > 0.02) {
      throw new AppError('Milestone split must sum to 1', 422, { split });
    }

    if (record.baselineDays > record.durationDays) {
      throw new AppError('Baseline period cannot exceed the pilot duration', 422);
    }

    const stored = await this.corpus.add(record);
    return { record: stored, corpusSize: await this.corpus.count() };
  }

  /**
   * What the corpus currently knows.
   *
   * Surfaced because the honest answer to "how confident is this?" is partly
   * "how much has been recorded so far", and that number should be visible
   * rather than buried.
   */
  async coverage() {
    const all = await this.corpus.all();
    const byDomain = new Map<string, { total: number; met: number }>();

    all.forEach((r) => {
      const entry = byDomain.get(r.domain) ?? { total: 0, met: 0 };
      entry.total += 1;
      if (r.outcome === 'TARGET_MET') entry.met += 1;
      byDomain.set(r.domain, entry);
    });

    return {
      corpusSize: all.length,
      domains: [...byDomain.entries()]
        .map(([domain, v]) => ({ domain, ...v }))
        .sort((a, b) => b.total - a.total),
      /** Domains too thin to advise on yet. Stated rather than hidden. */
      thinDomains: [...byDomain.entries()]
        .filter(([, v]) => v.total < 4)
        .map(([domain]) => domain),
    };
  }
}
