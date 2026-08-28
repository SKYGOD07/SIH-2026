import { PilotRecord, SimulationRequest, ComparablePilot } from '../domain/types';

/**
 * Comparable-pilot scoring.
 *
 * No embedding service. Similarity here is computed from the four features that
 * actually determine whether a prior pilot tells you anything useful about a
 * proposed one: the problem domain, the technology class, the scale of
 * deployment, and how good the baseline measurement was.
 *
 * That is a deliberate choice, not a shortcut. An embedding of the pilot's prose
 * would score "Nashik water pilot" and "Nagpur water pilot" as near-identical
 * regardless of whether one ran 30 days of baseline and the other ran none —
 * which is the single variable that most separates success from failure in this
 * corpus. Features the engine reasons about should be the features retrieval
 * scores on.
 *
 * A vector index would slot in as an additional axis here (semantic similarity
 * of the problem statement) without displacing the rest.
 */

interface Axis {
  name: string;
  weight: number;
  score: (record: PilotRecord, request: SimulationRequest) => number;
}

/** Order-independent overlap of two sets, 0-1. */
function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  const setA = new Set(a);
  const setB = new Set(b);
  let shared = 0;
  setA.forEach((v) => {
    if (setB.has(v)) shared += 1;
  });
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : shared / union;
}

/**
 * Closeness of two magnitudes on a ratio scale, 0-1.
 *
 * Ratio rather than absolute difference, because 2 wards versus 4 wards is a
 * far bigger design difference than 140 vehicles versus 142.
 */
function ratioCloseness(a: number, b: number): number {
  if (a <= 0 || b <= 0) return 0;
  const r = Math.min(a, b) / Math.max(a, b);
  return r;
}

const BASELINE_RANK: Record<string, number> = { NONE: 0, PARTIAL: 1, GOOD: 2 };

export const AXES: Axis[] = [
  {
    name: 'domain',
    weight: 0.4,
    // Domain is the gate. A water pilot tells you little about grievance triage,
    // however similar the technology stack looks.
    score: (r, q) => (r.domain === q.domain ? 1 : 0),
  },
  {
    name: 'technology',
    weight: 0.25,
    score: (r, q) => jaccard(r.technologies, q.technologies),
  },
  {
    name: 'scale',
    weight: 0.2,
    score: (r, q) => ratioCloseness(r.scopeUnits, q.proposed.scopeUnits),
  },
  {
    name: 'baseline quality',
    weight: 0.15,
    // Distance on a three-point ordinal scale, normalised.
    score: (r, q) =>
      1 - Math.abs(BASELINE_RANK[r.baselineQuality] - BASELINE_RANK[q.context.baselineQuality]) / 2,
  },
];

export function scorePilot(record: PilotRecord, request: SimulationRequest) {
  const breakdown = AXES.map((axis) => ({
    axis: axis.name,
    score: Number(axis.score(record, request).toFixed(3)),
    weight: axis.weight,
  }));

  const similarity = breakdown.reduce((sum, b) => sum + b.score * b.weight, 0);
  return { similarity: Number(similarity.toFixed(3)), breakdown };
}

const OUTCOME_NOTE: Record<PilotRecord['outcome'], string> = {
  TARGET_MET: 'Target met',
  PARTIALLY_MET: 'Partially met',
  TARGET_MISSED: 'Target missed',
};

export function toComparable(record: PilotRecord, request: SimulationRequest): ComparablePilot {
  const { similarity, breakdown } = scorePilot(record, request);
  return {
    id: record.id,
    title: record.title,
    department: record.department,
    year: record.year,
    similarity,
    breakdown,
    outcome: record.outcome,
    note: record.note,
  };
}

export { OUTCOME_NOTE };
