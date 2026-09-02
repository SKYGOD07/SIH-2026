/**
 * Take one challenge through selection into a contracted pilot.
 *
 *   npm run demo:pilot
 *
 * The console has two challenges with responses and scored matches, and zero
 * pilots — so the pilots and ledger screens have nothing to render. This walks
 * the top-ranked candidate through selection, which is the step that produces a
 * pilot, its milestone chain and its primary KPI.
 *
 * It does this by **calling the workflow service**, not by inserting rows.
 * That distinction is the point: `selectAndCreatePilot` enforces the milestone
 * split summing to the contract value, marks the losing candidates rejected,
 * unlocks only the first milestone and writes the audit trail. Inserting the
 * same rows directly would produce a pilot that looks right and skipped every
 * rule the product exists to enforce — and the first person to notice would be
 * a judge asking how payment is controlled.
 *
 * It stops at a contracted pilot. No evidence is filed, no milestone approved,
 * no measurement recorded and no outcome set, because those are things people
 * do — and pre-baking them would demonstrate a workflow nobody ran. M1 is left
 * IN_PROGRESS, which is exactly where a real pilot sits on day one.
 *
 * Idempotent: a challenge that already has a pilot is skipped.
 */
import { PrismaClient, UserRole } from '@prisma/client';
import { selectAndCreatePilot } from '../src/workflow/workflow.service';

const prisma = new PrismaClient();

/** A four-stage chain: prove the baseline, deploy, review, measure. */
function milestones(contractValue: number, durationDays: number) {
  const day = (n: number) =>
    new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  const split = [0.2, 0.3, 0.25, 0.25];
  const payments = split.map((f) => Math.round(contractValue * f));
  // Rounding must not break the sum-to-contract rule the service enforces.
  payments[payments.length - 1] += contractValue - payments.reduce((a, b) => a + b, 0);

  return [
    {
      code: 'M1',
      title: 'Baseline established',
      description:
        'Baseline measured and agreed with the department before any intervention is deployed.',
      payment: payments[0],
      dueOn: day(Math.round(durationDays * 0.25)),
      evidenceRequired: ['Baseline dataset', 'Measurement method note'],
    },
    {
      code: 'M2',
      title: 'Deployment complete',
      description: 'Solution deployed across the agreed pilot scope and reporting.',
      payment: payments[1],
      dueOn: day(Math.round(durationDays * 0.5)),
      evidenceRequired: ['Deployment register', 'Coverage confirmation'],
    },
    {
      code: 'M3',
      title: 'Mid-pilot review',
      description: 'Interim reconciliation against the baseline, with issues logged.',
      payment: payments[2],
      dueOn: day(Math.round(durationDays * 0.75)),
      evidenceRequired: ['Interim measurement report'],
    },
    {
      code: 'M4',
      title: 'Final measurement',
      description: 'Final reconciliation and handover of the measurement record.',
      payment: payments[3],
      dueOn: day(durationDays),
      evidenceRequired: ['Final dataset', 'Independent validation note'],
    },
  ];
}

async function main() {
  const officer = await prisma.userProfile.findFirst({
    where: { role: { in: [UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN] } },
  });
  if (!officer) {
    console.error('No government profile exists. Sign in once, then re-run.');
    process.exitCode = 1;
    return;
  }

  const challenges = await prisma.challenge.findMany({
    include: { pilots: true, matches: { orderBy: { overallScore: 'desc' } } },
  });

  let created = 0;
  for (const challenge of challenges) {
    if (challenge.pilots.length > 0) {
      console.log(`skip   ${challenge.title} — already has a pilot`);
      continue;
    }
    const top = challenge.matches[0];
    if (!top) {
      console.log(`skip   ${challenge.title} — no scored candidate to select`);
      continue;
    }

    const contractValue = Number(challenge.budgetEnvelope ?? 2_400_000);
    const durationDays = challenge.pilotDurationDays ?? 90;

    const startup = await prisma.startup.findUniqueOrThrow({ where: { id: top.startupId } });

    const pilot = await selectAndCreatePilot(officer, challenge.id, {
      matchId: top.id,
      department: challenge.department,
      location: startup.city ?? undefined,
      contractValue,
      durationDays,
      baselineDays: Math.round(durationDays / 3),
      baselineQuality: 'PARTIAL',
      scopeUnits: 3,
      scopeUnitLabel: 'ward',
      primaryMetric: {
        name: challenge.targetMetric,
        unit: 'index',
        baselineValue: 100,
        // The challenge states a percentage improvement; the metric is the
        // level it implies, so achieved-vs-target is directly comparable.
        targetValue: 100 - (challenge.targetValue ?? 20),
        method: 'Departmental reconciliation against the agreed baseline.',
      },
      milestones: milestones(contractValue, durationDays),
    });

    created += 1;
    console.log(
      `pilot  ${challenge.title}\n` +
        `       selected ${startup.displayName ?? startup.legalName} (match ${(top.overallScore * 100).toFixed(0)})\n` +
        `       ${pilot.status} · ₹${contractValue.toLocaleString('en-IN')} · ${durationDays} days · 4 milestones`,
    );
  }

  const [pilots, ms, metrics, audit] = await Promise.all([
    prisma.pilot.count(),
    prisma.pilotMilestone.count(),
    prisma.pilotMetric.count(),
    prisma.auditEvent.count(),
  ]);
  console.log(
    `\ncreated ${created} pilot(s) · totals: pilots ${pilots}, milestones ${ms}, metrics ${metrics}, audit ${audit}`,
  );
  console.log('No evidence, approval, payment or outcome was written — those are produced by people.');
}

main()
  .catch((e) => {
    console.error('FAILED', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
