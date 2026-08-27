/**
 * MahaInnovate platform domain model.
 *
 * Deliberately kept API-shaped: every section of the cinematic landing page and
 * every product route reads from these types, so swapping the demo fixtures in
 * `src/data/*` for a Prisma-backed API is a data-source change, not a rewrite.
 *
 * Lives alongside `src/types/index.ts` (the existing backend transport types)
 * rather than replacing it.
 */

export type LifecycleStageId =
  | 'define'
  | 'discover'
  | 'verify'
  | 'evaluate'
  | 'pilot'
  | 'measure'
  | 'procure'
  | 'scale';

export interface LifecycleStage {
  id: LifecycleStageId;
  /** "01".."08" — used as the display index everywhere. */
  index: string;
  label: string;
  /** One-line description of what the stage does. */
  summary: string;
  /** What the department is accountable for at this stage. */
  government: string;
  /** What the startup is accountable for at this stage. */
  startup: string;
  /** Standard template this stage issues (problem statement, pilot agreement...). */
  artifact: string;
}

/* ------------------------------------------------------------------ */
/* Challenges                                                          */
/* ------------------------------------------------------------------ */

export type ChallengeStatus = 'DRAFT' | 'OPEN' | 'EVALUATION' | 'PILOT' | 'CLOSED';

export interface ChallengeMetric {
  label: string;
  baseline: string;
  target: string;
}

export interface Challenge {
  id: string;
  title: string;
  department: string;
  sector: string;
  /** Rupees. */
  budget: number;
  /** Days. */
  duration: number;
  /** The outcome statement the pilot is contracted against. */
  target: string;
  metrics: string[];
  /** Structured baseline/target pairs used by the KPI visualisations. */
  measurement: ChallengeMetric[];
  /** The original, unstructured departmental note the AI parsed. */
  rawNote: string;
  location: string;
  pilotScope: string;
  status: ChallengeStatus;
  applications: number;
  publishedOn: string;
}

/* ------------------------------------------------------------------ */
/* Startups                                                            */
/* ------------------------------------------------------------------ */

export type ComplianceStatus = 'VERIFIED' | 'IN_REVIEW' | 'ACTION_REQUIRED';

export interface EvidenceEvent {
  year: string;
  label: string;
  detail: string;
  kind: 'founding' | 'funding' | 'deployment' | 'pilot' | 'validated';
}

export interface Startup {
  id: string;
  name: string;
  technologies: string[];
  /** 0-100, produced by the discovery engine against a specific challenge. */
  matchScore: number;
  /** Technology Readiness Level, 1-9. */
  trl: number;
  governmentDeployments: number;
  previousPilots: number;
  /** 0-100 aggregate of past pilot outcomes. Not a funding proxy. */
  pilotSuccessScore: number;
  complianceStatus: ComplianceStatus;
  headquarters: string;
  founded: string;
  /** One signal among many — never presented as a quality score. */
  fundingRaised: number;
  evidence: EvidenceEvent[];
  summary: string;
}

/* ------------------------------------------------------------------ */
/* Pilots                                                              */
/* ------------------------------------------------------------------ */

export type MilestoneStatus = 'LOCKED' | 'IN_PROGRESS' | 'EVIDENCE_SUBMITTED' | 'APPROVED' | 'PAID';

export interface Milestone {
  id: string;
  code: string;
  title: string;
  description: string;
  /** Rupees released on approval. */
  payment: number;
  /** What the startup must file before approval is possible. */
  evidenceRequired: string[];
  status: MilestoneStatus;
  dueOn: string;
}

export interface PilotMetric {
  label: string;
  baseline: number;
  result: number;
  unit: string;
  /** Which way is good — drives colour and arrow direction. */
  direction: 'lower-is-better' | 'higher-is-better';
}

export type PilotStatus = 'DESIGN' | 'RUNNING' | 'VALIDATION' | 'DECIDED';
export type PilotDecision = 'SCALE' | 'EXTEND' | 'STOP' | 'PENDING';

export interface Pilot {
  id: string;
  startupId: string;
  challengeId: string;
  title: string;
  status: PilotStatus;
  milestones: Milestone[];
  metrics: PilotMetric[];
  /** 0-100 independent validation score. */
  score: number;
  decision: PilotDecision;
  wards: string[];
  startedOn: string;
}

/* ------------------------------------------------------------------ */
/* Evidence / retrieval                                                */
/* ------------------------------------------------------------------ */

export type SourceKind =
  | 'policy'
  | 'eligibility'
  | 'agreement'
  | 'cybersecurity'
  | 'ip-data'
  | 'pilot-report'
  | 'evaluation';

export interface EvidenceSource {
  id: string;
  kind: SourceKind;
  title: string;
  reference: string;
  /** The retrieved passage. Shown verbatim, visually separated from AI text. */
  excerpt: string;
  /** 0-1 retrieval relevance. */
  relevance: number;
}

export interface RetrievalAnswer {
  question: string;
  /** AI-written synthesis. Always rendered as assistive, never authoritative. */
  analysis: string;
  /** Ids into `evidenceSources`. */
  sourceIds: string[];
  /** The human role that holds the actual decision. */
  decisionOwner: string;
}

/* ------------------------------------------------------------------ */
/* Evaluation                                                          */
/* ------------------------------------------------------------------ */

export interface EvaluationCriterion {
  label: string;
  /** 0-100 AI-extracted signal strength. */
  score: number;
  /** Relative weight in the composite, 0-1. */
  weight: number;
  basis: string;
}

/* ------------------------------------------------------------------ */
/* Scale / knowledge graph                                             */
/* ------------------------------------------------------------------ */

export interface ScaleStep {
  label: string;
  count: number;
  unit: string;
  /** Indices into the Maharashtra district list that light up at this step. */
  districts: string[];
  note: string;
}

export type GraphNodeKind =
  | 'problem'
  | 'startup'
  | 'pilot'
  | 'result'
  | 'lesson'
  | 'challenge';

export interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  /** Normalised layout position, -1..1 on both axes. */
  x: number;
  y: number;
  meta: { label: string; value: string }[];
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface FailureRecord {
  id: string;
  title: string;
  department: string;
  result: string;
  cause: string;
  lesson: string;
  /** The requirement now baked into every future challenge of this type. */
  ruleAdded: string;
}

/* ------------------------------------------------------------------ */
/* Product surface                                                     */
/* ------------------------------------------------------------------ */

export interface PlatformMetric {
  label: string;
  value: number;
  /** Optional suffix such as "%" or "days". */
  unit?: string;
  hint: string;
}

export type Audience = 'government' | 'startup';

export interface AudienceCapability {
  label: string;
  detail: string;
}
