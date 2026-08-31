import {
  AuditAction,
  ChallengeStatus,
  DataOrigin,
  MilestoneStatus,
  Prisma,
  UserProfile,
  UserRole,
} from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { scoreMatch } from './matching';
import * as audit from './audit';
import {
  challengeRepo,
  evaluationRepo,
  evidenceRepo,
  matchRepo,
  metricRepo,
  milestoneRepo,
  pilotRepo,
  prisma,
  responseRepo,
  scaleDecisionRepo,
  scenarioRepo,
  startupRepo,
  withTransaction,
} from './repositories';

/**
 * The procurement lifecycle.
 *
 * Every function takes the caller's `UserProfile` — resolved by the auth
 * middleware from a verified token — as its first argument, and derives all
 * identity and ownership from it. No function here accepts a user id, an actor
 * name, or a role from anywhere else, because a security-sensitive transition
 * that trusts a request body is one HTTP call away from being anybody.
 *
 * The transitions this file refuses are as much the product as the ones it
 * allows: payment without approval, approval without accepted evidence, a scale
 * decision on an open pilot, a startup acting on another's record.
 */

/* ------------------------------------------------------------------ */
/* Authorisation helpers                                               */
/* ------------------------------------------------------------------ */

const isGovernment = (u: UserProfile) =>
  u.role === UserRole.GOVERNMENT_OFFICER || u.role === UserRole.ADMIN;

function assertGovernment(u: UserProfile) {
  if (!isGovernment(u)) throw new AppError('This action is limited to government accounts', 403);
}

function assertEvaluator(u: UserProfile) {
  if (u.role !== UserRole.EVALUATOR && !isGovernment(u)) {
    throw new AppError('This action is limited to evaluator accounts', 403);
  }
}

/** The startup this user speaks for, or a 403. */
function ownStartupId(u: UserProfile): string {
  if (u.role !== UserRole.STARTUP || !u.startupId) {
    throw new AppError('This action is limited to startup accounts with a company profile', 403);
  }
  return u.startupId;
}

/**
 * A challenge the caller owns.
 *
 * Ownership rather than role: a government officer may not act on another
 * department's challenge simply for holding the same role.
 */
async function ownedChallenge(u: UserProfile, challengeId: string) {
  const challenge = await challengeRepo.findById(prisma, challengeId);
  if (!challenge) throw new AppError('No such challenge', 404);
  assertGovernment(u);
  if (challenge.ownerUserId !== u.id && u.role !== UserRole.ADMIN) {
    throw new AppError('This challenge belongs to another officer', 403);
  }
  return challenge;
}

/* ------------------------------------------------------------------ */
/* Simulation workspace                                                */
/* ------------------------------------------------------------------ */

export async function createScenario(u: UserProfile, input: { name: string; description: string }) {
  assertGovernment(u);
  return scenarioRepo.create(prisma, {
    name: input.name,
    description: input.description,
    status: 'ACTIVE',
    createdByUserId: u.id,
  });
}

export const listScenarios = () => scenarioRepo.listActive(prisma);

export async function deleteScenario(u: UserProfile, scenarioId: string) {
  if (u.role !== UserRole.ADMIN) {
    throw new AppError('Only an administrator may delete a workspace', 403);
  }
  await scenarioRepo.destroy(prisma, scenarioId);
}

/* ------------------------------------------------------------------ */
/* Startup profile                                                     */
/* ------------------------------------------------------------------ */

export interface StartupProfileInput {
  legalName: string;
  displayName?: string;
  description?: string;
  sector: string;
  technologies: string[];
  capabilities: string[];
  state?: string;
  city?: string;
  website?: string;
  scenarioId?: string;
}

/**
 * Create or update the caller's own company.
 *
 * `origin` is set by the server from the workspace, never by the client: a
 * record created inside a simulation is DEMO, and one created outside it is the
 * user's own first-party entry. There is no path by which a caller can label
 * their own record VERIFIED — that state requires a cited source and is
 * refused by a database constraint besides.
 */
