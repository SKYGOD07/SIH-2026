import {
  DataOrigin,
  Prisma,
  SimulationRunStatus,
  UserRole,
  type Challenge,
  type UserProfile,
} from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';
import { prisma } from '../../workflow/repositories';
import { seedFromString } from '../../utils/rng';
import { preconditionFor } from './attribute';
import { applyPerturbation, parameterise, perturbationPlan } from './parameters';
import { rankAggregates, runCohortMember } from './montecarlo';
import { screen } from './screen';
import {
  MODEL_VERSION,
  SIMULATION_DISCLAIMER,
  type CompanyAggregate,
  type ModelAssumptions,
  type ParameterisedCompany,
  type PilotDesign,
} from './types';

/**
 * Running a simulation over a cohort.
 *
 * Orchestration only — every piece of model logic lives in a pure module beside
 * this one, so the model can be tested without a database and this file can be
 * read without understanding the model.
 *
 * Three operational facts shape it:
 *
 *  1. **It takes minutes.** So it runs detached from the request that started
 *     it, writes its progress to its own row, and is polled. A four-minute HTTP
 *     request would die to any proxy timeout between here and the browser.
 *
 *  2. **It is CPU-bound.** A tight loop for four minutes would block Node's
 *     event loop entirely — the polling endpoint that reports progress would
 *     itself be unable to answer. So the loop yields to the event loop between
 *     companies. (`worker_threads` is the upgrade when two officers ever run
 *     one at once; for a single-run demo, yielding is sufficient and far
 *     simpler.)
 *
 *  3. **It can be wrong.** A crash mid-run must leave a row that says so, not
 *     a row stuck at RUNNING forever, so the worker is wrapped and failure is
 *     recorded in the same place success would be.
 */

const isGovernment = (u: UserProfile) =>
  u.role === UserRole.GOVERNMENT_OFFICER || u.role === UserRole.ADMIN;

function assertGovernment(u: UserProfile) {
  if (!isGovernment(u)) throw new AppError('This action is limited to government accounts', 403);
}

/**
 * Defaults, tuned by measurement rather than guessed.
 *
 * `runsPerCompany` is the dial that sets wall-clock time. It is stored on the
 * run rather than hardcoded at the call site so a result always carries the
 * count it was computed at — a p10 from 200 runs and one from 4,000 are not
 * the same quantity and must not be compared as though they were.
 */
export const DEFAULT_ASSUMPTIONS: ModelAssumptions = {
  // Both calibrated by measurement (`npm run pilotsim:calibrate`), not guessed:
  // ~4.9 microseconds per simulated pilot once warm, 178 eligible companies and
  // 81 passes puts a full run in the middle of the 3–5 minute window.
  //
  // The split between the two matters more than their product. Extra runs of an
  // identical parameter setting stop buying anything once the distribution has
  // converged, at a couple of thousand; each extra *pass* is a different
  // setting, and therefore genuinely new information. So the passes are pushed
  // to the full plan first, and the run count only then raised to fill the
  // remaining time — which also tightens the p10/p90 tails, the one thing more
  // runs still improve.
  runsPerCompany: 3400,
  perturbationPasses: 80,
  rampTauDays: 14,
  noiseSigma: 0.09,
  seasonal: null,
  maxMobilisationDays: 32,
  maxCoverageRate: 0.14,
  maxEfficacy: 1.6,
  coverageAdequacy: 0.8,
};

/** How often progress is flushed. Frequent enough to look live, rare enough
 *  not to turn a CPU-bound run into a write-bound one. */
const PROGRESS_INTERVAL_MS = 700;

/** Trajectories are stored only for the leaders; 515 curves would dominate. */
const TRAJECTORY_TOP_N = 20;

/** A company is "stable" if it stays within this many places of its base rank. */
const STABILITY_TOLERANCE = 2;

export interface StartOptions {
  runsPerCompany?: number;
  perturbationPasses?: number;
  seed?: number;
}

