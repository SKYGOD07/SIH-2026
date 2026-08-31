# Data sources

What this platform holds, where it came from, and what it does not hold yet.

Last reviewed: **29 August 2026**

---

## The rule

Every figure the product shows is one of exactly three things, and the type
system enforces the distinction — see `frontend/src/lib/provenance.ts`.

| State | Renders as | Means |
|---|---|---|
| `verified` | The figure, plus its source and the date it was read | Read from a named public source |
| `demo` | The figure, plus a **Demo scenario** label | A constructed scenario, deliberately labelled |
| `pending` | An em-dash, plus what will fill it and from where | We do not have this |

`pending` carries no `value` field at all, so there is nothing to print by
accident. That is the point: the failure this guards against is not deliberate
invention, it is a placeholder quietly becoming a fact because a plausible number
was easier to render than an absence.

One distinction is easy to lose and worth stating. A figure published **by** a
programme ("MSInS states 120 winners work with departments") is verified. The
number of those winners **we hold records for** is a different quantity and is
currently zero. Collapsing the two is exactly what produced this codebase's
former "2,481 startups indexed".

---

## Verified — what the product may assert

These are the only figures rendered as fact anywhere in the product. They live in
`frontend/src/data/programs.ts` and `frontend/src/data/sisfsPathway.ts`.

### Maharashtra Startup Week — MSInS

| Fact | Value |
|---|---|
| Startups selected per edition | 24 |
| Maximum work order per winner | ₹15,00,000 |
| Winners working with departments, last 5 editions | 120 |
| Shortlisted to showcase before final selection | ~100 |

Source: MSInS Key Initiatives flyer —
`https://msins.in/assets/MSINS_Info-Flyers_English-D-I7b6l_.pdf`
Programme page — `https://msins.in/MaharashtraStartupMain`

This is the programme that matters most to the problem statement: it issues
government work orders, so its winners are the only population in this state with
demonstrated government delivery experience.

### Startup India Seed Fund Scheme — DPIIT

| Fact | Value |
|---|---|
| Maximum grant — PoC, prototype, product trials | ₹20,00,000 |
| Maximum convertible debentures — market entry, scaling | ₹50,00,000 |
| Maximum age of startup at application | 2 years |
| Minimum Indian promoter shareholding | 51% |
| Cap on prior government monetary support | ₹10,00,000 |

Source: `https://seedfund.startupindia.gov.in/`

### SISFS application pathway — 9 stages

Transcribed from `Startup_Government_Funding_Tracker.xlsx`, supplied for this
project: the nine stages a startup passes through and the documents each requires.
The scheme parameters the tracker states were cross-checked against published
descriptions of the scheme before being reproduced.

Rendered at `/intelligence`. It is the first checkable eligibility content the
platform has — a checklist an officer or a startup can actually work from.

---

## Blocked — and why

I attempted each of these before planning a placeholder.

| Wanted | Attempt | Result |
|---|---|---|
| SISFS portfolio count (the "3,602") | Fetch `seedfund.startupindia.gov.in/startup_portfolio` | JavaScript application. The HTML contains only the string "SISFS" — no listing, no count, no filters |
| MSW winner records — name, edition, sector, department | Fetch `msins.in/StartupWeekwinner` | JavaScript application. The HTML contains only the page title |
| MSW 2018 winners with departments | Fetch the CTIER programme report PDF | 10 MB+, exceeds the fetch size limit |

Both government portals render their listings client-side, so no simple fetch
will ever return the records. This is not a transient failure and will not fix
itself.

---

## Three routes to real data

Unresolved. This is the decision that unblocks everything downstream.

**1. You supply an export.** Fastest and most reliable. A CSV, a spreadsheet, or
pasted text of the MSW winner list and/or a SISFS subset. The schema and ingestion
get built around exactly the shape you provide, and every row lands with a source
and a retrieval date.

**2. Render the portals in a browser and extract.** I drive Chrome to load each
SPA, check whether it calls a JSON API underneath — if it does, that is a clean
ingestion path — and otherwise read the rendered DOM and paginate. Slower, breaks
when either site changes its layout, and it is scraping government portals, so it
needs your explicit go-ahead.

