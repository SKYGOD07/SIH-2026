/**
 * Measure the model's throughput, then pick `runsPerCompany`.
 *
 *   npm run pilotsim:calibrate
 *
 * The target duration is a product requirement — a run should take three to
 * five minutes — but the number of Monte Carlo runs that produces it depends
 * entirely on the machine. Hardcoding a guess would give a thirty-second run on
 * one laptop and a twenty-minute one on another, and the second is a demo that
 * never finishes.
 *
 * So the constant is derived rather than guessed: time a known number of runs,
 * measure the real cohort, and solve for the count that lands in the window.
 *
 * This measures the model only. It writes nothing.
 */
import { PrismaClient } from '@prisma/client';
import { DEFAULT_ASSUMPTIONS } from '../src/sarthi/pilotsim/pilotsim.service';
import { parameterise } from '../src/sarthi/pilotsim/parameters';
import { runCohortMember } from '../src/sarthi/pilotsim/montecarlo';
import { screen } from '../src/sarthi/pilotsim/screen';
import type { PilotDesign } from '../src/sarthi/pilotsim/types';

const prisma = new PrismaClient();

const TARGET_SECONDS = 240; // the middle of the 3–5 minute window

async function main() {
  const challenge = await prisma.challenge.findFirst({
    where: { targetValue: { not: null } },
    orderBy: { createdAt: 'asc' },
  });
  if (!challenge) {
    console.error('No challenge with a target value exists to calibrate against.');
    process.exitCode = 1;
    return;
  }

  const cohort = await prisma.startup.findMany({ orderBy: { id: 'asc' } });
  const eligible = cohort.filter((s) => screen(s, challenge).eligible);

  console.log(`challenge   ${challenge.title}`);
  console.log(`cohort      ${cohort.length} companies · ${eligible.length} eligible\n`);

  if (eligible.length === 0) {
    console.error('No eligible companies — nothing to calibrate.');
    process.exitCode = 1;
    return;
  }

  const design: PilotDesign = {
    baseline: 100,
    target: 100 - (challenge.targetValue ?? 20),
    durationDays: challenge.pilotDurationDays ?? 90,
    scopeUnits: 3,
    scopeUnitLabel: 'ward',
    baselineQuality: 'PARTIAL',
  };

  // Time a sample of real companies rather than one synthetic company: model
  // cost varies with the parameters, and a fast company would flatter the
  // estimate.
  const SAMPLE = Math.min(25, eligible.length);
  const PROBE_RUNS = 400;
  const assumptions = { ...DEFAULT_ASSUMPTIONS, runsPerCompany: PROBE_RUNS };

  const started = process.hrtime.bigint();
  for (let i = 0; i < SAMPLE; i += 1) {
    const s = eligible[Math.floor((i * eligible.length) / SAMPLE)];
    const c = parameterise(s, challenge, null, 0, design, assumptions);
    runCohortMember(c.startupId, design, c.params, assumptions, 12345, false);
  }
  const elapsedNs = Number(process.hrtime.bigint() - started);

  const nsPerRun = elapsedNs / (SAMPLE * PROBE_RUNS);
  const usPerRun = nsPerRun / 1000;
  const passes = 1 + DEFAULT_ASSUMPTIONS.perturbationPasses;

  // Total runs the whole job performs = eligible × runsPerCompany × passes.
  const runsForTarget =
    (TARGET_SECONDS * 1e9) / (nsPerRun * eligible.length * passes);

  console.log(`measured    ${usPerRun.toFixed(2)} µs per simulated pilot`);
  console.log(`            (${SAMPLE} companies × ${PROBE_RUNS} runs in ${(elapsedNs / 1e6).toFixed(0)} ms)`);
  console.log(`passes      ${passes} (1 base + ${DEFAULT_ASSUMPTIONS.perturbationPasses} perturbation)\n`);

  const suggested = Math.round(runsForTarget / 100) * 100;
  console.log(`To land at ~${TARGET_SECONDS}s on this machine:`);
  console.log(`            runsPerCompany ≈ ${suggested.toLocaleString()}`);
  console.log(`            total simulated pilots ≈ ${(suggested * eligible.length * passes).toLocaleString()}`);
  console.log(
    `            simulated days ≈ ${(suggested * eligible.length * passes * design.durationDays).toLocaleString()}\n`,
  );

  const current = DEFAULT_ASSUMPTIONS.runsPerCompany;
  const projected = (nsPerRun * current * eligible.length * passes) / 1e9;
  console.log(
    `Current default (${current.toLocaleString()} runs) projects to ${projected.toFixed(0)}s — ` +
      (projected >= 180 && projected <= 300
        ? 'inside the 3–5 minute window.'
        : `outside the window; set runsPerCompany to ${suggested.toLocaleString()}.`),
  );

  if (suggested > 20000) {
    console.log(
      '\nNote: the suggested count exceeds the API cap of 20,000. Statistically ' +
        'anything past a few thousand runs adds nothing, so prefer raising ' +
        'perturbationPasses — more parameter settings tested is real information, ' +
        'where more runs of the same setting is not.',
    );
  }
}

main()
  .catch((e) => {
    console.error('FAILED', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
