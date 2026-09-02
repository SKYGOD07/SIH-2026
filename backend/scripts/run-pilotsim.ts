/**
 * Run a full pilot simulation headlessly and print the ranking.
 *
 *   npm run demo:simulate
 *   npm run demo:simulate -- --runs 300 --passes 6     (a fast smoke test)
 *
 * Exercises the real orchestrator — the same code path the API drives — so a
 * failure here is a failure in the product, not in a test harness. It polls the
 * run row exactly as the browser does, which also proves the progress counters
 * actually advance rather than jumping from 0 to done.
 */
import { PrismaClient, SimulationRunStatus, UserRole } from '@prisma/client';
import { startRun } from '../src/sarthi/pilotsim/pilotsim.service';

const prisma = new PrismaClient();

const arg = (name: string): number | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const v = Number(process.argv[i + 1]);
  return Number.isFinite(v) ? v : undefined;
};

const bar = (done: number, total: number, width = 24) => {
  const filled = total > 0 ? Math.round((done / total) * width) : 0;
  return `${'█'.repeat(filled)}${'░'.repeat(Math.max(0, width - filled))}`;
};

async function main() {
  const officer = await prisma.userProfile.findFirst({
    where: { role: { in: [UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN] } },
  });
  if (!officer) {
    console.error('No government profile exists. Sign in once, then re-run.');
    process.exitCode = 1;
    return;
  }

  const challenge = await prisma.challenge.findFirst({
    where: { targetValue: { not: null } },
    orderBy: { createdAt: 'asc' },
  });
  if (!challenge) {
    console.error('No challenge with a target value exists.');
    process.exitCode = 1;
    return;
  }

  // A previous run left mid-flight would block this one. Clear only those.
  await prisma.pilotSimulationRun.updateMany({
    where: {
      challengeId: challenge.id,
      status: { in: [SimulationRunStatus.QUEUED, SimulationRunStatus.RUNNING] },
    },
    data: { status: SimulationRunStatus.CANCELLED, phase: 'CANCELLED', finishedAt: new Date() },
  });

  console.log(`challenge  ${challenge.title}`);
  console.log(`target     ${challenge.targetValue} · ${challenge.targetMetric}\n`);

  const started = Date.now();
  const run = await startRun(officer, challenge.id, {
    runsPerCompany: arg('runs'),
    perturbationPasses: arg('passes'),
  });

  let lastLine = '';
  for (;;) {
    await new Promise((r) => setTimeout(r, 1000));
    const r = await prisma.pilotSimulationRun.findUnique({ where: { id: run.id } });
    if (!r) break;

    const totalPasses = 1 + r.perturbationPasses;
    const elapsed = (Date.now() - started) / 1000;
    // `passesDone` already counts completed passes, so the in-pass fraction
    // belongs to the pass now running — adding it to the completed count is
    // what pushed this past 100% at the end.
    const overall = Math.min(
      1,
      (Math.max(0, r.passesDone - 1) + (r.eligibleCount ? r.companiesDone / r.eligibleCount : 0)) /
        totalPasses,
    );
    const eta = overall > 0.02 ? (elapsed / overall) * (1 - overall) : NaN;

    const line =
      `  ${bar(overall, 1)} ${(overall * 100).toFixed(0).padStart(3)}%  ` +
      `pass ${r.passesDone}/${totalPasses}  ` +
      `co ${r.companiesDone}/${r.eligibleCount}  ` +
      `${(r.runsDone / 1e6).toFixed(1)}M runs  ` +
      `${elapsed.toFixed(0)}s${Number.isFinite(eta) ? ` · ~${eta.toFixed(0)}s left` : ''}`;

    if (line !== lastLine) {
      process.stdout.write(`\r${line.padEnd(110)}`);
      lastLine = line;
    }

    if (
      r.status === SimulationRunStatus.COMPLETE ||
      r.status === SimulationRunStatus.FAILED ||
      r.status === SimulationRunStatus.CANCELLED
    ) {
      process.stdout.write('\n\n');
      if (r.status !== SimulationRunStatus.COMPLETE) {
        console.error(`run ended ${r.status}${r.error ? `: ${r.error}` : ''}`);
        process.exitCode = 1;
        return;
      }
      break;
    }
  }

  const final = await prisma.pilotSimulationRun.findUniqueOrThrow({ where: { id: run.id } });
  const results = await prisma.pilotSimulationResult.findMany({
    where: { runId: run.id, eligible: true },
    orderBy: { rankPosition: 'asc' },
    take: 12,
    include: { startup: { select: { displayName: true, legalName: true } } },
  });
  const excluded = await prisma.pilotSimulationResult.count({
    where: { runId: run.id, eligible: false },
  });

  const wall = ((final.finishedAt!.getTime() - final.startedAt!.getTime()) / 1000);
  console.log(
    `completed in ${wall.toFixed(1)}s (${(wall / 60).toFixed(1)} min) · ` +
      `${final.eligibleCount}/${final.cohortSize} eligible · ${excluded} screened out`,
  );
  console.log(
    `${final.runsDone.toLocaleString()} simulated pilots · ` +
      `${final.simulatedDays.toLocaleString()} simulated days · ` +
      `${final.passesDone} parameter settings\n`,
  );

  console.log('  #  company                        met/total   median    p10–p90        stability  limiting');
  console.log('  ─────────────────────────────────────────────────────────────────────────────────────────────');
  for (const r of results) {
    const name = (r.startup.displayName ?? r.startup.legalName).slice(0, 28);
    const met = `${r.runsMetTarget}/${r.runsTotal}`;
    const band = `${r.p10?.toFixed(1)}–${r.p90?.toFixed(1)}`;
    console.log(
      `  ${String(r.rankPosition).padStart(2)}  ${name.padEnd(29)} ${met.padStart(10)}  ` +
        `${r.medianAchieved?.toFixed(1).padStart(6)}  ${band.padStart(12)}  ` +
        `${((r.rankStability ?? 0) * 100).toFixed(0).padStart(7)}%  ${r.dominantCause ?? '—'}`,
    );
  }

  console.log(
    '\nCounts are model runs, not probabilities of real-world success. ' +
      `Model ${final.modelVersion}, seed ${final.seed}.`,
  );
}

main()
  .catch((e) => {
    console.error('FAILED', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
