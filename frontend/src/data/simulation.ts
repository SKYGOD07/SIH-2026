/**
 * The Pilot Design & Risk Simulator.
 *
 * Sits between EVALUATE (04) and PILOT (05). It does not predict whether a
 * solution will work — that claim is not supportable from the available data,
 * and no department could act on it. It does three things that ARE supportable,
 * all of them descriptive statistics over comparable prior pilots:
 *
 *   1. Recommends a pilot design (scope, duration, milestone split, thresholds)
 *   2. Generates a risk register from failure modes observed in comparable pilots
 *   3. Reports a confidence band with the variables that most changed outcomes
 *
 * Every output cites the prior pilots it was derived from. Nothing appears
 * without a source, and the recommendation is explicitly advisory.
 *
 * DEMONSTRATION DATA — the historical corpus is simulated. The schema is what
 * matters: it is shaped to ingest real departmental pilot records, state
 * innovation society registries and GeM transaction history when those exist.
 */

export const SIMULATOR_DISCLAIMER =
  'The simulator informs pilot design. It does not score startups, does not predict success, and produces no procurement decision. Every figure below is derived from the comparable pilots cited beside it.';

/* ------------------------------------------------------------------ */
/* Inputs — what the department and the startup supply                 */
/* ------------------------------------------------------------------ */

export interface SimulationInput {
  key: string;
  label: string;
  value: string;
  /** Where this value came from — proposal, challenge, or departmental record. */
  origin: 'Proposal' | 'Challenge' | 'Department record';
}

export const SIMULATION_INPUTS: SimulationInput[] = [
  { key: 'domain', label: 'Domain', value: 'Water distribution — non-revenue loss', origin: 'Challenge' },
  { key: 'tech', label: 'Technology class', value: 'Acoustic + pressure sensing, IoT', origin: 'Proposal' },
  { key: 'trl', label: 'Technology readiness', value: 'TRL 8', origin: 'Proposal' },
  { key: 'scope', label: 'Proposed scope', value: '3 wards · 92 km of mains', origin: 'Proposal' },
  { key: 'baseline', label: 'Baseline data available', value: '14 months of billing + supply', origin: 'Department record' },
  { key: 'target', label: 'Contracted target', value: '20% reduction in water loss', origin: 'Challenge' },
  { key: 'budget', label: 'Indicative budget', value: '₹15,00,000', origin: 'Challenge' },
];

/* ------------------------------------------------------------------ */
/* Retrieval — the comparable pilots every output is derived from      */
/* ------------------------------------------------------------------ */

export interface ComparablePilot {
  id: string;
  title: string;
  department: string;
  year: string;
  /** 0-1 similarity on domain, technology class, scale and baseline quality. */
  similarity: number;
  outcome: 'Target met' | 'Partially met' | 'Target missed';
  /** The one sentence that made this pilot informative. */
  note: string;
}

export const COMPARABLE_PILOTS: ComparablePilot[] = [
  {
    id: 'PL-2907',
    title: 'Nashik NMC — acoustic leak localisation',
    department: 'Municipal Administration',
    year: '2025',
    similarity: 0.93,
    outcome: 'Target met',
    note: '26% reduction over 120 days. A 30-day baseline capture preceded any detection claim.',
  },
  {
    id: 'PL-2744',
    title: 'Amravati — district-metered-area balance',
    department: 'Municipal Administration',
    year: '2024',
    similarity: 0.86,
    outcome: 'Target met',
    note: '19% reduction. Required meter replacement on 11% of the network before baseline was usable.',
  },
  {
    id: 'PL-2611',
    title: 'Solapur — pressure-transient detection',
    department: 'Water Supply',
    year: '2024',
    similarity: 0.79,
    outcome: 'Partially met',
    note: '12% against a 20% target. Repair crew capacity, not detection, was the binding constraint.',
  },
  {
    id: 'PL-2455',
    title: 'Hubballi — thermal drone survey',
    department: 'Municipal Administration',
    year: '2023',
    similarity: 0.71,
    outcome: 'Target missed',
    note: 'Survey coverage reached 54% of planned length. Monsoon window was not accounted for.',
  },
  {
    id: 'PL-2298',
    title: 'Kolhapur — smart metering pilot',
    department: 'Municipal Administration',
    year: '2023',
    similarity: 0.64,
    outcome: 'Partially met',
    note: 'Consumption data improved; loss attribution did not, because trunk mains were unmetered.',
  },
];

