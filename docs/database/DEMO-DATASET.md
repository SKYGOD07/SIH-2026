# The demonstration dataset

> How the 500+ synthetic companies are built, what they may and may not be
> called, and how the four *derived* discovery filters get their values.

## What this dataset is

**500+ synthetic startups in the Sarthi demonstration dataset**, spread across a
**demonstration taxonomy based on public-sector innovation domains**.

Every row is `origin = DEMO`. A database CHECK prevents any of it being marked
`VERIFIED`, because verification requires a cited `EvidenceSource` and synthetic
data has none.

## What it must never be called

| Never | Say instead |
|---|---|
| "500 Maharashtra government-funded startups" | "500+ synthetic startups in the Sarthi demonstration dataset" |
| "Last 5 years of Maharashtra Government funding data" | "Demonstration taxonomy based on public-sector innovation domains" |
| "Verified government startups" | "Simulated company records, labelled DEMO" |
| "₹X Cr of government funding" | "Simulated funding disclosure. Not government funding." |

The funding figures are simulated. The programme participations are simulated.
The documents are placeholders with no file behind them. None of it corresponds
to anything real, and none of it may be presented as a government record.

## Running it

```bash
cd backend
npm run demo:dataset          # companies -> evidence -> verify
```

or one phase at a time:

```bash
npm run demo:generate-companies   # the company population
npm run demo:generate-evidence    # participation, funding, dossier
npm run demo:verify               # 36 checks; exits non-zero on failure
```

All three are **deterministic** (seeded PRNG keyed on the company id, never
`Math.random()`) and **idempotent** — a second run reports `0 created,
0 pruned, 0 relabelled` and leaves the row count unchanged.

### Protected companies

`generate-companies.ts` holds a `PROTECTED` set naming every company seeded by
something other than itself: the five rich profiles from `demo.ts`, the ten
field companies from `seed-fields.ts`, and the three team companies it creates
once. Nothing in that set is ever renamed, reconciled or removed.

**`generate-evidence.ts` writes nothing at all against the five team-owned
companies** — CIVORA, HIX, Crop Saver, WaterManager, EnviroPlus. They get no
invented participation, no invented funding round and no placeholder document.
Their dossiers are the real imported packs, and three of them currently hold no
evidence; that is an honest reading, not a gap to be filled.

> Add a company to `PROTECTED` the moment it is seeded anywhere other than by the
> generator. It is enumerated rather than inferred on purpose: an earlier version
> recognised its own output by name shape, which both missed surplus rows and put
> hand-seeded companies at risk.

### The prune step

The generator removes companies it produced under an earlier naming scheme.
Four guards must all hold:

1. `origin = DEMO`
2. not in `PROTECTED`
3. not in the set the current run intends to produce
4. **zero** documents, responses, matches, pilots, participations, funding rounds

Guard 4 is the one that matters. A surplus company that has acquired any history
is left in place and reported, never deleted — a cascade from here would take
responses and matches with it.

## The derived metrics view

Four discovery filters are **not columns on `startups`** and must never become
ones. Each is a reading over related rows that change independently of the
company record, so a stored copy would be correct on the day it was written and
quietly wrong afterwards.

They are computed by the view `startup_derived_metrics`
(`prisma/migrations/20260902021500_startup_derived_metrics`).

| Column | Type | Values |
|---|---|---|
| `startup_id` | uuid | joins `startups.id` |
| `evidence_completeness` | int | 0–100 |
| `government_experience` | text | `NONE` · `PROGRAM` · `WORK_ORDER` · `MULTI_DEPARTMENT` |
| `government_experience_rank` | int | 0–3, matching the order above |
| `funding_stage` | text | `BOOTSTRAPPED` · `GRANT` · `PRE_SEED` · `SEED` · `SERIES_A` · `SERIES_B_PLUS` |
| `funding_stage_rank` | int | 0–5, matching the order above |
| `funding_band` | text | `NONE` · `UNDER_50L` · `50L_2CR` · `2CR_10CR` · `OVER_10CR` |
| `total_funding_raised` | numeric | sum of disclosed rounds |
| `document_count`, `required_doc_categories` | int | dossier size, and how many of six required categories |
| `participation_count`, `work_order_count`, `pilot_count`, `department_count` | int | the counts the experience level is read from |

The `_rank` columns exist so a caller can express "at least SEED" without
re-encoding the ordering at every call site.

### How evidence completeness is computed