export async function upsertOwnStartup(u: UserProfile, input: StartupProfileInput) {
  if (u.role !== UserRole.STARTUP) {
    throw new AppError('Only a startup account may maintain a company profile', 403);
  }

  const origin = input.scenarioId ? DataOrigin.DEMO : DataOrigin.USER_ENTERED;

  if (u.startupId) {
    return startupRepo.update(prisma, u.startupId, { ...input, origin });
  }

  return withTransaction(async (tx) => {
    const startup = await startupRepo.create(tx, { ...input, origin });
    await tx.userProfile.update({ where: { id: u.id }, data: { startupId: startup.id } });
    return startup;
  });
}

export async function getOwnStartup(u: UserProfile) {
  const id = ownStartupId(u);
  return startupRepo.findById(prisma, id);
}

/* ------------------------------------------------------------------ */
/* Challenges                                                          */
/* ------------------------------------------------------------------ */

export interface ChallengeInput {
  department: string;
  title: string;
  problemStatement: string;
  domain: string;
  technologies: string[];
  targetMetric: string;
  targetValue?: number;
  budgetEnvelope?: number;
  pilotDurationDays?: number;
  scenarioId?: string;
}

export async function createChallenge(u: UserProfile, input: ChallengeInput) {
  assertGovernment(u);

  const challenge = await challengeRepo.create(prisma, {
    ...input,
    ownerUserId: u.id,
    origin: input.scenarioId ? DataOrigin.DEMO : DataOrigin.USER_ENTERED,
    budgetEnvelope: input.budgetEnvelope ? new Prisma.Decimal(input.budgetEnvelope) : null,
    status: ChallengeStatus.DRAFT,
  });

  await audit.record(prisma, {
    actorUserId: u.id,
    subjectType: 'Challenge',
    subjectId: challenge.id,
    action: AuditAction.CHALLENGE_STATUS_CHANGED,
    detail: `Challenge created as DRAFT: ${challenge.title}`,
  });

  return challenge;
}

export async function publishChallenge(u: UserProfile, challengeId: string) {
  const challenge = await ownedChallenge(u, challengeId);
  if (challenge.status !== ChallengeStatus.DRAFT) {
    throw new AppError(`A ${challenge.status} challenge cannot be published again`, 409);
  }

  const updated = await challengeRepo.setStatus(prisma, challengeId, ChallengeStatus.PUBLISHED);
  await audit.record(prisma, {
    actorUserId: u.id,
    subjectType: 'Challenge',
    subjectId: challengeId,
    action: AuditAction.CHALLENGE_STATUS_CHANGED,
    detail: 'Challenge published; startups may now respond',
  });
  return updated;
}

/** What a startup may see. Never another startup's responses or evaluations. */
export async function listOpenChallenges(u: UserProfile) {
  const startupId = ownStartupId(u);
  const startup = await startupRepo.findById(prisma, startupId);
  const challenges = await challengeRepo.listOpen(prisma, startup?.scenarioId ?? null);
  const mine = await responseRepo.listForStartup(prisma, startupId);
  const responded = new Set(mine.map((r) => r.challengeId));
  return challenges.map((c) => ({ ...c, hasResponded: responded.has(c.id) }));
}

export const listOwnChallenges = async (u: UserProfile) => {
  assertGovernment(u);
  return challengeRepo.listOwnedBy(prisma, u.id);
};

export async function challengeForReview(u: UserProfile, challengeId: string) {
  await ownedChallenge(u, challengeId);
  return challengeRepo.findForReview(prisma, challengeId);
}

/* ------------------------------------------------------------------ */
/* Startup responses                                                   */
/* ------------------------------------------------------------------ */

export interface ResponseInput {
  solutionSummary: string;
  capabilities: string[];
  technologies: string[];
  deploymentApproach: string;
  expectedResult: string;
  pilotApproach: string;
  constraints?: string;
  evidenceReferences?: string[];
  submit: boolean;
}

