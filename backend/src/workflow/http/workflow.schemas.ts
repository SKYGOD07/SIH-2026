import { z } from 'zod';

/**
 * Request shapes for the procurement lifecycle.
 *
 * Read these as a whitelist of what a caller may influence. Conspicuously
 * absent from every schema: `userId`, `actorUserId`, `ownerUserId`, `actor`,
 * `role`, `submittedByUserId`, `decidedByUserId`, `approvedBy`. Identity is
 * derived from the verified token, so an attempt to supply it is rejected by
 * shape before any handler runs rather than being quietly ignored.
 */

const tags = z.array(z.string().trim().min(1).max(60)).max(30);

export const createScenarioSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3).max(160),
    description: z.string().trim().min(3).max(2000),
  }),
});

/** The minimum needed to bring a company into existence; the rest is edited. */
export const createCompanySchema = z.object({
  body: z.object({
    legalName: z.string().trim().min(2).max(200),
    sector: z.string().trim().min(2).max(120),
    scenarioId: z.string().uuid().optional(),
  }),
});

export const createChallengeSchema = z.object({
  body: z.object({
    department: z.string().trim().min(2).max(200),
    title: z.string().trim().min(4).max(240),
    problemStatement: z.string().trim().min(20).max(8000),
    domain: z.string().trim().min(2).max(120),
    technologies: tags,
    targetMetric: z.string().trim().min(2).max(200),
    targetValue: z.number().finite().optional(),
    budgetEnvelope: z.number().nonnegative().optional(),
    pilotDurationDays: z.number().int().positive().max(3650).optional(),
    scenarioId: z.string().uuid().optional(),
    
    currentBaseline: z.string().trim().max(4000).optional(),
    desiredOutcome: z.string().trim().max(4000).optional(),
    targetTolerance: z.string().trim().max(1000).optional(),
    measurementMethod: z.string().trim().max(4000).optional(),
    measurementOwner: z.string().trim().max(1000).optional(),
    operatingConstraints: z.string().trim().max(4000).optional(),
    geographicScope: z.string().trim().max(1000).optional(),
    eligibilityRequirements: z.array(z.string().trim().min(1).max(300)).max(30).optional(),
    requiredCapabilities: z.array(z.string().trim().min(1).max(300)).max(30).optional(),
    dataRequirements: z.string().trim().max(4000).optional(),
    cybersecurityRequirements: z.string().trim().max(4000).optional(),
    deploymentRequirements: z.string().trim().max(4000).optional(),
    ipDataConstraints: z.string().trim().max(4000).optional(),
    evaluationCriteria: z.array(z.string().trim().min(1).max(300)).max(30).optional(),
  }),
});

export const updateChallengeSchema = z.object({
  body: z.object({
    department: z.string().trim().min(2).max(200).optional(),
    title: z.string().trim().min(4).max(240).optional(),
    problemStatement: z.string().trim().min(20).max(8000).optional(),
    domain: z.string().trim().min(2).max(120).optional(),
    technologies: tags.optional(),
    targetMetric: z.string().trim().min(2).max(200).optional(),
    targetValue: z.number().finite().optional(),
    budgetEnvelope: z.number().nonnegative().optional(),
    pilotDurationDays: z.number().int().positive().max(3650).optional(),
    
    currentBaseline: z.string().trim().max(4000).optional(),
    desiredOutcome: z.string().trim().max(4000).optional(),
    targetTolerance: z.string().trim().max(1000).optional(),
    measurementMethod: z.string().trim().max(4000).optional(),
    measurementOwner: z.string().trim().max(1000).optional(),
    operatingConstraints: z.string().trim().max(4000).optional(),
    geographicScope: z.string().trim().max(1000).optional(),
    eligibilityRequirements: z.array(z.string().trim().min(1).max(300)).max(30).optional(),
    requiredCapabilities: z.array(z.string().trim().min(1).max(300)).max(30).optional(),
    dataRequirements: z.string().trim().max(4000).optional(),
    cybersecurityRequirements: z.string().trim().max(4000).optional(),
    deploymentRequirements: z.string().trim().max(4000).optional(),
    ipDataConstraints: z.string().trim().max(4000).optional(),
    evaluationCriteria: z.array(z.string().trim().min(1).max(300)).max(30).optional(),
  }),
});

export const respondSchema = z.object({
  body: z.object({
    solutionSummary: z.string().trim().min(20).max(4000),
    capabilities: tags,
    technologies: tags,
    deploymentApproach: z.string().trim().min(10).max(4000),
    expectedResult: z.string().trim().min(10).max(2000),
    pilotApproach: z.string().trim().min(10).max(4000),
    constraints: z.string().trim().max(2000).optional(),
    evidenceReferences: z.array(z.string().trim().min(1).max(300)).max(20).optional(),
    submit: z.boolean().default(true),
  }),
});

export const evaluationSchema = z.object({
  body: z.object({
    criteria: z.record(z.unknown()),
    compositeScore: z.number().min(0).max(100),
    recommendation: z.enum(['PILOT', 'REJECT', 'NEEDS_MORE_EVIDENCE', 'HOLD']),
    comments: z.string().trim().max(4000).optional(),
  }),
});

