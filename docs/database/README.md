# Database schema

The canonical Sarthi persistence model, for SIH Problem Statement 26136 —
a startup-friendly public procurement mechanism letting government departments
identify, pilot, procure and scale innovative solutions from eligible startups.

- **Engine**: PostgreSQL 17.6 (Supabase, `ap-south-1`)
- **ORM**: Prisma
- **Access path**: Next.js → Express → Prisma → PostgreSQL
- **Migration**: `20260831133722_init_sarthi` — 18 tables, 16 enums, 0 rows

The browser never queries these tables. Supabase Auth is used from the frontend
for authentication only; every read and write of application data goes through
the backend, which derives the caller's identity from the Supabase access token
and never trusts a client-supplied user id.

---

## Three rules the schema exists to enforce

**1. Supabase Auth owns credentials.** There is no password column anywhere in
this schema. `UserProfile.id` holds the `auth.users` UUID verbatim, with no
foreign key — `auth` is outside the Prisma schema, and a cross-schema FK would
tie our migrations to a schema Supabase manages. The row is created by a trigger
on `auth.users` or by controlled backend synchronisation.

**2. Every record declares where it came from.** `DataOrigin` is `VERIFIED`,
`DEMO` or `USER_ENTERED`, and a `VERIFIED` row without an `EvidenceSource` is
refused by the database. See [Provenance](#provenance).

**3. AI is advisory.** `StartupMatch` holds a recommendation, `Evaluation` holds
a named human's review of it, and `ScaleDecision` holds the government decision.
No model lets a score stand in for a decision.

---

## The lifecycle

```text
                          SUPABASE AUTH
                               │  id copied, no FK
                               ▼
                          UserProfile ──1:N── AIProviderConnection
                               │
                               │ owns
                               ▼
                           Challenge
                               │
                               ▼
                          StartupMatch ──N:1── Startup
                               │                 │
                               ▼                 ├──1:N── FundingRound
                          Evaluation             │
                               │                 └──1:N── StartupProgramParticipation
                               │                                    │
                               ▼                                    ▼
                             Pilot                          GovernmentProgram
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       PilotMilestone     PilotMetric     PilotEvidence
              ▲                ▲                │
              └────────────────┴────────────────┘
                        (evidence backs either)
                               │
                               ▼
                         ScaleDecision

  EvidenceSource ──provenance for──> Startup, FundingRound, GovernmentProgram,
                                     StartupProgramParticipation, Document

  Document ──1:N── DocumentChunk  (pgvector, 768d, HNSW cosine)

  AuditEvent — append-only, no foreign keys
```

---

## Models

### Authentication and settings

| Model | Purpose |
|---|---|
| `UserProfile` | The application's view of a person. Roles: `GOVERNMENT_OFFICER`, `STARTUP`, `EVALUATOR`, `ADMIN`. `startupId` is set only for startup users. |
| `AIProviderConnection` | A user's own provider configuration. `OLLAMA` or `ANTHROPIC`. |

`ADMIN` must never be reachable through public signup. That is a backend
authorisation rule — the database cannot tell a self-serve signup from an
administrative grant.

### Startup intelligence

| Model | Purpose |
|---|---|
| `EvidenceSource` | A citable source: publisher, title, url, and the date it was read. |
| `Startup` | Company facts only. **No score column** — see below. |
| `FundingRound` | One disclosed funding event. |
| `GovernmentProgram` | e.g. `MSW` (Maharashtra Startup Week), `SISFS`. |
| `StartupProgramParticipation` | A startup's participation in a programme edition. |

`Startup` deliberately carries no suitability score. Suitability is a property of
a *(challenge, startup)* pair: a company that is an excellent answer to a
water-distribution challenge is irrelevant to a transit one, and a stored
"startup quality" score would be read as the former while meaning neither.
Scores live on `StartupMatch`.

`StartupProgramParticipation` is the highest-value evidence the platform holds
for this problem statement. A Maharashtra Startup Week winner has already
delivered against a government work order — the one thing a prior-experience
requirement asks for, and the one thing most startups cannot show.

Funding is one signal among several and the schema does not weight it. Capital
raised measures investor conviction about a company's future, not whether its
solution works in a specific ward.

### Procurement pathway

| Model | Purpose |
|---|---|
| `Challenge` | A department's problem, stated as an outcome. `targetMetric` + `targetValue` are separate columns so the pilot has something to measure against. |
| `StartupMatch` | AI-assisted recommendation, scored on eight named axes plus an overall. Unique per `(challenge, startup)`. |
| `Evaluation` | A named expert's review. Only an evaluation can carry a pilot recommendation. |

`Evaluation.recommendation` includes `NEEDS_MORE_EVIDENCE` as a first-class value
rather than a comment, because "we cannot yet tell" is a legitimate and common
outcome — forcing it into `PILOT` or `REJECT` is how weak evidence gets laundered
into a decision.

### Pilot

| Model | Purpose |
|---|---|
| `Pilot` | One controlled experiment. **The single canonical pilot entity.** |
| `PilotMilestone` | Contract milestone. Enforces `evidence → approval → payment`. |
| `PilotMetric` | One measured quantity. `method` is required. |
| `PilotEvidence` | A filed artefact backing a milestone or a metric. |
| `ScaleDecision` | The government's decision. One per pilot. |

There is exactly one pilot model. An earlier design split a running pilot from a
closed "corpus record", which meant closing a pilot required copying it and left
two rows that could disagree. Here a closed pilot simply has `status = CLOSED`,
and the historical corpus is a *query* rather than a table — closing a pilot
makes it evidence for the next department with no copy step.

`PilotMetric.achievedValue` stays null until the measurement exists. There is no
default of zero, because a zero would read as "no improvement" when it means
"not yet measured".

`PilotMetric.method` is required. A number without a stated measurement method is
not a KPI — it is an assertion, and the independent validation the problem
statement asks for has nothing to check it against.

### Documents and retrieval

| Model | Purpose |
|---|---|
| `Document` | A source document the platform can quote. |
| `DocumentChunk` | One retrievable passage, with its embedding. |

`DocumentChunk.embedding` is `vector(768)`, matching **`nomic-embed-text`**.
Prisma cannot express the pgvector type, so it is declared
`Unsupported("vector(768)")` and read through raw SQL. `embeddingModel` records
which model produced the vector, so a corpus embedded by two different models is
detectable rather than silently incomparable.

`pageNumber` and `sectionRef` exist so a quoted passage can be located in the
original document by a human who wants to check it.

### Audit

`AuditEvent` is append-only and has **no foreign keys**. `subjectType`,
`subjectId` and `actorUserId` are plain columns so the trail survives the
deletion of what it describes — an audit log a cascade can erase is not an audit
log, and that is precisely the case where it is most needed.

---

## Provenance

`DataOrigin` mirrors `frontend/src/lib/provenance.ts`, with one addition the
database needs and the frontend does not:

| Value | Means |
|---|---|
| `VERIFIED` | An externally sourced fact. **Must** cite an `EvidenceSource`. |
| `DEMO` | A deliberately constructed scenario, labelled as one. |
| `USER_ENTERED` | A first-party record created by an authenticated user. |

`USER_ENTERED` exists so a department's own challenge is not forced to pretend it
was sourced externally.

The frontend's `pending` state has no counterpart here on purpose: an absent fact
is a NULL column or a missing row, which is exactly what `pending` means — a
value that cannot be printed because it does not exist.

### The hazard this guards against

A `DEMO` pilot is structurally identical to a real one. Any aggregate that
forgets to filter turns a constructed scenario into a statistic — *"6 of 11
comparable pilots met target"*, computed partly from something we made up. That
is the same failure as this codebase's former "2,481 startups indexed", except it
arrives looking computed rather than typed.

`origin` is therefore indexed on `Startup`, `Challenge`, `Pilot`,
`FundingRound`, `StartupProgramParticipation` and `Document`, and **repository
methods that feed analytics must take origin as a required argument** — never a
default. Real aggregates exclude `DEMO`.

The UI displays `VERIFIED`, `DEMO SCENARIO` or `USER ENTERED`. There is no
"live" state.

---

## Constraints Prisma cannot express

Hand-written into the migration, and each one negative-tested against the live
database:

```sql
-- A row may only claim VERIFIED if it names its source.
-- Applied to: startups, funding_rounds, government_programs,
--             startup_program_participations, documents
CHECK (origin <> 'VERIFIED' OR "sourceId" IS NOT NULL)

-- Credential shape is per-provider and strict in both directions.
CHECK (
  (provider = 'OLLAMA'
     AND "keyCipher" IS NULL AND "keyNonce" IS NULL AND "keyTag" IS NULL)
  OR
  (provider = 'ANTHROPIC'
     AND "keyCipher" IS NOT NULL AND "keyNonce" IS NOT NULL AND "keyTag" IS NOT NULL)
)

-- Evidence attaches to a milestone or a metric, never both.
CHECK (NOT ("milestoneId" IS NOT NULL AND "metricId" IS NOT NULL))
```

Plus the pgvector extension and the ANN index, neither of which Prisma creates:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE INDEX "document_chunks_embedding_idx"
  ON "document_chunks" USING hnsw ("embedding" vector_cosine_ops);
```

The provenance constraint is the load-bearing one. Without it, `origin =
VERIFIED` is a string any bug can write; with it, the database refuses a verified
fact that cannot name where it came from.

---

## AI credentials

Stored only as AES-256-GCM ciphertext (`keyCipher`, `keyNonce`, `keyTag`), with
the encryption key held in a backend environment secret and never in this
database. The decrypted value is never returned by the API, never logged, and
never reaches the browser. Ollama is local and carries no credential at all.

The per-provider CHECK is strict in both directions because a half-populated
credential is worse than none: a permissive rule would let a hosted connection
save with a nonce but no ciphertext, and fail only at call time.

---

## Data

**The database is empty.** The initial migration creates tables only. No startup,
funding, pilot, KPI, contract, officer, or procurement record has been seeded.

Real data will be imported from authoritative sources — MSInS, Startup India /
SISFS, official programme material — each row landing with an `EvidenceSource`
and a retrieval date. See [`docs/DATA-SOURCES.md`](../DATA-SOURCES.md) for what
is currently verified, what is blocked, and why.

Demo data, when needed for presentation, is marked `DEMO` and named as a
scenario.
