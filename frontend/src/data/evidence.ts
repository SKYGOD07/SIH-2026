import type { EvidenceSource, RetrievalAnswer, SourceKind } from '@/types/platform';

/**
 * DEMONSTRATION DATA — simulated policy corpus for the retrieval sequence.
 *
 * Every answer the platform surfaces must be traceable to entries in this
 * corpus. The UI renders source excerpts and AI analysis as visually distinct
 * registers so a reader can never mistake the second for the first.
 */

export const SOURCE_LABEL: Record<SourceKind, string> = {
  policy: 'Procurement policy',
  eligibility: 'Eligibility rule',
  agreement: 'Pilot agreement',
  cybersecurity: 'Cybersecurity requirement',
  'ip-data': 'IP & data clause',
  'pilot-report': 'Previous pilot report',
  evaluation: 'Evaluation framework',
};

export const EVIDENCE_SOURCES: EvidenceSource[] = [
  {
    id: 'SRC-P-014',
    kind: 'policy',
    title: 'Innovation Procurement Policy',
    reference: 'Clause 4.2 — Relaxation of prior turnover and experience',
    excerpt:
      'For challenges routed through the innovation pathway, prior turnover and prior supply experience conditions shall not be applied as qualifying criteria at the pilot stage.',
    relevance: 0.94,
  },
  {
    id: 'SRC-E-007',
    kind: 'eligibility',
    title: 'Startup Eligibility Rules',
    reference: 'Rule 3(b) — Recognition and standing',
    excerpt:
      'An entity holding valid DPIIT recognition and no adverse compliance finding in the preceding 24 months is eligible to participate in a controlled pilot.',
    relevance: 0.91,
  },
  {
    id: 'SRC-A-021',
    kind: 'agreement',
    title: 'Standard Pilot Agreement',
    reference: 'Schedule II — Scope limitation',
    excerpt:
      'A controlled pilot is limited to the wards, depots or facilities named in Schedule I, and confers no right to supply beyond that scope.',
    relevance: 0.86,
  },
  {
    id: 'SRC-C-009',
    kind: 'cybersecurity',
    title: 'Departmental Cybersecurity Baseline',
    reference: 'Section 6 — Data residency and access',
    excerpt:
      'Operational data generated during a pilot shall be stored within state-controlled infrastructure, with role-based access logged and auditable.',
    relevance: 0.79,
  },
  {
    id: 'SRC-I-011',
    kind: 'ip-data',
    title: 'IP and Data Clauses',
    reference: 'Clause 9 — Background and foreground IP',
    excerpt:
      'Background IP remains with the originating party. Foreground IP created specifically under the pilot is jointly recorded, with a licence to the department for continued operational use.',
    relevance: 0.74,
  },
  {
    id: 'SRC-R-104',
    kind: 'pilot-report',
    title: 'Nashik Water Pilot — Validation Report',
    reference: 'Pilot PL-2907, closed 2025',
    excerpt:
      'Non-revenue water reduced by 26% across two wards over 120 days. Detection latency fell from 9 days to 41 hours. Result independently verified by the municipal engineering wing.',
    relevance: 0.88,
  },
  {
    id: 'SRC-V-002',
    kind: 'evaluation',
    title: 'Evaluation Framework',
    reference: 'Annexure A — Weighted criteria',
    excerpt:
      'Proposals are scored on technical capability, impact, feasibility, security, scalability and cost. Assisted analysis may inform the panel; the panel records the decision.',
    relevance: 0.83,
  },
];

export const getSource = (id: string) => EVIDENCE_SOURCES.find((s) => s.id === id);

/**
 * The worked retrieval example.
 * Note the shape: QUESTION -> RETRIEVAL -> SOURCES -> EVIDENCE -> EXPLANATION,
 * with the decision explicitly owned by a human role.
 */
export const PRIMARY_RETRIEVAL: RetrievalAnswer = {
  question: 'Can this startup participate in this pilot?',
  analysis:
    'On the retrieved clauses, HydroAI appears eligible for a controlled pilot: DPIIT recognition is current and no adverse compliance finding is on record, and the turnover and prior-experience conditions are relaxed for this pathway. Data residency under Section 6 is a condition of award, not a bar to participation.',
  sourceIds: ['SRC-P-014', 'SRC-E-007', 'SRC-C-009'],
  decisionOwner: 'Eligibility determination rests with the department’s competent authority.',
};

/** The staged states of the retrieval animation. */
export const RETRIEVAL_STAGES = [
  { id: 'question', label: 'Question', caption: 'A question is asked in plain language.' },
  { id: 'retrieval', label: 'Retrieval', caption: 'Retrieving evidence…' },
  { id: 'sources', label: 'Source documents', caption: '3 relevant sources found' },
  { id: 'evidence', label: 'Evidence', caption: 'Passages shown verbatim, with citations.' },
  { id: 'analysis', label: 'AI explanation', caption: 'Analysis drawn only from the cited passages.' },
] as const;

/** Documents that drift through the retrieval mechanism in the 3D scene. */
export const DOCUMENT_SHELF: { kind: SourceKind; title: string }[] = [
  { kind: 'policy', title: 'Procurement policy' },
  { kind: 'eligibility', title: 'Eligibility rules' },
  { kind: 'agreement', title: 'Pilot agreement' },
  { kind: 'cybersecurity', title: 'Cybersecurity baseline' },
  { kind: 'ip-data', title: 'IP & data clauses' },
  { kind: 'pilot-report', title: 'Previous pilot reports' },
  { kind: 'evaluation', title: 'Evaluation framework' },
];

export const TRUST_PRINCIPLE = [
  { term: 'AI', definition: 'assists.' },
  { term: 'Evidence', definition: 'supports.' },
  { term: 'Humans', definition: 'decide.' },
];
