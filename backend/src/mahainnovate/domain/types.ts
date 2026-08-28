/**
 * MahaInnovate domain model.
 *
 * The shapes here are the contract the frontend already reads against
 * (`frontend/src/data/simulation.ts`). Keeping them identical is deliberate:
 * the frontend was built first against demonstration fixtures, so when these
 * services replace those fixtures nothing in the UI has to change.
 *
 * One rule governs every type in this file: no field asserts a prediction.
 * Everything the simulator emits is a description of prior pilots, and every
 * emitted value carries the pilot ids it was derived from.
 */

/* ------------------------------------------------------------------ */
/* The corpus — what the state has already run                         */
/* ------------------------------------------------------------------ */

export type PilotOutcome = 'TARGET_MET' | 'PARTIALLY_MET' | 'TARGET_MISSED';

/** How trustworthy the baseline measurement was before the pilot began. */
export type BaselineQuality = 'NONE' | 'PARTIAL' | 'GOOD';

/**
 * One completed pilot, normalised.
 *
 * This is the asset the whole simulator depends on. Every field exists because
 * some recommendation is derived from it — `baselineDays` drives the duration
 * recommendation, `failureCauses` drives the risk register, `outcome` drives
 * the confidence band.
 */
export interface PilotRecord {
  id: string;
  title: string;
  department: string;
  /** Problem domain, e.g. 'water-distribution'. Primary similarity axis. */
  domain: string;
  /** Technology classes the solution used, e.g. ['acoustic-sensing', 'iot']. */
  technologies: string[];
  year: string;

  /* --- how it was designed --- */
  /** Total contracted length in days. */
  durationDays: number;
  /** Days of baseline capture before any outcome claim was contractable. */
  baselineDays: number;
  baselineQuality: BaselineQuality;
  /** Scale of deployment — wards, depots, corridors. Unit is domain-specific. */
  scopeUnits: number;
  scopeUnitLabel: string;
  /** Contract value in rupees. */
  contractValue: number;
  /** Milestone split as fractions of the contract value; must sum to 1. */
  milestoneSplit: number[];

  /* --- what happened --- */
  outcome: PilotOutcome;
  /** Target as contracted, e.g. 20 for "20% reduction". */
  targetValue: number;
  /** What was actually achieved, in the same unit as `targetValue`. */
  achievedValue: number;
  /** Machine-readable causes, drawn from a controlled vocabulary. */
  failureCauses: FailureCause[];
  /** The one sentence that makes this pilot informative to a reader. */
  note: string;
}

/**
 * Controlled vocabulary for what went wrong.
 *
 * Free text would make the risk register unaggregatable — "we could not dig"
 * and "no excavation crew" are the same finding and must count as one. Every
 * cause added here must also be given a `RISK_LIBRARY` entry.
 */
export type FailureCause =
  | 'INSUFFICIENT_BASELINE'
  | 'DELIVERY_CAPACITY'
  | 'COVERAGE_SHORTFALL'
  | 'DATA_QUALITY'
  | 'SEASONAL_WINDOW'
  | 'INTEGRATION_GAP'
  | 'SCOPE_TOO_WIDE'
  | 'TAXONOMY_MISMATCH';

/* ------------------------------------------------------------------ */
/* Simulator input                                                     */
/* ------------------------------------------------------------------ */

/** The proposed pilot the department is considering funding. */
export interface SimulationRequest {
  challengeId: string;
  domain: string;
  technologies: string[];
  /** Proposed design, as drafted. The simulator compares against this. */
  proposed: {
    durationDays: number;
    baselineDays: number;
    scopeUnits: number;
    scopeUnitLabel: string;
    contractValue: number;
    milestoneSplit: number[];
    targetValue: number;
  };
  /** What the department already has, which constrains what is achievable. */
  context: {
    baselineQuality: BaselineQuality;
    /** Months the pilot calendar would overlap the monsoon, if known. */
    monsoonOverlapMonths?: number;
  };
}

/* ------------------------------------------------------------------ */
/* Simulator output                                                    */
/* ------------------------------------------------------------------ */

/** A prior pilot returned by retrieval, with why it was returned. */
export interface ComparablePilot {
  id: string;
  title: string;
  department: string;
  year: string;
  /** 0-1 overall similarity. */
  similarity: number;
  /** Per-axis breakdown, so a reader can see what made it comparable. */
  breakdown: { axis: string; score: number; weight: number }[];
  outcome: PilotOutcome;
  note: string;
}

