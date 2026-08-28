import { AppError } from '../../middleware/errorHandler';
import {
  LedgerEvent,
  Milestone,
  MilestoneStatus,
  PilotLedger,
} from '../domain/types';

/**
 * Milestone and payment ledger (BE-05).
 *
 * The rule this service exists to enforce is a single sentence:
 *
 *     evidence  →  approval  →  payment
 *
 * It is enforced as a state machine rather than as a convention, because a
 * convention is what gets skipped under deadline pressure. There is deliberately
 * no method that pays an unapproved milestone, and no argument that makes one
 * possible — an officer cannot release a tranche early through this API, only
 * by changing this file, which leaves a diff.
 *
 * Every transition appends to an append-only event log. Nothing is mutated
 * without a corresponding line, so the trail cannot silently disagree with the
 * state.
 */

/** Legal transitions. Anything absent here is refused. */
const TRANSITIONS: Record<MilestoneStatus, MilestoneStatus[]> = {
  LOCKED: ['IN_PROGRESS'],
  IN_PROGRESS: ['EVIDENCE_SUBMITTED'],
  EVIDENCE_SUBMITTED: ['APPROVED', 'REJECTED'],
  // Rejection returns the milestone to the startup rather than ending it.
  REJECTED: ['EVIDENCE_SUBMITTED'],
  APPROVED: ['PAID'],
  PAID: [],
};

export interface LedgerRepository {
  find(pilotId: string): Promise<PilotLedger | null>;
  save(ledger: PilotLedger): Promise<PilotLedger>;
  appendEvent(event: LedgerEvent): Promise<void>;
  events(pilotId: string): Promise<LedgerEvent[]>;
}

/** In-memory implementation. Swapped for a persisted one with the database. */
export class InMemoryLedgerRepository implements LedgerRepository {
  private ledgers = new Map<string, PilotLedger>();
  private log: LedgerEvent[] = [];

  constructor(seed: PilotLedger[] = []) {
    seed.forEach((l) => this.ledgers.set(l.pilotId, l));
  }

  async find(pilotId: string) {
    return this.ledgers.get(pilotId) ?? null;
  }

  async save(ledger: PilotLedger) {
    this.ledgers.set(ledger.pilotId, ledger);
    return ledger;
  }

  async appendEvent(event: LedgerEvent) {
    this.log.push(event);
  }

  async events(pilotId: string) {
    return this.log.filter((e) => e.pilotId === pilotId);
  }
}

export class LedgerService {
  constructor(private readonly repo: LedgerRepository) {}

  private async load(pilotId: string): Promise<PilotLedger> {
    const ledger = await this.repo.find(pilotId);
    if (!ledger) throw new AppError(`No ledger for pilot ${pilotId}`, 404);
    return ledger;
  }

  private locate(ledger: PilotLedger, milestoneId: string): Milestone {
    const milestone = ledger.milestones.find((m) => m.id === milestoneId);
    if (!milestone) {
      throw new AppError(`Milestone ${milestoneId} not found on ${ledger.pilotId}`, 404);
    }
    return milestone;
  }

  private assertTransition(milestone: Milestone, next: MilestoneStatus) {
    if (!TRANSITIONS[milestone.status].includes(next)) {
      throw new AppError(
        `Milestone ${milestone.code} cannot move from ${milestone.status} to ${next}`,
        409,
      );
    }
  }

  private async record(
    pilotId: string,
    milestoneId: string,
    action: LedgerEvent['action'],
    actor: string,
    detail: string,
  ) {
    await this.repo.appendEvent({
      at: new Date().toISOString(),
      pilotId,
      milestoneId,
      action,
      actor,
      detail,
    });
  }

  async get(pilotId: string): Promise<PilotLedger> {
    return this.load(pilotId);
  }

  async trail(pilotId: string): Promise<LedgerEvent[]> {
    await this.load(pilotId);
    return this.repo.events(pilotId);
  }

