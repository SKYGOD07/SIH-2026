import { z } from 'zod';

/**
 * Request validation.
 *
 * Every constraint here mirrors one the engines depend on, so a malformed
 * request is refused at the edge with a useful message rather than producing a
 * confident-looking recommendation derived from nonsense.
 */

const baselineQuality = z.enum(['NONE', 'PARTIAL', 'GOOD']);

export const simulateSchema = z.object({
  body: z.object({
    challengeId: z.string().min(1),
    domain: z.string().min(1),
    technologies: z.array(z.string().min(1)).min(1),
    proposed: z.object({
      durationDays: z.number().int().positive(),
      baselineDays: z.number().int().min(0),
      scopeUnits: z.number().positive(),
      scopeUnitLabel: z.string().min(1),
      contractValue: z.number().positive(),
      // The split is a set of fractions of the contract value; anything else
      // would make the milestone recommendation meaningless.
      milestoneSplit: z
        .array(z.number().positive())
        .min(2)
        .refine((s) => Math.abs(s.reduce((a, b) => a + b, 0) - 1) < 0.02, {
          message: 'milestoneSplit must sum to 1',
        }),
      targetValue: z.number().positive(),
    }),
    context: z.object({
      baselineQuality,
      monsoonOverlapMonths: z.number().int().min(0).max(12).optional(),
    }),
  }),
});

export const askSchema = z.object({
  body: z.object({
    question: z.string().min(3).max(500),
    decisionOwner: z.string().max(300).optional(),
  }),
});

const evidenceItem = z.object({
  label: z.string().min(1),
  reference: z.string().min(1),
});

export const submitEvidenceSchema = z.object({
  params: z.object({ pilotId: z.string().min(1), milestoneId: z.string().min(1) }),
  body: z.object({
    actor: z.string().min(1),
    evidence: z.array(evidenceItem).min(1),
  }),
});

export const approveSchema = z.object({
  params: z.object({ pilotId: z.string().min(1), milestoneId: z.string().min(1) }),
  body: z.object({ actor: z.string().min(1) }),
});

export const rejectSchema = z.object({
  params: z.object({ pilotId: z.string().min(1), milestoneId: z.string().min(1) }),
  body: z.object({ actor: z.string().min(1), reason: z.string().min(3) }),
});

export const closePilotSchema = z.object({
  body: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    department: z.string().min(1),
    domain: z.string().min(1),
    technologies: z.array(z.string()).min(1),
    year: z.string().min(4),
    durationDays: z.number().int().positive(),
    baselineDays: z.number().int().min(0),
    baselineQuality,
    scopeUnits: z.number().positive(),
    scopeUnitLabel: z.string().min(1),
    contractValue: z.number().positive(),
    milestoneSplit: z.array(z.number().positive()).min(2),
    outcome: z.enum(['TARGET_MET', 'PARTIALLY_MET', 'TARGET_MISSED']),
    targetValue: z.number(),
    achievedValue: z.number(),
    failureCauses: z.array(
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
    ),
    note: z.string().min(1),
  }),
});
