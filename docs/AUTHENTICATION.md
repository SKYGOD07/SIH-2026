# Authentication

How a person becomes an identified, authorised user of Sarthi.

Last updated: **31 August 2026**

---

## The shape of it

```text
Next.js  ──signIn──▶  Supabase Auth  ──access token──▶  Next.js
                                                          │
                                          Authorization: Bearer <token>
                                                          ▼
                                                      Express
                                                          │
                                    verify signature against JWKS (ES256)
                                                          │
                                                     user UUID
                                                          ▼
                                            UserProfile · role · ownership
                                                          ▼
                                                       Prisma
```

Supabase Auth owns credentials. Sarthi owns identity — who this person is inside
the platform, what role they hold, and what they may do.

There is **no login, signup or logout endpoint on the Express API.** The browser
talks to Supabase Auth for those. Proxying them would be a second authentication
system with a second set of bugs and no gain.

---

## Access model

| Role | How an account is obtained |
|---|---|
| `STARTUP` | **Public self-registration.** The only public signup in the product. |
| `GOVERNMENT_OFFICER` | Administrator invitation only. |
| `EVALUATOR` | Administrator invitation only. |
| `ADMIN` | Never through any API. Out-of-band only. |

This asymmetry is the point. A department attribution on a challenge means
something only because nobody can self-declare it — a self-registered
"Executive Engineer, Pune Municipal Corporation" would be worth nothing.

`ADMIN` is not in the invitable set either: an administrator can invite officers
and evaluators, but cannot mint another administrator, and cannot modify or
disable an existing one through the API.

---

## Routes

### Frontend

| Route | Purpose |
|---|---|
| `/login` | Selector — Startup or Government. States the access model. |
| `/login/startup` | Email + password sign-in. |
| `/login/government` | Same form; says invitation is required, offers no signup. |
| `/login/forgot` | Password reset request. |
| `/signup/startup` | Registration, then the 6-digit OTP step. |
| `/onboarding/startup` | Profile completion, after verification. |
| `/auth/invite` | Where invitation and password-reset links land. |

There is deliberately no `/signup/government` — the route does not exist, rather
than existing and being hidden.

### Backend — `/api/auth`

| Method | Path | Guard |
|---|---|---|
| `GET` | `/session` | Authenticated. **Not** behind email verification. |
| `PATCH` | `/profile` | Authenticated + verified |
| `GET` | `/admin/users` | `ADMIN` |
| `POST` | `/admin/invitations` | `ADMIN` |
| `PATCH` | `/admin/users/:userId` | `ADMIN` |
| `PATCH` | `/admin/users/:userId/access` | `ADMIN` |

`GET /session` sits outside the verification guard on purpose: the client on the
OTP screen needs to ask what it still owes. Everything that does real work is
behind `requireVerifiedEmail`.

---

## Sessions

**`sessionStorage`. Not cookies. Not `localStorage`.**

The frontend deploys to Vercel and the API deploys separately, so authentication
travels explicitly as `Authorization: Bearer`. There is no cookie to share, and
the API sets `credentials: false` in its CORS policy to match — which makes the
wildcard-origin-with-cookies mistake structurally impossible.

`sessionStorage` is per-tab, so a startup session in one tab and a government
session in another do not clobber each other. That matters for demonstrating
this product. It also ends with the tab.

`frontend/src/lib/supabase/client.ts` is the **only** module that touches auth
storage. Nothing else reads or writes those keys; two owners would eventually
disagree about who is signed in.

**None of this is a security boundary.** Anything in a browser is
caller-supplied. Authorisation happens in the backend against the verified
token, on every request.

---

## Token verification

The project signs access tokens with an asymmetric **ES256** key and publishes
the public half at `/auth/v1/.well-known/jwks.json`. The backend verifies
locally against a cached key set: no shared secret to leak, and no network round
trip per request.

The alternative — `supabase.auth.getUser(token)` on every request — adds a
network hop to every authenticated call. It is worth reaching for only if
immediate revocation matters more than latency; cached JWKS verification honours
a token until it expires.

### The rule that matters

The authenticated identity is the `sub` claim of a verified token, and nothing
else. `req.body.userId`, `req.query.userId` and `req.params.userId` are never
consulted for identity. Handlers read `requireUserId(req)`.

Role is read from the persisted `UserProfile`, not from the token — so editing
JWT claims, or posting a role in a request body, changes nothing.

---

## Profile synchronisation

Backend upsert on every authenticated request, not a Postgres trigger.

```text
Supabase Auth creates the user
        ↓
authenticated request arrives
        ↓
token verified → user UUID
        ↓
UserProfile upserted (idempotent)
```

Chosen over a trigger so the rule is visible in the repository, testable, and
changeable without a migration. Doing it on every request makes the first
request self-healing for a user created outside the app — an invitation, or the
Supabase dashboard.

Two invariants:

1. **A created profile is always `STARTUP`.** Role is never read from a request.
2. **The upsert never downgrades.** An invited officer has a profile *before*
   they first sign in; their first request must not overwrite that role.

The only self-editable field is `displayName`. `role`, `departmentName`,
`designation` and `startupId` are absent from the request schema entirely, so an
escalation attempt is rejected by shape before any handler runs.

---

## Invitations

`POST /api/auth/admin/invitations` calls `inviteUserByEmail` with the Supabase
secret key, then writes the profile carrying the authoritative role and
department. By the time the invited person signs in, the profile already exists
with the right role.

Disabling access is a Supabase Auth ban, not a column. A flag this API checked
would leave a valid token working against anything that forgot to check it.

The secret key exists only in the backend process. It bypasses RLS and can
create users, so it is never returned, never logged, and never prefixed
`NEXT_PUBLIC_`.

---

## Environment

**Frontend** — both values ship to the browser by design:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_API_BASE_URL
```

**Backend:**

```
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY     # only for admin invitations
DATABASE_URL
CLIENT_URLS             # comma-separated CORS allowlist, no wildcard
```

Never `NEXT_PUBLIC_`: `SUPABASE_SECRET_KEY`, `DATABASE_URL`,
`ANTHROPIC_API_KEY`, `AI_CREDENTIAL_ENCRYPTION_KEY`.

---

## Operational note — email delivery

This project has email confirmation **enabled**, and uses Supabase's built-in
SMTP, which is rate-limited to a handful of messages per hour. That limit is
reachable during ordinary testing.

Before any demonstration, configure a custom SMTP provider in
Supabase → Authentication → Emails. Otherwise signup will appear to work and the
code will never arrive.

---

## Responsibilities

| Concern | Owner |
|---|---|
| Password storage and checking | Supabase Auth |
| Email verification, OTP, reset links | Supabase Auth |
| Token issuance and signing | Supabase Auth |
| Token verification | Express (`auth/verifyToken.ts`) |
| Identity → UserProfile | Express (`auth/profile.service.ts`) |
| Role assignment | Administrator provisioning only |
| Authorisation | Express role guards, per request |
| Route visibility | Frontend — UX only, never security |
