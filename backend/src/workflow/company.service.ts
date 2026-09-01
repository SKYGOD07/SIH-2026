import { AssuranceStatus, DataOrigin, Prisma, Startup, UserProfile, UserRole } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { prisma, withTransaction } from './repositories';

/**
 * The company record, and what the government is allowed to read of it.
 *
 * One `Startup` row is the canonical company. It is written once by the company
 * that owns it and read from every later stage — matching, evaluation, pilot
 * setup — so a company that updates its capabilities changes what the
 * government sees without anyone re-entering anything.
 *
 * The government analysis is **derived**, never stored. That is the design
 * decision this file exists to hold: a saved analysis is a snapshot that goes
 * quietly stale the moment the profile behind it changes, and an officer
 * reading a six-week-old "pilot readiness: high" has no way to know it no
 * longer follows from anything.
 */

/* ------------------------------------------------------------------ */
/* Profile completeness                                                */
/* ------------------------------------------------------------------ */

/**
 * The fields a profile needs before it can be put in front of a department.
 *
 * Completeness is *computed from what is present*, never stored and never
 * rounded up. A company that has said nothing about its security posture shows
 * as incomplete, because the alternative — a full bar over an empty field — is
 * how an absence becomes an implied assurance.
 */
const REQUIRED_FIELDS = [
  'legalName',
  'sector',
  'problemSolved',
  'solutionSummary',
  'technologies',
  'capabilities',
  'pilotDurationDays',
] as const;

const OPTIONAL_FIELDS = [
  'oneLineDescription',
  'description',
  'foundedYear',
  'teamSize',
  'founderSummary',
  'productSummary',
  'targetUsers',
  'deploymentModel',
  'geographicCoverage',
  'state',
  'city',
  'website',
  'stage',
  'revenueBand',
  'customerCount',
  'deploymentCount',
  'commercializationStage',
  'governmentExperienceSummary',
  'pilotTeamSummary',
  'infrastructureRequirements',
  'implementationDependencies',
  'deploymentRequirements',
  'estimatedPilotBudget',
  'scalingRequirements',
] as const;

function filled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

export interface Completeness {
  /** 0–100, computed. Required fields carry the weight. */
  percent: number;
  requiredMissing: string[];
  optionalMissing: string[];
  readyToPublish: boolean;
}

export function completeness(startup: Startup): Completeness {
  const row = startup as unknown as Record<string, unknown>;
  const requiredMissing = REQUIRED_FIELDS.filter((f) => !filled(row[f]));
  const optionalMissing = OPTIONAL_FIELDS.filter((f) => !filled(row[f]));

  // Required fields are worth three quarters of the bar: a profile with every
  // optional flourish and no stated problem is not three quarters ready.
  const reqScore = (REQUIRED_FIELDS.length - requiredMissing.length) / REQUIRED_FIELDS.length;
  const optScore = (OPTIONAL_FIELDS.length - optionalMissing.length) / OPTIONAL_FIELDS.length;

  return {
    percent: Math.round((reqScore * 0.75 + optScore * 0.25) * 100),
    requiredMissing: [...requiredMissing],
    optionalMissing: [...optionalMissing],
    readyToPublish: requiredMissing.length === 0,
  };
}

/* ------------------------------------------------------------------ */
/* Writing one's own company                                           */
/* ------------------------------------------------------------------ */

/**
 * Fields a startup user may set about themselves.
 *
 * Note what is absent and cannot be reached from any request: `origin`,
 * `sourceId`, `scenarioId`, and every assurance field's `VERIFIED` value. A
 * company can declare a claim; it cannot verify itself, and it cannot label its
 * own record as externally sourced.
 */
