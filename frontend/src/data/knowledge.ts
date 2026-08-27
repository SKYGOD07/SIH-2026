import type {
  GraphNode,
  GraphEdge,
  FailureRecord,
  PlatformMetric,
  Audience,
  AudienceCapability,
} from '@/types/platform';

/**
 * The innovation knowledge graph. Every completed pilot — including the ones
 * that failed — leaves a node behind, so the next department starts from what
 * the last one learned.
 */

export const GRAPH_NODES: GraphNode[] = [
  {
    id: 'n-problem',
    kind: 'problem',
    label: 'Water loss in distribution mains',
    x: -0.78,
    y: -0.42,
    meta: [
      { label: 'Department', value: 'Municipal Administration' },
      { label: 'Raised by', value: '3 corporations' },
      { label: 'Status', value: 'Addressed' },
    ],
  },
  {
    id: 'n-startup',
    kind: 'startup',
    label: 'HydroAI',
    x: -0.34,
    y: -0.66,
    meta: [
      { label: 'TRL', value: '8' },
      { label: 'Gov deployments', value: '4' },
      { label: 'Compliance', value: 'Verified' },
    ],
  },
  {
    id: 'n-pilot',
    kind: 'pilot',
    label: 'Pune PMC pilot',
    x: 0.02,
    y: -0.28,
    meta: [
      { label: 'Scope', value: '3 wards, 90 days' },
      { label: 'Contract value', value: '₹15L' },
      { label: 'Milestones', value: '4 of 4 evidenced' },
    ],
  },
  {
    id: 'n-result',
    kind: 'result',
    label: '29% water-loss improvement',
    x: 0.42,
    y: -0.58,
    meta: [
      { label: 'Baseline', value: '31%' },
      { label: 'After pilot', value: '22%' },
      { label: 'Validation', value: 'Independent' },
    ],
  },
  {
    id: 'n-lesson-a',
    kind: 'lesson',
    label: 'Acoustic sensing needs pressure baseline',
    x: 0.74,
    y: -0.16,
    meta: [
      { label: 'Source', value: 'Pune PMC pilot' },
      { label: 'Now required', value: '30-day baseline before detection claims' },
    ],
  },
  {
    id: 'n-prior',
    kind: 'pilot',
    label: 'Nashik water pilot (2025)',
    x: -0.68,
    y: 0.12,
    meta: [
      { label: 'Result', value: '26% reduction' },
      { label: 'Duration', value: '120 days' },
      { label: 'Reused as', value: 'Evidence for CH-2601' },
    ],
  },
  {
    id: 'n-failure',
    kind: 'result',
    label: 'AI traffic prediction — target missed',
    x: -0.12,
    y: 0.52,
    meta: [
      { label: 'Result', value: 'Target not achieved' },
      { label: 'Cause', value: 'Insufficient camera coverage' },
      { label: 'Filed', value: 'Failure registry' },
    ],
  },
  {
    id: 'n-lesson-b',
    kind: 'lesson',
    label: 'Minimum 80% sensor coverage',
    x: 0.28,
    y: 0.72,
    meta: [
      { label: 'Derived from', value: 'AI traffic prediction pilot' },
      { label: 'Applied to', value: 'All vision-based challenges' },
    ],
  },
  {
    id: 'n-challenge',
    kind: 'challenge',
    label: 'Next challenge: corridor congestion',
    x: 0.78,
    y: 0.44,
    meta: [
      { label: 'Pre-conditions', value: 'Coverage floor written in' },
      { label: 'Department', value: 'Transport' },
      { label: 'Status', value: 'Draft' },
    ],
  },
  {
    id: 'n-scale',
    kind: 'result',
    label: 'Scaled to 8 districts',
    x: 0.5,
    y: 0.06,
    meta: [
      { label: 'Decision', value: 'Proceed to procurement' },
      { label: 'Basis', value: 'Validated pilot evidence' },
    ],
  },
];

