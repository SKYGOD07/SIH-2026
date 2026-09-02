# The Pilot Simulation Engine

**Module** `backend/src/sarthi/pilotsim/` · **Model version** `pilotsim-1.0.0`

---

## What it answers

Sarthi can already rank the startups that *applied* to a challenge (`scoreMatch`,
six weighted axes) and can run a contracted pilot through evidence → approval →
payment. Neither answers the question an officer has before committing public
money:

> If we ran this as a real 90-day pilot, **who would actually deliver — and what
> would stop them?**

The simulation engine answers it by construction. For one challenge it runs a
full synthetic pilot for every eligible company in the cohort, several thousand
times each, then re-ranks the entire cohort under eighty alternative parameter
settings to test whether that ranking survives being wrong.

---

## Read this before reading a number

This is the part that matters most, and it is enforced in code rather than left
to the interface to remember.

A count produced here is a statement **about the model**, never about a company:

> ✅ *"Under this model, Aqua Networks met the target in 2,514 of 3,400 runs."*
> Reproducible. Every parameter traceable to a named stored field.
>
> ❌ *"Aqua Networks has a 74% chance of succeeding."*
> A claim about the world. Nothing here supports it.

So **counts are stored and displayed with their denominators** and are never
divided down to a rate. `runsMetTarget` sits beside `runsTotal` in the database,
in the API response, and on screen. The rate is what invites the misreading, and
the misreading is the one that could mislead a procurement decision.

This is the same discipline `simulator/confidence.ts` already applies to the
retrospective simulator, which reports "met target in 2 of 5 comparable pilots"
and refuses to call it 40%. The two modules measure different things — that one
counts real pilots, this one counts model runs — but they report the same way.

**What this must never be used for:** deciding an award on its own; telling a
company it will or will not succeed; representing simulated figures as pilot
results; comparing runs made under different `modelVersion`s or different
`runsPerCompany` values as though they were the same quantity.

---

## The five phases

### 1 · Screen — `screen.ts`

Every company in the cohort is gated on domain and technology overlap. The bar is
deliberately low — same sector, *or* one shared technology — because the screen's
job is to remove the meaningless (a road-safety company against a water-leakage
challenge), not to pre-judge the ranking.

**Excluded companies keep their row and their reason.** Seeing that 337 of 515
were screened out is information; dropping them silently would make a broken
query indistinguishable from a small eligible cohort.

### 2 · Parameterise — `parameters.ts`

Five numbers per company, each derived from named stored fields, each carrying
provenance so the interface can show *why* a company was modelled as it was.

| Parameter | Meaning | Derived from |
|---|---|---|
| `mobilisationDays` | days before anything is deployed | `procurementReadiness`, `complianceStatus`, `cybersecurityStatus` |
| `coverageRate` | scope units brought online per day | `teamSize`, `deploymentCount` |
| `efficacy` | fraction of the baseline→target gap reachable at full coverage | technologies, capabilities, sector, description — blended with `scoreMatch` where a response exists |
| `dataPenalty` | multiplier on measurement noise | pilot `baselineQuality`, `dataPrivacyStatus` |
| `integrationRisk` | chance rollout freezes on a systems boundary | `implementationDependencies`, `deploymentRequirements` |

**Absence scores pessimistically and is never imputed.** A company that has not
declared its team size gets the floor, not the cohort median. Imputing a
plausible average would let a blank profile outrank a company that filed honest
but modest figures — precisely backwards, and a strategy once anyone noticed.

The assurance ladders are typed as exhaustive `Record`s over the Prisma enums, so
adding a value to `AssuranceStatus` stops the build until someone decides what it
is worth. A loose string map would have scored the new value zero in silence.

> **Why efficacy is not `scoreMatch` alone.** `scoreMatch` is the authoritative
> fit signal, but most of its weight sits on the challenge *response* —
> deployment approach, pilot approach, evidence references. This engine
> simulates the whole cohort, and in a real cohort almost nobody has applied:
> measured on the live data, 176 of 178 eligible companies score an identical
> `0.110`, because every difference between them lives in fields blank for all
> of them. Ranking on that is Monte Carlo noise dressed as analysis. So fit is
> computed from what the whole cohort *has*, and `scoreMatch` is blended back in
> at equal weight wherever a response exists — it is strictly better evidence,
> written by the company about this specific problem.

### 3 · Trajectory — `trajectory.ts`

One run is one seeded walk across the pilot window, stepped **per scope unit per
day** rather than in aggregate:

