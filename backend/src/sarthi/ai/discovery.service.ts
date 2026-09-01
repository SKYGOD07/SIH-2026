import { z } from 'zod';
import { AssuranceStatus, DataOrigin, Prisma, ReadinessLevel } from '@prisma/client';
import { prisma } from '../../workflow/repositories';
import { defaultAIProvider } from './ollama.provider';

/**
 * Problem-first startup discovery.
 *
 * The officer's entry point into the pathway. They arrive with a departmental
 * problem stated in their own words — or with no statement at all, only the
 * sense that something needs solving — and leave with a shortlist of companies
 * working in the relevant field.
 *
 * The division of labour here is the whole design, and it is the same one that
 * governs the matching engine:
 *
 *   **The database decides which companies exist and which field they work in.**
 *   **The model only reads the officer's prose and proposes a field.**
 *
 * An LLM is good at "this description of blocked drains is about waste
 * management" and has no business deciding which companies are returned. So the
 * model's entire output is a set of field names, each of which must survive a
 * check against the taxonomy before it is used; anything it invents is dropped.
 * Retrieval is then an ordinary indexed query.
 *
 * Every AI call has a deterministic fallback. The discovery flow works with
 * Ollama switched off — degraded, in that field suggestions come from keyword
 * matching rather than comprehension, but never broken. A demonstration that
 * depends on a model server starting is a demonstration that fails in the room.
 */

/* ------------------------------------------------------------------ */
/* The taxonomy                                                        */
/* ------------------------------------------------------------------ */

/**
 * The fields the platform recognises.
 *
 * The platform's own working vocabulary for this demonstration. It is **not**
 * derived from published MSInS or Startup India funding statistics — this
 * project holds no such dataset, and presenting one would be the exact failure
 * `docs/DATA-SOURCES.md` exists to prevent. Callers must label it as a
 * taxonomy, never as "the fields Maharashtra funded most".
 */
export const FIELD_TAXONOMY: { field: string; label: string; keywords: string[] }[] = [
  { field: 'water-distribution', label: 'Water distribution & supply',
    keywords: ['water', 'leak', 'leakage', 'pipe', 'supply', 'non-revenue', 'pressure', 'meter', 'tap'] },
  { field: 'wastewater', label: 'Wastewater & sanitation',
    keywords: ['sewage', 'effluent', 'wastewater', 'drain', 'sanitation', 'treatment', 'discharge', 'toilet'] },
  { field: 'municipal-waste-management', label: 'Solid waste management',
    keywords: ['garbage', 'waste', 'refuse', 'segregation', 'landfill', 'collection', 'sweeping', 'dump'] },
  { field: 'urban-mobility', label: 'Urban mobility & transport',
    keywords: ['bus', 'traffic', 'transport', 'mobility', 'congestion', 'parking', 'commute', 'route'] },
  { field: 'renewable-energy', label: 'Energy & renewables',
    keywords: ['solar', 'energy', 'power', 'electricity', 'renewable', 'grid', 'street light', 'consumption'] },
  { field: 'agritech', label: 'Agriculture & rural',
    keywords: ['farm', 'crop', 'irrigation', 'soil', 'agriculture', 'yield', 'farmer', 'harvest'] },
  { field: 'healthcare-delivery', label: 'Public health delivery',
    keywords: ['health', 'hospital', 'patient', 'clinic', 'referral', 'medicine', 'disease', 'phc'] },
  { field: 'public-safety', label: 'Public safety & emergency',
    keywords: ['safety', 'emergency', 'fire', 'police', 'disaster', 'incident', 'response', 'flood'] },
  { field: 'e-governance', label: 'Governance & citizen services',
    keywords: ['grievance', 'citizen', 'service', 'certificate', 'application', 'portal', 'record', 'delay'] },
  { field: 'education-technology', label: 'Education',
    keywords: ['school', 'student', 'learning', 'teacher', 'literacy', 'attendance', 'education'] },
];

const VALID_FIELDS = new Set(FIELD_TAXONOMY.map((f) => f.field));

/* ------------------------------------------------------------------ */
/* Field suggestion                                                    */
/* ------------------------------------------------------------------ */

export interface FieldSuggestion {
  field: string;
  label: string;
  /** 0–1. From term overlap, or from the model's own ordering. */
  confidence: number;
  /** Why this field was proposed, in a sentence a reader can check. */
  reason: string;
  /** Companies on the platform working in it. Counted, never estimated. */
  companyCount: number;
}

