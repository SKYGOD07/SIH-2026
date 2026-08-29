/**
 * Policy and evidence sources.
 *
 * Emptied in the truth pass. This file previously held seven invented government policy clauses, quoted verbatim with fabricated clause references and relevance scores, invented for a
 * prototype and rendered indistinguishably from departmental records.
 *
 * The exports and their types remain so consumers still compile and so the shape
 * a real record must take is documented. They are populated from
 * ingesting the actual scheme, procurement and policy documents — see docs/DATA-SOURCES.md.
 */

import type { EvidenceSource, SourceKind } from '@/types/platform';

export const SOURCE_LABEL: Record<SourceKind, string> = {
  policy: 'Policy',
  eligibility: 'Eligibility',
  agreement: 'Agreement',
  cybersecurity: 'Cybersecurity',
  'ip-data': 'IP & data',
  report: 'Report',
  evaluation: 'Evaluation',
};

export const EVIDENCE_SOURCES: EvidenceSource[] = [];

export const getSource = (id: string) => EVIDENCE_SOURCES.find((s) => s.id === id);

/**
 * How a retrieved answer must be presented. Not a claim about any document —
 * these are the rules the retrieval layer is held to.
 */
export const TRUST_PRINCIPLE = [
  'Every conclusion cites the clause it came from.',
  'A question with no clause behind it is returned unanswered.',
  'The officer decides; the platform supplies the evidence.',
];