export async function submitResponse(u: UserProfile, challengeId: string, input: ResponseInput) {
  const startupId = ownStartupId(u);

  const challenge = await challengeRepo.findById(prisma, challengeId);
  if (!challenge) throw new AppError('No such challenge', 404);
  if (
    challenge.status !== ChallengeStatus.PUBLISHED &&
    challenge.status !== ChallengeStatus.MATCHING
  ) {
    throw new AppError('This challenge is not accepting responses', 409);
  }

  return responseRepo.upsert(prisma, challengeId, startupId, {
    solutionSummary: input.solutionSummary,
    capabilities: input.capabilities,
    technologies: input.technologies,
    deploymentApproach: input.deploymentApproach,
    expectedResult: input.expectedResult,
    pilotApproach: input.pilotApproach,
    constraints: input.constraints ?? null,
    evidenceReferences: input.evidenceReferences ?? [],
    status: input.submit ? 'SUBMITTED' : 'DRAFT',
    submittedByUserId: u.id,
    submittedAt: input.submit ? new Date() : null,
    origin: challenge.origin,
  });
}

export const listOwnResponses = async (u: UserProfile) =>
  responseRepo.listForStartup(prisma, ownStartupId(u));

/* ------------------------------------------------------------------ */
/* Matching                                                            */
/* ------------------------------------------------------------------ */

/**
 * Score every submitted response against the challenge.
 *
 * Regenerating replaces the previous scores for each pair rather than appending,
 * so a challenge never carries two contradictory rankings. A match already
 * marked SELECTED is left alone: rescoring after a decision must not silently
 * unmake it.
 */
export async function generateMatches(u: UserProfile, challengeId: string) {
  const challenge = await ownedChallenge(u, challengeId);
  const responses = await responseRepo.listForChallenge(prisma, challengeId);

  if (responses.length === 0) {
    throw new AppError('No startup has submitted a response to this challenge yet', 409);
  }

  for (const response of responses) {
    const engagements = await prisma.startupProgramParticipation.count({
      where: { startupId: response.startupId },
    });

    const result = scoreMatch({
      challenge,
      startup: response.startup,
      response,
      governmentEngagements: engagements,
    });

    const existing = await prisma.startupMatch.findUnique({
      where: { challengeId_startupId: { challengeId, startupId: response.startupId } },
    });
    if (existing?.status === 'SELECTED') continue;

    await matchRepo.upsert(prisma, challengeId, response.startupId, {
      problemFitScore: result.problemFitScore,
      technicalFitScore: result.technicalFitScore,
      deploymentReadinessScore: result.deploymentReadinessScore,
      governmentExperienceScore: result.governmentExperienceScore,
      evidenceStrengthScore: result.evidenceStrengthScore,
      pilotReadinessScore: result.pilotReadinessScore,
      overallScore: result.overallScore,
      breakdown: result.breakdown as unknown as Prisma.InputJsonValue,
      rationale: result.rationale,
      status: 'SUGGESTED',
    });
  }

  if (challenge.status === ChallengeStatus.PUBLISHED) {
    await challengeRepo.setStatus(prisma, challengeId, ChallengeStatus.MATCHING);
  }

  await audit.record(prisma, {
    actorUserId: u.id,
    subjectType: 'Challenge',
    subjectId: challengeId,
    action: AuditAction.MATCH_STATUS_CHANGED,
    detail: `AI-assisted matching run over ${responses.length} response(s)`,
  });

  return matchRepo.ranked(prisma, challengeId);
}

export async function rankedMatches(u: UserProfile, challengeId: string) {
  await ownedChallenge(u, challengeId);
  return matchRepo.ranked(prisma, challengeId);
}

/* ------------------------------------------------------------------ */
/* Evaluation                                                          */
/* ------------------------------------------------------------------ */

export interface EvaluationInput {
  criteria: Record<string, unknown>;
  compositeScore: number;
  recommendation: 'PILOT' | 'REJECT' | 'NEEDS_MORE_EVIDENCE' | 'HOLD';
  comments?: string;
}

export async function submitEvaluation(u: UserProfile, matchId: string, input: EvaluationInput) {
  assertEvaluator(u);

  const match = await matchRepo.findById(prisma, matchId);
  if (!match) throw new AppError('No such match', 404);

  const evaluation = await evaluationRepo.create(prisma, {
    matchId,
    evaluatorUserId: u.id,
    criteria: input.criteria as Prisma.InputJsonValue,
    compositeScore: input.compositeScore,
    recommendation: input.recommendation,
    status: 'SUBMITTED',
    comments: input.comments ?? null,
    decidedAt: new Date(),
  });

  await audit.record(prisma, {
    actorUserId: u.id,
    subjectType: 'Evaluation',
    subjectId: evaluation.id,
    action: AuditAction.EVALUATION_SUBMITTED,
    detail: `Human evaluation recorded: ${input.recommendation}`,
  });

  return evaluation;
}