Four components, each a count of what is present over what is asked for:

| Component | Weight | Denominator |
|---|---|---|
| Profile | 30 | the 7 required fields (`legalName`, `sector`, `problemSolved`, `solutionSummary`, `technologies`, `capabilities`, `pilotDurationDays`) |
| Dossier | 40 | the 6 required document categories |
| Assurance | 15 | compliance, cybersecurity, data protection — answered at all |
| Pilot | 15 | `pilotDurationDays`, `pilotTeamSummary`, `infrastructureRequirements`, `deploymentRequirements` |

The dossier carries the largest share because it is the only component backed by
an attached artefact rather than by the company's own prose. Nothing is rounded
up: a company that has said nothing reads as empty.

Required document categories, in the order a company realistically produces
them: `CORPORATE_LEGAL`, `KYC`, `FINANCIAL`, `COMPLIANCE`, `TECHNOLOGY`, `PILOT`.

### How government experience is read

| Level | Condition |
|---|---|
| `MULTI_DEPARTMENT` | 2+ distinct departments across participations and pilots |
| `WORK_ORDER` | a participation with `workOrderValue`, or any pilot |
| `PROGRAM` | a participation with no work order |
| `NONE` | neither |

It is a count of structured rows. There is deliberately no "risk score" — a
permanent company-level rating would be read as suitability, which is a property
of a (challenge, startup) pair and lives on `StartupMatch`.

### Querying it

The view is not in the Prisma schema — Prisma cannot express a view without the
`views` preview feature, and the ordering columns make raw SQL clearer anyway.
Read it with `$queryRaw`:

```ts
const derived = await prisma.$queryRaw<{ startup_id: string; evidence_completeness: number }[]>`
  SELECT startup_id, evidence_completeness, government_experience_rank, funding_stage_rank, funding_band
    FROM startup_derived_metrics
   WHERE evidence_completeness      >= ${minEvidence}
     AND government_experience_rank >= ${minGovernmentExperienceRank}
     AND funding_stage_rank         >= ${minFundingStageRank}
`;
```

then intersect the returned ids with the Prisma `where` for the eleven column
filters (`id: { in: ids }`). At demonstration scale the view is one cheap query
over 515 rows. If the population ever reaches the tens of thousands, the next
step is a covering index on the underlying tables — not a stored column.

## Distribution as generated

Verified by `npm run demo:verify`, which fails the build if any filter stops
splitting the population.

```
population              515 companies, 25 fields, 0 duplicates, 0 VERIFIED
largest field           water-distribution 6.6%
state                   Maharashtra 52.6%, then 13 other states
government experience   NONE 206 · WORK_ORDER 137 · PROGRAM 110 · MULTI_DEPARTMENT 62
funding stage           SEED 152 · PRE_SEED 107 · SERIES_A 100 · BOOTSTRAPPED 93 · GRANT 44 · SERIES_B_PLUS 19
funding band            UNDER_50L 139 · 2CR_10CR 107 · 50L_2CR 93 · NONE 93 · OVER_10CR 83
related rows            448 with documents · 309 with participation · 640 funding rounds
```

A filter check fails if the column holds fewer than two values, covers less than
90% of companies, or has one value holding more than its allowed share. A
control where almost every row answers the same way looks like it works and never
changes a result, which is worse than not shipping it.

## The simulated programmes

`generate-evidence.ts` creates four programmes, none of which is named after a
real scheme:

| Code | Name |
|---|---|
| `DEMO-SIP` | Simulated State Innovation Programme |
| `DEMO-MPP` | Simulated Municipal Pilot Programme |
| `DEMO-SSS` | Simulated Seed Support Scheme |
| `DEMO-DPP` | Simulated Departmental Procurement Pilot |

Maharashtra Startup Week and SISFS are deliberately **not** used. A `DEMO`
participation citing a real programme asserts that a fictional company won
something a real body actually awards, and no origin label undoes that reading
once it is on a screen. Sponsoring departments are named the same way
("Simulated Water Supply & Sanitation Department").

`investors` is left empty on every generated funding round rather than filled
with the names of real firms.

## The placeholder documents

Generated dossier documents carry `originalPath = demo://dossier/<startupId>/<CATEGORY>`,
`publisher = 'Sarthi demonstration workspace'`, and:

- **no `extractedText`** — nothing was ingested, so retrieval has nothing to
  quote and a RAG answer can never cite a passage invented here
