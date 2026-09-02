/**
 * Sign-in accounts for the five team members.
 *
 *   npm run demo:seed-accounts
 *
 * Creates (or repairs) one Supabase Auth user per teammate, marks the address
 * confirmed, sets the demonstration password, syncs the `UserProfile` row, and
 * claims that account's primary company.
 *
 * REQUIRES `SUPABASE_SECRET_KEY` in `backend/.env` — the service role key from
 * Project Settings → API. Nothing here works with the publishable key: creating
 * a user with a known password and a pre-confirmed address is a privileged
 * operation, by design.
 *
 * Why not just sign up. The project has `mailer_autoconfirm` disabled, so an
 * ordinary signup emails a confirmation link to five real addresses and leaves
 * every account unverified until somebody clicks it — and `requireVerifiedEmail`
 * then blocks the whole workflow API. `email_confirm: true` on the admin path
 * sends nothing and produces an account that can sign in immediately.
 *
 * ── ON THE PASSWORD ────────────────────────────────────────────────────────
 *
 * `11111111` is a demonstration credential for a demonstration workspace, and it
 * is weak on purpose so five people can sign in during a judging session without
 * a password reset. Two things follow:
 *
 *   1. These accounts must never hold anything that is not simulated.
 *   2. If this repository is ever made public, or this database is ever pointed
 *      at anything real, rotate every one of them first.
 *
 * Override with `TEAM_SEED_PASSWORD` rather than editing the constant.
 */
import { createClient } from '@supabase/supabase-js';
import { PrismaClient, UserRole } from '@prisma/client';
import { TEAM_EMAILS, companiesFor, primaryFor } from './team';

const prisma = new PrismaClient();

const PASSWORD = process.env.TEAM_SEED_PASSWORD ?? '11111111';

async function main() {
  const url = process.env.SUPABASE_URL ?? '';
  const secret = process.env.SUPABASE_SECRET_KEY ?? '';

  if (!url || !secret) {
    console.error('SUPABASE_SECRET_KEY is not set.\n');
    console.error('  1. Supabase dashboard → Project Settings → API → service_role key');
    console.error('  2. Add to backend/.env:   SUPABASE_SECRET_KEY=<key>');
    console.error('  3. npm run demo:seed-accounts\n');
    console.error('The service role key bypasses row-level security. Keep it in .env,');
    console.error('never in the frontend, and never in a commit.');
    process.exitCode = 1;
    return;
  }

  const admin = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });

  /*
   * The whole user list, paged.
   *
   * `listUsers` is the only lookup the admin API offers for an address — there
   * is no getUserByEmail — so the list is pulled once and indexed rather than
   * re-fetched per teammate.
   */
  const existing = new Map<string, string>();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`Could not list users: ${error.message}`);
    data.users.forEach((u) => u.email && existing.set(u.email.toLowerCase(), u.id));
    if (data.users.length < 200) break;
  }

  console.log(`Supabase Auth holds ${existing.size} users.\n`);

  const report: { email: string; action: string; company: string; note: string }[] = [];

  for (const email of TEAM_EMAILS) {
    const key = email.toLowerCase();
    let userId = existing.get(key);
    let action: string;

    if (userId) {
      // Repair rather than recreate: the id is referenced by UserProfile, and
      // by any challenge response or evidence the account has already filed.
      const { error } = await admin.auth.admin.updateUserById(userId, {
        password: PASSWORD,
        email_confirm: true,
      });
      if (error) throw new Error(`Could not update ${email}: ${error.message}`);
      action = 'password reset, address confirmed';
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: PASSWORD,
        // Confirmed here, so no mail is sent to a real address and the account
        // clears `requireVerifiedEmail` on its first request.
        email_confirm: true,
      });
      if (error) throw new Error(`Could not create ${email}: ${error.message}`);
      userId = data.user.id;
      action = 'account created';
    }

    /* --- the application's own view of the person ----------------------- */

    const primary = primaryFor(email);
    const owned = companiesFor(email);

    const company = primary
      ? await prisma.startup.findFirst({ where: { legalName: primary.legalName }, select: { id: true, displayName: true } })
      : null;

    // The local part, not an invented human name — the same rule
    // `profile.service.ts` applies when it creates a profile on first sign-in.
    const displayName = email.split('@')[0] ?? 'Team member';

    const profile = await prisma.userProfile.upsert({
      where: { id: userId },
      update: { email, role: UserRole.STARTUP },
      create: { id: userId, email, displayName, role: UserRole.STARTUP },
    });

    /* --- the claim ------------------------------------------------------ */

    let note = '';
    if (!company) {
      note = primary ? `no company row for ${primary.legalName}` : 'no company mapped';
    } else {
      const claimedByAnother = await prisma.userProfile.findFirst({
        where: { startupId: company.id, NOT: { id: userId } },
        select: { email: true },
      });
      if (claimedByAnother) {
        note = `already claimed by ${claimedByAnother.email}`;
      } else if (profile.startupId === company.id) {
        note = 'claim already in place';
      } else {
        await prisma.userProfile.update({ where: { id: userId }, data: { startupId: company.id } });
        note = 'claimed';
      }
    }

    /*
     * `UserProfile.startupId` is unique in both directions, so one account can
     * claim exactly one company. Two teammates own two companies each; the
     * second is reported here rather than silently dropped.
     */
    const unclaimed = owned.filter((c) => !c.primary).map((c) => c.displayName);
    if (unclaimed.length) note += `${note ? '; ' : ''}also owns ${unclaimed.join(', ')} (unclaimed — one company per account)`;

    report.push({ email, action, company: company?.displayName ?? '—', note });
  }

  /* --- report ----------------------------------------------------------- */

  const w = Math.max(...report.map((r) => r.email.length));
  console.log('  account'.padEnd(w + 2), ' company              action');
  report.forEach((r) =>
    console.log(`  ${r.email.padEnd(w)}  ${r.company.padEnd(20)} ${r.action}${r.note ? ` — ${r.note}` : ''}`),
  );

  console.log(`\n  password for all ${report.length} accounts: ${PASSWORD}`);
  console.log('  role: STARTUP · sign in at /login/startup');
  console.log('\n  Demonstration credentials for a demonstration workspace. Rotate them before');
  console.log('  this database is pointed at anything real, and never publish them.');
}

main()
  .catch((e) => {
    console.error('\nFAILED', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
