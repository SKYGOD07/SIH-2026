/**
 * Prove the government workspace's three activated pages against the database.
 *
 *   npm run verify:workflow
 *
 * Two things are checked, because a page can be wrong in two different ways.
 *
 * **Shape.** `/pilots`, `/pilots/[id]` and `/ledger` read specific fields off
 * specific queries. A missing include is invisible in TypeScript — the frontend
 * declares its own interface and believes it — and surfaces in the browser as a
 * silent `undefined`. So every field those pages actually render is asserted
 * present here, against the same repository functions the routes call.
 *
 * **Rules.** The ledger tells an officer that payment requires an approved
 * milestone and that approval requires accepted artefacts. That claim has to be
 * true. It is tested by attempting the illegal transitions and requiring them to
 * be refused — which is safe to run against live data precisely because a
 * refusal writes nothing. If one of them ever succeeds, this script fails and
 * the ledger's wording is a lie worth catching before a demo does.
 *
 * Nothing here mutates. It is safe to run at any time.
 */
import { PrismaClient, UserRole } from '@prisma/client';
import { AppError } from '../src/middleware/errorHandler';
import * as svc from '../src/workflow/workflow.service';

const prisma = new PrismaClient();

let failures = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

/** An action that must be refused. A success here is the failure. */
async function mustRefuse(name: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    failures += 1;
    console.log(`  FAIL  ${name} — the action was ALLOWED`);
  } catch (e) {
    if (e instanceof AppError && e.statusCode === 409) {
      console.log(`  PASS  ${name} — refused: ${e.message}`);
    } else {
      failures += 1;
      console.log(
        `  FAIL  ${name} — refused for the wrong reason: ${e instanceof Error ? e.message : e}`,
      );
    }
  }
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
  console.log(`officer ${officer.displayName} (${officer.role})\n`);

  /* ---------------------------------------------------------------- */
  console.log('/pilots — list');
  const list = await svc.listOwnPilots(officer);
  check('returns at least one pilot', list.length > 0, `got ${list.length}`);

  for (const p of list) {
    const row = p as Record<string, unknown> & { challenge?: unknown; startup?: unknown };
    check(
      `pilot ${String(row.id).slice(0, 8)} carries every field the list renders`,
      ['status', 'department', 'contractValue', 'durationDays', 'origin'].every(
        (f) => row[f] !== undefined,
      ) &&
        row.challenge !== undefined &&
        row.startup !== undefined,
      'a field the row reads is missing from the query include',
    );
  }

  /* ---------------------------------------------------------------- */
  console.log('\n/pilots/[id] and /ledger — detail');
  if (list.length === 0) {
    console.log('  SKIP  no pilot to open');
  }

  for (const p of list) {
    const full = await svc.getPilot(officer, p.id);
    const title = full.challenge.title;

    check(`${title}: milestones present`, full.milestones.length > 0);
    check(
      `${title}: every milestone carries its evidence array`,
      full.milestones.every((m) => Array.isArray(m.evidence)),
      'findFull is missing include.milestones.evidence — the ledger would count undefined',
    );
    check(
      `${title}: every milestone names its required artefacts`,
      full.milestones.every((m) => Array.isArray(m.evidenceRequired)),
    );
    check(
      `${title}: milestone payments sum to the contract value`,
      full.milestones.reduce((t, m) => t + Number(m.payment), 0) === Number(full.contractValue),
      `${full.milestones.reduce((t, m) => t + Number(m.payment), 0)} vs ${full.contractValue}`,
    );
    check(
      `${title}: exactly one primary metric`,
      full.metrics.filter((m) => m.isPrimary).length === 1,
      `${full.metrics.filter((m) => m.isPrimary).length} primary metrics`,
    );

    const trail = await svc.pilotAuditTrail(officer, p.id);
    check(`${title}: audit trail is populated`, trail.length > 0, `${trail.length} events`);
  }

  /* ---------------------------------------------------------------- */
  console.log('\nevidence → approval → payment (the rule the ledger states)');
  const milestones = await prisma.pilotMilestone.findMany({
    include: { evidence: true },
    orderBy: { code: 'asc' },
  });

  const locked = milestones.find((m) => m.status === 'LOCKED');
  const inProgress = milestones.find((m) => m.status === 'IN_PROGRESS');

  if (inProgress) {
    await mustRefuse(
      `approving ${inProgress.code} with no accepted evidence`,
      () => svc.approveMilestone(officer, inProgress.id),
    );
    await mustRefuse(
      `paying ${inProgress.code} before approval`,
      () => svc.payMilestone(officer, inProgress.id),
    );
  } else {
    console.log('  SKIP  no IN_PROGRESS milestone to test against');
  }

  if (locked) {
    await mustRefuse(
      `paying ${locked.code} while it is still locked`,
      () => svc.payMilestone(officer, locked.id),
    );
  } else {
    console.log('  SKIP  no LOCKED milestone to test against');
  }

  /* ---------------------------------------------------------------- */
  console.log('\nledger arithmetic');
  const all = await prisma.pilotMilestone.findMany();
  const paid = all.filter((m) => m.status === 'PAID');
  const evidence = await prisma.pilotEvidence.count();
  console.log(
    `  ${all.length} milestone(s) · ${paid.length} paid · ${evidence} evidence artefact(s) filed`,
  );
  check(
    'no milestone is PAID without an approval recorded',
    paid.every((m) => m.approvedAt !== null && m.approvedBy !== null),
    'a paid milestone has no approver — the chain was bypassed',
  );

  console.log(
    failures === 0
      ? '\nALL CHECKS PASSED — the pages render real fields and the payment rule holds.'
      : `\n${failures} CHECK(S) FAILED`,
  );
  if (failures > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error('FAILED', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