export const GRAPH_EDGES: GraphEdge[] = [
  { from: 'n-problem', to: 'n-startup' },
  { from: 'n-startup', to: 'n-pilot' },
  { from: 'n-pilot', to: 'n-result' },
  { from: 'n-result', to: 'n-lesson-a' },
  { from: 'n-prior', to: 'n-problem' },
  { from: 'n-prior', to: 'n-startup' },
  { from: 'n-result', to: 'n-scale' },
  { from: 'n-lesson-a', to: 'n-scale' },
  { from: 'n-failure', to: 'n-lesson-b' },
  { from: 'n-lesson-b', to: 'n-challenge' },
  { from: 'n-scale', to: 'n-challenge' },
  { from: 'n-pilot', to: 'n-failure' },
];

export const GRAPH_CHAIN = ['Problem', 'Startup', 'Pilot', 'Result', 'Lesson', 'Future challenge'];

/** DEMONSTRATION DATA — a pilot that did not meet its target. */
export const FAILURE_RECORDS: FailureRecord[] = [
  {
    id: 'FR-118',
    title: 'AI Traffic Prediction',
    department: 'Transport',
    result: 'Target not achieved',
    cause: 'Insufficient camera coverage across the corridor',
    lesson: 'Minimum 80% coverage required before prediction targets are contractable',
    ruleAdded: 'Every vision-based challenge now states a coverage floor in the problem statement.',
  },
  {
    id: 'FR-092',
    title: 'Smart Streetlight Fault Detection',
    department: 'Urban Development',
    result: 'Partially achieved',
    cause: 'Fault taxonomy differed between the two participating corporations',
    lesson: 'Shared taxonomy must be agreed before the baseline period opens',
    ruleAdded: 'Multi-body pilots now require a signed common data dictionary at M1.',
  },
];

/* ------------------------------------------------------------------ */
/* Product surface                                                     */
/* ------------------------------------------------------------------ */

export const PLATFORM_METRICS: PlatformMetric[] = [
  { label: 'Active challenges', value: 24, hint: 'Published and open to applications' },
  { label: 'Matched startups', value: 142, hint: 'Surfaced across all open challenges' },
  { label: 'Active pilots', value: 38, hint: 'Under milestone contract' },
  { label: 'Successful pilots', value: 21, hint: 'Independently validated against target' },
  { label: 'Scale-ready', value: 12, hint: 'Cleared for a procurement pathway decision' },
];

export const PIPELINE_STAGES = [
  { label: 'Problem', value: 24, hint: 'Challenges published' },
  { label: 'Applications', value: 142, hint: 'Startups applied' },
  { label: 'Shortlist', value: 46, hint: 'Cleared eligibility screening' },
  { label: 'Pilot', value: 38, hint: 'Under contract' },
  { label: 'Validation', value: 21, hint: 'Evidence validated' },
  { label: 'Scale', value: 12, hint: 'Decision recorded' },
];

export const AUDIENCE_CAPABILITIES: Record<Audience, AudienceCapability[]> = {
  government: [
    { label: 'Create challenges', detail: 'Turn an operational problem into an outcome-based statement with a baseline and a target.' },
    { label: 'Discover startups', detail: 'Search recognised databases and see why each candidate surfaced.' },
    { label: 'Evaluate proposals', detail: 'Score against published weighted criteria with the panel decision on record.' },
    { label: 'Run pilots', detail: 'Contract a bounded sandbox with data, IP and cybersecurity terms settled upfront.' },
    { label: 'Measure outcomes', detail: 'Validate milestone evidence before any payment is released.' },
    { label: 'Scale solutions', detail: 'Convert a validated result into a compliant procurement pathway.' },
  ],
  startup: [
    { label: 'Find challenges', detail: 'See departmental demand directly, without a sales cycle.' },
    { label: 'Check eligibility', detail: 'Screening against the actual clauses, with each conclusion cited.' },
    { label: 'Apply', detail: 'One structured proposal against published criteria — no turnover gate at pilot stage.' },
    { label: 'Track pilot', detail: 'Scope, milestones and approvals visible to both sides at all times.' },
    { label: 'Track milestones', detail: 'Know exactly what evidence unlocks the next stage.' },
    { label: 'Receive payments', detail: 'Payment tied to approved milestone evidence, not to invoicing cycles.' },
    { label: 'Build evidence', detail: 'Every validated result becomes reusable proof for the next department.' },
  ],
};

export const AUDIENCE_LABEL: Record<Audience, string> = {
  government: 'Government',
  startup: 'Startup',
};
