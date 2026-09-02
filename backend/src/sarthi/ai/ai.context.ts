import { Prisma } from '@prisma/client';
import { prisma } from '../../workflow/repositories';
import type { AiOutput, GroundingIndex } from './ai.contract';

/**
 * Context assembly.
 *
 * The rule this file implements is "do not send arbitrary database dumps to
 * the model". Each builder reads exactly the records a task needs, reduces them
 * to a small structured object, and returns three things together:
 *
 *   facts     what the model is shown
 *   index     what the model is permitted to cite, derived from the same reads
 *   fallback  the answer the platform gives when there is no model
 *
 * Returning the fallback from here rather than from the service is the point
 * worth defending. The deterministic answer and the model's answer are built
 * from one set of records, in one place, so they cannot disagree about what the
 * database says — and the fallback is written first, which keeps it a real
 * answer rather than an apology for the absence of a model.
 *
 * Nothing here computes a score. Scores arrive already computed on
 * `StartupMatch` and are passed through as facts.
 */

export interface AiContext {
  facts: Record<string, unknown>;
  index: GroundingIndex;
  fallback: AiOutput;
  subject: { type: string; id: string; label: string };
}

/* ---------------------------------------------------------------- helpers */

const money = (d: Prisma.Decimal | null): number | null => (d === null ? null : Number(d));

/** A count phrased so zero reads as absence rather than as a measured zero. */
const countPhrase = (n: number, singular: string, plural = `${singular}s`): string =>
  n === 0 ? `No ${plural} on file` : `${n} ${n === 1 ? singular : plural} on file`;

const pct = (n: number): string => `${Math.round(n * 100)}%`;

/** The name a reader would use. */
const nameOf = (s: { displayName: string | null; legalName: string }): string =>
  s.displayName || s.legalName;

/**
 * The standing caveat for a demonstration record.
 *
 * Present on every fallback and every prompt for a DEMO row, because the one
 * sentence that must never go missing is the one saying this is not real
 * government data.
 */
const originNote = (origin: string): string =>
  origin === 'DEMO'
    ? 'This is a DEMO record in the Sarthi demonstration dataset. It is not real government data and nothing in it is verified.'
    : origin === 'USER_ENTERED'
      ? 'Self-declared by the company. Nothing in it has been independently checked.'
      : 'Backed by a cited evidence source.';

/* -------------------------------------------------------------- challenge */

/**
 * A challenge, and what the department has actually specified about it.
 *
 * Used for the briefing an officer reads before opening discovery. Deliberately
 * excludes matches and responses: a briefing is about the problem, and mixing
 * in candidate companies is how a briefing becomes a shortlist.
 */
export async function challengeContext(challengeId: string): Promise<AiContext> {
  const c = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: { _count: { select: { responses: true, matches: true, pilots: true } } },
  });
  if (!c) throw new Error('Challenge not found');

  const facts = {
    challenge: {
      title: c.title,
      department: c.department,
      domain: c.domain,
      problemStatement: c.problemStatement,
      technologies: c.technologies,
      targetMetric: c.targetMetric,
      targetValue: c.targetValue,
      budgetEnvelope: money(c.budgetEnvelope),
      pilotDurationDays: c.pilotDurationDays,
      status: c.status,
      origin: c.origin,
      provenanceNote: originNote(c.origin),
    },
    activity: {
      responsesReceived: c._count.responses,
      matchesGenerated: c._count.matches,
      pilotsRunning: c._count.pilots,
    },
  };

  /* What the department has left unstated, computed rather than guessed at. */
  const unstated: string[] = [];
  if (c.targetValue === null) unstated.push('No target value for the stated metric');
  if (c.budgetEnvelope === null) unstated.push('No budget envelope');
  if (c.pilotDurationDays === null) unstated.push('No pilot duration');
  if (c.technologies.length === 0) unstated.push('No technology expectations recorded');

  const fallback: AiOutput = {
    summary: `${c.title} — ${c.department}, in the ${c.domain} domain. Success is measured on ${c.targetMetric}${
      c.targetValue !== null ? ` against a target of ${c.targetValue}` : ', for which no target value has been set'
    }. ${c._count.responses} response(s) received and ${c._count.matches} match(es) generated.`,
    strengths: [
      `Problem statement recorded in full (${c.problemStatement.length} characters).`,
      c.technologies.length > 0
        ? `Technology expectations stated: ${c.technologies.join(', ')}.`
        : 'Open on technology, which widens the candidate pool.',
    ],
    limitations: unstated.length > 0 ? unstated : ['Specification is complete on every recorded field.'],
    evidenceUsed: [],
    missingEvidence: unstated,
    questions: [
      c.targetValue === null
        ? `What target value on "${c.targetMetric}" would the department accept as success?`
        : `How will "${c.targetMetric}" be measured during the pilot, and by whom?`,
    ],
    recommendationExplanation: '',
  };

  return {
    facts,
    index: { citable: [] }, // A challenge specification cites nothing.
    fallback,
    subject: { type: 'Challenge', id: c.id, label: c.title },
  };
}