```
for day in 1..durationDays:
  if day >= integrationFailureDay: freeze rollout
  if day > mobilisationDays and not frozen:
    each dark unit comes online with probability coverageRate / scopeUnits
  effect = Σ_units ramp(day − liveOn[unit]) / scopeUnits × efficacy
  if day in seasonal window: effect ×= (1 − suppression)

achieved = baseline + (target − baseline) × effect
         + gaussian × noiseSigma × dataPenalty × |target − baseline|
```

Per-unit stepping is the point. Coverage shortfall is a per-unit phenomenon, and
a ward brought online on day 78 of a 90-day pilot has had twelve days to show an
effect. Averaging it with a ward live since day 12 would credit it with effect it
never had time to produce — the difference between ranking on capability and
ranking on *deliverable* capability inside the contracted window.

Direction is inferred, never configured: a target below baseline is driven down
(leakage, delay, cost), above it driven up (coverage, uptime, collection). A
stored direction flag could contradict the numbers beside it.

### 4 · Monte Carlo — `montecarlo.ts`

`runsPerCompany` runs, each with a sub-seed derived from
`(runSeed, startupId, i)` — from the company's **id**, never its position, since
row order is not something Postgres promises and a ranking that shifted when the
query planner changed its mind would be indefensible.

The **spread** is the output, not the average. Two companies with the same median
are not equivalent if one lands within a hand's breadth every time and the other
swings from triumph to nothing. So `p10` and `p90` are first-class fields.

Every run is classified by `classifyOutcome` in `backend/src/workflow/outcome.ts`
— **the same function that closes a real pilot.** Extracted from `closePilot`
specifically so the two can never drift: a simulation judged by different
arithmetic would be ranking on something the platform does not contract on.

**Ranking rule:** runs meeting target, then median achieved, then p10. Not a
blended composite — a single number would hide which of the three actually
separated two candidates, and that is the first thing anyone asks.

### 5 · Sensitivity and attribution — `parameters.ts`, `attribute.ts`

The cohort is re-ranked under **80 alternative parameter settings**:

- **Single-parameter** (40): each of the five parameters at ×0.5, 0.6, 0.7, 0.8,
  1.2, 1.3, 1.4, 1.5. The magnitude is the finding — *"the ranking holds until
  delivery capacity is 30% below assumption"* is usable; a lone ±20% test can
  only say "held" or "did not".
- **Pairwise** (40): every pair moved together, each sign combination.
  One-at-a-time sensitivity has a well-known blind spot — it cannot see
  interactions, and being slightly wrong about two things at once is both
  commoner and more damaging than being badly wrong about one.

`rankStability` is the fraction of those settings in which a company stayed
within two places of its base rank. **This is the most defensible number the
engine produces:** a ranking that survives its own assumptions can be defended;
one that doesn't, you need to know about.

Runs that missed are attributed to the binding constraint, in precedence order —
a rollout that froze on an integration boundary is an integration gap even if
coverage also ended low, because the coverage shortfall was the *symptom*. Each
cause maps to a **contractual precondition** taken from `RISK_LIBRARY` in
`simulator/risk.ts`, not written here: two libraries of contract language would
drift, and the drift would surface in a signed document.

> A note on the vocabulary. The schema's `FailureCause` enum has no
> "solution underdelivers" entry. When a run was fully covered, on time,
> integrated and well measured and *still* fell short, it is attributed to
> `SCOPE_TOO_WIDE` rather than `COVERAGE_SHORTFALL`. The reason is the clause:
> a coverage shortfall's precondition is a coverage guarantee, which that pilot
> already satisfied and which would therefore have changed nothing.
> `SCOPE_TOO_WIDE` carries the clause that would actually have helped — bound
> the scope to what the solution can move.

---

## Determinism

Same `(seed, modelVersion, cohort)` ⇒ byte-identical output, on any machine. No
`Math.random()`, no clock read inside the model — everything draws from
`mulberry32` in `backend/src/utils/rng.ts`. A ranking an officer cannot reproduce
is a ranking they cannot defend.

`modelVersion` and the full `assumptions` object are stored **on every run**. A
ranking is meaningless without the parameters that produced it, and a result read
six months later against a changed model would be quietly wrong.

---

## Runtime, and why it takes minutes

The 3–5 minute duration is real computation, not a paced clock. But it was
arrived at honestly, and the reasoning is worth recording:

