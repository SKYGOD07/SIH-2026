# Deployment

Two services, deployed separately.

| | Host | URL |
|---|---|---|
| Frontend | Vercel | `https://sarthhi.vercel.app` |
| Backend | Render | `https://sih-2026-gojz.onrender.com` |
| Database | Supabase | `ap-south-1`, session pooler |
| Model host | Ollama | see below |

The browser talks only to the backend. It holds no database credential, no
service key and no model credential.

```
Browser  →  Next.js (Vercel)  →  Express (Render)  →  Prisma  →  Supabase
                                        │
                                        └─────────→  Ollama
```

Supabase Auth is the one exception: the browser talks to it directly for
sign-in and session refresh, and sends the resulting access token to the
backend as a bearer. The backend derives who the caller is from that token and
never trusts a user id in a request body.

---

## Backend environment (Render)

| Variable | Production value | Why |
|---|---|---|
| `NODE_ENV` | `production` | Also arms the loopback check below. |
| `PORT` | set by Render | |
| `DATABASE_URL` | session pooler URI | Username is `postgres.<project-ref>`. Percent-encode the password — an unencoded `#` silently truncates it to empty. |
| `CLIENT_URLS` | `https://sarthhi.vercel.app` | Exact allowlist. Comma-separated for more than one. |
| `VERCEL_PREVIEW_SUFFIX` | `.vercel.app` | Optional. Without it, every preview deployment is rejected by CORS. |
| `SUPABASE_URL` | `https://<ref>.supabase.co` | Token verification cannot work without it; the server refuses to boot. |
| `SUPABASE_PUBLISHABLE_KEY` | publishable key | |
| `SUPABASE_SECRET_KEY` | service role key | Administrator invitations only. Never `NEXT_PUBLIC_`. |
| `OLLAMA_BASE_URL` | `https://ollama.com` | **See the trap below.** |
| `OLLAMA_MODEL` | a model the host actually serves | |
| `OLLAMA_EMBED_MODEL` | `nomic-embed-text` | Must match the `vector(768)` column. Changing it means re-embedding. |
| `OLLAMA_API_KEY` | Ollama Cloud key | Attached as a bearer only when the base URL is not loopback. |
| `OLLAMA_TIMEOUT_MS` | `20000` | Ceiling on user-visible latency, not a target. |
| `AI_ENABLED` | `true` | `false` runs the platform on deterministic output alone. |
| `AI_CREDENTIAL_ENCRYPTION_KEY` | 32 bytes, base64 | Only needed once per-user credentials are implemented. |

### The loopback trap

`OLLAMA_BASE_URL=http://localhost:11434` is correct on a developer machine and
meaningless on Render, where `localhost` is the backend's own container — which
is not running a model. Every generation fails at fetch time.

Until this release the status endpoint reported `ready: true` in exactly that
state, so the interface said the assistant was working while nothing worked.
`ollamaReadiness()` now refuses a loopback URL when `NODE_ENV=production` and
returns the fix in the reason string.

To point the deployed backend at a real host:

```
OLLAMA_BASE_URL=https://ollama.com
OLLAMA_API_KEY=<key>
OLLAMA_MODEL=<a model that host serves>
```

Then sign in as a government officer or administrator and press **Test AI** on
the Settings page. It lists the models the host actually serves and says
whether the two configured model names are among them — which is the only
reliable way to find out that a configured model name does not exist there.

Nothing breaks while this is misconfigured. Every analysis surface falls back to
a summary composed directly from the stored records, labelled as such.

---

## Frontend environment (Vercel)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://sih-2026-gojz.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key |

`NEXT_PUBLIC_API_BASE_URL` is also read and takes precedence where both are
set; one of the two must be present or the browser will call `localhost:5000`
from a deployed page.

Nothing else belongs here. In particular there is no `NEXT_PUBLIC_OLLAMA_*` of
any kind: a `NEXT_PUBLIC_` variable is compiled into the JavaScript bundle and
is readable by anyone who opens the page.

---

## Supabase Auth redirect configuration

Dashboard → Authentication → URL Configuration. This is the one piece that
cannot be fixed from the repository.

| Field | Value |
|---|---|
| Site URL | `https://sarthhi.vercel.app` |
| Redirect URLs | `https://sarthhi.vercel.app/auth/callback`, `https://sarthhi.vercel.app/auth/invite`, plus the `http://localhost:3000` equivalents for local work |

`emailRedirectTo` is honoured **only** when it matches an entry in the Redirect
URLs allowlist. When it does not match, Supabase does not error — it silently
falls back to Site URL. That is why a confirmation email sent from the deployed
site can arrive pointing at `localhost:3000`: the frontend asks for the right
origin, the allowlist does not contain it, and the fallback wins.

Both routes must be listed. `/auth/callback` handles sign-up confirmation and
`/auth/invite` handles password reset and administrator invitations; listing
only the first breaks reset links.

---

## Database migrations

```
cd backend
npx prisma migrate deploy
```

`migrate deploy`, never `migrate dev`. The latter hangs against the session
pooler and leaves a stale advisory lock behind.

On Windows, `prisma generate` fails with `EPERM ... query_engine-windows.dll`
while a dev server holds the engine. Stop the backend dev server first.

---

## Verification

```
cd backend
npm run demo:verify    # the demonstration dataset
npm run verify:ai      # the assistance layer
```

`verify:ai` checks three things: that grounding removes a fabricated citation,
that every analysis surface produces a usable answer with no model at all, and
— when a model is reachable — that the configured model and embedding model are
actually installed on the host. It exits non-zero on failure, so it can gate a
deploy. A model host that is simply down is reported as skipped rather than
failed, because the platform is designed to run without one.
