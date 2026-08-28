/**
 * The pathway, mapped one-to-one onto the problem statement.
 *
 * The PS names ten activities the mechanism must cover, seven standard
 * templates it must provide, two integration surfaces it may use, and six
 * outcomes it is judged on. All four lists live here verbatim, so the page can
 * demonstrate coverage rather than assert it — and so nothing in the build
 * drifts away from what was actually asked for.
 */

export type StageId =
  | 'identify'
  | 'discover'
  | 'screen'
  | 'evaluate'
  | 'simulate'
  | 'design'
  | 'contract'
  | 'measure'
  | 'validate'
  | 'scale';

export interface Stage {
  id: StageId;
  index: string;
  label: string;
  /** The PS activity this stage implements, in the PS's own words. */
  psActivity: string;
  /** What the department does here. */
  government: string;
  /** What the startup gets here. */
  startup: string;
  /** The standard template this stage issues, where the PS names one. */
  template?: string;
  /** Set on the one stage that is our addition to the PS pathway. */
  isOurs?: boolean;
}

export const PATHWAY: Stage[] = [
  {
    id: 'identify',
    index: '01',
    label: 'Identify',
    psActivity: 'Challenge identification',
    government:
      'An operational problem becomes an outcome-based statement with a baseline, a target and the metrics it will be judged on.',
    startup: 'Reads a challenge written as an outcome, not as a product specification.',
    template: 'Problem statement template',
  },
  {
    id: 'discover',
    index: '02',
    label: 'Discover',
    psActivity: 'Startup discovery',
    government: 'Searches recognised startup databases and sees why each candidate surfaced.',
    startup: 'Gains visibility of departmental demand without a sales cycle.',
  },
  {
    id: 'screen',
    index: '03',
    label: 'Screen',
    psActivity: 'Eligibility screening',
    government: 'Every eligibility conclusion is tied to the clause it came from.',
    startup:
      'No prior-turnover or prior-experience gate at pilot stage. Cleared once, reusable across departments.',
    template: 'Eligibility criteria template',
  },
  {
    id: 'evaluate',
    index: '04',
    label: 'Evaluate',
    psActivity: 'Expert evaluation',
    government: 'A panel scores against published weighted criteria and records the decision.',
    startup: 'Receives structured, comparable feedback against criteria published in advance.',
    template: 'Evaluation criteria template',
  },
  {
    id: 'simulate',
    index: '05',
    label: 'Simulate',
    psActivity: 'Sandbox or pilot design',
    government:
      'Before any money is committed, the pilot is designed against every comparable pilot the state has already run.',
    startup:
      'Enters a pilot whose scope, duration and thresholds are set from evidence, not from guesswork.',
    template: 'Pilot design brief',
    isOurs: true,
  },
  {
    id: 'design',
    index: '06',
    label: 'Sandbox',
    psActivity: 'Sandbox or pilot design',
    government:
      'A controlled deployment with bounded scope, agreed exit conditions and settled data and IP terms.',
    startup: 'Works to a signed agreement with data, IP and security terms fixed before day one.',
    template: 'Pilot agreement · data/IP clauses · cybersecurity requirements',
  },
  {
    id: 'contract',
    index: '07',
    label: 'Contract',
    psActivity: 'Milestone-based contracting',
    government: 'Funds are committed per milestone, against named deliverables.',
    startup: 'Knows exactly what evidence unlocks each payment before the pilot starts.',
    template: 'Milestone contract template',
  },
  {
    id: 'measure',
    index: '08',
    label: 'Measure & pay',
    psActivity: 'Performance measurement · Payment',
    government: 'Releases each tranche only against validated milestone evidence.',
    startup: 'Paid on delivery, not on invoicing cycles.',
    template: 'Milestone validation report',
  },
  {
    id: 'validate',
    index: '09',
    label: 'Validate',
    psActivity: 'Independent validation',
    government: 'Outcomes verified independently of both the startup and the sponsoring officer.',
    startup: 'A validated result that transfers to the next department as accepted evidence.',
    template: 'Independent validation report',
  },
  {
    id: 'scale',
    index: '10',
    label: 'Scale',
    psActivity: 'Scale-up decisions',
    government:
      'Scale, extend or stop — recorded with its evidence base and a compliant procurement route.',
    startup: 'Converts a proven pilot into a procurement pathway across departments and districts.',
    template: 'Procurement pathway note · risk management plan',
  },
];

/** The seven standard templates the PS requires the mechanism to provide. */
export const TEMPLATES = [
  { name: 'Problem statements', stage: 'Identify', note: 'Outcome, baseline, target, metrics.' },
  { name: 'Evaluation criteria', stage: 'Evaluate', note: 'Weighted, published before applications open.' },
  { name: 'Pilot agreements', stage: 'Sandbox', note: 'Bounded scope, exit conditions, liabilities.' },
  { name: 'Data & IP clauses', stage: 'Sandbox', note: 'Background IP retained; foreground jointly recorded.' },
  { name: 'Cybersecurity requirements', stage: 'Sandbox', note: 'State data residency, logged role-based access.' },
  { name: 'Risk management', stage: 'Scale', note: 'Register generated from prior pilot failures.' },
  { name: 'Procurement pathways', stage: 'Scale', note: 'Route from validated pilot to compliant award.' },
];

/** Integration surfaces the PS names as optional. */
export const INTEGRATIONS = [
  {
    name: 'Recognised startup databases',
    detail: 'Startup India / DPIIT recognition, state innovation society registries.',
    use: 'Discovery and eligibility screening.',
  },
  {
    name: 'Government e-marketplace (GeM)',
    detail: 'Listing and award once a pilot is validated.',
    use: 'The scale-up procurement route.',
  },
];

/** The six outcomes the PS says the mechanism will be judged on. */
export const PS_OUTCOMES = [
  { outcome: 'Faster discovery and testing', how: 'Ranked, explainable shortlists instead of open tenders.' },
  { outcome: 'Higher quality pilots', how: 'Pilot design derived from every comparable pilot already run.' },
  { outcome: 'Reduced departmental risk', how: 'Known failure modes become preconditions before award.' },
  { outcome: 'Timely startup payments', how: 'Payment triggered by validated evidence, not invoicing cycles.' },
  { outcome: 'Evidence-based procurement decisions', how: 'Every decision recorded with the evidence behind it.' },
  { outcome: 'Scaling across departments', how: 'Validated evidence transfers; the pilot is not re-run.' },
];

/** The two-sided problem, in the PS's own framing. */
export const DEPARTMENT_PAINS = [
  'Formulate outcome-based problem statements',
  'Discover suitable startups',
  'Evaluate novel technologies',
  'Structure controlled pilots',
  'Manage intellectual property and data',
  'Measure pilot results',
  'Transition pilots into compliant procurement',
];

export const STARTUP_PAINS = [
  'Prior-turnover requirements',
  'Prior-experience requirements',
  'Long sales cycles',
  'Unclear payment milestones',
  'Limited visibility of departmental demand',
];