export async function startRun(u: UserProfile, challengeId: string, options: StartOptions = {}) {
  assertGovernment(u);

  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
  if (!challenge) throw new AppError('No such challenge', 404);
  if (challenge.targetValue === null) {
    throw new AppError('This challenge has no target value, so there is nothing to simulate', 422, {
      hint: 'A simulation measures against a contracted target. Set one on the challenge first.',
    });
  }

  // One run at a time per challenge. Two concurrent four-minute CPU jobs would
  // starve each other and the API with them.
  const active = await prisma.pilotSimulationRun.findFirst({
    where: { challengeId, status: { in: [SimulationRunStatus.QUEUED, SimulationRunStatus.RUNNING] } },
  });
  if (active) {
    throw new AppError('A simulation is already running for this challenge', 409, {
      runId: active.id,
    });
  }

  const assumptions: ModelAssumptions = {
    ...DEFAULT_ASSUMPTIONS,
    runsPerCompany: options.runsPerCompany ?? DEFAULT_ASSUMPTIONS.runsPerCompany,
    perturbationPasses: options.perturbationPasses ?? DEFAULT_ASSUMPTIONS.perturbationPasses,
  };

  const run = await prisma.pilotSimulationRun.create({
    data: {
      challengeId,
      createdByUserId: u.id,
      status: SimulationRunStatus.QUEUED,
      seed: options.seed ?? seedFromString(challengeId) % 2_000_000_000,
      runsPerCompany: assumptions.runsPerCompany,
      perturbationPasses: assumptions.perturbationPasses,
      modelVersion: MODEL_VERSION,
      assumptions: assumptions as unknown as Prisma.InputJsonValue,
      origin: DataOrigin.DEMO,
      phase: 'QUEUED',
    },
  });

  // Detached on purpose: the caller gets the id immediately and polls.
  void execute(run.id, challenge, assumptions).catch(async (e) => {
    await prisma.pilotSimulationRun
      .update({
        where: { id: run.id },
        data: {
          status: SimulationRunStatus.FAILED,
          error: e instanceof Error ? e.message : String(e),
          finishedAt: new Date(),
          phase: 'FAILED',
        },
      })
      .catch(() => undefined);
  });

  return run;
}

/** Lets the event loop serve the polling requests this run is generating. */
const yieldToLoop = () => new Promise<void>((r) => setImmediate(r));