const AiFieldsSchema = z.object({
  fields: z.array(z.object({ field: z.string(), reason: z.string() })).max(6),
});

/**
 * Keyword overlap between the officer's words and the taxonomy.
 *
 * Deliberately simple and always available. It is the floor the whole feature
 * stands on: when the model is unreachable, slow, or returns something that
 * fails validation, this is what the officer gets, and it is explainable in one
 * sentence rather than being a second opaque system.
 */
function suggestByKeyword(problem: string): { field: string; score: number; hits: string[] }[] {
  const text = problem.toLowerCase();
  return FIELD_TAXONOMY.map((f) => {
    const hits = f.keywords.filter((k) => text.includes(k));
    return { field: f.field, score: hits.length / f.keywords.length, hits };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

async function countByField(fields: string[]): Promise<Record<string, number>> {
  const rows = await prisma.startup.groupBy({
    by: ['sector'],
    where: { sector: { in: fields } },
    _count: true,
  });
  return Object.fromEntries(rows.map((r) => [r.sector, r._count]));
}

const label = (field: string) =>
  FIELD_TAXONOMY.find((f) => f.field === field)?.label ?? field;

/**
 * Read a stated problem and propose fields to search in.
 *
 * The model is asked only to classify. Its answer is filtered against the
 * taxonomy, so a hallucinated field name is discarded rather than becoming a
 * query that returns nothing and looks like an empty database.
 */
export async function suggestFields(problem: string): Promise<{
  suggestions: FieldSuggestion[];
  usedAI: boolean;
  note: string;
}> {
  const keyword = suggestByKeyword(problem);

  let aiFields: { field: string; reason: string }[] = [];
  let usedAI = false;

  try {
    const health = await defaultAIProvider.healthCheck();
    if (health.ready) {
      const result = await defaultAIProvider.generateStructured<z.infer<typeof AiFieldsSchema>>(
        [
          'A government officer has described a departmental problem.',
          'Choose the fields from the list that the problem belongs to, most relevant first.',
          '',
          `Permitted fields (use these exact strings, nothing else): ${[...VALID_FIELDS].join(', ')}`,
          '',
          `Officer's problem: "${problem}"`,
          '',
          'Return at most three. For each, give a one-sentence reason quoting the officer\'s own terms.',
          'If none fit, return an empty list. Do not invent a field name.',
        ].join('\n'),
        AiFieldsSchema,
        'You classify government problem statements into a fixed taxonomy. You never invent categories and never recommend a company.',
      );
      // Anything outside the taxonomy is dropped rather than trusted.
      aiFields = (result?.fields ?? []).filter((f) => VALID_FIELDS.has(f.field));
      usedAI = aiFields.length > 0;
    }
  } catch {
    // Unreachable, slow, or malformed. The keyword floor covers it.
  }

  const merged: FieldSuggestion[] = [];
  const seen = new Set<string>();

  for (const a of aiFields) {
    if (seen.has(a.field)) continue;
    seen.add(a.field);
    const kw = keyword.find((k) => k.field === a.field);
    merged.push({
      field: a.field,
      label: label(a.field),
      confidence: Math.min(1, 0.6 + (kw?.score ?? 0)),
      reason: a.reason,
      companyCount: 0,
    });
  }

  for (const k of keyword) {
    if (seen.has(k.field)) continue;
    seen.add(k.field);
    merged.push({
      field: k.field,
      label: label(k.field),
      confidence: k.score,
      reason: `Your description mentions ${k.hits.slice(0, 3).map((h) => `"${h}"`).join(', ')}.`,
      companyCount: 0,
    });
  }

  const counts = await countByField(merged.map((m) => m.field));
  merged.forEach((m) => {
    m.companyCount = counts[m.field] ?? 0;
  });

  return {
    suggestions: merged.slice(0, 4),
    usedAI,
    note: usedAI
      ? 'Fields proposed with AI assistance and checked against the platform taxonomy. Not a decision.'
      : 'Fields proposed by term matching. The AI model was unavailable, so this is the deterministic fallback.',
  };
}

/**
 * Fields with companies on the platform, for the "help me find a problem" path.
 *
 * An officer who has not written a problem statement gets the fields the
 * platform can actually serve, with counts. Showing a field with no companies
 * would send them down a path that ends in an empty list.
 */
export async function browsableFields(): Promise<FieldSuggestion[]> {
  const counts = await countByField(FIELD_TAXONOMY.map((f) => f.field));
  return FIELD_TAXONOMY.map((f) => ({
    field: f.field,
    label: f.label,
    confidence: 1,
    reason: 'Available on the platform.',
    companyCount: counts[f.field] ?? 0,
  }))
    .filter((f) => f.companyCount > 0)
    .sort((a, b) => b.companyCount - a.companyCount);
}

/* ------------------------------------------------------------------ */
/* Company search                                                      */
/* ------------------------------------------------------------------ */

export interface DiscoveryFilters {
  field?: string;
  technologies?: string[];
  /** Minimum stated procurement readiness. */
  minReadiness?: ReadinessLevel;
  /** Only companies that have said something about security. */
  cybersecurityProvided?: boolean;
  /** Only companies with at least this many recorded deployments. */
  minDeployments?: number;
  maxPilotDurationDays?: number;
  maxPilotBudget?: number;
  city?: string;
}

const READINESS_ORDER: ReadinessLevel[] = [
  ReadinessLevel.NOT_ASSESSED,
  ReadinessLevel.LOW,
  ReadinessLevel.MODERATE,
  ReadinessLevel.HIGH,
];

/**
 * Companies in a field, narrowed by the officer's filters.
 *
 * Ordinary SQL. No model is consulted, because which companies exist is a fact
 * and facts come from the database — and because a search whose results move
 * between identical runs cannot be defended in a procurement review.
 *
 * `origin` is explicit, as it is on every query that feeds a decision.
 */
export async function discoverStartups(
  filters: DiscoveryFilters,
  origins: DataOrigin[] = [DataOrigin.DEMO, DataOrigin.VERIFIED, DataOrigin.USER_ENTERED],
) {
  const where: Prisma.StartupWhereInput = { origin: { in: origins } };

  if (filters.field) where.sector = filters.field;
  if (filters.city) where.city = filters.city;
  if (filters.technologies?.length) where.technologies = { hasSome: filters.technologies };
  if (filters.minDeployments !== undefined) {
    where.deploymentCount = { gte: filters.minDeployments };
  }
  if (filters.maxPilotDurationDays !== undefined) {
    where.pilotDurationDays = { lte: filters.maxPilotDurationDays };
  }
  if (filters.maxPilotBudget !== undefined) {
    where.estimatedPilotBudget = { lte: new Prisma.Decimal(filters.maxPilotBudget) };
  }
  if (filters.cybersecurityProvided) {
    where.cybersecurityStatus = { not: AssuranceStatus.NOT_PROVIDED };
  }
  if (filters.minReadiness) {
    const allowed = READINESS_ORDER.slice(READINESS_ORDER.indexOf(filters.minReadiness));
    where.procurementReadiness = { in: allowed };
  }

  const startups = await prisma.startup.findMany({
    where,
    orderBy: [{ deploymentCount: 'desc' }, { legalName: 'asc' }],
    select: {
      id: true, legalName: true, displayName: true, oneLineDescription: true,
      sector: true, city: true, state: true, teamSize: true,
      technologies: true, capabilities: true,
      problemSolved: true, solutionSummary: true,
      deploymentCount: true, customerCount: true,
      procurementReadiness: true, complianceStatus: true,
      cybersecurityStatus: true, dataPrivacyStatus: true,
      pilotDurationDays: true, estimatedPilotBudget: true,
      origin: true,
      _count: { select: { documents: true, participations: true, pilots: true } },
    },
  });

  return {
    startups,
    total: startups.length,
    /** Travels with the results so the caveat cannot be separated from them. */
    disclaimer:
      'Companies on this platform matching your filters. Ordering is by recorded deployments, not by suitability — suitability is challenge-specific and is scored only once a challenge exists.',
  };
}

/** The filter vocabulary, built from what the data actually contains. */
export async function filterOptions(field?: string) {
  const where = field ? { sector: field } : {};
  const rows = await prisma.startup.findMany({
    where,
    select: { technologies: true, city: true, sector: true },
  });

  const tech = new Set<string>();
  const cities = new Set<string>();
  const sectors = new Set<string>();
  rows.forEach((r) => {
    r.technologies.forEach((t) => tech.add(t));
    if (r.city) cities.add(r.city);
    sectors.add(r.sector);
  });

  return {
    technologies: [...tech].sort(),
    cities: [...cities].sort(),
    sectors: [...sectors].sort(),
    readinessLevels: READINESS_ORDER,
  };
}