/* ------------------------------------------------------------------ */
/* Output 1 — recommended pilot design                                 */
/* ------------------------------------------------------------------ */

export interface DesignRecommendation {
  field: string;
  proposed: string;
  recommended: string;
  /** Why the recommendation differs, and which pilots support it. */
  rationale: string;
  sources: string[];
  /** Whether the recommendation changes the proposal. */
  changed: boolean;
}

export const DESIGN_RECOMMENDATIONS: DesignRecommendation[] = [
  {
    field: 'Duration',
    proposed: '90 days',
    recommended: '120 days',
    rationale:
      'Both comparable pilots that met target ran a 30-day baseline capture before any detection claim. A 90-day pilot leaves 60 days of measurement, below the 90 observed as sufficient.',
    sources: ['PL-2907', 'PL-2744'],
    changed: true,
  },
  {
    field: 'Scope',
    proposed: '3 wards · 92 km',
    recommended: '3 wards · 92 km',
    rationale:
      'Comparable successful pilots covered 60-140 km. The proposed scope sits inside that band and needs no adjustment.',
    sources: ['PL-2907', 'PL-2744', 'PL-2611'],
    changed: false,
  },
  {
    field: 'Milestone split',
    proposed: '4 × 25%',
    recommended: '20 / 27 / 27 / 26',
    rationale:
      'Deployment carries the least outcome risk and the most cash-flow pressure for the startup. Weighting the later tranches keeps payment tied to evidence without starving delivery.',
    sources: ['PL-2907', 'PL-2298'],
    changed: true,
  },
  {
    field: 'Success threshold',
    proposed: '20% reduction',
    recommended: '20% reduction · 15% floor',
    rationale:
      'One comparable pilot reached 12% and was recorded as a failure despite producing usable infrastructure. A partial-credit floor preserves the evidence rather than discarding it.',
    sources: ['PL-2611'],
    changed: true,
  },
];

/* ------------------------------------------------------------------ */
/* Output 2 — risk register                                            */
/* ------------------------------------------------------------------ */

export interface SimulatedRisk {
  id: string;
  risk: string;
  /** How often this failure mode appeared among comparable pilots. */
  observedIn: string;
  severity: 'High' | 'Medium' | 'Low';
  /** The precondition this risk adds to the challenge. */
  precondition: string;
  sources: string[];
}

export const RISK_REGISTER: SimulatedRisk[] = [
  {
    id: 'R-01',
    risk: 'Repair crew capacity becomes the binding constraint, not detection',
    observedIn: '2 of 5 comparable pilots',
    severity: 'High',
    precondition:
      'Department confirms repair throughput of ≥ 8 excavations per week for the pilot duration, in writing, before M1.',
    sources: ['PL-2611', 'PL-2298'],
  },
  {
    id: 'R-02',
    risk: 'Baseline unusable because trunk mains are unmetered',
    observedIn: '2 of 5 comparable pilots',
    severity: 'High',
    precondition:
      'Bulk meters verified on all trunk inlets to the pilot wards before the baseline period opens.',
    sources: ['PL-2744', 'PL-2298'],
  },
  {
    id: 'R-03',
    risk: 'Monsoon window compresses the effective survey period',
    observedIn: '1 of 5 comparable pilots',
    severity: 'Medium',
    precondition:
      'Pilot calendar excludes June–September, or the duration extends by the overlap.',
    sources: ['PL-2455'],
  },
  {
    id: 'R-04',
    risk: 'Detection coverage falls below the level the target assumes',
    observedIn: '1 of 5 comparable pilots',
    severity: 'Medium',
    precondition:
      'Minimum 80% of planned main length surveyed before any target claim is contractable.',
    sources: ['PL-2455'],
  },
];

/* ------------------------------------------------------------------ */
/* Output 3 — confidence band, not a verdict                           */
/* ------------------------------------------------------------------ */