async function execute(runId: string, challenge: Challenge, assumptions: ModelAssumptions) {
  const startedAt = Date.now();
  let lastFlush = 0;
  let cancelled = false;

  const run = await prisma.pilotSimulationRun.update({
    where: { id: runId },
    data: { status: SimulationRunStatus.RUNNING, startedAt: new Date(), phase: 'SCREENING' },
  });

  /** Writes progress, and reports back whether the officer has cancelled. */
  const flush = async (data: Prisma.PilotSimulationRunUpdateInput, force = false) => {
    if (!force && Date.now() - lastFlush < PROGRESS_INTERVAL_MS) return;
    lastFlush = Date.now();
    const fresh = await prisma.pilotSimulationRun.update({ where: { id: runId }, data });
    if (fresh.status === SimulationRunStatus.CANCELLED) cancelled = true;
  };

  /* --- Phase 1 · screen ------------------------------------------------ */

  const cohort = await prisma.startup.findMany({ orderBy: { id: 'asc' } });
  const screened = cohort.map((s) => ({ startup: s, ...screen(s, challenge) }));
  const eligible = screened.filter((s) => s.eligible);

  await flush(
    {
      phase: 'PARAMETERISING',
      cohortSize: cohort.length,
      eligibleCount: eligible.length,
    },
    true,
  );

  if (eligible.length === 0) {
    await prisma.pilotSimulationRun.update({
      where: { id: runId },
      data: {
        status: SimulationRunStatus.COMPLETE,
        finishedAt: new Date(),
        phase: 'COMPLETE',
      },
    });
    await writeResults(runId, screened, [], new Map(), null);
    return;
  }

  /* --- Phase 2 · parameterise ------------------------------------------ */

  const design: PilotDesign = {
    baseline: 100,
    // The challenge states an improvement in percent; the metric is the level
    // it implies, which keeps achieved-vs-target directly comparable.
    target: 100 - (challenge.targetValue ?? 20),
    durationDays: challenge.pilotDurationDays ?? 90,
    scopeUnits: 3,
    scopeUnitLabel: 'ward',
    baselineQuality: 'PARTIAL',
  };

  const responses = await prisma.challengeResponse.findMany({
    where: { challengeId: challenge.id },
  });
  const responseBy = new Map(responses.map((r) => [r.startupId, r]));

  const engagements = await prisma.startupProgramParticipation.groupBy({
    by: ['startupId'],
    _count: { _all: true },
  });
  const engagementBy = new Map(engagements.map((e) => [e.startupId, e._count._all]));

  const parameterised: ParameterisedCompany[] = eligible.map((e) =>
    parameterise(
      e.startup,
      challenge,
      responseBy.get(e.startup.id) ?? null,
      engagementBy.get(e.startup.id) ?? 0,
      design,
      assumptions,
    ),
  );

  /* --- Phase 3 · base pass --------------------------------------------- */

  await flush({ phase: 'TRAJECTORIES', companiesDone: 0, passesDone: 0 }, true);

  const totalPasses = 1 + Math.min(assumptions.perturbationPasses, perturbationPlan().length);
  let runsDone = 0;
  let simulatedDays = 0n;
  const daysPerRun = BigInt(design.durationDays);

  const basePass: CompanyAggregate[] = [];
  for (let i = 0; i < parameterised.length; i += 1) {
    const c = parameterised[i];
    basePass.push(
      runCohortMember(c.startupId, design, c.params, assumptions, run.seed, false),
    );
    runsDone += assumptions.runsPerCompany;
    simulatedDays += daysPerRun * BigInt(assumptions.runsPerCompany);

    await yieldToLoop();
    await flush({ companiesDone: i + 1, runsDone, simulatedDays });
    if (cancelled) return;
  }

  const baseRanked = rankAggregates(basePass, design);
  const baseRank = new Map(baseRanked.map((a, i) => [a.startupId, i]));

  /* --- Phase 4 · sensitivity ------------------------------------------- */
  //
  // One-at-a-time perturbation: each parameter moved ±20% while the others
  // hold. It answers the question an officer actually has — "would this
  // ranking survive if we were wrong about delivery capacity?" — and, unlike a
  // global sample, each pass has a name a reader can understand.

  await flush({ phase: 'SENSITIVITY', passesDone: 1 }, true);

  const heldPosition = new Map<string, number>(
    parameterised.map((c) => [c.startupId, 0]),
  );

  const plan = perturbationPlan();
  const passesToRun = Math.min(assumptions.perturbationPasses, plan.length);

  for (let p = 0; p < passesToRun; p += 1) {
    const setting = plan[p];

    const pass: CompanyAggregate[] = [];
    for (let i = 0; i < parameterised.length; i += 1) {
      const c = parameterised[i];
      pass.push(
        runCohortMember(
          c.startupId,
          design,
          applyPerturbation(c.params, setting),
          assumptions,
          // A distinct seed per pass, so a pass is not merely the base pass
          // with one number nudged and identical noise.
          run.seed + (p + 1) * 7919,
          false,
        ),
      );
      runsDone += assumptions.runsPerCompany;
      simulatedDays += daysPerRun * BigInt(assumptions.runsPerCompany);

      await yieldToLoop();
      await flush({
        companiesDone: i + 1,
        runsDone,
        simulatedDays,
        phase: `SENSITIVITY · ${setting.label}`,
      });
      if (cancelled) return;
    }

    rankAggregates(pass, design).forEach((a, i) => {
      const was = baseRank.get(a.startupId);
      if (was !== undefined && Math.abs(i - was) <= STABILITY_TOLERANCE) {
        heldPosition.set(a.startupId, (heldPosition.get(a.startupId) ?? 0) + 1);
      }
    });

    await flush({ passesDone: p + 2, companiesDone: parameterised.length }, true);
    if (cancelled) return;
  }

  /* --- Phase 5 · trajectories for the leaders --------------------------- */

  await flush({ phase: 'ATTRIBUTING' }, true);

  const leaders = new Set(baseRanked.slice(0, TRAJECTORY_TOP_N).map((a) => a.startupId));
  const paramsBy = new Map(parameterised.map((c) => [c.startupId, c.params]));
  const trajectoryBy = new Map<string, number[]>();

  for (const startupId of leaders) {
    const params = paramsBy.get(startupId);
    if (!params) continue;
    const withCurve = runCohortMember(
      startupId,
      design,
      params,
      // A smaller sample purely to pick a representative median curve; the
      // published counts stay those of the full base pass.
      { ...assumptions, runsPerCompany: Math.min(assumptions.runsPerCompany, 200) },
      run.seed,
      true,
    );
    if (withCurve.trajectory) trajectoryBy.set(startupId, withCurve.trajectory);
    await yieldToLoop();
    if (cancelled) return;
  }

  /* --- Write ------------------------------------------------------------ */

  await writeResults(
    runId,
    screened,
    baseRanked,
    heldPosition,
    { totalPasses, design, trajectoryBy },
  );

  await prisma.pilotSimulationRun.update({
    where: { id: runId },
    data: {
      status: SimulationRunStatus.COMPLETE,
      phase: 'COMPLETE',
      finishedAt: new Date(),
      companiesDone: parameterised.length,
      passesDone: totalPasses,
      runsDone,
      simulatedDays,
    },
  });

  // eslint-disable-next-line no-console
  console.log(
    `[pilotsim] ${runId} complete in ${((Date.now() - startedAt) / 1000).toFixed(1)}s · ` +
      `${eligible.length}/${cohort.length} eligible · ${runsDone.toLocaleString()} runs`,
  );
}