/* ---------------------------------------------------------------- startup */

/**
 * A company and its dossier.
 *
 * Serves both the company summary and the evidence summary — the same records
 * answer "who are they" and "what have they filed", and reading them twice
 * would be two chances to disagree.
 */
export async function startupContext(startupId: string): Promise<AiContext> {
  const s = await prisma.startup.findUnique({
    where: { id: startupId },
    include: {
      documents: {
        include: { document: { select: { title: true, kind: true, origin: true } } },
        orderBy: { category: 'asc' },
      },
      fundingRounds: { orderBy: { announcedOn: 'desc' } },
      participations: { include: { program: true } },
      _count: { select: { pilots: true, responses: true, matches: true } },
    },
  });
  if (!s) throw new Error('Startup not found');

  const documents = s.documents.map((d) => ({
    title: d.label || d.document.title,
    category: d.category,
    origin: d.document.origin,
  }));

  const programmes = s.participations.map((p) => ({
    programme: p.program.name,
    operator: p.program.operator,
    edition: p.edition,
    outcome: p.outcome,
    // The sponsoring department lives on the participation, not the programme:
    // one programme can place a company with several departments, and that
    // spread is the signal worth counting.
    department: p.sponsoringDepartment,
    workOrderValue: money(p.workOrderValue),
  }));

  const facts = {
    company: {
      name: nameOf(s),
      legalName: s.legalName,
      sector: s.sector,
      industry: s.industry,
      stage: s.stage,
      location: [s.city, s.state].filter(Boolean).join(', ') || null,
      foundedYear: s.foundedYear,
      teamSize: s.teamSize,
      oneLineDescription: s.oneLineDescription,
      problemSolved: s.problemSolved,
      solutionSummary: s.solutionSummary,
      productSummary: s.productSummary,
      targetUsers: s.targetUsers,
      technologies: s.technologies,
      capabilities: s.capabilities,
      deploymentModel: s.deploymentModel,
      geographicCoverage: s.geographicCoverage,
      origin: s.origin,
      provenanceNote: originNote(s.origin),
    },
    traction: {
      deploymentCount: s.deploymentCount,
      customerCount: s.customerCount,
      revenueBand: s.revenueBand,
      commercializationStage: s.commercializationStage,
      // Nulls are left as nulls throughout: an unstated figure is unknown, and
      // a zero here would be read as a measured zero.
    },
    assurance: {
      compliance: s.complianceStatus,
      cybersecurity: s.cybersecurityStatus,
      dataPrivacy: s.dataPrivacyStatus,
      procurementReadiness: s.procurementReadiness,
      certifications: s.requiredCertifications,
    },
    pilotCapacity: {
      statedDurationDays: s.pilotDurationDays,
      estimatedBudget: money(s.estimatedPilotBudget),
      teamSummary: s.pilotTeamSummary,
      infrastructureRequirements: s.infrastructureRequirements,
      dependencies: s.implementationDependencies,
    },
    governmentExperience: {
      // The countable signal, and the prose, kept apart on purpose: the prose
      // cannot manufacture a programme the participations table does not hold.
      programmes,
      distinctDepartments: new Set(programmes.map((p) => p.department).filter(Boolean)).size,
      narrative: s.governmentExperienceSummary,
    },
    funding: s.fundingRounds.map((r) => ({
      round: r.roundType,
      amount: money(r.amount),
      announcedOn: r.announcedOn?.toISOString().slice(0, 10) ?? null,
    })),
    dossier: {
      documentCount: documents.length,
      documents,
    },
    platformActivity: {
      pilotsOnThisPlatform: s._count.pilots,
      challengeResponses: s._count.responses,
    },
  };

  /* Gaps, computed from the absent fields rather than described in prose. */
  const gaps: string[] = [];
  if (s.complianceStatus === 'NOT_PROVIDED') gaps.push('No compliance evidence provided');
  if (s.cybersecurityStatus === 'NOT_PROVIDED') gaps.push('No cybersecurity evidence provided');
  if (s.dataPrivacyStatus === 'NOT_PROVIDED') gaps.push('No data-privacy evidence provided');
  if (s.procurementReadiness === 'NOT_ASSESSED') gaps.push('Procurement readiness not assessed');
  if (documents.length === 0) gaps.push('No documents filed');
  if (programmes.length === 0) gaps.push('No recorded government programme participation');
  if (s.deploymentCount === null) gaps.push('Deployment count not stated');

  const fallback: AiOutput = {
    summary: `${nameOf(s)} works in ${s.sector}${s.city ? `, based in ${s.city}` : ''}. ${
      s.oneLineDescription || s.solutionSummary || 'No solution summary has been provided.'
    } ${countPhrase(documents.length, 'document')}; ${countPhrase(programmes.length, 'government programme participation', 'government programme participations')}.`,
    strengths: [
      s.technologies.length > 0 ? `Technologies: ${s.technologies.join(', ')}.` : 'No technologies listed.',
      s.deploymentCount !== null
        ? `${s.deploymentCount} deployment(s) reported.`
        : 'Deployment history not stated.',
      programmes.length > 0
        ? `Participated in ${programmes.map((p) => p.programme).join(', ')}.`
        : 'No government delivery history on record.',
    ],
    limitations: gaps.length > 0 ? gaps : ['Profile complete on every field the platform tracks.'],
    evidenceUsed: documents.slice(0, 5).map((d) => d.title),
    missingEvidence: gaps,
    questions: gaps.slice(0, 3).map((g) => `${g} — can the company supply it?`),
    recommendationExplanation: '',
  };

  return {
    facts,
    index: { citable: [...documents.map((d) => d.title), ...programmes.map((p) => p.programme)] },
    fallback,
    subject: { type: 'Startup', id: s.id, label: nameOf(s) },
  };
}

