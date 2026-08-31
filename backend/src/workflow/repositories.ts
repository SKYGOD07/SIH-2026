import { DataOrigin, Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../config/prisma';

/**
 * Persistence for the procurement lifecycle.
 *
 * Thin by intent: these functions translate between the domain's vocabulary and
 * Prisma queries and do nothing else. Every rule — who may act, what transition
 * is legal, what a score means — lives in the services above, where it can be
 * read in one place and tested without a database.
 *
 * One convention runs through the whole file and is the reason it exists at all:
 *
 *   **every read that feeds an aggregate takes `origin` explicitly.**
 *
 * There is no `findAll()` that quietly includes demonstration records. A
 * simulated pilot is structurally identical to a real one, so a default that
 * included it would turn a scenario we invented into a statistic — the same
 * failure as this codebase's former "2,481 startups indexed", except arriving
 * as arithmetic rather than as a typed literal. Callers must say what they mean.
 */

export type Db = PrismaClient | Prisma.TransactionClient;

/** The origins a query is willing to include. Never defaulted. */
export type OriginFilter = readonly DataOrigin[];

/** Real analytics. Demonstration records are excluded by construction. */
export const REAL_ONLY: OriginFilter = [DataOrigin.VERIFIED, DataOrigin.USER_ENTERED];

/** Everything inside a demonstration workspace. */
export const DEMO_ONLY: OriginFilter = [DataOrigin.DEMO];

/* ------------------------------------------------------------------ */
/* Simulation scenarios                                                */
/* ------------------------------------------------------------------ */

export const scenarioRepo = {
  create: (db: Db, data: Prisma.SimulationScenarioUncheckedCreateInput) =>
    db.simulationScenario.create({ data }),

  findById: (db: Db, id: string) => db.simulationScenario.findUnique({ where: { id } }),

  listActive: (db: Db) =>
    db.simulationScenario.findMany({
      where: { status: { in: ['DRAFT', 'ACTIVE'] } },
      orderBy: { createdAt: 'desc' },
    }),

  setStatus: (db: Db, id: string, status: 'DRAFT' | 'ACTIVE' | 'CLOSED') =>
    db.simulationScenario.update({ where: { id }, data: { status } }),

  /**
   * Remove a scenario and everything it produced.
   *
   * The cascade is declared in the schema, so this is one statement rather than
   * an ordered teardown that can half-fail. Demonstration data has to be
   * genuinely disposable or it stops being demonstration data.
   */
  destroy: (db: Db, id: string) => db.simulationScenario.delete({ where: { id } }),
};

/* ------------------------------------------------------------------ */
/* Startups                                                            */
/* ------------------------------------------------------------------ */

export const startupRepo = {
  create: (db: Db, data: Prisma.StartupUncheckedCreateInput) => db.startup.create({ data }),

  findById: (db: Db, id: string) => db.startup.findUnique({ where: { id } }),

  update: (db: Db, id: string, data: Prisma.StartupUncheckedUpdateInput) =>
    db.startup.update({ where: { id }, data }),

  /** Candidates for a challenge: everything in the same workspace. */
  listByScenario: (db: Db, scenarioId: string) =>
    db.startup.findMany({ where: { scenarioId }, orderBy: { legalName: 'asc' } }),

  listByOrigin: (db: Db, origin: OriginFilter) =>
    db.startup.findMany({ where: { origin: { in: [...origin] } }, orderBy: { legalName: 'asc' } }),

  countByOrigin: (db: Db, origin: OriginFilter) =>
    db.startup.count({ where: { origin: { in: [...origin] } } }),
};

/* ------------------------------------------------------------------ */
/* Challenges                                                          */
/* ------------------------------------------------------------------ */

export const challengeRepo = {
  create: (db: Db, data: Prisma.ChallengeUncheckedCreateInput) => db.challenge.create({ data }),

  findById: (db: Db, id: string) => db.challenge.findUnique({ where: { id } }),

  /** With everything the review screen needs, in one query rather than four. */
  findForReview: (db: Db, id: string) =>
    db.challenge.findUnique({
      where: { id },
      include: {
        responses: { include: { startup: true } },
        matches: { include: { startup: true, evaluations: true } },
        pilots: true,
        scenario: true,
      },
    }),

  listOwnedBy: (db: Db, ownerUserId: string) =>
    db.challenge.findMany({ where: { ownerUserId }, orderBy: { createdAt: 'desc' } }),

  /** What a startup may see: published challenges in its workspace. */
  listOpen: (db: Db, scenarioId: string | null) =>
    db.challenge.findMany({
      where: {
        scenarioId,
        status: { in: ['PUBLISHED', 'MATCHING', 'UNDER_EVALUATION'] },
      },
      orderBy: { createdAt: 'desc' },
    }),

  setStatus: (db: Db, id: string, status: Prisma.ChallengeUpdateInput['status']) =>
    db.challenge.update({ where: { id }, data: { status } }),
};

/* ------------------------------------------------------------------ */
/* Challenge responses                                                 */
/* ------------------------------------------------------------------ */

export const responseRepo = {
  /** Upsert, because the schema allows one response per startup per challenge. */
  upsert: (
    db: Db,
    challengeId: string,
    startupId: string,
    data: Omit<Prisma.ChallengeResponseUncheckedCreateInput, 'challengeId' | 'startupId'>,
  ) =>
    db.challengeResponse.upsert({
      where: { challengeId_startupId: { challengeId, startupId } },
      create: { ...data, challengeId, startupId },
      update: { ...data },
    }),

  findOne: (db: Db, challengeId: string, startupId: string) =>
    db.challengeResponse.findUnique({
      where: { challengeId_startupId: { challengeId, startupId } },
    }),

  listForChallenge: (db: Db, challengeId: string) =>
    db.challengeResponse.findMany({
      where: { challengeId, status: 'SUBMITTED' },
      include: { startup: true },
    }),

  listForStartup: (db: Db, startupId: string) =>
    db.challengeResponse.findMany({
      where: { startupId },
      include: { challenge: true },
      orderBy: { updatedAt: 'desc' },
    }),
};

/* ------------------------------------------------------------------ */
/* Matches and evaluations                                             */
/* ------------------------------------------------------------------ */

export const matchRepo = {
  /** Regenerating a ranking replaces the previous scores for that pair. */
  upsert: (
    db: Db,
    challengeId: string,
    startupId: string,
    data: Omit<Prisma.StartupMatchUncheckedCreateInput, 'challengeId' | 'startupId'>,
  ) =>
    db.startupMatch.upsert({
      where: { challengeId_startupId: { challengeId, startupId } },
      create: { ...data, challengeId, startupId },
      update: { ...data },
    }),

  findById: (db: Db, id: string) =>
    db.startupMatch.findUnique({ where: { id }, include: { startup: true, challenge: true } }),

  ranked: (db: Db, challengeId: string) =>
    db.startupMatch.findMany({
      where: { challengeId },
      include: { startup: true, evaluations: true },
      orderBy: { overallScore: 'desc' },
    }),

  setStatus: (db: Db, id: string, status: Prisma.StartupMatchUpdateInput['status']) =>
    db.startupMatch.update({ where: { id }, data: { status } }),

  /** Demote every other candidate when one is chosen. */
  rejectOthers: (db: Db, challengeId: string, keepMatchId: string) =>
    db.startupMatch.updateMany({
      where: { challengeId, id: { not: keepMatchId }, status: { not: 'REJECTED' } },
      data: { status: 'REJECTED' },
    }),
};

export const evaluationRepo = {
  create: (db: Db, data: Prisma.EvaluationUncheckedCreateInput) => db.evaluation.create({ data }),

  listForMatch: (db: Db, matchId: string) =>
    db.evaluation.findMany({ where: { matchId }, orderBy: { createdAt: 'desc' } }),

  findById: (db: Db, id: string) => db.evaluation.findUnique({ where: { id } }),
};

/* ------------------------------------------------------------------ */
/* Pilots                                                              */
/* ------------------------------------------------------------------ */

export const pilotRepo = {
  create: (db: Db, data: Prisma.PilotUncheckedCreateInput) => db.pilot.create({ data }),

  /** The whole pilot, as the pilot screen renders it. */
  findFull: (db: Db, id: string) =>
    db.pilot.findUnique({
      where: { id },
      include: {
        challenge: true,
        startup: true,
        scenario: true,
        milestones: { orderBy: { code: 'asc' }, include: { evidence: true } },
        metrics: { orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }] },
        evidence: true,
        scaleDecision: true,
      },
    }),

  findById: (db: Db, id: string) => db.pilot.findUnique({ where: { id } }),

  listForStartup: (db: Db, startupId: string) =>
    db.pilot.findMany({ where: { startupId }, include: { challenge: true }, orderBy: { createdAt: 'desc' } }),

  listForOwner: (db: Db, ownerUserId: string) =>
    db.pilot.findMany({
      where: { challenge: { ownerUserId } },
      include: { challenge: true, startup: true },
      orderBy: { createdAt: 'desc' },
    }),

  setStatus: (db: Db, id: string, data: Prisma.PilotUncheckedUpdateInput) =>
    db.pilot.update({ where: { id }, data }),

  /**
   * Closed pilots, as evidence for future advice.
   *
   * `origin` is a required parameter with no default — this is the query that
   * would otherwise silently mix a simulated pilot into a real confidence band.
   */
  closedCorpus: (db: Db, origin: OriginFilter) =>
    db.pilot.findMany({
      where: { status: 'CLOSED', origin: { in: [...origin] } },
      include: { challenge: true, metrics: true },
    }),
};

