import { PilotRecord } from '../domain/types';

/**
 * The pilot corpus, behind an interface.
 *
 * The database is deliberately not built yet, so the only implementation today
 * is in-memory. Everything downstream — retrieval, the design engine, the risk
 * register — depends on this interface and never on the storage, which is what
 * makes swapping in a Prisma-backed implementation a one-file change rather
 * than a rewrite.
 *
 * The methods are shaped around how the simulator actually queries: it never
 * needs "all pilots" for its own sake, it needs "pilots comparable to this
 * one", and it needs to append an outcome when a pilot closes.
 */
export interface PilotCorpusRepository {
  /** Every record. Retrieval scores in memory; a SQL implementation would
   *  push the domain filter down and return a candidate set instead. */
  all(): Promise<PilotRecord[]>;

  findById(id: string): Promise<PilotRecord | null>;

  /** Cheap pre-filter so scoring never runs over the whole corpus needlessly. */
  findByDomain(domain: string): Promise<PilotRecord[]>;

  /** Appends a completed pilot. This is the feedback loop's only write. */
  add(record: PilotRecord): Promise<PilotRecord>;

  count(): Promise<number>;
}

/**
 * In-memory corpus.
 *
 * Seeded from the demonstration fixtures. Writes are kept in process memory and
 * are lost on restart — acceptable while the store is a stand-in, and the
 * reason `add()` returns the stored record rather than assuming the caller can
 * reconstruct it.
 */
export class InMemoryPilotCorpus implements PilotCorpusRepository {
  private records: Map<string, PilotRecord>;

  constructor(seed: PilotRecord[] = []) {
    this.records = new Map(seed.map((r) => [r.id, r]));
  }

  async all(): Promise<PilotRecord[]> {
    return [...this.records.values()];
  }

  async findById(id: string): Promise<PilotRecord | null> {
    return this.records.get(id) ?? null;
  }

  async findByDomain(domain: string): Promise<PilotRecord[]> {
    return [...this.records.values()].filter((r) => r.domain === domain);
  }

  async add(record: PilotRecord): Promise<PilotRecord> {
    if (this.records.has(record.id)) {
      throw new Error(`Pilot ${record.id} is already in the corpus`);
    }
    this.records.set(record.id, record);
    return record;
  }

  async count(): Promise<number> {
    return this.records.size;
  }
}
