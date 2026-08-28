import { Router } from 'express';
import { validateRequest } from '../../middleware/validate';
import * as controller from './mahainnovate.controller';
import {
  approveSchema,
  askSchema,
  closePilotSchema,
  rejectSchema,
  simulateSchema,
  submitEvidenceSchema,
} from './mahainnovate.schemas';

/**
 * MahaInnovate API.
 *
 * Grouped by the stage of the pathway each endpoint serves, so the route file
 * reads in the same order as the product does.
 */
const router = Router();

/* --- 05 Simulate: design the pilot from evidence, before funding it --- */
router.post('/simulate', validateRequest(simulateSchema), controller.simulate);

/* --- 03 Screen: answer policy questions by quoting the clause --- */
router.post('/ask', validateRequest(askSchema), controller.ask);

/* --- 07/08 Contract, measure and pay --- */
router.get('/pilots/:pilotId/ledger', controller.getLedger);
router.get('/pilots/:pilotId/ledger/trail', controller.getLedgerTrail);
router.post(
  '/pilots/:pilotId/milestones/:milestoneId/evidence',
  validateRequest(submitEvidenceSchema),
  controller.submitEvidence,
);
router.post(
  '/pilots/:pilotId/milestones/:milestoneId/approve',
  validateRequest(approveSchema),
  controller.approveMilestone,
);
router.post(
  '/pilots/:pilotId/milestones/:milestoneId/reject',
  validateRequest(rejectSchema),
  controller.rejectMilestone,
);
router.post(
  '/pilots/:pilotId/milestones/:milestoneId/pay',
  validateRequest(approveSchema),
  controller.payMilestone,
);

/* --- the loop: a closed pilot becomes evidence for the next one --- */
router.post('/corpus/close', validateRequest(closePilotSchema), controller.closePilot);
router.get('/corpus/coverage', controller.corpusCoverage);

/* --- the department console --- */
router.get('/dashboard', controller.dashboard);

export default router;