/* ------------------------------------------------------------------ */
/* Selection and pilot creation                                        */
/* ------------------------------------------------------------------ */

export interface PilotInput {
  matchId: string;
  department: string;
  location?: string;
  contractValue: number;
  durationDays: number;
  baselineDays: number;
  baselineQuality: 'NONE' | 'PARTIAL' | 'GOOD';
  scopeUnits: number;
  scopeUnitLabel: string;
  primaryMetric: { name: string; unit: string; baselineValue: number; targetValue: number; method: string };
  milestones: { code: string; title: string; description: string; payment: number; dueOn: string; evidenceRequired: string[] }[];
}

/**
 * The human selection, and the pilot it creates.
 *
 * This is the moment the product exists to protect. A match score never reaches
 * here on its own: a government user calls this, their id is recorded, and the
 * audit line says a person selected the startup. Nothing in the system can take
 * this step automatically.
 *
 * One transaction, because a pilot without its milestones is not a half-created
 * pilot — it is a contract with no payment schedule.
 */
export async function selectAndCreatePilot(u: UserProfile, challengeId: string, input: PilotInput) {
  const challenge = await ownedChallenge(u, challengeId);
  const match = await matchRepo.findById(prisma, input.matchId);
  if (!match || match.challengeId !== challengeId) {
    throw new AppError('That match does not belong to this challenge', 404);
  }

  const split = input.milestones.reduce((sum, m) => sum + m.payment, 0);
  if (Math.abs(split - input.contractValue) > 1) {
    throw new AppError('Milestone payments must sum to the contract value', 422, {
      contractValue: input.contractValue,
      milestoneTotal: split,
    });
  }
  if (input.baselineDays > input.durationDays) {
    throw new AppError('The baseline period cannot exceed the pilot duration', 422);
  }

  return withTransaction(async (tx) => {
    await matchRepo.setStatus(tx, match.id, 'SELECTED');
    await matchRepo.rejectOthers(tx, challengeId, match.id);

    const pilot = await pilotRepo.create(tx, {
      challengeId,
      startupId: match.startupId,
      department: input.department,
      location: input.location ?? null,
      contractValue: new Prisma.Decimal(input.contractValue),
      durationDays: input.durationDays,
      baselineDays: input.baselineDays,
      baselineQuality: input.baselineQuality,
      scopeUnits: input.scopeUnits,
      scopeUnitLabel: input.scopeUnitLabel,
      status: 'ACTIVE',
      origin: challenge.origin,
      scenarioId: challenge.scenarioId,
    });

    await milestoneRepo.createMany(
      tx,
      input.milestones.map((m, i) => ({
        pilotId: pilot.id,
        code: m.code,
        title: m.title,
        description: m.description,
        payment: new Prisma.Decimal(m.payment),
        evidenceRequired: m.evidenceRequired,
        dueOn: new Date(m.dueOn),
        // Only the first milestone is workable; the rest unlock in sequence.
        status: i === 0 ? MilestoneStatus.IN_PROGRESS : MilestoneStatus.LOCKED,
      })),
    );

    await metricRepo.create(tx, {
      pilotId: pilot.id,
      name: input.primaryMetric.name,
      unit: input.primaryMetric.unit,
      baselineValue: input.primaryMetric.baselineValue,
      targetValue: input.primaryMetric.targetValue,
      method: input.primaryMetric.method,
      isPrimary: true,
    });

    await challengeRepo.setStatus(tx, challengeId, ChallengeStatus.PILOT_READY);

    await audit.record(tx, {
      actorUserId: u.id,
      subjectType: 'StartupMatch',
      subjectId: match.id,
      action: AuditAction.MATCH_STATUS_CHANGED,
      detail: `Startup selected for pilot by ${u.displayName} (${u.role})`,
    });
    await audit.record(tx, {
      actorUserId: u.id,
      subjectType: 'Pilot',
      subjectId: pilot.id,
      action: AuditAction.PILOT_STATUS_CHANGED,
      detail: 'Pilot created and set ACTIVE',
    });

    return pilot;
  });
}