- **no `fileHash`** — there is no file
- a title ending `(simulated placeholder)`

`verify-demo.ts` fails if any of them acquires extractable text or a non-`DEMO`
origin.

## The seven team-owned companies

Five teammates own seven companies. The registry is `backend/scripts/team.ts`,
imported by every script that must treat them differently from the synthetic 500.

| Account | Company | Field | Claim |
|---|---|---|---|
| pathaniqra303@gmail.com | CIVORA | municipal-waste-management | claimed |
| pathaniqra303@gmail.com | HIX | agri-fintech-health | unclaimed |
| sr5937424@gmail.com | Crop Saver | agritech | claimed |
| sr5937424@gmail.com | WaterManager | water-distribution | unclaimed |
| Suhanigoyal856@gmail.com | EnviroPlus | climate-environment | claimed |
| heoric361004@gmail.com | Chalan Solutions | urban-mobility | claimed |
| mohammadhaaris791@gmail.com | Rakshak Innovations | public-safety | claimed |

> **One company per account.** `UserProfile.startupId` is unique in both
> directions, so an account can claim exactly one company. HIX and WaterManager
> stay unclaimed until ownership moves onto `Startup` as a many-to-one relation.
> They are fully profiled and fully visible; only the sign-in link is missing.

### The two promoted companies

`data/heoric361004@gmail.com/` and `data/mohammadhaaris791@gmail.com/` are empty
— no packs, no source material. Rather than invent two more fictions for a
dataset that already holds five hundred, two existing synthetic companies were
promoted: they keep their id, funding history and programme participation, and
gain a full profile and a dossier. Nothing was created and nothing was deleted.

They are in `PROTECTED_LEGAL_NAMES`, so `generate-companies.ts` keeps their name
slot in `targetNames` (the prune leaves them alone) but excludes them from
`reconcile` (their authored profile is never overwritten with generated prose).

### The dossier

```bash
python scripts/parse-team-files.py   # manifest the real files, once
npm run demo:seed-team               # profiles + dossiers + funding
```

**Real files first.** `data/<email>/` holds five documents that were never
ingested. They are registered as themselves — real path, real SHA-256, real size
— keyed on the content hash so a re-run never files a second copy. The two
`.xlsx` files have their text extracted; the three PDFs do not, because this
environment has no PDF parser and "filed, not yet ingested" is the honest state.

**Mock documents fill only the gaps.** The catalogue of 28 requirements comes
from the team's own `WaterManager_Government_Funding_Due_Diligence.xlsx`, which
is the closest thing the project has to a specification of what a department
asks for. A mock document is added only where a company holds nothing in that
category — CIVORA and HIX arrive with 33 real documents each, so most of the
catalogue is skipped for them. A placeholder standing beside a real filing is
worse than no placeholder, because it dilutes the evidence worth reading.

Two rules `verify-demo.ts` enforces:

- **No statutory identifiers.** No CIN, PAN, GSTIN, Udyam or DPIIT number is
  generated, not even a marked-dummy one — a well-formed fake survives being
  copied out of the interface into a real form. The record says which document
  is needed and what it must show.
- **Every mock document opens with `SIMULATED PLACEHOLDER —`**, so a retrieval
  answer that quotes one carries the caveat inside the quotation.

Mock documents live under `demo://team-dossier/`, distinct from the synthetic
population's `demo://dossier/`.

## Sign-in accounts

```bash
npm run demo:seed-accounts     # needs SUPABASE_SECRET_KEY
```

Creates or repairs one Supabase Auth user per teammate, confirms the address,
sets the password and claims the primary company.

**Requires the service role key** (Supabase dashboard → Project Settings → API →
`service_role`) in `backend/.env` as `SUPABASE_SECRET_KEY`. The publishable key
cannot do it: the project has `mailer_autoconfirm` disabled, so an ordinary
signup emails a confirmation link to five real addresses and leaves every account
unverified — which `requireVerifiedEmail` then blocks. `email_confirm: true` on
the admin path sends nothing and produces an account that can sign in at once.

> **The password is `11111111`** — weak on purpose, so five people can sign in
> during a judging session without a reset. Two things follow: these accounts
> must never hold anything that is not simulated, and every one of them must be
> rotated before this repository is made public or this database is pointed at
> anything real. Override with `TEAM_SEED_PASSWORD`.

All five accounts are role `STARTUP` and sign in at `/login/startup`.
