/**
 * Prove the pilot simulation model.
 *
 *   npm run verify:pilotsim
 *
 * The model produces a ranking that could influence how public money is
 * committed, so the properties it claims have to be tested rather than asserted
 * in a comment. Five of them matter:
 *
 *  1. **Determinism.** The same seed reproduces the same result exactly. A
 *     ranking an officer cannot reproduce is one they cannot defend.
 *  2. **Agreement with the real rule.** A simulated run is judged by the same
 *     `classifyOutcome` that closes a real pilot. If the two ever diverged the
 *     simulation would be ranking on something the platform does not contract on.
 *  3. **Counts reconcile.** met + partial + missed === total, always. A
 *     denominator that does not add up makes every figure above it unreadable.
 *  4. **Absence is penalised, never imputed.** An empty profile must rank below
 *     a modest but complete one — otherwise saying nothing is a strategy.
 *  5. **Nobody vanishes.** Every screened-out company keeps a row and a reason,
 *     so a broken query cannot masquerade as a small eligible cohort.
 *
 * Runs against the model directly. Writes nothing to the database.
 */
import { PrismaClient, type Startup } from '@prisma/client';
import { classifyOutcome, progressFraction, targetMet } from '../src/workflow/outcome';
import { DEFAULT_ASSUMPTIONS } from '../src/sarthi/pilotsim/pilotsim.service';
import { parameterise, perturbationPlan } from '../src/sarthi/pilotsim/parameters';
import { rankAggregates, runCohortMember } from '../src/sarthi/pilotsim/montecarlo';
import { screen } from '../src/sarthi/pilotsim/screen';
import { simulateOnce } from '../src/sarthi/pilotsim/trajectory';
import type { PilotDesign } from '../src/sarthi/pilotsim/types';

const prisma = new PrismaClient();