/* ------------------------------------------------------------------ */
/* Pilot execution                                                     */
/* ------------------------------------------------------------------ */

export async function getPilot(u: UserProfile, pilotId: string) {
  const pilot = await pilotRepo.findFull(prisma, pilotId);
  if (!pilot) throw new AppError('No such pilot', 404);

  // A startup sees only its own pilot; a government officer only one on a
  // challenge they own.
  if (u.role === UserRole.STARTUP) {
    if (pilot.startupId !== u.startupId) throw new AppError('No such pilot', 404);
  } else if (!isGovernment(u) && u.role !== UserRole.EVALUATOR) {
    throw new AppError('Not permitted', 403);
  }
  return pilot;
}

export const listOwnPilots = async (u: UserProfile) =>
  u.role === UserRole.STARTUP
    ? pilotRepo.listForStartup(prisma, ownStartupId(u))
    : pilotRepo.listForOwner(prisma, u.id);

/** The startup files evidence against a milestone or a metric. */
export async function submitEvidence(
  u: UserProfile,
  pilotId: string,
  input: { milestoneId?: string; metricId?: string; label: string; reference: string },
) {
  const startupId = ownStartupId(u);
  const pilot = await pilotRepo.findById(prisma, pilotId);
  if (!pilot || pilot.startupId !== startupId) throw new AppError('No such pilot', 404);
  if (input.milestoneId && input.metricId) {
    throw new AppError('Evidence attaches to a milestone or a metric, not both', 422);
  }

  const evidence = await evidenceRepo.create(prisma, {
    pilotId,
    milestoneId: input.milestoneId ?? null,
    metricId: input.metricId ?? null,
    label: input.label,
    reference: input.reference,
    submittedByUserId: u.id,
    submittedAt: new Date(),
    status: 'SUBMITTED',
  });

  if (input.milestoneId) {
    const milestone = await milestoneRepo.findById(prisma, input.milestoneId);
    if (milestone && milestone.status === MilestoneStatus.IN_PROGRESS) {
      await milestoneRepo.update(prisma, input.milestoneId, {
        status: MilestoneStatus.EVIDENCE_SUBMITTED,
      });
    }
  }

  await audit.record(prisma, {
    actorUserId: u.id,
    subjectType: 'PilotEvidence',
    subjectId: evidence.id,
    action: AuditAction.EVIDENCE_SUBMITTED,
    detail: `Evidence filed: ${input.label}`,
  });

  return evidence;
}

/** The department judges the evidence. A submission is not an accepted fact. */
export async function reviewEvidence(
  u: UserProfile,
  evidenceId: string,
  decision: 'ACCEPTED' | 'REJECTED',
  reviewNote?: string,
) {
  assertGovernment(u);
  const evidence = await evidenceRepo.findById(prisma, evidenceId);
  if (!evidence) throw new AppError('No such evidence', 404);

  const updated = await evidenceRepo.review(prisma, evidenceId, decision, u.id, reviewNote);
  await audit.record(prisma, {
    actorUserId: u.id,
    subjectType: 'PilotEvidence',
    subjectId: evidenceId,
    action: AuditAction.VALIDATION_RECORDED,
    detail: `Evidence ${decision.toLowerCase()}${reviewNote ? `: ${reviewNote}` : ''}`,
  });
  return updated;
}

/** Legal milestone transitions. Anything absent is refused. */
const TRANSITIONS: Record<MilestoneStatus, MilestoneStatus[]> = {
  LOCKED: [MilestoneStatus.IN_PROGRESS],
  IN_PROGRESS: [MilestoneStatus.EVIDENCE_SUBMITTED],
  EVIDENCE_SUBMITTED: [MilestoneStatus.APPROVED, MilestoneStatus.REJECTED],
  REJECTED: [MilestoneStatus.EVIDENCE_SUBMITTED],
  APPROVED: [MilestoneStatus.PAID],
  PAID: [],
};

