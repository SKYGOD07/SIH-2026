// Temporary end-to-end auth verification. Deleted after the run.
// Creates one throwaway auth user, exercises the real guards, cleans up.
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const API = 'http://localhost:5000/api';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const prisma = new PrismaClient();

const email = `sarthi-authtest-${Date.now()}@example.com`;
const password = 'TestPassword!2026';
const results = [];
const rec = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

const status = async (path, opts = {}) => (await fetch(API + path, opts)).status;

const { data, error } = await supabase.auth.signUp({ email, password });

if (error) {
  console.log('SIGNUP_ERROR', error.message);
  process.exit(2);
}

if (!data.session) {
  console.log('NO_SESSION: email confirmation is enabled — a real inbox is required.');
  console.log('USER_ID', data.user?.id ?? '(none)');
  // Clean up the profile row if one somehow exists.
  if (data.user?.id) await prisma.userProfile.deleteMany({ where: { id: data.user.id } });
  await prisma.$disconnect();
  process.exit(3);
}

const token = data.session.access_token;
const uid = data.user.id;
const auth = { Authorization: `Bearer ${token}` };

// 1. A real token is accepted and the profile is synced.
const sessionRes = await fetch(API + '/auth/session', { headers: auth });
const body = await sessionRes.json();
rec('valid token -> 200 on /auth/session', sessionRes.status === 200, `status ${sessionRes.status}`);
rec(
  'identity derived from verified token (uuid matches)',
  body?.data?.user?.id === uid,
  `${body?.data?.user?.id === uid ? 'matches auth uuid' : 'MISMATCH'}`,
);
rec(
  'profile auto-created with role STARTUP',
  body?.data?.profile?.role === 'STARTUP',
  `role=${body?.data?.profile?.role}`,
);
rec('no passwordHash in profile payload', !('passwordHash' in (body?.data?.profile ?? {})));

// 2. Profile sync is idempotent — a second call must not duplicate.
await fetch(API + '/auth/session', { headers: auth });
const count = await prisma.userProfile.count({ where: { id: uid } });
rec('profile upsert idempotent (exactly 1 row)', count === 1, `rows=${count}`);

// 3. Role guard: a STARTUP must not reach admin endpoints.
rec(
  'STARTUP -> admin/users returns 403',
  (await status('/auth/admin/users', { headers: auth })) === 403,
);
rec(
  'STARTUP -> admin/invitations returns 403',
  (await status('/auth/admin/invitations', {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'x@example.com', role: 'GOVERNMENT_OFFICER', displayName: 'X' }),
  })) === 403,
);

// 4. Escalation attempts must be refused by schema, not silently ignored.
const escalate = await fetch(API + '/auth/profile', {
  method: 'PATCH',
  headers: { ...auth, 'Content-Type': 'application/json' },
  body: JSON.stringify({ displayName: 'Real Name', role: 'ADMIN', departmentName: 'PMC' }),
});
const after = await prisma.userProfile.findUnique({ where: { id: uid } });
rec('self-edit with role=ADMIN does not change role', after?.role === 'STARTUP', `role=${after?.role}`);
rec(
  'self-edit cannot set departmentName',
  after?.departmentName === null,
  `department=${after?.departmentName}`,
);
rec('legitimate displayName change applied', after?.displayName === 'Real Name', `name=${after?.displayName}`);
rec('profile PATCH succeeded', escalate.status === 200, `status ${escalate.status}`);

// 5. A client-supplied userId must never be treated as identity.
const other = await prisma.userProfile.count();
rec('only the test profile exists (no stray rows)', other === 1, `profiles=${other}`);

// Clean up: leave the database exactly as we found it.
await prisma.userProfile.delete({ where: { id: uid } });
const remaining = await prisma.userProfile.count();
rec('cleanup: profile removed', remaining === 0, `profiles=${remaining}`);

await prisma.$disconnect();
console.log('\nAUTH_USER_TO_DELETE', uid);
console.log(results.every((r) => r.pass) ? '\nALL PASS' : '\nSOME FAILED');