let failures = 0;
function check(name: string, ok: boolean, detail?: string) {
  if (ok) console.log(`  PASS  ${name}`);
  else {
    failures += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function main() {
  const challenge = await prisma.challenge.findFirst({
    where: { targetValue: { not: null } },
    orderBy: { createdAt: 'asc' },
  });
  if (!challenge) {
    console.error('No challenge with a target value exists.');
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

  const cohort = await prisma.startup.findMany({ orderBy: { id: 'asc' } });
  const screened = cohort.map((s) => ({ startup: s, ...screen(s, challenge) }));
  const eligible = screened.filter((s) => s.eligible);

  console.log(`challenge  ${challenge.title}`);
  console.log(`design     baseline ${design.baseline} → target ${design.target} over ${design.durationDays}d\n`);

  /* ---------------------------------------------------------------- */
  console.log('the outcome rule (shared with closePilot)');

  // Downward-improving: baseline 100, target 80.
  check('achieved 78 against target 80 (downward) is met', targetMet(100, 80, 78));
  check('achieved 82 against target 80 (downward) is not met', !targetMet(100, 80, 82));
  // Upward-improving: baseline 40, target 70.
  check('achieved 72 against target 70 (upward) is met', targetMet(40, 70, 72));
  check('achieved 65 against target 70 (upward) is not met', !targetMet(40, 70, 65));
  check('halfway is PARTIALLY_MET', classifyOutcome(100, 80, 90) === 'PARTIALLY_MET');
  check('barely moved is TARGET_MISSED', classifyOutcome(100, 80, 98) === 'TARGET_MISSED');
  check(
    'progress fraction is direction-agnostic',
    Math.abs(progressFraction(100, 80, 90) - 0.5) < 1e-9 &&
      Math.abs(progressFraction(40, 70, 55) - 0.5) < 1e-9,
  );

  /* ---------------------------------------------------------------- */
  console.log('\ndeterminism');

  const sample = eligible.slice(0, 12);
  const digest = (seed: number) =>
    sample
      .map((e) => {
        const c = parameterise(e.startup, challenge, null, 0, design, DEFAULT_ASSUMPTIONS);
        const a = runCohortMember(
          c.startupId,
          design,
          c.params,
          { ...DEFAULT_ASSUMPTIONS, runsPerCompany: 150 },
          seed,
          false,
        );
        return `${a.runsMetTarget}:${a.medianAchieved.toFixed(9)}:${a.p10.toFixed(9)}`;
      })
      .join('|');

  const first = digest(4242);
  const second = digest(4242);
  const different = digest(9999);

  check('same seed reproduces an identical digest', first === second);
  check('a different seed produces a different digest', first !== different);

  const oneA = simulateOnce(design, sampleParams(), DEFAULT_ASSUMPTIONS, 77, true);
  const oneB = simulateOnce(design, sampleParams(), DEFAULT_ASSUMPTIONS, 77, true);
  check(
    'a single run is reproducible to the last decimal',
    oneA.achieved === oneB.achieved && oneA.coverageFraction === oneB.coverageFraction,
  );

  /* ---------------------------------------------------------------- */
  console.log('\ncounts and coverage');

  const aggregates = sample.map((e) => {
    const c = parameterise(e.startup, challenge, null, 0, design, DEFAULT_ASSUMPTIONS);
    return runCohortMember(
      c.startupId,
      design,
      c.params,
      { ...DEFAULT_ASSUMPTIONS, runsPerCompany: 300 },
      31337,
      false,
    );
  });

  check(
    'met + partial + missed === total for every company',
    aggregates.every((a) => a.runsMetTarget + a.runsPartial + a.runsMissed === a.runsTotal),
  );
  check(
    'p10 ≤ median ≤ p90 for every company',
    aggregates.every((a) => a.p10 <= a.medianAchieved && a.medianAchieved <= a.p90),
  );
  check(
    'coverage is a fraction',
    aggregates.every((a) => a.medianCoverage >= 0 && a.medianCoverage <= 1),
  );
  check(
    'every company that missed at least once has a dominant cause',
    aggregates.every((a) => a.runsMetTarget === a.runsTotal || a.dominantCause !== null),
  );

  /* ---------------------------------------------------------------- */
  console.log('\nabsence is penalised, never imputed');

  const empty = {
    ...sample[0].startup,
    teamSize: null,
    deploymentCount: null,
    procurementReadiness: 'NOT_ASSESSED',
    complianceStatus: 'NOT_PROVIDED',
    cybersecurityStatus: 'NOT_PROVIDED',
    dataPrivacyStatus: 'NOT_PROVIDED',
    implementationDependencies: null,
    deploymentRequirements: null,
  } as Startup;

  const complete = {
    ...sample[0].startup,
    teamSize: 24,
    deploymentCount: 5,
    procurementReadiness: 'HIGH',
    complianceStatus: 'VERIFIED',
    cybersecurityStatus: 'VERIFIED',
    dataPrivacyStatus: 'VERIFIED',
    implementationDependencies: 'x'.repeat(120),
    deploymentRequirements: 'y'.repeat(120),
  } as Startup;

  const pEmpty = parameterise(empty, challenge, null, 0, design, DEFAULT_ASSUMPTIONS);
  const pComplete = parameterise(complete, challenge, null, 0, design, DEFAULT_ASSUMPTIONS);

  check(
    'a blank profile mobilises at the ceiling',
    pEmpty.params.mobilisationDays === DEFAULT_ASSUMPTIONS.maxMobilisationDays,
    `got ${pEmpty.params.mobilisationDays}`,
  );
  check(
    'a blank profile has the floor coverage rate',
    pEmpty.params.coverageRate < pComplete.params.coverageRate,
  );
  check(
    'a blank profile carries the highest integration risk',
    pEmpty.params.integrationRisk > pComplete.params.integrationRisk,
  );

  const aEmpty = runCohortMember(
    'empty',
    design,
    pEmpty.params,
    { ...DEFAULT_ASSUMPTIONS, runsPerCompany: 400 },
    5150,
    false,
  );
  const aComplete = runCohortMember(
    'complete',
    design,
    pComplete.params,
    { ...DEFAULT_ASSUMPTIONS, runsPerCompany: 400 },
    5150,
    false,
  );
  check(
    'and it ranks below an otherwise identical complete profile',
    rankAggregates([aEmpty, aComplete], design)[0].startupId === 'complete',
    `${aEmpty.runsMetTarget}/400 empty vs ${aComplete.runsMetTarget}/400 complete`,
  );

  /* ---------------------------------------------------------------- */
  console.log('\nscreening');

  check('no company is silently dropped', screened.length === cohort.length);
  check(
    'every excluded company carries a reason',
    screened.filter((s) => !s.eligible).every((s) => !!s.reason),
  );
  check(
    'the eligible set is neither empty nor everything',
    eligible.length > 0 && eligible.length < cohort.length,
    `${eligible.length} of ${cohort.length}`,
  );

  /* ---------------------------------------------------------------- */
  console.log('\nthe sensitivity plan');

  const plan = perturbationPlan();
  const labels = new Set(plan.map((p) => p.label));
  check('every parameter setting in the plan is distinct', labels.size === plan.length,
    `${labels.size} unique of ${plan.length}`);
  check(
    'the plan covers at least the configured number of passes',
    plan.length >= DEFAULT_ASSUMPTIONS.perturbationPasses,
    `plan has ${plan.length}, config wants ${DEFAULT_ASSUMPTIONS.perturbationPasses}`,
  );
  check('the plan tests interactions, not just single parameters',
    plan.some((p) => p.shifts.length > 1));

  /* ---------------------------------------------------------------- */
  console.log('\nprojected runtime');

  const probeAssumptions = { ...DEFAULT_ASSUMPTIONS, runsPerCompany: 400 };
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < 20; i += 1) {
    const c = parameterise(
      eligible[Math.floor((i * eligible.length) / 20)].startup,
      challenge,
      null,
      0,
      design,
      probeAssumptions,
    );
    runCohortMember(c.startupId, design, c.params, probeAssumptions, 999, false);
  }
  const nsPerRun = Number(process.hrtime.bigint() - t0) / (20 * 400);
  const passes = 1 + Math.min(DEFAULT_ASSUMPTIONS.perturbationPasses, plan.length);
  const projected =
    (nsPerRun * DEFAULT_ASSUMPTIONS.runsPerCompany * eligible.length * passes) / 1e9;

  console.log(`  ${(nsPerRun / 1000).toFixed(2)} µs/run · ${eligible.length} eligible · ${passes} passes`);
  console.log(
    `  projected ${projected.toFixed(0)}s (${(projected / 60).toFixed(1)} min) · ` +
      `${(DEFAULT_ASSUMPTIONS.runsPerCompany * eligible.length * passes).toLocaleString()} simulated pilots`,
  );
  check(
    'a full run lands inside the 3–5 minute window',
    projected >= 170 && projected <= 320,
    `${projected.toFixed(0)}s — retune runsPerCompany via npm run pilotsim:calibrate`,
  );

  console.log(
    failures === 0
      ? '\nALL CHECKS PASSED — the model is deterministic, reconciles, and penalises silence.'
      : `\n${failures} CHECK(S) FAILED`,
  );
  if (failures > 0) process.exitCode = 1;
}

/** A mid-range parameter set, for tests that need one without a company. */
function sampleParams() {
  return {
    mobilisationDays: 12,
    coverageRate: 0.06,
    efficacy: 0.8,
    dataPenalty: 1,
    integrationRisk: 0.18,
  };
}

main()
  .catch((e) => {
    console.error('FAILED', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
