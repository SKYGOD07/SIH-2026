# Your Idea, Implemented

**Sarthi — an evidence-driven innovation procurement pathway for the
Government of Maharashtra.**

This document explains what your idea becomes when it is built properly, why each
decision was made, and exactly how it maps onto the problem statement.

---

## 1. Your idea, in one sentence

> Before a government department spends money on a startup pilot, the pilot
> should be designed from the evidence of every comparable pilot the state has
> already run — including the ones that failed.

That is the whole thing. Everything below is engineering around that sentence.

---

## 2. What changed from your original framing, and why

You originally described a **RAG-enabled sandbox that simulates whether a
startup's idea will work**, using five years of government investment data plus
market trends and citizen requirements.

Three things had to change. Each change makes the idea stronger, not smaller.

### Change 1 — It designs pilots. It does not predict success.

**The problem with predicting:** market and funding signals predict *company
survival*. They do not predict *solution efficacy*. Whether an acoustic leak
detector reduces water loss in Pune depends on pipe material, sensor density and
how many excavation crews the corporation can field that month. It does not
depend on the AgriTech funding climate. Conflating those two is the single
weakest point in the original framing, and it is the first thing a technical
judge will press on.

**What it does instead:** three outputs, all of them descriptive statistics over
comparable prior pilots.

| Output | What it answers | Why it holds up |
| --- | --- | --- |
| **Pilot design** | How long, how wide, what milestone split, what threshold? | Directly observed from what comparable pilots needed |
| **Risk register** | What has gone wrong before in pilots like this? | Failure causes are recorded facts, not forecasts |
| **Confidence band** | How often did this profile meet target? | A ratio with its denominator and caveats stated |

None of these require predicting the future. All of them are immediately
actionable by an officer. And critically — **a department can defend every one of
them in an audit**, because each cites the pilots it came from.

### Change 2 — "Sandbox" was renamed, because the PS means something else by it

In procurement language a **sandbox** is a *controlled real-world deployment
under relaxed rules* — the RBI regulatory-sandbox sense. Real users, bounded
scope, temporary regulatory relaxation. It is not a computer simulation.

So the pathway now has **both**, as two distinct stages:

- **05 · Simulate** — your idea. Design the pilot from evidence. *Before* money.
- **06 · Sandbox** — the PS's sandbox. The actual controlled deployment.

This is strictly better than merging them. It shows you understood the PS's
vocabulary, and it gives your contribution its own clearly-labelled place in the
pathway rather than hiding it inside an existing stage.

### Change 3 — Honesty about the data

Five years of structured government startup-investment outcomes **is not
published as a clean dataset.** Startup India, GeM and state innovation societies
publish fragments. Claiming you have it invites the one question you cannot
answer.

**Say this instead:**

> "The schema is designed to ingest departmental pilot records, Startup India and
> state innovation society registries, and GeM transaction history. For this
> prototype the corpus is clearly marked as simulated, because the historical
> record is not yet published in structured form — which is itself part of the
> problem this platform solves. Every pilot the platform runs adds a real record."

That answer turns your weakest point into your strongest one. The absence of the
dataset *is the problem*, and your feedback loop *is the fix*. Use it verbatim.

---

## 3. Why this is the right idea for this problem statement

The PS lists six expected outcomes. Your simulator is the direct mechanism for
three of them, and it is the only part of the pathway that is:

| PS outcome | How the simulator delivers it |
| --- | --- |
| **Higher quality pilots** | Scope, duration and thresholds set from what comparable pilots actually needed |
| **Reduced departmental risk** | Known failure modes become contractual preconditions *before* award |
| **Evidence-based procurement decisions** | Every recommendation cites the prior pilots behind it |

Most teams answering this PS will build a portal — a form to post challenges, a
list to browse startups, a dashboard. That satisfies the PS but differentiates
nothing. **The simulator is the part that a Maharashtra officer would actually
want and cannot get anywhere else**, and it is only possible because the platform
holds the pilot record in the first place.

That is the story: *the pathway generates the data; the data improves the
pathway.*

---

## 4. The complete pathway — ten stages

The PS names ten activities. All ten are implemented, in order. Stage 05 is the
addition.

| # | Stage | PS activity | Template issued |
| --- | --- | --- | --- |
| 01 | Identify | Challenge identification | Problem statement template |
| 02 | Discover | Startup discovery | — |
| 03 | Screen | Eligibility screening | Eligibility criteria template |
| 04 | Evaluate | Expert evaluation | Evaluation criteria template |
| **05** | **Simulate** | **Sandbox or pilot design** | **Pilot design brief** ← *ours* |
| 06 | Sandbox | Sandbox or pilot design | Pilot agreement · data/IP · cybersecurity |
| 07 | Contract | Milestone-based contracting | Milestone contract template |
| 08 | Measure & pay | Performance measurement · Payment | Milestone validation report |
| 09 | Validate | Independent validation | Independent validation report |
| 10 | Scale | Scale-up decisions | Procurement pathway · risk management |

**Seven standard templates** — all named by the PS, all surfaced on the page:
problem statements, evaluation criteria, pilot agreements, data/IP clauses,
cybersecurity requirements, risk management, procurement pathways.

**Two integrations** — both named by the PS: recognised startup databases
(Startup India / DPIIT, state registries) for discovery and screening; GeM for
the scale-up award route.

