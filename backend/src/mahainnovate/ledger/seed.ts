import { PilotLedger } from '../domain/types';

/**
 * DEMONSTRATION LEDGERS.
 *
 * One pilot part-way through its milestone chain, so the dashboard has a real
 * state to render: two tranches paid, one awaiting departmental validation, one
 * still locked behind it.
 */
export const LEDGER_SEED: PilotLedger[] = [
  {
    pilotId: 'PL-3311',
    contractValue: 1500000,
    milestones: [
      {
        id: 'M1',
        code: 'M1',
        title: 'Deploy',
        description:
          'Sensor nodes installed across the three pilot wards and streaming to the municipal gateway.',
        payment: 300000,
        evidenceRequired: ['Installation register', 'Node connectivity log', 'Site photographs'],
        evidence: [
          { id: 'M1-E1', label: 'Installation register', reference: 'DOC-4411', submittedAt: '2026-03-20T09:12:00.000Z' },
          { id: 'M1-E2', label: 'Node connectivity log', reference: 'DOC-4412', submittedAt: '2026-03-20T09:12:00.000Z' },
          { id: 'M1-E3', label: 'Site photographs', reference: 'DOC-4413', submittedAt: '2026-03-20T09:12:00.000Z' },
        ],
        status: 'PAID',
        dueOn: '2026-03-25',
        approvedBy: 'PMC · Executive Engineer (Water)',
        approvedAt: '2026-03-22T11:00:00.000Z',
        paidAt: '2026-03-28T10:00:00.000Z',
      },
      {
        id: 'M2',
        code: 'M2',
        title: 'Collect',
        description: 'Thirty days of continuous baseline flow, pressure and acoustic data captured.',
        payment: 400000,
        evidenceRequired: ['Baseline dataset', 'Data quality report', 'Uptime record'],
        evidence: [
          { id: 'M2-E1', label: 'Baseline dataset', reference: 'DOC-4520', submittedAt: '2026-04-21T08:00:00.000Z' },
          { id: 'M2-E2', label: 'Data quality report', reference: 'DOC-4521', submittedAt: '2026-04-21T08:00:00.000Z' },
          { id: 'M2-E3', label: 'Uptime record', reference: 'DOC-4522', submittedAt: '2026-04-21T08:00:00.000Z' },
        ],
        status: 'PAID',
        dueOn: '2026-04-24',
        approvedBy: 'PMC · Executive Engineer (Water)',
        approvedAt: '2026-04-23T12:30:00.000Z',
        paidAt: '2026-04-29T10:00:00.000Z',
      },
      {
        id: 'M3',
        code: 'M3',
        title: 'Validate',
        description:
          'Detected leak locations verified against physical excavation by the municipal repair team.',
        payment: 400000,
        evidenceRequired: ['Excavation verification sheet', 'True/false positive analysis'],
        evidence: [
          { id: 'M3-E1', label: 'Excavation verification sheet', reference: 'DOC-4661', submittedAt: '2026-05-18T14:20:00.000Z' },
          { id: 'M3-E2', label: 'True/false positive analysis', reference: 'DOC-4662', submittedAt: '2026-05-18T14:20:00.000Z' },
        ],
        // Filed and waiting on the department — the state the dashboard flags.
        status: 'EVIDENCE_SUBMITTED',
        dueOn: '2026-05-20',
      },
      {
        id: 'M4',
        code: 'M4',
        title: 'Report',
        description:
          'Independent validation of the outcome metrics against the contracted target.',
        payment: 400000,
        evidenceRequired: ['Independent validation report', 'Cost impact statement'],
        evidence: [],
        status: 'LOCKED',
        dueOn: '2026-06-12',
      },
    ],
  },
];
