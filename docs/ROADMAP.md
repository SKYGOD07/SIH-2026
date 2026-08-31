# Sarthi — roadmap and project state

> Handoff document. Read this first when picking the project back up.
> Last updated: **31 August 2026**

**Project:** Sarthi — SIH Problem Statement 26136
**Problem statement:** A startup-friendly public procurement mechanism enabling
government departments to identify, pilot, procure and scale innovative solutions
from eligible startups.
**Organisation:** Maharashtra State Innovation Society (MSInS), Government of
Maharashtra.

---

## The final user journey

Everything below is in service of this. It is the thing being built.

```text
                 GOVERNMENT OFFICER
                        │
                        ▼
                "I HAVE A PROBLEM"
                        │
                        ▼
                 CHALLENGE BUILDER
                        │
                        ▼
                 STARTUP DISCOVERY
                        │
                        ▼
                 WHY THIS STARTUP?
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
           EVIDENCE              RAG
              │                   │
              └─────────┬─────────┘
                        ▼
                  EXPERT REVIEW
                        │
                        ▼
                      PILOT
                        │
                 ┌──────┼──────┐
                 ▼      ▼      ▼
              MILESTONE KPI  EVIDENCE
                 │      │      │
                 └──────┼──────┘
                        ▼
                  SCALE DECISION
```

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind |
| Backend | Node + Express + TypeScript |
| ORM | Prisma |
| Database | Supabase PostgreSQL 17.6 (`ap-south-1`) |
| Auth | Supabase Auth |
| Vectors | pgvector, 768d, HNSW cosine |
| Local AI | Ollama (`nomic-embed-text`) — planned |
| Hosted AI | Claude API — optional, per-user |

### Database access path — non-negotiable

```text
Next.js  →  Express  →  Prisma  →  Supabase PostgreSQL
```

The browser must **not** query or mutate application tables through the Supabase
Data API. Supabase Auth client functionality in Next.js is fine — sign-in and
session only. The backend derives the authenticated user from the Supabase access
token and never trusts a client-supplied `userId`.

### Connection note

The **session pooler** is used, not the direct connection:
`aws-0-ap-south-1.pooler.supabase.com:5432`, username `postgres.<project-ref>`.
The direct endpoint (`db.<ref>.supabase.co`) resolves **IPv6-only** and the
development network is IPv4-only, so it is unreachable. Two recurring traps:

- The pooler username is `postgres.<project-ref>`, not `postgres`.
- Percent-encode the password (`#` → `%23`, `@` → `%40`). An unencoded `#`
  silently truncates the password to empty.
- Use `prisma migrate deploy`, not `migrate dev` — `migrate dev` hangs against
  the pooler and can leave a stale advisory lock that blocks the next attempt.

---

## Current state — 31 August 2026

### Complete

| | |
|---|---|
| Supabase project + CLI link | done |
| PostgreSQL connection (session pooler) | done, verified |
| Prisma schema — 18 models, 16 enums | done |
| One clean init migration | `20260831133722_init_sarthi` |
| Provenance CHECK constraints | done, negative-tested |
| AI credential CHECK constraints | done, negative-tested |
| pgvector + `vector(768)` + HNSW cosine index | done, verified |
| Database documentation | `docs/database/README.md` |
| Logistics domain removal | done, zero references remain |

### Not complete

Authentication · user session · role authorisation · Prisma repositories ·
persistent CRUD · real MSInS data · real SISFS data · document ingestion · RAG
retrieval · Ollama integration · AI matching · evaluation workflow · pilot
persistence · scale-decision workflow · per-user AI settings UI.

### Data

**The database is intentionally empty — 0 application rows.** No fake startup,
pilot, KPI, officer, contract or procurement record exists.

---

## The schema

18 tables. Full detail in [`database/README.md`](database/README.md).

| Domain | Models |
|---|---|
| Auth | `UserProfile`, `AIProviderConnection` |
| Startup intelligence | `EvidenceSource`, `Startup`, `FundingRound`, `GovernmentProgram`, `StartupProgramParticipation` |
| Procurement | `Challenge`, `StartupMatch`, `Evaluation` |
| Pilot | `Pilot`, `PilotMilestone`, `PilotMetric`, `PilotEvidence`, `ScaleDecision` |
| RAG | `Document`, `DocumentChunk` |
| Audit | `AuditEvent` |

### Removed — do not reintroduce

