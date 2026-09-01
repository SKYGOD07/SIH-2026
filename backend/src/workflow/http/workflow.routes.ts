import { NextFunction, Request, Response, Router } from 'express';
import type { UserProfile } from '@prisma/client';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';
import { validateRequest } from '../../middleware/validate';
import { authenticate, requireVerifiedEmail } from '../../auth/authenticate';
import * as svc from '../workflow.service';
import * as company from '../company.service';
import * as s from './workflow.schemas';

/**
 * The procurement lifecycle API.
 *
 * Every route is authenticated and email-verified. There is no public read of a
 * challenge, a match or a pilot: this is a departmental workflow, not a public
 * noticeboard, and what a caller may see depends on who they are.
 *
 * Role enforcement lives in the service rather than in route middleware,
 * because most of these rules are about *ownership* — this officer's challenge,
 * this startup's pilot — which a role guard cannot express. `requireRole` would
 * let any government officer act on any department's challenge.
 */
const router = Router();

router.use(authenticate, requireVerifiedEmail);

/** The caller's profile, guaranteed present by `authenticate`. */
function caller(req: Request): UserProfile {
  if (!req.profile) throw new AppError('Not authenticated', 401);
  return req.profile;
}

/** Wraps a handler so a rejected promise reaches the error handler. */
const h =
  (fn: (req: Request, user: UserProfile) => Promise<unknown>, status = 200, message?: string) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      return sendSuccess(res, await fn(req, caller(req)), message, status);
    } catch (error) {
      return next(error);
    }
  };

/* --- demonstration workspace --- */

router.get('/scenarios', h(() => svc.listScenarios()));
router.post(
  '/scenarios',
  validateRequest(s.createScenarioSchema),
  h((req, u) => svc.createScenario(u, req.body), 201, 'Simulation workspace created'),
);
router.delete(
  '/scenarios/:scenarioId',
  h(async (req, u) => {
    await svc.deleteScenario(u, req.params.scenarioId);
    return { deleted: req.params.scenarioId };
  }, 200, 'Workspace and every record it produced were removed'),
);

/* --- the company record --- */

router.get('/company/me', h((_req, u) => company.getOwnCompany(u)));
router.post(
  '/company',
  validateRequest(s.createCompanySchema),
  h((req, u) => company.createOwnCompany(u, req.body), 201, 'Company profile created'),
);
router.patch(
  '/company/me',
  validateRequest(s.companyProfileSchema),
  h((req, u) => company.updateOwnCompany(u, req.body), 200, 'Company profile saved'),
);
router.get(
  '/company/claimable/:scenarioId',
  h((req) => company.listClaimable(req.params.scenarioId)),
);
router.post(
  '/company/claim',
  validateRequest(s.claimCompanySchema),
  h((req, u) => company.claimCompany(u, req.body.startupId), 200, 'Company claimed'),
);

/* --- the government's dossier and document vault on a company --- */

router.get('/startups/:startupId/report', h((req, u) => company.companyReport(u, req.params.startupId)));
router.get('/startups/:startupId/dossier', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await company.governmentDossier(req.profile || null, req.params.startupId);
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
});

router.get('/startups/:startupId/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await company.getStartupDocuments(req.profile || null, req.params.startupId, req.query.category as string);
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
});

/* --- challenges --- */

router.post(
  '/challenges',
  validateRequest(s.createChallengeSchema),
  h((req, u) => svc.createChallenge(u, req.body), 201, 'Challenge created as a draft'),
);
router.get('/challenges/mine', h((_req, u) => svc.listOwnChallenges(u)));
router.get('/challenges/open', h((_req, u) => svc.listOpenChallenges(u)));
router.post(
  '/challenges/:challengeId/publish',
  h((req, u) => svc.publishChallenge(u, req.params.challengeId), 200, 'Challenge published'),
);
router.get(
  '/challenges/:challengeId/review',
  h((req, u) => svc.challengeForReview(u, req.params.challengeId)),
);

/* --- startup responses --- */

router.put(
  '/challenges/:challengeId/response',
  validateRequest(s.respondSchema),
  h((req, u) => svc.submitResponse(u, req.params.challengeId, req.body), 200, 'Response saved'),
);
router.get('/responses/mine', h((_req, u) => svc.listOwnResponses(u)));

/* --- matching and evaluation --- */

router.post(
  '/challenges/:challengeId/matches',
  h(
    (req, u) => svc.generateMatches(u, req.params.challengeId),
    200,
    'AI-assisted recommendations generated. These are not a decision.',
  ),
);
router.get(
  '/challenges/:challengeId/matches',
  h((req, u) => svc.rankedMatches(u, req.params.challengeId)),
);
router.post(
  '/matches/:matchId/evaluations',
  validateRequest(s.evaluationSchema),
  h((req, u) => svc.submitEvaluation(u, req.params.matchId, req.body), 201, 'Evaluation recorded'),
);

/* --- selection and the pilot --- */

router.post(
  '/challenges/:challengeId/pilot',
  validateRequest(s.createPilotSchema),
  h(
    (req, u) => svc.selectAndCreatePilot(u, req.params.challengeId, req.body),
    201,
    'Startup selected by a government user and pilot created',
  ),
);
router.get('/pilots/mine', h((_req, u) => svc.listOwnPilots(u)));
router.get('/pilots/:pilotId', h((req, u) => svc.getPilot(u, req.params.pilotId)));
router.get('/pilots/:pilotId/trail', h((req, u) => svc.pilotAuditTrail(u, req.params.pilotId)));

/* --- evidence --- */

router.post(
  '/pilots/:pilotId/evidence',
  validateRequest(s.submitEvidenceSchema),
  h((req, u) => svc.submitEvidence(u, req.params.pilotId, req.body), 201, 'Evidence filed'),
);
router.post(
  '/evidence/:evidenceId/review',
  validateRequest(s.reviewEvidenceSchema),
  h(
    (req, u) => svc.reviewEvidence(u, req.params.evidenceId, req.body.decision, req.body.reviewNote),
    200,
    'Evidence reviewed',
  ),
);

/* --- milestones: evidence -> approval -> payment --- */

router.post(
  '/milestones/:milestoneId/approve',
  h((req, u) => svc.approveMilestone(u, req.params.milestoneId), 200, 'Milestone approved'),
);
router.post(
  '/milestones/:milestoneId/reject',
  validateRequest(s.rejectMilestoneSchema),
  h(
    (req, u) => svc.rejectMilestone(u, req.params.milestoneId, req.body.reason),
    200,
    'Milestone returned to the startup',
  ),
);
router.post(
  '/milestones/:milestoneId/pay',
  h(
    (req, u) => svc.payMilestone(u, req.params.milestoneId),
    200,
    'Payment released against an approved milestone',
  ),
);

/* --- measurement, close, and the decision --- */

router.post(
  '/metrics/:metricId/measurement',
  validateRequest(s.measurementSchema),
  h(
    (req, u) => svc.recordMeasurement(u, req.params.metricId, req.body.achievedValue),
    200,
    'Measurement recorded',
  ),
);
router.post(
  '/pilots/:pilotId/close',
  validateRequest(s.closePilotSchema),
  h((req, u) => svc.closePilot(u, req.params.pilotId, req.body.failureCauses), 200, 'Pilot closed'),
);
router.post(
  '/pilots/:pilotId/scale-decision',
  validateRequest(s.scaleDecisionSchema),
  h(
    (req, u) => svc.recordScaleDecision(u, req.params.pilotId, req.body),
    201,
    'Decision recorded against the pilot evidence',
  ),
);

export default router;
