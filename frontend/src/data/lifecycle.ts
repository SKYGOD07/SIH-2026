import type { LifecycleStage, LifecycleStageId } from '@/types/platform';

/**
 * The eight-stage innovation procurement pathway. This is the spine of the
 * whole experience: the scroll progress indicator, the orbital mechanism, the
 * product navigation and the route structure all index into this array.
 */
export const LIFECYCLE: LifecycleStage[] = [
  {
    id: 'define',
    index: '01',
    label: 'Define',
    summary: 'An operational problem becomes a measurable, outcome-based challenge.',
    government: 'States the problem, the baseline and the target outcome.',
    startup: 'Reads a challenge written in outcomes, not product specifications.',
    artifact: 'Problem statement template',
  },
  {
    id: 'discover',
    index: '02',
    label: 'Discover',
    summary: 'Candidate solutions are surfaced from recognised startup databases.',
    government: 'Reviews a ranked, explainable shortlist instead of a vendor list.',
    startup: 'Gains visibility of departmental demand without a sales cycle.',
    artifact: 'Discovery brief',
  },
  {
    id: 'verify',
    index: '03',
    label: 'Verify',
    summary: 'Eligibility, compliance and prior evidence are checked against sources.',
    government: 'Sees every eligibility conclusion tied to a cited clause.',
    startup: 'Clears screening once; the record is reusable across departments.',
    artifact: 'Eligibility screening record',
  },
  {
    id: 'evaluate',
    index: '04',
    label: 'Evaluate',
    summary: 'Experts score proposals against published, weighted criteria.',
    government: 'Panel reviews assisted analysis and records the decision.',
    startup: 'Receives structured, comparable feedback on the proposal.',
    artifact: 'Evaluation framework',
  },
  {
    id: 'pilot',
    index: '05',
    label: 'Pilot',
    summary: 'A controlled sandbox deployment with defined scope and safeguards.',
    government: 'Limits exposure to a bounded scope with agreed exit conditions.',
    startup: 'Works to a signed agreement with data and IP terms settled upfront.',
    artifact: 'Pilot agreement + data/IP clauses',
  },
  {
    id: 'measure',
    index: '06',
    label: 'Measure',
    summary: 'Milestone evidence is filed, validated and paid against.',
    government: 'Releases funds only against verified milestone evidence.',
    startup: 'Gets paid on a schedule tied to delivery, not to invoicing cycles.',
    artifact: 'Milestone validation report',
  },
  {
    id: 'procure',
    index: '07',
    label: 'Procure',
    summary: 'Validated results feed a compliant procurement pathway decision.',
    government: 'Records a scale / extend / stop decision with its evidence base.',
    startup: 'Converts a proven pilot into a procurement route.',
    artifact: 'Procurement pathway note',
  },
  {
    id: 'scale',
    index: '08',
    label: 'Scale',
    summary: 'What worked in one ward is offered to every comparable department.',
    government: 'Reuses proven results instead of re-running the same pilot.',
    startup: 'Expands on evidence already accepted by the state.',
    artifact: 'Scale-up dossier',
  },
];

export const LIFECYCLE_IDS = LIFECYCLE.map((s) => s.id);

export function getStage(id: LifecycleStageId): LifecycleStage {
  const stage = LIFECYCLE.find((s) => s.id === id);
  if (!stage) throw new Error('Unknown lifecycle stage: ' + id);
  return stage;
}

/** The words that scatter and converge in "A problem exists." */
export const LIFECYCLE_WORDS = LIFECYCLE.map((s) => s.label.toUpperCase());
