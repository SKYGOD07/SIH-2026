import type { Pilot, EvaluationCriterion } from '@/types/platform';

/** DEMONSTRATION DATA — simulated pilot records. */

export const PRIMARY_PILOT_ID = 'PL-3311';

export const PILOTS: Pilot[] = [
  {
    id: PRIMARY_PILOT_ID,
    startupId: 'ST-0417',
    challengeId: 'CH-2601',
    title: 'AI Water Leakage Detection — Pune PMC',
    status: 'VALIDATION',
    score: 90,
    decision: 'SCALE',
    wards: ['Ward 14 — Kothrud', 'Ward 21 — Aundh', 'Ward 33 — Hadapsar'],
    startedOn: '2026-03-04',
    milestones: [
      {
        id: 'M1',
        code: 'M1',
        title: 'Deploy',
        description: 'Sensor nodes installed across the three pilot wards and streaming to the municipal gateway.',
        payment: 300000,
        evidenceRequired: ['Installation register', 'Node connectivity log', 'Site photographs'],
        status: 'PAID',
        dueOn: '2026-03-25',
      },
      {
        id: 'M2',
        code: 'M2',
        title: 'Collect',
        description: 'Thirty days of continuous baseline flow, pressure and acoustic data captured.',
        payment: 400000,
        evidenceRequired: ['Baseline dataset', 'Data quality report', 'Uptime record'],
        status: 'PAID',
        dueOn: '2026-04-24',
      },
      {
        id: 'M3',
        code: 'M3',
        title: 'Validate',
        description: 'Detected leak locations verified against physical excavation by the municipal repair team.',
        payment: 400000,
        evidenceRequired: ['Excavation verification sheet', 'True/false positive analysis'],
        status: 'APPROVED',
        dueOn: '2026-05-20',
      },
      {
        id: 'M4',
        code: 'M4',
        title: 'Report',
        description: 'Independent validation of the outcome metrics against the contracted target.',
        payment: 400000,
        evidenceRequired: ['Independent validation report', 'Cost impact statement'],
        status: 'EVIDENCE_SUBMITTED',
        dueOn: '2026-06-12',
      },
    ],
    metrics: [
      { label: 'Water loss', baseline: 31, result: 22, unit: '%', direction: 'lower-is-better' },
      { label: 'Maintenance cost', baseline: 100, result: 82, unit: ' index', direction: 'lower-is-better' },
      { label: 'Response time', baseline: 100, result: 69, unit: ' index', direction: 'lower-is-better' },
      { label: 'System uptime', baseline: 84, result: 96, unit: '%', direction: 'higher-is-better' },
      { label: 'Citizen satisfaction', baseline: 58, result: 71, unit: ' / 100', direction: 'higher-is-better' },
    ],
  },
  {
    id: 'PL-3312',
    startupId: 'ST-0288',
    challengeId: 'CH-2602',
    title: 'Predictive Maintenance — MSRTC Depots',
    status: 'RUNNING',
    score: 0,
    decision: 'PENDING',
    wards: ['Nashik depot', 'Aurangabad depot', 'Solapur depot'],
    startedOn: '2026-05-18',
    milestones: [
      { id: 'M1', code: 'M1', title: 'Deploy', description: 'Telematics units fitted across 140 vehicles.', payment: 500000, evidenceRequired: ['Fitment register'], status: 'PAID', dueOn: '2026-06-10' },
      { id: 'M2', code: 'M2', title: 'Collect', description: '60 days of CAN-bus and vibration data.', payment: 600000, evidenceRequired: ['Dataset', 'Uptime record'], status: 'IN_PROGRESS', dueOn: '2026-08-09' },
      { id: 'M3', code: 'M3', title: 'Validate', description: 'Predictions checked against workshop findings.', payment: 550000, evidenceRequired: ['Workshop reconciliation'], status: 'LOCKED', dueOn: '2026-09-15' },
      { id: 'M4', code: 'M4', title: 'Report', description: 'Independent validation of breakdown reduction.', payment: 550000, evidenceRequired: ['Validation report'], status: 'LOCKED', dueOn: '2026-10-10' },
    ],
    metrics: [
      { label: 'Unplanned breakdowns', baseline: 18, result: 18, unit: ' / 1000km', direction: 'lower-is-better' },
      { label: 'Vehicle uptime', baseline: 86, result: 86, unit: '%', direction: 'higher-is-better' },
    ],
  },
  {
    id: 'PL-3308',
    startupId: 'ST-0559',
    challengeId: 'CH-2603',
    title: 'Air Quality Micro-Sensing — Chandrapur',
    status: 'DECIDED',
    score: 84,
    decision: 'EXTEND',
    wards: ['Corridor A', 'Corridor B'],
    startedOn: '2025-12-01',
    milestones: [
      { id: 'M1', code: 'M1', title: 'Deploy', description: '48 sensor nodes installed.', payment: 400000, evidenceRequired: ['Installation register'], status: 'PAID', dueOn: '2025-12-20' },
      { id: 'M2', code: 'M2', title: 'Collect', description: '90 days of co-located readings.', payment: 500000, evidenceRequired: ['Dataset'], status: 'PAID', dueOn: '2026-03-20' },
      { id: 'M3', code: 'M3', title: 'Validate', description: 'Drift correction verified against reference stations.', payment: 450000, evidenceRequired: ['Calibration report'], status: 'PAID', dueOn: '2026-04-18' },
      { id: 'M4', code: 'M4', title: 'Report', description: 'Independent accuracy validation.', payment: 450000, evidenceRequired: ['Validation report'], status: 'PAID', dueOn: '2026-05-12' },
    ],
    metrics: [
      { label: 'Attribution accuracy', baseline: 40, result: 89, unit: '%', direction: 'higher-is-better' },
      { label: 'Sensor uptime', baseline: 0, result: 94, unit: '%', direction: 'higher-is-better' },
    ],
  },
  {
    id: 'PL-3290',
    startupId: 'ST-1077',
    challengeId: 'CH-2605',
    title: 'Waste Route Optimisation — Nagpur NMC',
    status: 'DECIDED',
    score: 88,
    decision: 'SCALE',
    wards: ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5', 'Zone 6'],
    startedOn: '2025-09-08',
    milestones: [
      { id: 'M1', code: 'M1', title: 'Deploy', description: 'Route engine integrated with fleet telematics.', payment: 300000, evidenceRequired: ['Integration sign-off'], status: 'PAID', dueOn: '2025-09-28' },
      { id: 'M2', code: 'M2', title: 'Collect', description: '45 days of route adherence data.', payment: 300000, evidenceRequired: ['Adherence report'], status: 'PAID', dueOn: '2025-11-12' },
      { id: 'M3', code: 'M3', title: 'Validate', description: 'Coverage verified against collection point register.', payment: 300000, evidenceRequired: ['Coverage audit'], status: 'PAID', dueOn: '2025-12-06' },
      { id: 'M4', code: 'M4', title: 'Report', description: 'Independent validation of distance and cost impact.', payment: 300000, evidenceRequired: ['Validation report'], status: 'PAID', dueOn: '2026-01-04' },
    ],
    metrics: [
      { label: 'Fleet distance', baseline: 2480, result: 2058, unit: ' km/day', direction: 'lower-is-better' },
      { label: 'Missed pickups', baseline: 4.1, result: 1.8, unit: '%', direction: 'lower-is-better' },
    ],
  },
];