export const CONFIDENCE = {
  /** Comparable pilots that met their contracted target. */
  met: 2,
  partial: 2,
  missed: 1,
  get total() {
    return this.met + this.partial + this.missed;
  },
  statement:
    'Pilots with this profile met their contracted target in 2 of 5 comparable cases, and partially met it in 2 more.',
  caveat:
    'Five comparable pilots is a small base. This is a band, not a probability, and it describes past pilot design — not this startup.',
};

/** The variables that most separated met from missed, in order of effect. */
export const SENSITIVITY = [
  {
    variable: 'Baseline period length',
    effect: 'Strongest',
    finding: 'Both pilots that met target ran ≥ 30 days of baseline before detection claims.',
    detail: '+30 days',
  },
  {
    variable: 'Repair crew throughput',
    effect: 'Strong',
    finding: 'Detection without repair capacity produced findings but no measurable loss reduction.',
    detail: '≥ 8 / week',
  },
  {
    variable: 'Trunk main metering',
    effect: 'Moderate',
    finding: 'Unmetered inlets made loss attribution impossible regardless of sensor quality.',
    detail: '100% inlets',
  },
  {
    variable: 'Survey coverage',
    effect: 'Moderate',
    finding: 'Coverage below 80% of planned length correlated with missed targets.',
    detail: '≥ 80%',
  },
];

/* ------------------------------------------------------------------ */
/* Backend reservation — what the frontend is standing in for          */
/* ------------------------------------------------------------------ */

export interface BackendCapability {
  id: string;
  title: string;
  summary: string;
  /** What the service consumes. */
  inputs: string[];
  /** What it returns to the frontend. */
  outputs: string[];
  status: 'Frontend represented' | 'Schema defined' | 'Not started';
}

/**
 * Deliberately part of the data model rather than prose in a doc: the landing
 * page states plainly which parts are working software and which are the
 * backend to be built, so the demo never over-claims.
 */
export const BACKEND_PLAN: BackendCapability[] = [
  {
    id: 'BE-01',
    title: 'Pilot corpus & ingestion',
    summary:
      'Structured store of prior pilots — scope, duration, baseline quality, milestones, outcome, cause of failure. The asset the whole simulator depends on.',
    inputs: ['Departmental pilot records', 'State innovation society registries', 'GeM transaction history'],
    outputs: ['Normalised pilot records', 'Outcome and failure-cause taxonomy'],
    status: 'Schema defined',
  },
  {
    id: 'BE-02',
    title: 'Comparable-pilot retrieval',
    summary:
      'Embedding search over the corpus, scored on domain, technology class, scale and baseline quality. Returns the cited set every output is derived from.',
    inputs: ['Challenge parameters', 'Startup proposal', 'Pilot corpus'],
    outputs: ['Ranked comparable pilots with similarity scores'],
    status: 'Not started',
  },
  {
    id: 'BE-03',
    title: 'Design & risk engine',
    summary:
      'Descriptive statistics over the retrieved set — duration bands, milestone weighting, observed failure modes — emitted as recommendations with citations.',
    inputs: ['Comparable pilots', 'Proposed pilot design'],
    outputs: ['Design recommendations', 'Risk register', 'Preconditions'],
    status: 'Not started',
  },
  {
    id: 'BE-04',
    title: 'Policy RAG service',
    summary:
      'Retrieval over procurement policy, eligibility rules, IP/data and cybersecurity clauses. Answers eligibility questions by quoting the clause, never by asserting.',
    inputs: ['Question', 'Policy corpus', 'Startup record'],
    outputs: ['Cited passages', 'Assistive analysis', 'Named decision owner'],
    status: 'Frontend represented',
  },
  {
    id: 'BE-05',
    title: 'Milestone & payment ledger',
    summary:
      'Evidence submission, departmental validation and payment release, in that order. The record that makes payment auditable.',
    inputs: ['Milestone evidence', 'Validation decisions'],
    outputs: ['Approval trail', 'Payment triggers', 'Utilisation record'],
    status: 'Frontend represented',
  },
  {
    id: 'BE-06',
    title: 'Outcome feedback loop',
    summary:
      'Every completed pilot — including failures — writes back into the corpus, so the next simulation is derived from a larger base than this one.',
    inputs: ['Validated pilot outcomes', 'Failure causes'],
    outputs: ['Corpus updates', 'New preconditions on future challenges'],
    status: 'Not started',
  },
];