/**
 * Approve a milestone.
 *
 * Requires every named artefact to be filed *and accepted*. Approving against
 * evidence nobody has judged would make the review step decorative, which is
 * the whole mechanism this milestone chain exists to enforce.
 */
export async function approveMilestone(u: UserProfile, milestoneId: string) {
  assertGovernment(u);
  const milestone = await milestoneRepo.findById(prisma, milestoneId);
  if (!milestone) throw new AppError('No such milestone', 404);

  if (!TRANSITIONS[milestone.status].includes(MilestoneStatus.APPROVED)) {
    throw new AppError(
      `Milestone ${milestone.code} cannot move from ${milestone.status} to APPROVED`,
      409,
    );
  }

  const accepted = milestone.evidence.filter((e) => e.status === 'ACCEPTED');
  if (accepted.length < milestone.evidenceRequired.length) {
    throw new AppError('Every required artefact must be filed and accepted before approval', 409, {
      required: milestone.evidenceRequired.length,
      accepted: accepted.length,
    });
  }

  const updated = await milestoneRepo.update(prisma, milestoneId, {
    status: MilestoneStatus.APPROVED,
    approvedBy: `${u.displayName}${u.designation ? ` · ${u.designation}` : ''}`,
    approvedAt: new Date(),
  });

  await audit.record(prisma, {
    actorUserId: u.id,
    subjectType: 'PilotMilestone',
    subjectId: milestoneId,
    action: AuditAction.MILESTONE_APPROVED,
    detail: `Milestone ${milestone.code} approved against ${accepted.length} accepted artefact(s)`,
  });
  return updated;
}

export async function rejectMilestone(u: UserProfile, milestoneId: string, reason: string) {
  assertGovernment(u);
  const milestone = await milestoneRepo.findById(prisma, milestoneId);
  if (!milestone) throw new AppError('No such milestone', 404);
  if (!TRANSITIONS[milestone.status].includes(MilestoneStatus.REJECTED)) {
    throw new AppError(`Milestone ${milestone.code} cannot be rejected from ${milestone.status}`, 409);
  }

  const updated = await milestoneRepo.update(prisma, milestoneId, {
    status: MilestoneStatus.REJECTED,
    rejectionReason: reason,
  });
  await audit.record(prisma, {
    actorUserId: u.id,
    subjectType: 'PilotMilestone',
    subjectId: milestoneId,
    action: AuditAction.MILESTONE_REJECTED,
    detail: `Milestone ${milestone.code} returned to the startup: ${reason}`,
  });
  return updated;
}

/**
 * Release payment.
 *
 * Reachable only from APPROVED. There is deliberately no argument to this
 * function that could skip that — releasing a tranche early requires editing
 * this file, which leaves a diff.
 */
export async function payMilestone(u: UserProfile, milestoneId: string) {
  assertGovernment(u);
  const milestone = await milestoneRepo.findById(prisma, milestoneId);
  if (!milestone) throw new AppError('No such milestone', 404);
  if (!TRANSITIONS[milestone.status].includes(MilestoneStatus.PAID)) {
    throw new AppError(
      `Payment requires an approved milestone; ${milestone.code} is ${milestone.status}`,
      409,
    );
  }

  return withTransaction(async (tx) => {
    const paid = await milestoneRepo.update(tx, milestoneId, {
      status: MilestoneStatus.PAID,
      paidAt: new Date(),
    });

    // Unlock the next milestone in the chain.
    const chain = await milestoneRepo.listForPilot(tx, milestone.pilotId);
    const next = chain.find((m) => m.status === MilestoneStatus.LOCKED);
    if (next) await milestoneRepo.update(tx, next.id, { status: MilestoneStatus.IN_PROGRESS });

    await audit.record(tx, {
      actorUserId: u.id,
      subjectType: 'PilotMilestone',
      subjectId: milestoneId,
      action: AuditAction.PAYMENT_RELEASED,
      detail: `Payment released against approved milestone ${milestone.code}`,
    });
    return paid;
  });
}

