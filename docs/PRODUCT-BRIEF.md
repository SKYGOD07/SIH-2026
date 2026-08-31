# Sarthi — Product Brief & Working Record

> Living document. Everything agreed about the problem statement, the product idea,
> the design direction and the frontend/backend split lives here.
> Last updated: 2026-08-28

---

## 1. The problem statement (verbatim scope)

**Title:** Startup-friendly public procurement mechanism that enables government
departments to identify, pilot, procure and scale innovative solutions from
eligible startups.

**Organisation:** Government of Maharashtra
**Department:** Maharashtra State Innovation Society, Dept. of Skills, Employment,
Entrepreneurship and Innovation
**Category:** Software · **Theme:** Miscellaneous · **Event:** SIH

### Two sides of the pain

| Departments struggle to… | Startups struggle with… |
| --- | --- |
| Formulate outcome-based problem statements | Prior-turnover requirements |
| Discover suitable startups | Prior-experience requirements |
| Evaluate novel technologies | Long sales cycles |
| Structure controlled pilots | Unclear payment milestones |
| Manage IP and data | No visibility of departmental demand |
| Measure pilot results | |
| Transition pilots into compliant procurement | |

### The expected solution — the ten stages the PS explicitly names

1. Challenge identification
2. Startup discovery
3. Eligibility screening
4. Expert evaluation
5. **Sandbox or pilot design**
6. Milestone-based contracting
7. Performance measurement
8. Payment
9. Independent validation
10. Scale-up decisions

Plus **standard templates** for: problem statements, evaluation criteria, pilot
agreements, data/IP clauses, cybersecurity, risk management, procurement pathways.
Plus optional **integrations** with recognised startup databases and government
e-marketplaces (GeM).

**Expected outcomes:** faster discovery and testing · higher-quality pilots ·
reduced departmental risk · timely startup payments · evidence-based procurement
decisions · successful scaling across departments/districts.

---

## 2. Your idea, assessed

### The idea as stated

> A RAG-enabled sandbox/simulation environment for the pilot stage. A startup's
> idea is run against parameters derived from five years of past government
> startup investment (successes *and* failures), market trends of the last five
> years, and citizen/country requirements. The simulation informs whether the
> idea is worth piloting.

### Rating: **7 / 10 as stated — 9 / 10 with the reframe in §2.3**

Strong instinct, aimed at the right stage, but with three real problems.

### 2.1 What is right about it

- **The PS literally names "sandbox or pilot design" as stage 5.** You are not
  inventing scope; you are targeting a named deliverable. Good.
- **"Reduced departmental risk" is a named expected outcome.** De-risking a pilot
  *before* budget is committed is the single most direct way to deliver it.
- **Learning from failures is genuinely differentiating.** Most teams will build a
  portal. Treating a failed pilot as reusable institutional evidence is the kind
  of idea that wins on originality, and it maps onto "independent validation" and
  "evidence-based procurement decisions".
- **RAG is the right technique for the retrieval half.** Eligibility, IP and
  cybersecurity questions must be answered *with citations to clauses*. That is
  exactly what retrieval is for, and it keeps a human as the decision-maker.

### 2.2 What is wrong or risky — be honest about these before the demo

**Problem 1 — Scope. This is one stage out of ten.**
The PS asks for an *end-to-end mechanism*. If the build is only a simulator, it
answers roughly 15% of the expected-solution list. Judges score against that list.
The simulator should be the *centrepiece* of a complete pathway, not the whole
submission.

**Problem 2 — "Sandbox" does not mean "simulation" in procurement language.**
In this context a sandbox is a *controlled real-world deployment under relaxed
rules* — the RBI regulatory-sandbox sense: real users, limited scope, temporary
regulatory relaxation. It is not a computer simulation. Your simulator is a
valuable **pre-pilot de-risking tool**, but it cannot replace the pilot, and
calling it "the sandbox" will read as a misreading of the PS. Name it separately.

**Problem 3 — The predictive claim is too strong, and the data won't support it.**
Two separate issues:

- *Data availability.* Five years of structured government startup-investment
  outcomes is not published as a clean dataset. Startup India, GeM and state
  innovation societies publish fragments. Claiming otherwise invites the one
  question you cannot answer. Be upfront: this is a **designed schema**, populated
  with what is public plus clearly-labelled synthetic data.
- *Validity.* Market trends predict **company survival**. They do not predict
  **solution efficacy**. Whether HydroAI reduces non-revenue water in Pune depends
  on the pipe network, sensor density and repair-crew capacity — not on the AgriTech
  funding climate. Conflating the two is the biggest conceptual flaw in the idea
  as stated.

**Problem 4 — Legal.** A department cannot base a procurement decision on a
simulation. It can use one to *shortlist*, to *design the pilot*, or to *set
preconditions*. Position it as advisory or the trust story collapses.

### 2.3 The reframe — keeps your idea, fixes the flaws

Rename and reposition it as the **Pilot Design & Risk Simulator**, sitting between
**EVALUATE (04)** and **PILOT (05)**. It does not predict success. It does three
defensible things, all directly supported by historical data:

1. **Pilot design assistant.**
   Recommends scope, duration, sample size, milestone split and success thresholds
   based on what comparable past pilots actually needed.
   *Defensible because it is descriptive statistics over prior pilots, not prophecy.*

2. **Risk register generator.**
   Surfaces failure modes observed in comparable pilots and converts them into
   preconditions on the challenge.
   > "6 of 9 comparable vision-based pilots missed target due to sensor coverage
   > below 80%. → Precondition added: minimum 80% coverage before target is
   > contractable."
   *This is the failure-registry concept made operational. It is the strongest
   part of the whole idea.*

3. **Confidence bands, not verdicts.**
   Never "this will succeed". Instead:
   > "Pilots with this profile met target in 6 of 11 cases. The three variables
   > that most changed the outcome were baseline data quality, ward count, and
   > whether a 30-day baseline period preceded the intervention."
   With explicit uncertainty and every comparable pilot cited and clickable.

**Why this is stronger:** it uses the same data and the same RAG machinery, it
produces something a government officer can actually act on and defend in an
audit, and it never claims authority it does not have. It also slots cleanly into
the pathway instead of replacing it.

### 2.4 What to say when asked "where does the data come from?"

Prepared answer:
> "The schema is designed to ingest departmental pilot records, Startup India and
> state innovation society registries, and GeM transaction history. For this
> prototype the corpus is clearly marked as simulated, because the historical
> record is not yet published in structured form — which is itself part of the
> problem this platform solves. Every pilot the platform runs adds a real record."

That answer turns a weakness into a feature. Use it.

---

## 3. Product architecture — the ten stages

Frontend is being built now. Backend comes after. Each stage below notes what the
frontend represents and what is reserved for backend.

| # | Stage | Frontend (now) | Backend (later) |
| --- | --- | --- | --- |
| 01 | Define | Note → structured challenge, with the parsed span shown for each field | LLM extraction, template library, officer sign-off workflow |
| 02 | Discover | Node field filtering 2,481 → 3 with the rule at each step | Vector search over startup registries, ranking service |
| 03 | Verify | Eligibility answered with cited clauses | RAG over policy corpus, compliance API integrations |
| 04 | Evaluate | Weighted criteria → composite → human panel | Scoring service, panel workflow, decision record |
| — | **Simulate** | **Pilot design + risk register + confidence bands** | **Comparable-pilot retrieval, statistical model, scenario engine** |
| 05 | Pilot | Ward environment changing per milestone | Pilot agreement generation, sandbox provisioning |
| 06 | Measure | Milestone evidence → approval → payment | Evidence store, validation workflow, payment triggers |
| 07 | Procure | Scale / extend / stop, with the basis recorded | Decision record, GeM pathway integration |
| 08 | Scale | Maharashtra network expanding | Multi-department propagation, dossier generation |
| — | Learn | Knowledge graph + failure registry | Graph store, lesson extraction, precondition injection |

### Trust model (non-negotiable, appears throughout the UI)

```
AI ANALYSIS  →  EVIDENCE  →  EXPERT REVIEW  →  GOVERNMENT DECISION
```