export const getPilot = (id: string) => PILOTS.find((p) => p.id === id);

export const PRIMARY_PILOT = PILOTS[0];

/** Milestones in the payment timeline, with the "evidence unlocks payment" rule. */
export const PAYMENT_RULE = 'Evidence → Approval → Payment';

/**
 * Expert evaluation of the HydroAI proposal.
 * These are AI-extracted signal strengths presented to a human panel —
 * the composite is an input to the panel, never the decision itself.
 */
export const EVALUATION_CRITERIA: EvaluationCriterion[] = [
  { label: 'Technical capability', score: 91, weight: 0.22, basis: 'Acoustic localisation validated on 180 km of comparable mains.' },
  { label: 'Impact', score: 88, weight: 0.2, basis: 'Prior deployment reduced non-revenue water by 26%.' },
  { label: 'Feasibility', score: 85, weight: 0.16, basis: 'No excavation required for detection; fits existing repair workflow.' },
  { label: 'Security', score: 90, weight: 0.16, basis: 'Meets state cybersecurity baseline; data stays in-state.' },
  { label: 'Scalability', score: 92, weight: 0.14, basis: 'Node density scales linearly with network length.' },
  { label: 'Cost', score: 81, weight: 0.12, basis: 'Per-km cost above median; offset by projected loss recovery.' },
];

export const EVALUATION_CHAIN = [
  { step: 'AI recommendation', role: 'Assistive analysis', detail: 'Extracts and scores signals against the published criteria.' },
  { step: 'Human review', role: 'Expert evaluation panel', detail: 'Weighs the analysis, the evidence and factors no model sees.' },
  { step: 'Final decision', role: 'Competent authority', detail: 'Records the decision, the reasons and the dissent.' },
];

/** The three branches available at the procurement decision point. */
export const DECISION_BRANCHES = [
  {
    id: 'scale' as const,
    label: 'Scale',
    detail: 'Target achieved, risk acceptable. Proceed to a compliant procurement pathway.',
    tone: 'validated' as const,
  },
  {
    id: 'extend' as const,
    label: 'Extend pilot',
    detail: 'Direction is right, evidence is thin. Continue under revised scope.',
    tone: 'neutral' as const,
  },
  {
    id: 'stop' as const,
    label: 'Stop',
    detail: 'Target not achieved. Close the pilot and file the lesson to the registry.',
    tone: 'risk' as const,
  },
];

export const DECISION_EVIDENCE = [
  { label: 'Pilot score', value: '90 / 100' },
  { label: 'ROI', value: 'Positive' },
  { label: 'Target', value: 'Achieved' },
  { label: 'Risk', value: 'Acceptable' },
];
