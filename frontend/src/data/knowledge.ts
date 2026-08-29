import type {
  GraphNode,
  GraphEdge,
  FailureRecord,
  PlatformMetric,
  Audience,
  AudienceCapability,
} from '@/types/platform';

/**
 * The knowledge graph, the failure register and the platform counters.
 *
 * Emptied in the truth pass. These previously held ten graph nodes asserting
 * contract values, measured improvements and district counts; two invented
 * failed pilots; and the counter set that produced "24 active challenges" and
 * "142 matched startups".
 *
 * They are populated from pilots actually run through the platform. The shapes
 * stay so the graph, the register and the counters have something to be built
 * against — see docs/DATA-SOURCES.md.
 */

export const GRAPH_NODES: GraphNode[] = [];

export const GRAPH_EDGES: GraphEdge[] = [];

/** The chain a completed pilot leaves behind. Process description. */
export const GRAPH_CHAIN = ['Problem', 'Startup', 'Pilot', 'Result', 'Lesson', 'Future challenge'];

export const FAILURE_RECORDS: FailureRecord[] = [];

export const PLATFORM_METRICS: PlatformMetric[] = [];

export const PIPELINE_STAGES: { label: string; value: number; hint: string }[] = [];

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