A plain Monte Carlo over this cohort finishes in **under a second** (178 eligible
× 200 runs × 90 days). Padding that to four minutes would be the "spinner wearing
a costume" that `Radar.tsx` already warns against.

Reaching four minutes by run count alone would need ~16,300 runs per company —
and past roughly two thousand runs of an *identical parameter setting* the
distribution has converged and further runs buy nothing. So the time is spent
where it buys something: **80 different parameter settings**, each a genuinely
different question, with the run count then raised to 3,400 to fill the remainder
(which does still tighten the p10/p90 tails, the one thing more runs improve).

Measured on the development machine: ~4.9 µs per simulated pilot, 178 eligible
companies, 81 passes ⇒ **~245 s and ~49 million simulated pilots.**

`npm run pilotsim:calibrate` re-measures and prints the `runsPerCompany` that
lands in the window on the current machine. The constant is derived, not guessed
— a hardcoded number gives a thirty-second run on one laptop and a twenty-minute
one on another, and the second is a demo that never finishes.

**The run is CPU-bound**, so the orchestrator yields to the event loop between
companies (`setImmediate`). Without that, the four-minute loop would block Node
entirely and the progress endpoint the browser is polling could not answer.
`worker_threads` is the upgrade when two officers ever run one at once.

---

## Storage

| Table | Holds |
|---|---|
| `pilot_simulation_runs` | one execution: seed, model version, assumptions, live progress counters, status |
| `pilot_simulation_results` | one row per company per run — including screened-out companies, with their reason |

Every run is written `origin = DEMO`. A simulation is never a record of something
that happened. Trajectories are stored for the leading 20 companies only; 515
rows each carrying 90 points would dominate the table for data nobody opens.

## API

Mounted at `/api/simulation`, government and admin accounts only.

| Route | Purpose |
|---|---|
| `POST /runs` | start; returns the run id immediately (202) |
| `GET /runs/:id` | progress and live leaderboard — polled at 1 s |
| `GET /runs/:id/results` | the ranked cohort |
| `POST /runs/:id/cancel` | a four-minute job needs a stop button |
| `GET /runs?challengeId=` | past runs |

A run is detached from the request that starts it — a four-minute HTTP request
would die to any proxy timeout between the server and the browser. Cancellation
sets a flag the worker notices at its next progress flush; there is no way to
kill the loop from outside, and marking a run cancelled while it kept burning CPU
would be worse than the short delay.

## Interface

`frontend/src/app/(console)/government/simulate/page.tsx`, with
`CohortGrid` and `TrajectoryPlot` in `components/simulation/`.

The running view is driven entirely by state polled from the run row — the cohort
grid fills as companies are actually simulated, and stops filling if the run
stalls. The phase rail names the parameter setting currently under test, which is
the honest explanation for why this takes minutes. `prefers-reduced-motion` gets
the same information without the pulse.

---

## Verification

```bash
npm run verify:pilotsim     # 25 checks: determinism, reconciliation, calibration
npm run pilotsim:calibrate  # measure throughput, print the tuned run count
npm run demo:simulate       # full headless run, prints the ranked table
npm run demo:simulate -- --runs 150 --passes 4    # fast smoke test
```

`verify:pilotsim` asserts the properties this document claims, rather than
trusting the comments:

- same seed ⇒ identical digest; different seed ⇒ different digest
- `classifyOutcome` agrees with the real pilot-closing rule in both directions
- `met + partial + missed === total` for every company
- `p10 ≤ median ≤ p90`
- a blank profile mobilises at the ceiling and ranks below an otherwise
  identical complete profile
- no company is silently dropped; every exclusion carries a reason
- every parameter setting in the sensitivity plan is distinct, and the plan tests
  interactions rather than only single parameters
- a full run is projected to land inside the 3–5 minute window

## Known limits

- **Scope units are fixed at 3.** Coverage is therefore lumpy — 0, ⅓, ⅔ or 1 —
  and the 0.8 adequacy threshold is effectively "all three wards". Real pilots
  vary; this should come from the challenge once challenges carry a scope.
- **The baseline is fixed at 100** with the target derived from the challenge's
  percentage improvement. Real metrics have real units.
- **Seasonal suppression is disabled by default** (`seasonal: null`). The
  mechanism and its `SEASONAL_WINDOW` attribution exist and are tested, but no
  challenge currently carries a calendar.
- **One run at a time per challenge**, enforced in `startRun`. Two concurrent
  CPU-bound jobs would starve each other and the API with them.