export type CompanyProfileInput = Partial<
  Pick<
    Prisma.StartupUncheckedUpdateInput,
    | 'legalName'
    | 'displayName'
    | 'oneLineDescription'
    | 'description'
    | 'foundedYear'
    | 'teamSize'
    | 'founderSummary'
    | 'keyTeamMembers'
    | 'sector'
    | 'industry'
    | 'stage'
    | 'state'
    | 'city'
    | 'website'
    | 'problemSolved'
    | 'solutionSummary'
    | 'productSummary'
    | 'targetUsers'
    | 'deploymentModel'
    | 'geographicCoverage'
    | 'technologies'
    | 'capabilities'
    | 'revenueBand'
    | 'customerCount'
    | 'deploymentCount'
    | 'commercializationStage'
    | 'governmentExperienceSummary'
    | 'requiredCertifications'
    | 'pilotDurationDays'
    | 'pilotTeamSummary'
    | 'infrastructureRequirements'
    | 'implementationDependencies'
    | 'deploymentRequirements'
    | 'estimatedPilotBudget'
    | 'scalingRequirements'
  >
> & {
  /** Self-declared only; the service refuses to store VERIFIED from here. */
  complianceStatus?: AssuranceStatus;
  cybersecurityStatus?: AssuranceStatus;
  dataPrivacyStatus?: AssuranceStatus;
};

/**
 * A company cannot mark its own claims verified.
 *
 * `VERIFIED` means an `EvidenceSource` stands behind it, which only the
 * evidence pipeline can establish. Submitting it here is downgraded rather than
 * rejected: the intent — "we have this" — is honoured at the level the platform
 * can actually support.
 */
function selfDeclaredOnly(v: AssuranceStatus | undefined): AssuranceStatus | undefined {
  if (v === undefined) return undefined;
  return v === AssuranceStatus.VERIFIED || v === AssuranceStatus.PARTIALLY_VERIFIED
    ? AssuranceStatus.SELF_DECLARED
    : v;
}

export function ownStartupId(u: UserProfile): string {
  if (u.role !== UserRole.STARTUP || !u.startupId) {
    throw new AppError('This action is limited to startup accounts with a claimed company', 403);
  }
  return u.startupId;
}

/**
 * Bring a company into existence for a startup user who has none.
 *
 * `origin` is set by the server from the workspace, never by the client: inside
 * a simulation the record is DEMO, outside it the user's own first-party entry.
 * There is no path by which a caller labels their own record VERIFIED — that
 * requires a cited source, and a database CHECK refuses it besides.
 */
export async function createOwnCompany(
  u: UserProfile,
  input: { legalName: string; sector: string; scenarioId?: string },
) {
  if (u.role !== UserRole.STARTUP) {
    throw new AppError('Only a startup account may create a company profile', 403);
  }
  if (u.startupId) throw new AppError('You already have a company profile', 409);

  return withTransaction(async (tx) => {
    const startup = await tx.startup.create({
      data: {
        legalName: input.legalName,
        sector: input.sector,
        scenarioId: input.scenarioId ?? null,
        origin: input.scenarioId ? DataOrigin.DEMO : DataOrigin.USER_ENTERED,
        technologies: [],
        capabilities: [],
        requiredCertifications: [],
      },
    });
    await tx.userProfile.update({ where: { id: u.id }, data: { startupId: startup.id } });
    return { startup, completeness: completeness(startup) };
  });
}

export async function getOwnCompany(u: UserProfile) {
  const startup = await prisma.startup.findUnique({
    where: { id: ownStartupId(u) },
    include: {
      fundingRounds: true,
      participations: { include: { program: true } },
      responses: { include: { challenge: true } },
      pilots: { include: { challenge: true, metrics: true } },
    },
  });
  if (!startup) throw new AppError('No such company', 404);
  return { startup, completeness: completeness(startup) };
}

export async function updateOwnCompany(u: UserProfile, patch: CompanyProfileInput) {
  const id = ownStartupId(u);

  const data: Prisma.StartupUncheckedUpdateInput = {
    ...patch,
    ...(patch.complianceStatus !== undefined && {
      complianceStatus: selfDeclaredOnly(patch.complianceStatus),
    }),
    ...(patch.cybersecurityStatus !== undefined && {
      cybersecurityStatus: selfDeclaredOnly(patch.cybersecurityStatus),
    }),
    ...(patch.dataPrivacyStatus !== undefined && {
      dataPrivacyStatus: selfDeclaredOnly(patch.dataPrivacyStatus),
    }),
  };

  const startup = await prisma.startup.update({ where: { id }, data });
  return { startup, completeness: completeness(startup) };
}