/** Record a KPI measurement. Government only — a startup cannot grade itself. */
export async function recordMeasurement(u: UserProfile, metricId: string, achievedValue: number) {
  assertGovernment(u);
  const metric = await metricRepo.findById(prisma, metricId);
  if (!metric) throw new AppError('No such metric', 404);

  const updated = await metricRepo.record(prisma, metricId, achievedValue, new Date());
  await audit.record(prisma, {
    actorUserId: u.id,
    subjectType: 'Pilot',
    subjectId: metric.pilotId,
    action: AuditAction.VALIDATION_RECORDED,
    detail: `${metric.name} measured at ${achievedValue} ${metric.unit} against a target of ${metric.targetValue}`,
  });
  return updated;
}

/**
 * Close the pilot.
 *
 * The outcome is computed from the primary metric rather than supplied, so it
 * cannot disagree with the measurement. A pilot with no measurement cannot be
 * closed at all: "we did not measure" is not an outcome.
 */
export async function closePilot(
  u: UserProfile,
  pilotId: string,
  failureCauses: string[] = [],
) {
  assertGovernment(u);
  const pilot = await pilotRepo.findFull(prisma, pilotId);
  if (!pilot) throw new AppError('No such pilot', 404);
  if (pilot.status === 'CLOSED') throw new AppError('This pilot is already closed', 409);

  const primary = pilot.metrics.find((m) => m.isPrimary);
  if (!primary || primary.achievedValue === null) {
    throw new AppError('The primary metric must be measured before the pilot can close', 409);
  }

  const improving = (primary.baselineValue ?? 0) >= primary.targetValue;
  const met = improving
    ? primary.achievedValue <= primary.targetValue
    : primary.achievedValue >= primary.targetValue;

  const span = Math.abs((primary.baselineValue ?? 0) - primary.targetValue) || 1;
  const progress = Math.abs((primary.baselineValue ?? 0) - primary.achievedValue) / span;
  const outcome = met ? 'TARGET_MET' : progress >= 0.5 ? 'PARTIALLY_MET' : 'TARGET_MISSED';

  if (outcome !== 'TARGET_MET' && failureCauses.length === 0) {
    throw new AppError('A pilot that did not meet its target must record at least one cause', 422, {
      hint: 'The cause becomes a precondition on the next comparable challenge.',
    });
  }

  const updated = await pilotRepo.setStatus(prisma, pilotId, {
    status: 'CLOSED',
    outcome,
    failureCauses: failureCauses as never,
  });

  await audit.record(prisma, {
    actorUserId: u.id,
    subjectType: 'Pilot',
    subjectId: pilotId,
    action: AuditAction.PILOT_STATUS_CHANGED,
    detail: `Pilot closed with outcome ${outcome} (${primary.achievedValue} ${primary.unit} against target ${primary.targetValue})`,
  });

  return updated;
}

/* ------------------------------------------------------------------ */
/* Scale decision                                                      */
/* ------------------------------------------------------------------ */

export async function recordScaleDecision(
  u: UserProfile,
  pilotId: string,
  input: { decision: 'SCALE' | 'EXTEND_PILOT' | 'STOP'; rationale: string },
) {
  assertGovernment(u);
  const pilot = await pilotRepo.findFull(prisma, pilotId);
  if (!pilot) throw new AppError('No such pilot', 404);
  if (pilot.status !== 'CLOSED') {
    throw new AppError('A scale decision requires a closed pilot', 409);
  }
  if (pilot.scaleDecision) throw new AppError('This pilot already carries a decision', 409);

  const decision = await scaleDecisionRepo.create(prisma, {
    pilotId,
    decision: input.decision,
    rationale: input.rationale,
    decidedByUserId: u.id,
    decidedAt: new Date(),
  });

  await audit.record(prisma, {
    actorUserId: u.id,
    subjectType: 'ScaleDecision',
    subjectId: decision.id,
    action: AuditAction.SCALE_DECISION_RECORDED,
    detail: `${input.decision} decided by ${u.displayName}: ${input.rationale}`,
  });

  return decision;
}

/** The lifecycle trail for one pilot, for the audit view. */
export async function pilotAuditTrail(u: UserProfile, pilotId: string) {
  const pilot = await getPilot(u, pilotId);
  return audit.pilotTrail(
    prisma,
    pilotId,
    pilot.milestones.map((m) => m.id).concat(pilot.evidence.map((e) => e.id)),
  );
}