export const milestoneRepo = {
  createMany: (db: Db, rows: Prisma.PilotMilestoneUncheckedCreateInput[]) =>
    db.pilotMilestone.createMany({ data: rows }),

  findById: (db: Db, id: string) =>
    db.pilotMilestone.findUnique({ where: { id }, include: { pilot: true, evidence: true } }),

  update: (db: Db, id: string, data: Prisma.PilotMilestoneUncheckedUpdateInput) =>
    db.pilotMilestone.update({ where: { id }, data }),

  listForPilot: (db: Db, pilotId: string) =>
    db.pilotMilestone.findMany({
      where: { pilotId },
      orderBy: { code: 'asc' },
      include: { evidence: true },
    }),
};

export const metricRepo = {
  create: (db: Db, data: Prisma.PilotMetricUncheckedCreateInput) => db.pilotMetric.create({ data }),

  findById: (db: Db, id: string) => db.pilotMetric.findUnique({ where: { id } }),

  primaryFor: (db: Db, pilotId: string) =>
    db.pilotMetric.findFirst({ where: { pilotId, isPrimary: true } }),

  record: (db: Db, id: string, achievedValue: number, measuredAt: Date) =>
    db.pilotMetric.update({ where: { id }, data: { achievedValue, measuredAt } }),
};

export const evidenceRepo = {
  create: (db: Db, data: Prisma.PilotEvidenceUncheckedCreateInput) =>
    db.pilotEvidence.create({ data }),

  findById: (db: Db, id: string) =>
    db.pilotEvidence.findUnique({ where: { id }, include: { pilot: true, milestone: true } }),

  review: (
    db: Db,
    id: string,
    status: 'ACCEPTED' | 'REJECTED',
    reviewedByUserId: string,
    reviewNote?: string,
  ) =>
    db.pilotEvidence.update({
      where: { id },
      data: { status, reviewedByUserId, reviewedAt: new Date(), reviewNote: reviewNote ?? null },
    }),

  listForMilestone: (db: Db, milestoneId: string) =>
    db.pilotEvidence.findMany({ where: { milestoneId } }),
};

export const scaleDecisionRepo = {
  create: (db: Db, data: Prisma.ScaleDecisionUncheckedCreateInput) =>
    db.scaleDecision.create({ data }),

  findForPilot: (db: Db, pilotId: string) => db.scaleDecision.findUnique({ where: { pilotId } }),
};

/** The transaction helper the services use for multi-write operations. */
export const withTransaction = <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> =>
  prisma.$transaction(fn);

export { prisma };