**3. Manual entry of one edition.** The 24 winners of a single Startup Week, keyed
in by hand with their sector and sponsoring department. Small enough to be
accurate, large enough to make matching demonstrable, and every field checkable
against the published directory.

---

## What was removed, and what replaced it

The truth pass emptied every fixture that invented records. The exports and types
remain so consumers compile and so the shape a real record must take stays
documented.

| File | Held | Now |
|---|---|---|
| `data/challenges.ts` | 6 departmental challenges with budgets, baselines, targets, application counts | Empty; `DEMO_NOTICE` retained |
| `data/pilots.ts` | 4 pilots, 16 milestones, rupee values, real Pune ward names, outcome deltas | Empty; `PAYMENT_RULE` retained |
| `data/startups.ts` | 8 companies, match scores, funding raised, 40 evidence events, a 2,481 discovery funnel | Empty |
| `data/evidence.ts` | 7 government policy clauses quoted verbatim with fabricated references | Empty; the retrieval principles retained |
| `data/knowledge.ts` | 10 graph nodes asserting contract values and measured improvements, 2 failed pilots, the 24/142/38/21/12 counters | Empty |
| `data/simulation.ts` | 5 invented comparable pilots, risk register, confidence band | **Deleted** — no importer |
| `data/maharashtra.ts` | An adoption run from 1 pilot to 3 districts to 8 departments | `SCALE_STEPS` empty; map geometry retained (stylised, and says so) |
| `data/templates.ts` | 42 worked examples naming PMC officers, ₹15,00,000, report `VAL-3311-04` | Examples removed; fields, guidance and standing clauses retained |
| `lib/api/sarthi.ts` | A complete fabricated snapshot on every fallback | Returns an empty snapshot |
| `lib/console/rail.ts` | An invented officer with invented approval authority, on every console route | States that there is no session |

**Deleted outright**, as dead code carrying fabricated claims:
`services/startupService.ts` and `services/orderService.ts` — which fabricated
statutory registration identifiers (CIN, DPIIT, PAN, GSTIN, Udyam) and SHA-256
"verification hashes"; eleven unused dashboard components; the three chart
components that read the invented snapshot; and `three/StartupNetwork.tsx`.

---

## Two disclosure bugs fixed

**The notice reached one route.** `SiteChrome.tsx` renders `Nav` and `SiteFooter`
only when `pathname === '/'`, so the demonstration notice — which lived in the
footer — never appeared on `/templates`, `/challenges`, `/startups`, `/pilots` or
`/intelligence`. The console shell now carries it on every console route.

**"Live API" was the wrong way round.** The backend serves the same invented seed
records, so a successful call returned `source: 'live'` and the console rendered a
green **Live API** badge. Starting the backend made the product assert *more*
confidently that fabricated records were real. There is now no `live` state: the
honest values are `demonstration` and `unavailable`.

---

## The landing deck

Slides 05–08 walk a worked example — a water-leakage challenge, a shortlist
narrowing from 142 to 3, a suitability breakdown. The walk is the argument and it
is honest. The numbers in it are chosen rather than computed, so each of those
slides now carries an **Illustration — not a measured result** marker.

They become real figures when the matching engine has records to run against.

---

## What is still unwired

- **Prisma.** `backend/prisma/schema.prisma` now holds the Sarthi schema — 18
  models, migrated to Supabase, **all tables empty**. No startup, funding, pilot,
  KPI, contract or procurement row has been seeded. The logistics schema this
  section previously described has been removed entirely.
- **Repositories.** Nothing in Sarthi reads or writes the database yet. The
  schema exists; the persistence layer does not.
- **Storage.** Both repositories are `Map`-backed and constructed at module load
  in `backend/src/sarthi/container.ts`. Every write is lost on restart.
- **The policy corpus.** `rag.service.ts` holds 7 invented clauses. Retrieval is
  keyword scoring, not embeddings; there is no LLM anywhere in the backend.