/* ------------------------------------------------------------------ */
/* Claiming a demonstration company                                    */
/* ------------------------------------------------------------------ */

/** Unclaimed companies in a scenario, for the claim screen. */
export async function listClaimable(scenarioId: string) {
  return prisma.startup.findMany({
    where: { scenarioId, owner: null },
    orderBy: { legalName: 'asc' },
    select: { id: true, legalName: true, oneLineDescription: true, sector: true },
  });
}

/**
 * Take ownership of one demonstration company.
 *
 * A unique constraint on `UserProfile.startupId` makes the one-owner rule the
 * database's job rather than this function's — two teammates racing for the
 * same slot get one winner and one clear error, instead of both appearing to
 * succeed.
 */
export async function claimCompany(u: UserProfile, startupId: string) {
  if (u.role !== UserRole.STARTUP) {
    throw new AppError('Only a startup account may claim a company', 403);
  }
  if (u.startupId) throw new AppError('You have already claimed a company', 409);

  const startup = await prisma.startup.findUnique({
    where: { id: startupId },
    include: { owner: true },
  });
  if (!startup) throw new AppError('No such company', 404);
  if (startup.owner) throw new AppError('That company has already been claimed', 409);

  try {
    return await withTransaction(async (tx) => {
      await tx.userProfile.update({ where: { id: u.id }, data: { startupId } });
      return tx.startup.findUniqueOrThrow({ where: { id: startupId } });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError('That company was claimed a moment ago by someone else', 409);
    }
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* The government's view                                               */
/* ------------------------------------------------------------------ */

/**
 * What a government reader may see.
 *
 * A whitelist, not a redaction list. Adding a column to `Startup` therefore
 * does *not* expose it to the government side by default — which is the right
 * failure direction, because the alternative leaks by omission.
 *
 * The company keeps its own view of everything; this is the procurement view of
 * the same record.
 */
const GOVERNMENT_VISIBLE = {
  id: true,
  legalName: true,
  displayName: true,
  oneLineDescription: true,
  description: true,
  sector: true,
  industry: true,
  stage: true,
  state: true,
  city: true,
  website: true,
  foundedYear: true,
  teamSize: true,
  founderSummary: true,
  dpiitStatus: true,

  problemSolved: true,
  solutionSummary: true,
  productSummary: true,
  targetUsers: true,
  deploymentModel: true,
  geographicCoverage: true,
  technologies: true,
  capabilities: true,

  revenueBand: true,
  customerCount: true,
  deploymentCount: true,
  commercializationStage: true,

  governmentExperienceSummary: true,
  complianceStatus: true,
  cybersecurityStatus: true,
  dataPrivacyStatus: true,
  procurementReadiness: true,
  requiredCertifications: true,

  pilotDurationDays: true,
  pilotTeamSummary: true,
  infrastructureRequirements: true,
  implementationDependencies: true,
  deploymentRequirements: true,
  estimatedPilotBudget: true,
  scalingRequirements: true,

  origin: true,
  scenarioId: true,
  createdAt: true,
  // Deliberately absent: keyTeamMembers (named individuals), sourceId.
} satisfies Prisma.StartupSelect;

export interface AnalysisSignal {
  label: string;
  /** A band, not a score. Challenge-specific scores live on `StartupMatch`. */
  level: 'NOT_ASSESSED' | 'LOW' | 'MODERATE' | 'HIGH';
  /** The fields this reading was taken from, so a reader can check it. */
  basis: string[];
}

/**
 * Company-level readings, derived on read.
 *
 * These are **not** match scores and deliberately carry no number. Problem fit
 * and technical fit are properties of a (challenge, startup) pair and are
 * computed by the matching engine; a company-level "fit" would be read as the
 * former while meaning nothing. What can honestly be said about a company on
 * its own is how much it has evidenced, and how ready it says it is.
 */
function signals(
  s: Startup & {
    participations: unknown[];
    fundingRounds: unknown[];
    pilots: { status: string; outcome: string | null }[];
  },
): AnalysisSignal[] {
  const assured = (v: AssuranceStatus) =>
    v === AssuranceStatus.VERIFIED
      ? 'HIGH'
      : v === AssuranceStatus.PARTIALLY_VERIFIED
        ? 'MODERATE'
        : v === AssuranceStatus.SELF_DECLARED
          ? 'LOW'
          : 'NOT_ASSESSED';

  const closedPilots = s.pilots.filter((p) => p.status === 'CLOSED');
  const met = closedPilots.filter((p) => p.outcome === 'TARGET_MET').length;

  const govtCount = s.participations.length;
  const pilotReadyInputs = [
    s.pilotDurationDays,
    s.pilotTeamSummary,
    s.infrastructureRequirements,
    s.deploymentRequirements,
  ].filter(filled).length;

  return [
    {
      label: 'Government experience',
      level: govtCount >= 3 ? 'HIGH' : govtCount >= 1 ? 'MODERATE' : 'NOT_ASSESSED',
      basis:
        govtCount > 0
          ? [`${govtCount} recorded programme participation(s)`]
          : ['No government programme participation is recorded for this company'],
    },
    {
      label: 'Pilot readiness',
      level:
        pilotReadyInputs >= 4 ? 'HIGH' : pilotReadyInputs >= 2 ? 'MODERATE' : pilotReadyInputs > 0 ? 'LOW' : 'NOT_ASSESSED',
      basis: [`${pilotReadyInputs} of 4 pilot-readiness fields completed`],
    },
    {
      label: 'Compliance',
      level: assured(s.complianceStatus),
      basis: [`Stated as ${s.complianceStatus.replace(/_/g, ' ').toLowerCase()}`],
    },
    {
      label: 'Cybersecurity',
      level: assured(s.cybersecurityStatus),
      basis:
        s.cybersecurityStatus === AssuranceStatus.NOT_PROVIDED
          ? ['Cybersecurity evidence not provided']
          : [`Stated as ${s.cybersecurityStatus.replace(/_/g, ' ').toLowerCase()}`],
    },
    {
      label: 'Data protection',
      level: assured(s.dataPrivacyStatus),
      basis:
        s.dataPrivacyStatus === AssuranceStatus.NOT_PROVIDED
          ? ['Data protection evidence not provided']
          : [`Stated as ${s.dataPrivacyStatus.replace(/_/g, ' ').toLowerCase()}`],
    },
    {
      label: 'Prior pilot outcomes',
      level: closedPilots.length === 0 ? 'NOT_ASSESSED' : met > 0 ? 'MODERATE' : 'LOW',
      basis:
        closedPilots.length === 0
          ? ['No closed pilot on this platform yet']
          : [`${met} of ${closedPilots.length} closed pilot(s) met their target`],
    },
  ];
}

/**
 * The company dossier a government officer opens.
 *
 * Everything here is read from stored fields or counted from related rows.
 * Nothing is generated, and no language model is involved — the page works with
 * Ollama switched off, which is the requirement that keeps the demonstration
 * from depending on a service that might not start.
 */
export async function governmentDossier(u: UserProfile, startupId: string) {
  if (u.role !== UserRole.GOVERNMENT_OFFICER && u.role !== UserRole.EVALUATOR && u.role !== UserRole.ADMIN) {
    throw new AppError('This view is limited to government and evaluator accounts', 403);
  }

  const startup = await prisma.startup.findUnique({
    where: { id: startupId },
    select: {
      ...GOVERNMENT_VISIBLE,
      fundingRounds: {
        select: { roundType: true, amount: true, announcedOn: true, investors: true, origin: true },
        orderBy: { announcedOn: 'desc' },
      },
      participations: {
        select: {
          edition: true,
          outcome: true,
          workOrderValue: true,
          sponsoringDepartment: true,
          origin: true,
          program: { select: { code: true, name: true, operator: true } },
          source: { select: { publisher: true, title: true, url: true, retrievedAt: true } },
        },
      },
      pilots: {
        select: {
          id: true,
          status: true,
          outcome: true,
          department: true,
          createdAt: true,
          challenge: { select: { title: true, targetMetric: true } },
          metrics: { select: { name: true, unit: true, targetValue: true, achievedValue: true, isPrimary: true } },
          scaleDecision: { select: { decision: true, decidedAt: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      documents: {
        select: {
          id: true,
          category: true,
          label: true,
          createdAt: true,
          document: {
            select: {
              id: true,
              kind: true,
              title: true,
              publisher: true,
              url: true,
              retrievedAt: true,
              origin: true,
              fileHash: true,
              originalPath: true,
              extractedText: true,
            },
          },
        },
      },
      source: { select: { publisher: true, title: true, url: true, retrievedAt: true } },
    },
  });

  if (!startup) throw new AppError('No such company', 404);

  const s = startup as unknown as Startup & {
    participations: unknown[];
    fundingRounds: unknown[];
    pilots: { status: string; outcome: string | null }[];
    documents: { category: string; document: { title: string; kind: string; origin: string } }[];
  };

  // Calculate Document Readiness counts by category
  const categoriesList = [
    'CORPORATE_LEGAL',
    'GOVERNMENT_FUNDING',
    'FINANCIAL',
    'COMPLIANCE',
    'TECHNOLOGY',
    'PILOT',
    'AI_GOVERNANCE',
    'OWNERSHIP',
    'KYC',
    'CHECKLIST',
    'OTHER',
  ];

  const documentReadiness: Record<string, number> = {};
  categoriesList.forEach((c) => (documentReadiness[c] = 0));
  s.documents.forEach((d) => {
    documentReadiness[d.category] = (documentReadiness[d.category] || 0) + 1;
  });

  const totalDocs = s.documents.length;

  // Deterministic WHY THIS STARTUP explanation
  const whyThisStartup = {
    summary: `${startup.displayName || startup.legalName} addresses ${startup.problemSolved || 'the challenge domain'} via ${startup.solutionSummary || 'its proprietary solution'}.`,
    strengths: [
      `Structured dossier backed by ${totalDocs} ${startup.origin} evidence documents across ${Object.values(documentReadiness).filter(v => v > 0).length} categories.`,
      `Technologies & capabilities aligned: ${(startup.technologies || []).join(', ') || 'N/A'}.`,
      `Pilot readiness: ${startup.pilotDurationDays ? `${startup.pilotDurationDays} days deployment plan` : 'Self-declared readiness'}.`,
    ],
    limitations: [
      startup.origin === DataOrigin.DEMO
        ? 'Records belong to an internal DEMO simulation workspace and require formal verification before real procurement.'
        : 'Self-declared assertions require verification against official sources.',
    ],
  };

  return {
    company: startup,
    signals: signals(s),
    documentReadiness,
    totalDocuments: totalDocs,
    whyThisStartup,
    gaps: completeness(s).requiredMissing,
    disclaimer:
      startup.origin === DataOrigin.DEMO
        ? 'Simulated company record, created for demonstration. Not a real company and not a government supplier.'
        : 'Company-stated information. Not independently verified except where a source is cited.',
  };
}

/**
 * Get documents for a startup's document vault.
 */
export async function getStartupDocuments(u: UserProfile, startupId: string, categoryFilter?: string) {
  if (u.role === UserRole.STARTUP && u.startupId !== startupId) {
    throw new AppError('Startups can only access their own document vault', 403);
  }

  const docs = await prisma.startupDocument.findMany({
    where: {
      startupId,
      ...(categoryFilter && categoryFilter !== 'ALL' ? { category: categoryFilter } : {}),
    },
    include: {
      document: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return docs.map((d) => ({
    id: d.id,
    documentId: d.documentId,
    title: d.label || d.document.title,
    category: d.category,
    kind: d.document.kind,
    origin: d.document.origin,
    fileHash: d.document.fileHash,
    originalPath: d.document.originalPath,
    extractedText: d.document.extractedText,
    createdAt: d.createdAt,
  }));
}

/** The candidate list for a challenge, as the comparison table needs it. */
export async function comparisonRow(startupId: string) {
  return prisma.startup.findUnique({ where: { id: startupId }, select: GOVERNMENT_VISIBLE });
}