export interface DesignRecommendation {
  field: string;
  proposed: string;
  recommended: string;
  /** Why it differs. Written to be readable in an audit file. */
  rationale: string;
  /** Pilot ids this was derived from. Never empty. */
  sources: string[];
  changed: boolean;
}

export type RiskSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SimulatedRisk {
  id: string;
  cause: FailureCause;
  risk: string;
  /** Human-readable frequency, e.g. "2 of 5 comparable pilots". */
  observedIn: string;
  observedCount: number;
  comparableCount: number;
  severity: RiskSeverity;
  /** The condition this adds to the challenge before award. */
  precondition: string;
  sources: string[];
}

export interface ConfidenceBand {
  met: number;
  partial: number;
  missed: number;
  total: number;
  statement: string;
  /** Always present. The caveat is not optional. */
  caveat: string;
  /**
   * True when the comparable set is too small to say anything useful. The API
   * still returns the band, but flagged, so the UI can suppress the number
   * rather than dress up noise as a finding.
   */
  belowReportingThreshold: boolean;
}

export interface SensitivityFinding {
  variable: string;
  effect: 'Strongest' | 'Strong' | 'Moderate' | 'Weak';
  finding: string;
  /** The threshold observed to separate met from missed. */
  detail: string;
  sources: string[];
}

/** Everything the simulator returns for one proposed pilot. */
export interface SimulationResult {
  challengeId: string;
  generatedAt: string;
  comparables: ComparablePilot[];
  /** Total corpus size the comparables were drawn from. */
  corpusSize: number;
  design: DesignRecommendation[];
  risks: SimulatedRisk[];
  confidence: ConfidenceBand;
  sensitivity: SensitivityFinding[];
  /** Stated on every response so the boundary travels with the data. */
  disclaimer: string;
}

/* ------------------------------------------------------------------ */
/* Policy retrieval (RAG)                                              */
/* ------------------------------------------------------------------ */

export type SourceKind =
  | 'policy'
  | 'eligibility'
  | 'agreement'
  | 'cybersecurity'
  | 'ip-data'
  | 'pilot-report'
  | 'evaluation';

export interface PolicyClause {
  id: string;
  kind: SourceKind;
  title: string;
  /** Clause or section reference, cited verbatim in the answer. */
  reference: string;
  /** The passage. Returned unmodified — never paraphrased. */
  excerpt: string;
  /** Retrieval keywords. Stands in for an embedding index. */
  keywords: string[];
}

export interface RetrievedClause extends PolicyClause {
  relevance: number;
}

/**
 * A retrieval answer.
 *
 * The separation of `clauses` from `analysis` is the whole trust model in one
 * type: passages are quoted, the synthesis is labelled as generated, and the
 * human who actually decides is named. A response that returned only prose
 * would be indefensible in a procurement review.
 */
export interface RetrievalAnswer {
  question: string;
  clauses: RetrievedClause[];
  analysis: string;
  decisionOwner: string;
  /** True when nothing relevant was found — the API says so rather than guessing. */
  unanswered: boolean;
}

/* ------------------------------------------------------------------ */
/* Milestone ledger                                                    */
/* ------------------------------------------------------------------ */

export type MilestoneStatus =
  | 'LOCKED'
  | 'IN_PROGRESS'
  | 'EVIDENCE_SUBMITTED'
  | 'APPROVED'
  | 'PAID'
  | 'REJECTED';

export interface MilestoneEvidence {
  id: string;
  label: string;
  submittedAt: string;
  /** Reference to the filed artefact. Storage is out of scope here. */
  reference: string;
}

export interface Milestone {
  id: string;
  code: string;
  title: string;
  description: string;
  /** Rupees released on approval. */
  payment: number;
  /** Evidence that must be filed before approval is possible. */
  evidenceRequired: string[];
  evidence: MilestoneEvidence[];
  status: MilestoneStatus;
  dueOn: string;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  /** Recorded when a submission is rejected, so the trail survives. */
  rejectionReason?: string;
}

export interface PilotLedger {
  pilotId: string;
  contractValue: number;
  milestones: Milestone[];
}

/** One immutable line in the audit trail. */
export interface LedgerEvent {
  at: string;
  pilotId: string;
  milestoneId: string;
  action: 'EVIDENCE_SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID';
  actor: string;
  detail: string;
}