`Driver` · `Vehicle` · `Order` · `Tracking` · `DISPATCHER` · `DRIVER` ·
`CUSTOMER` · `passwordHash`

---

## Standing rules

### Provenance

| Origin | Meaning |
|---|---|
| `VERIFIED` | Externally sourced fact. **Must** cite an `EvidenceSource`. |
| `DEMO` | A deliberately constructed scenario, always labelled as one. |
| `USER_ENTERED` | A first-party record created by an authenticated user. |

There is **no `LIVE` state**. A `pending` fact is a NULL column or an absent
row — never a zero, never a guess.

Demo records must never enter real analytics. Repository methods feeding
aggregates take origin as a **required** argument, never a default.

### AI is advisory

```text
StartupMatch  = AI recommendation
Evaluation    = human expert review
ScaleDecision = government decision
```

An AI recommendation is never a government decision.

### AI credentials

Ollama carries no credential. Anthropic credentials are AES-256-GCM ciphertext
with the key in a backend environment secret. No plaintext keys, ever. Per-user
ownership; a user can never reach another user's credential. Decrypted values are
never returned by the API, never logged, never sent to the browser.

---

## Phases

### Phase 1 — Authentication ← **current**

Build `/login`, `/signup`, `/logout`, `/session`.

```text
Supabase Auth
      ↓
  UserProfile
```

Roles: `GOVERNMENT_OFFICER`, `STARTUP`, `EVALUATOR`, `ADMIN`.

`UserProfile.id` equals the Supabase Auth user UUID. No Prisma foreign key to
`auth.users` — it lives outside the Prisma schema. Public signup must never be
able to create an `ADMIN`.

### Phase 2 — Repository layer

Replace the in-memory `Map` stores with Prisma repositories.

```text
ChallengeService  →  ChallengeRepository  →  Prisma  →  Postgres
```

Outcome: data survives a restart.

### Phase 3 — Real data

Where the project becomes credible.

1. **Maharashtra Startup Week (MSInS)** — highest priority; directly relevant to
   the Maharashtra PS, and its winners are the only population with demonstrated
   government delivery experience.
2. **SISFS** — broader startup ecosystem.
3. **Evidence documents** — policies, eligibility rules, procurement rules.

Target shape (a goal, **not** a current figure): thousands of real startup
records → government programme history → evidence. Every row lands with an
`EvidenceSource` and a retrieval date.

See [`DATA-SOURCES.md`](DATA-SOURCES.md) for what is verified today, what is
blocked, and the three routes to real data.

### Phase 4 — RAG

`documents` → `document_chunks` → pgvector → `nomic-embed-text` → Ollama.

A user asks *"Can this startup participate in this pilot?"* and receives:
answer + evidence + source + document section. The generated explanation stays
visually and structurally distinct from the quoted passage.

### Phase 5 — AI matching

```text
Challenge → search startups → filter by sector/domain → evidence retrieval
          → scoring → Ollama explanation
```

Produces a **"Why this startup?"** panel with per-axis scores. Presented as an
AI-assisted recommendation, never as a selection.

### Phase 6 — One killer SIH demo scenario

A single clearly-labelled `DEMO SCENARIO` — e.g. a Water & Wastewater Innovation
Challenge — built on **real** startup records from the database. The challenge
and pilot numbers are simulated and visibly marked; the startup information stays
`VERIFIED` against MSInS / Startup India.

```text
REAL DATA + REAL SOURCES + SIMULATED WORKFLOW + TRANSPARENT LABELLING
```

Far stronger than fabricating everything.

---

## Implementation order

1. Supabase Auth
2. Backend auth middleware
3. `UserProfile` synchronisation
4. Prisma repositories
5. Startup / programme data ingestion
6. Source & provenance pipeline
7. RAG document ingestion
8. Ollama embedding + generation
9. Challenge → startup matching
10. Expert evaluation
11. Pilot persistence
12. KPI / evidence workflow
13. Scale decision
14. Demo scenario — real sourced startups, explicitly simulated workflow
15. Dashboard / UI polish

---

## Do not

- Reintroduce fake startup data
- Create fake government officers
- Create fake statutory identifiers (CIN, DPIIT, PAN, GSTIN, Udyam)
- Call prototype data "Live"
- Use funding as a startup quality score
- Let AI make a final procurement decision
- Let demo pilots enter real analytics
- Create a second authentication system
- Connect the browser directly to application tables