---

## 5. How the simulator works

```
INPUTS                    RETRIEVAL                 OUTPUTS
challenge parameters  →   embedding search over  →  pilot design
startup proposal          the pilot corpus,         risk register
department records        scored on domain,         confidence band
                          tech class, scale,
                          baseline quality              ↓
                              ↓                    every figure cites
                          5 of 47 pilots           the pilots it came from
                          returned, ranked
```

### The three outputs, concretely

**Pilot design** — compares what was proposed against what comparable pilots
needed, and shows the delta with its reasoning:

> Duration: 90 days → **120 days.** Both comparable pilots that met target ran a
> 30-day baseline capture before any detection claim. A 90-day pilot leaves 60
> days of measurement, below the 90 observed as sufficient. *From PL-2907, PL-2744.*

**Risk register** — converts observed failures into contractual preconditions:

> Repair crew capacity becomes the binding constraint, not detection.
> Observed in 2 of 5 comparable pilots. **Precondition:** department confirms
> repair throughput of ≥ 8 excavations per week, in writing, before M1.

This is the most valuable output in the entire product. It is the difference
between a department discovering a constraint at month four and writing it into
the contract at month zero.

**Confidence band** — a ratio with its caveats attached, never a verdict:

> Pilots with this profile met their contracted target in 2 of 5 comparable
> cases, and partially met it in 2 more.
> *Five comparable pilots is a small base. This is a band, not a probability, and
> it describes past pilot design — not this startup.*

Publishing the caveat as prominently as the number is what makes this credible
rather than a fortune-teller.

### The feedback loop — the part that compounds

Every completed pilot, **including every failure**, writes back into the corpus.
The tenth department to use the platform gets materially better guidance than the
first. That is the defensible long-term claim, and it is the reason the platform
is worth building rather than the simulation being run once in a spreadsheet.

---

## 6. The trust model — non-negotiable

```
AI ANALYSIS  →  EVIDENCE  →  EXPERT REVIEW  →  GOVERNMENT DECISION
```

The simulator lives **only in the first box.** It is visible throughout the UI:

- Match scores are labelled as ranking for human review, never as selection.
- Retrieved policy passages appear verbatim, in a different visual register from
  the AI's synthesis, with the human decision owner named underneath.
- The simulator's disclaimer is on the page, not buried: *"It informs pilot
  design. It does not score startups, does not predict success, and produces no
  procurement decision."*
- Funding raised appears as one evidence event among five, and is deliberately
  **not** a sortable ranking on the startup register — because making it one
  would quietly turn capital raised into the default measure of quality.

A government-facing product that over-claims its AI is a product that never gets
deployed. This is a feature, not a hedge.

---

## 7. The page — eight sections

The earlier build had twenty sections, fourteen of them pinned. Same content,
about a third of the scroll:

| Section | Does what | Pinned |
| --- | --- | --- |
| **Hero** | The thesis | yes |
| **Problem** | Two-sided failure, from the PS | no |
| **Pathway** | All ten stages + seven templates + two integrations | no |
| **Simulator** | Your idea, in full | no |
| **Evidence** | RAG with citations; who decides | yes |
| **Outcome** | Contract → measure → pay → validate → scale | no |
| **Backend plan** | The six services still to build | no |
| **Finale** | Close | yes |

Removed as unnecessary: the word-cloud problem section, the orbital lifecycle
mechanism, five separate single-stage sections, the standalone KPI/decision/scale
screens, the knowledge-graph and failure-registry sections (retained on
`/intelligence`, where they belong), the dashboard preview, the audience toggle
section, and the lifecycle scroll rail.

Three unused 3D scenes were deleted with them.

---

## 8. Honest scope

Stated on the page itself, in the Backend Plan section:

| Service | Status |
| --- | --- |
| Policy RAG service | Frontend represented |
| Milestone & payment ledger | Frontend represented |
| Pilot corpus & ingestion | Schema defined |
| Comparable-pilot retrieval | Not started |
| Design & risk engine | Not started |
| Outcome feedback loop | Not started |

The frontend already reads the exact shapes these services will return, so
building them cannot drift from the contract.

---

## 9. What to say in the demo

1. **Open on the problem.** Procurement built for standard goods, asked to buy
   the unproven. Both sides lose.
2. **Show the pathway.** Ten stages, seven templates, GeM integration. "This is
   the compliant mechanism the PS asks for."
3. **Stop on the simulator.** "Here is the part that does not exist anywhere
   else. Before this department spends ₹15 lakh, we show them what happened the
   last five times Maharashtra tried this — and we turn those failures into
   preconditions in the contract."
4. **Show one risk becoming a precondition.** This is the moment that lands.
5. **State the limits before you are asked.** "It does not predict success and it
   does not choose a vendor. A panel does that. This makes the pilot they approve
   a better-designed one."
6. **Close on the loop.** "Every pilot run on this platform — including every
   failure — makes the next department's guidance better."

---

## 10. Open questions

1. Is water the right deep demo, or is there a domain with better public
   historical data?
2. Should the confidence band be suppressed entirely below a minimum comparable
   count (say, fewer than 5 pilots)? Arguably yes.
3. Do you want the simulator exposed as its own route (`/simulate`) for the
   product surface, or does it live only inside a challenge?