/* ------------------------------------------------------------------ match */

/**
 * A match: a challenge, a company, and the scores the engine computed.
 *
 * The scores are supplied as facts and the model is asked to explain them. It
 * is never asked what the score should be — that is the line between an
 * explanation and a second opinion, and the second opinion is the one that
 * would end up quoted in a procurement file.
 */
export async function matchContext(challengeId: string, startupId: string): Promise<AiContext> {
  const m = await prisma.startupMatch.findUnique({
    where: { challengeId_startupId: { challengeId, startupId } },
    include: {
      challenge: true,
      startup: {
        include: {
          documents: { include: { document: { select: { title: true } } } },
          participations: { include: { program: true } },
        },
      },
      evaluations: {
        where: { status: { in: ['SUBMITTED', 'FINAL'] } },
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
  });
  if (!m) throw new Error('No match exists for that challenge and company');

  const documents = m.startup.documents.map((d) => d.label || d.document.title);
  const programmes = m.startup.participations.map((p) => p.program.name);

  /* The weakest axis, computed here so the model explains it rather than picks it. */
  const axes: [string, number][] = [
    ['problem fit', m.problemFitScore],
    ['technical fit', m.technicalFitScore],
    ['deployment readiness', m.deploymentReadinessScore],
    ['government experience', m.governmentExperienceScore],
    ['evidence strength', m.evidenceStrengthScore],
    ['pilot readiness', m.pilotReadinessScore],
  ];
  const sorted = [...axes].sort((a, b) => a[1] - b[1]);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  const facts = {
    challenge: {
      title: m.challenge.title,
      department: m.challenge.department,
      domain: m.challenge.domain,
      problemStatement: m.challenge.problemStatement,
      technologies: m.challenge.technologies,
      targetMetric: m.challenge.targetMetric,
    },
    company: {
      name: nameOf(m.startup),
      sector: m.startup.sector,
      technologies: m.startup.technologies,
      capabilities: m.startup.capabilities,
      deploymentCount: m.startup.deploymentCount,
      origin: m.startup.origin,
      provenanceNote: originNote(m.startup.origin),
    },
    computedScores: {
      note: 'Computed by the platform. Authoritative. Explain these; do not re-score.',
      overall: m.overallScore,
      problemFit: m.problemFitScore,
      technicalFit: m.technicalFitScore,
      deploymentReadiness: m.deploymentReadinessScore,
      governmentExperience: m.governmentExperienceScore,
      evidenceStrength: m.evidenceStrengthScore,
      pilotReadiness: m.pilotReadinessScore,
      weakestAxis: weakest[0],
      strongestAxis: strongest[0],
    },
    scoreWorking: m.breakdown,
    engineRationale: m.rationale,
    matchStatus: m.status,
    humanEvaluations: m.evaluations.map((e) => ({
      recommendation: e.recommendation,
      compositeScore: e.compositeScore,
      status: e.status,
      comments: e.comments,
    })),
    dossier: { documentCount: documents.length, documents },
    governmentProgrammes: programmes,
  };

  const fallback: AiOutput = {
    summary: `${nameOf(m.startup)} scores ${pct(m.overallScore)} overall against "${m.challenge.title}". Its strongest axis is ${strongest[0]} (${pct(strongest[1])}) and its weakest is ${weakest[0]} (${pct(weakest[1])}). ${m.rationale}`,
    strengths: axes.filter(([, v]) => v >= 0.6).map(([k, v]) => `${k}: ${pct(v)}`),
    limitations: axes.filter(([, v]) => v < 0.5).map(([k, v]) => `${k}: ${pct(v)} — the weak part of this match`),
    evidenceUsed: documents.slice(0, 5),
    missingEvidence:
      m.evaluations.length === 0
        ? ['No human evaluation has been filed. This match is a suggestion, not an assessment.']
        : [],
    questions: [`What would raise ${weakest[0]} for this company on this challenge?`],
    recommendationExplanation: `A match is a ranked suggestion produced from stored company facts. It carries no procurement recommendation until an evaluator files one.`,
  };

  return {
    facts,
    index: { citable: [...documents, ...programmes] },
    fallback,
    subject: { type: 'StartupMatch', id: m.id, label: `${nameOf(m.startup)} × ${m.challenge.title}` },
  };
}

/* ------------------------------------------------------------------ pilot */

/**
 * A running or finished pilot: milestones, metrics, evidence, decision.
 *
 * Serves the plan draft, the progress analysis, the KPI explanation, the
 * outcome summary and the scale-decision explanation. All five are readings of
 * the same five tables, and the derived counts below are computed once here so
 * every one of them quotes the same numbers.
 */
export async function pilotContext(pilotId: string): Promise<AiContext> {
  const p = await prisma.pilot.findUnique({
    where: { id: pilotId },
    include: {
      challenge: true,
      startup: true,
      milestones: { orderBy: { dueOn: 'asc' } },
      metrics: { orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }] },
      evidence: { orderBy: { submittedAt: 'desc' } },
      scaleDecision: true,
    },
  });
  if (!p) throw new Error('Pilot not found');

  const milestones = p.milestones.map((m) => ({
    code: m.code,
    title: m.title,
    status: m.status,
    payment: money(m.payment),
    dueOn: m.dueOn.toISOString().slice(0, 10),
    evidenceRequired: m.evidenceRequired,
    rejectionReason: m.rejectionReason,
  }));

  const metrics = p.metrics.map((m) => ({
    name: m.name,
    unit: m.unit,
    method: m.method,
    isPrimary: m.isPrimary,
    baseline: m.baselineValue,
    target: m.targetValue,
    // Null means not yet measured. It is never rendered as zero.
    achieved: m.achievedValue,
    measuredAt: m.measuredAt?.toISOString().slice(0, 10) ?? null,
  }));

  const evidence = p.evidence.map((e) => ({
    label: e.label,
    status: e.status,
    submittedAt: e.submittedAt.toISOString().slice(0, 10),
    reviewNote: e.reviewNote,
  }));

  /* Derived state. Computed, never asked of the model. */
  const approved = milestones.filter((m) => m.status === 'APPROVED' || m.status === 'PAID').length;
  const paidValue = p.milestones
    .filter((m) => m.status === 'PAID')
    .reduce((sum, m) => sum + Number(m.payment), 0);
  const measured = metrics.filter((m) => m.achieved !== null);
  const unmeasured = metrics.filter((m) => m.achieved === null);
  const meetingTarget = measured.filter((m) => m.achieved !== null && m.achieved >= m.target);
  const primary = metrics.find((m) => m.isPrimary) ?? null;

  const facts = {
    pilot: {
      challenge: p.challenge.title,
      company: nameOf(p.startup),
      department: p.department,
      location: p.location,
      status: p.status,
      outcome: p.outcome,
      failureCauses: p.failureCauses,
      contractValue: money(p.contractValue),
      durationDays: p.durationDays,
      baselineDays: p.baselineDays,
      baselineQuality: p.baselineQuality,
      scope: `${p.scopeUnits} ${p.scopeUnitLabel}`,
      origin: p.origin,
      provenanceNote: originNote(p.origin),
    },
    derived: {
      note: 'Computed by the platform from the rows below. Authoritative.',
      milestonesTotal: milestones.length,
      milestonesApproved: approved,
      valuePaid: paidValue,
      metricsTotal: metrics.length,
      metricsMeasured: measured.length,
      metricsAwaitingMeasurement: unmeasured.length,
      metricsMeetingTarget: meetingTarget.length,
      primaryMetric: primary ? primary.name : null,
      evidenceAccepted: evidence.filter((e) => e.status === 'ACCEPTED').length,
      evidenceRejected: evidence.filter((e) => e.status === 'REJECTED').length,
      evidenceAwaitingReview: evidence.filter((e) => e.status === 'SUBMITTED').length,
    },
    milestones,
    metrics,
    evidence,
    scaleDecision: p.scaleDecision
      ? {
          decision: p.scaleDecision.decision,
          rationale: p.scaleDecision.rationale,
          decidedAt: p.scaleDecision.decidedAt.toISOString().slice(0, 10),
          note: 'Recorded by a named government officer. Not a model output.',
        }
      : null,
  };

  const gaps: string[] = [];
  if (unmeasured.length > 0) {
    gaps.push(`${unmeasured.length} metric(s) not yet measured: ${unmeasured.map((m) => m.name).join(', ')}`);
  }
  if (p.baselineQuality === 'NONE' || p.baselineQuality === 'PARTIAL') {
    gaps.push(`Baseline quality is ${p.baselineQuality} — outcome claims against it are weakly supported.`);
  }
  if (evidence.length === 0) gaps.push('No evidence filed against this pilot.');

  const fallback: AiOutput = {
    summary: `${nameOf(p.startup)} is running "${p.challenge.title}" for ${p.department} across ${p.scopeUnits} ${p.scopeUnitLabel}. Status ${p.status}${p.outcome ? `, outcome ${p.outcome}` : ''}. ${approved} of ${milestones.length} milestone(s) approved and ${measured.length} of ${metrics.length} metric(s) measured.`,
    strengths: [
      `${approved} of ${milestones.length} milestone(s) approved.`,
      meetingTarget.length > 0
        ? `Meeting target on ${meetingTarget.map((m) => m.name).join(', ')}.`
        : 'No metric is yet at target.',
      `Baseline quality: ${p.baselineQuality}.`,
    ],
    limitations: gaps.length > 0 ? gaps : ['Every tracked metric has been measured and every milestone reviewed.'],
    evidenceUsed: evidence.slice(0, 5).map((e) => e.label),
    missingEvidence: gaps,
    questions: unmeasured.length
      ? [`When will ${unmeasured[0].name} be measured, and by whose method?`]
      : ['Does the measured improvement hold outside the pilot scope?'],
    recommendationExplanation: p.scaleDecision
      ? `The scale decision on record is ${p.scaleDecision.decision}, recorded by a named officer with a stated rationale.`
      : 'No scale decision has been recorded. A scale decision requires a named officer and a written rationale.',
  };

  return {
    facts,
    index: {
      citable: [
        ...evidence.map((e) => e.label),
        ...metrics.map((m) => m.name),
        ...milestones.map((m) => m.title),
      ],
    },
    fallback,
    subject: { type: 'Pilot', id: p.id, label: `${nameOf(p.startup)} — ${p.challenge.title}` },
  };
}