export const createPilotSchema = z.object({
  body: z.object({
    matchId: z.string().uuid(),
    department: z.string().trim().min(2).max(200),
    location: z.string().trim().max(200).optional(),
    contractValue: z.number().positive(),
    durationDays: z.number().int().positive().max(3650),
    baselineDays: z.number().int().min(0).max(3650),
    baselineQuality: z.enum(['NONE', 'PARTIAL', 'GOOD']),
    scopeUnits: z.number().int().positive(),
    scopeUnitLabel: z.string().trim().min(1).max(60),
    primaryMetric: z.object({
      name: z.string().trim().min(2).max(160),
      unit: z.string().trim().min(1).max(40),
      baselineValue: z.number().finite(),
      targetValue: z.number().finite(),
      method: z.string().trim().min(4).max(500),
    }),
    milestones: z
      .array(
        z.object({
          code: z.string().trim().min(1).max(12),
          title: z.string().trim().min(2).max(200),
          description: z.string().trim().min(4).max(2000),
          payment: z.number().nonnegative(),
          dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
          evidenceRequired: z.array(z.string().trim().min(1).max(200)).min(1).max(12),
        }),
      )
      .min(1)
      .max(12),
  }),
});

export const submitEvidenceSchema = z.object({
  body: z
    .object({
      milestoneId: z.string().uuid().optional(),
      metricId: z.string().uuid().optional(),
      label: z.string().trim().min(2).max(200),
      reference: z.string().trim().min(1).max(300),
    })
    .refine((b) => !(b.milestoneId && b.metricId), {
      message: 'Evidence attaches to a milestone or a metric, not both',
    }),
});

export const reviewEvidenceSchema = z.object({
  body: z.object({
    decision: z.enum(['ACCEPTED', 'REJECTED']),
    reviewNote: z.string().trim().max(2000).optional(),
  }),
});

export const rejectMilestoneSchema = z.object({
  body: z.object({
    reason: z.string().trim().min(4).max(2000),
  }),
});

export const measurementSchema = z.object({
  body: z.object({
    achievedValue: z.number().finite(),
  }),
});

export const closePilotSchema = z.object({
  body: z.object({
    failureCauses: z
      .array(
        z.enum([
          'INSUFFICIENT_BASELINE',
          'DELIVERY_CAPACITY',
          'COVERAGE_SHORTFALL',
          'DATA_QUALITY',
          'SEASONAL_WINDOW',
          'INTEGRATION_GAP',
          'SCOPE_TOO_WIDE',
          'TAXONOMY_MISMATCH',
        ]),
      )
      .max(8)
      .default([]),
  }),
});

export const scaleDecisionSchema = z.object({
  body: z.object({
    decision: z.enum(['SCALE', 'EXTEND_PILOT', 'STOP']),
    rationale: z.string().trim().min(10).max(4000),
  }),
});

/**
 * The company profile a startup writes about itself.
 *
 * Every field optional so the onboarding can save step by step rather than
 * demanding the whole dossier before anything persists. Absent from the shape
 * entirely, and therefore unreachable: `origin`, `sourceId`, `scenarioId`,
 * `procurementReadiness`. A company cannot label its own record as externally
 * sourced, move itself into a workspace, or grade its own procurement standing.
 */
const assurance = z.enum(['NOT_PROVIDED', 'SELF_DECLARED']);

export const companyProfileSchema = z.object({
  body: z.object({
    legalName: z.string().trim().min(2).max(200).optional(),
    displayName: z.string().trim().max(200).nullable().optional(),
    oneLineDescription: z.string().trim().max(300).nullable().optional(),
    description: z.string().trim().max(6000).nullable().optional(),
    foundedYear: z.number().int().min(1900).max(2100).nullable().optional(),
    teamSize: z.number().int().min(1).max(100000).nullable().optional(),
    founderSummary: z.string().trim().max(4000).nullable().optional(),
    keyTeamMembers: z.array(z.object({
      role: z.string().trim().min(1).max(120),
      responsibility: z.string().trim().max(400).optional(),
      experience: z.string().trim().max(400).optional(),
      fullTime: z.boolean().optional(),
    })).max(30).nullable().optional(),

    sector: z.string().trim().min(2).max(120).optional(),
    industry: z.string().trim().max(120).nullable().optional(),
    stage: z.string().trim().max(80).nullable().optional(),
    state: z.string().trim().max(120).nullable().optional(),
    city: z.string().trim().max(120).nullable().optional(),
    website: z.string().url().max(300).nullable().optional(),

    problemSolved: z.string().trim().max(4000).nullable().optional(),
    solutionSummary: z.string().trim().max(4000).nullable().optional(),
    productSummary: z.string().trim().max(4000).nullable().optional(),
    targetUsers: z.string().trim().max(2000).nullable().optional(),
    deploymentModel: z.string().trim().max(500).nullable().optional(),
    geographicCoverage: z.string().trim().max(500).nullable().optional(),
    technologies: tags.optional(),
    capabilities: tags.optional(),

    revenueBand: z.string().trim().max(120).nullable().optional(),
    customerCount: z.number().int().min(0).nullable().optional(),
    deploymentCount: z.number().int().min(0).nullable().optional(),
    commercializationStage: z.string().trim().max(120).nullable().optional(),

    governmentExperienceSummary: z.string().trim().max(4000).nullable().optional(),
    complianceStatus: assurance.optional(),
    cybersecurityStatus: assurance.optional(),
    dataPrivacyStatus: assurance.optional(),
    requiredCertifications: tags.optional(),

    pilotDurationDays: z.number().int().min(1).max(3650).nullable().optional(),
    pilotTeamSummary: z.string().trim().max(2000).nullable().optional(),
    infrastructureRequirements: z.string().trim().max(2000).nullable().optional(),
    implementationDependencies: z.string().trim().max(2000).nullable().optional(),
    deploymentRequirements: z.string().trim().max(2000).nullable().optional(),
    estimatedPilotBudget: z.number().nonnegative().nullable().optional(),
    scalingRequirements: z.string().trim().max(2000).nullable().optional(),
  }),
});

export const claimCompanySchema = z.object({
  body: z.object({ startupId: z.string().uuid() }),
});