async function writeResults(
  runId: string,
  screened: { startup: { id: string }; eligible: boolean; reason: string | null }[],
  ranked: CompanyAggregate[],
  heldPosition: Map<string, number>,
  ctx: {
    totalPasses: number;
    design: PilotDesign;
    trajectoryBy: Map<string, number[]>;
  } | null,
) {
  const aggregateBy = new Map(ranked.map((a) => [a.startupId, a]));
  const rankBy = new Map(ranked.map((a, i) => [a.startupId, i + 1]));

  const rows = screened.map((s) => {
    const a = aggregateBy.get(s.startup.id);
    const cause = a?.dominantCause ?? null;

    return {
      runId,
      startupId: s.startup.id,
      eligible: s.eligible,
      exclusionReason: s.reason,
      runsMetTarget: a?.runsMetTarget ?? 0,
      runsPartial: a?.runsPartial ?? 0,
      runsMissed: a?.runsMissed ?? 0,
      runsTotal: a?.runsTotal ?? 0,
      medianAchieved: a?.medianAchieved ?? null,
      p10: a?.p10 ?? null,
      p90: a?.p90 ?? null,
      medianCoverage: a?.medianCoverage ?? null,
      medianMobilisationDays: a?.medianMobilisationDays ?? null,
      dominantCause: cause,
      precondition: cause && ctx ? preconditionFor(cause, ctx.design) : null,
      rankPosition: rankBy.get(s.startup.id) ?? null,
      // Perturbation passes only; the base pass trivially holds its own rank.
      rankStability:
        ctx && ctx.totalPasses > 1
          ? (heldPosition.get(s.startup.id) ?? 0) / (ctx.totalPasses - 1)
          : null,
      trajectory: (ctx?.trajectoryBy.get(s.startup.id) ?? null) as Prisma.InputJsonValue | null,
    };
  });

  // Chunked: a single 515-row insert over the session pooler is a large enough
  // statement to be worth splitting, and a partial failure is easier to read.
  for (let i = 0; i < rows.length; i += 100) {
    await prisma.pilotSimulationResult.createMany({
      data: rows.slice(i, i + 100) as Prisma.PilotSimulationResultCreateManyInput[],
      skipDuplicates: true,
    });
  }
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export async function getRun(u: UserProfile, runId: string) {
  assertGovernment(u);
  const run = await prisma.pilotSimulationRun.findUnique({
    where: { id: runId },
    include: { challenge: { select: { title: true, targetMetric: true, targetValue: true } } },
  });
  if (!run) throw new AppError('No such simulation run', 404);

  // The live leaderboard. Empty until the base pass has been written, which is
  // honest: there is no ranking to show before then.
  const leaders = await prisma.pilotSimulationResult.findMany({
    where: { runId, eligible: true, rankPosition: { not: null } },
    orderBy: { rankPosition: 'asc' },
    take: 5,
    include: { startup: { select: { displayName: true, legalName: true } } },
  });

  return { ...run, simulatedDays: run.simulatedDays.toString(), leaders, disclaimer: SIMULATION_DISCLAIMER };
}

export async function getResults(u: UserProfile, runId: string, limit = 100) {
  assertGovernment(u);
  const run = await prisma.pilotSimulationRun.findUnique({ where: { id: runId } });
  if (!run) throw new AppError('No such simulation run', 404);

  const results = await prisma.pilotSimulationResult.findMany({
    where: { runId, eligible: true },
    orderBy: { rankPosition: 'asc' },
    take: Math.min(limit, 515),
    include: {
      startup: { select: { id: true, displayName: true, legalName: true, sector: true, city: true } },
    },
  });

  const excluded = await prisma.pilotSimulationResult.count({
    where: { runId, eligible: false },
  });

  return {
    run: { ...run, simulatedDays: run.simulatedDays.toString() },
    results,
    excludedCount: excluded,
    disclaimer: SIMULATION_DISCLAIMER,
  };
}

export async function listRuns(u: UserProfile, challengeId?: string) {
  assertGovernment(u);
  const runs = await prisma.pilotSimulationRun.findMany({
    where: challengeId ? { challengeId } : {},
    orderBy: { createdAt: 'desc' },
    take: 25,
    include: { challenge: { select: { title: true } } },
  });
  return runs.map((r) => ({ ...r, simulatedDays: r.simulatedDays.toString() }));
}

/**
 * Cancel.
 *
 * Sets the flag; the worker notices at its next progress flush and stops. There
 * is no way to kill the loop from outside, and pretending otherwise — by
 * marking it cancelled and leaving it burning CPU — would be worse than the
 * short delay.
 */
export async function cancelRun(u: UserProfile, runId: string) {
  assertGovernment(u);
  const run = await prisma.pilotSimulationRun.findUnique({ where: { id: runId } });
  if (!run) throw new AppError('No such simulation run', 404);
  if (run.status !== SimulationRunStatus.RUNNING && run.status !== SimulationRunStatus.QUEUED) {
    throw new AppError(`A ${run.status.toLowerCase()} run cannot be cancelled`, 409);
  }

  const updated = await prisma.pilotSimulationRun.update({
    where: { id: runId },
    data: { status: SimulationRunStatus.CANCELLED, phase: 'CANCELLED', finishedAt: new Date() },
  });
  return { ...updated, simulatedDays: updated.simulatedDays.toString() };
}