  /**
   * The startup files evidence.
   *
   * Every artefact the milestone names must be present. A partial submission is
   * refused rather than accepted-and-flagged, so "submitted" always means the
   * same thing to the officer reviewing it.
   */
  async submitEvidence(
    pilotId: string,
    milestoneId: string,
    actor: string,
    evidence: { label: string; reference: string }[],
  ): Promise<PilotLedger> {
    const ledger = await this.load(pilotId);
    const milestone = this.locate(ledger, milestoneId);

    if (milestone.status === 'LOCKED') {
      throw new AppError(
        `Milestone ${milestone.code} is locked until the previous milestone is approved`,
        409,
      );
    }
    this.assertTransition(milestone, 'EVIDENCE_SUBMITTED');

    const supplied = new Set(evidence.map((e) => e.label));
    const missing = milestone.evidenceRequired.filter((r) => !supplied.has(r));
    if (missing.length > 0) {
      throw new AppError(`Evidence incomplete for ${milestone.code}`, 422, { missing });
    }

    const now = new Date().toISOString();
    milestone.evidence = evidence.map((e, i) => ({
      id: `${milestone.id}-E${i + 1}`,
      label: e.label,
      reference: e.reference,
      submittedAt: now,
    }));
    milestone.status = 'EVIDENCE_SUBMITTED';
    milestone.rejectionReason = undefined;

    await this.record(pilotId, milestoneId, 'EVIDENCE_SUBMITTED', actor, `${evidence.length} artefacts filed`);
    return this.repo.save(ledger);
  }

  /** The department validates what was filed. */
  async approve(pilotId: string, milestoneId: string, actor: string): Promise<PilotLedger> {
    const ledger = await this.load(pilotId);
    const milestone = this.locate(ledger, milestoneId);
    this.assertTransition(milestone, 'APPROVED');

    milestone.status = 'APPROVED';
    milestone.approvedBy = actor;
    milestone.approvedAt = new Date().toISOString();

    // Approval is what unlocks the next milestone — never elapsed time.
    const index = ledger.milestones.findIndex((m) => m.id === milestoneId);
    const next = ledger.milestones[index + 1];
    if (next && next.status === 'LOCKED') next.status = 'IN_PROGRESS';

    await this.record(pilotId, milestoneId, 'APPROVED', actor, 'Evidence validated');
    return this.repo.save(ledger);
  }

  async reject(
    pilotId: string,
    milestoneId: string,
    actor: string,
    reason: string,
  ): Promise<PilotLedger> {
    const ledger = await this.load(pilotId);
    const milestone = this.locate(ledger, milestoneId);
    this.assertTransition(milestone, 'REJECTED');

    milestone.status = 'REJECTED';
    milestone.rejectionReason = reason;

    await this.record(pilotId, milestoneId, 'REJECTED', actor, reason);
    return this.repo.save(ledger);
  }

  /**
   * Payment.
   *
   * Reachable only from APPROVED, by the transition table. This is the sentence
   * the whole service exists to make true.
   */
  async pay(pilotId: string, milestoneId: string, actor: string): Promise<PilotLedger> {
    const ledger = await this.load(pilotId);
    const milestone = this.locate(ledger, milestoneId);
    this.assertTransition(milestone, 'PAID');

    milestone.status = 'PAID';
    milestone.paidAt = new Date().toISOString();

    await this.record(
      pilotId,
      milestoneId,
      'PAID',
      actor,
      `${milestone.payment} released against approved evidence`,
    );
    return this.repo.save(ledger);
  }

  /** Released and outstanding value, for the dashboard. */
  async summary(pilotId: string) {
    const ledger = await this.load(pilotId);
    const released = ledger.milestones
      .filter((m) => m.status === 'PAID')
      .reduce((sum, m) => sum + m.payment, 0);
    const approvedUnpaid = ledger.milestones
      .filter((m) => m.status === 'APPROVED')
      .reduce((sum, m) => sum + m.payment, 0);
    const awaitingValidation = ledger.milestones.filter(
      (m) => m.status === 'EVIDENCE_SUBMITTED',
    ).length;

    return {
      pilotId,
      contractValue: ledger.contractValue,
      released,
      approvedUnpaid,
      outstanding: ledger.contractValue - released,
      awaitingValidation,
    };
  }
}