AI assists. Evidence supports. Humans decide. The simulator sits in the first box
only.

---

## 4. Design direction

### 4.1 Reference

- `noomoagency.com` — pale gradient ground, enormous light-weight grotesk edge to
  edge, a **few large soft matte 3D forms** intersecting the type, generous space.
- `valentime.noomoagency.com` — warm blush ground, extremely minimal preloader
  (small centred mark + one mono caps label), calm.

### 4.2 What was wrong with the first pass

Observed in the browser, confirmed:

- **Dark and busy.** Near-black ground with ~100 small grey shards read as debris,
  not as a considered object. This is exactly the "random floating cubes" failure.
- **3D competed with type** instead of composing with it.
- **Type bunched to the left**, indentation steps looked arbitrary.
- **Metallic material** — reference is soft, matte, clay/porcelain.
- **Preloader too heavy** — reference is one small mark on a calm ground.

### 4.3 Corrected direction

| | First pass | Corrected |
| --- | --- | --- |
| Ground | Near-black | Warm bone / off-white, dark reserved for 3D moments |
| Type | Large | **Enormous** — edge to edge, light weight, tight leading |
| 3D count | ~100 small shards | **3–6 large forms** |
| Material | Metallic, emissive | Soft matte, porcelain/clay, soft studio light |
| 3D placement | Beside the type | **Intersecting** the type, front and behind |
| Preloader | Full-screen with lifecycle ticker | One centred mark, one label |
| Rhythm | Uniform dark | Light sections with dark punctuation |

### 4.4 3D assets — decision

**Procedural geometry, not downloaded models.** The reference forms are soft
primitives (rounded boxes, blobs, extruded shapes) — they are modelled, not
asset-store downloads, and procedural versions are a few KB against several MB.

If real models are wanted later, the CC0 sources worth using are:

- **Poly Haven** (polyhaven.com) — CC0 HDRIs and models. The HDRI is the one asset
  that genuinely improves this look; procedural lighting approximates it but an
  HDRI is better.
- **Quaternius** (quaternius.com) — CC0 low-poly model packs, good for the ward
  environment.
- **Kenney** (kenney.nl) — CC0 city/infrastructure kits.
- **Sketchfab** — filter licence to CC0 specifically.

A GLTF loading path is worth wiring so a model can be dropped in without a rewrite.

---

## 5. Technical decisions on record

| Decision | Reason |
| --- | --- |
| GSAP + ScrollTrigger owns scroll choreography | Scrubbed, pinned timelines are what it is for |
| Framer Motion owns interface state only | Shared-layout (`layoutId`) has no GSAP equivalent |
| Lenis drives GSAP's ticker | One animation loop; ScrollTrigger reads after Lenis writes |
| Scrub kept low (0.5), Lenis duration 0.85 | Two smoothing layers on one value reads as input lag |
| **No `filter: blur()` in scrubbed timelines** | Re-rasterises viewport-scale type every frame — the main jank source |
| Display type clamps against `svh` as well as `vw` | vw-only sizing overflowed short viewports and hid type under the nav |
| Dark sections are transparent over one fixed backdrop | Opaque sections hid the backdrop and made the page a stack of black boxes |
| 3D scenes lazily mounted, `frameloop="never"` off-screen | Never more than one live WebGL context doing work |
| `distDir` overridable via `NEXT_BUILD_DIR` | A concurrent dev server writing `.next` breaks `next build` |

---

## 6. Environment notes

- A **second process auto-commits to this repo** during sessions and has twice
  introduced merge-conflict markers into `tailwind.config.ts` and `globals.css`.
  Worth tracking down.
- A **second `next dev` runs on port 3000** and races `next build` for `.next`.
  Use `NEXT_BUILD_DIR=.next-verify npx next build` to verify without a collision.

---

## 7. Open questions

1. Is the simulator reframed per §2.3, or kept as a predictive simulation?
2. Which challenge domain is the deep demo — water (current) or something with
   better public historical data?
3. Light-primary palette confirmed, or keep dark with light punctuation?
4. Real CC0 3D models, or procedural throughout?
