import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../../auth/authenticate';
import { validateRequest } from '../../middleware/validate';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';
import * as sim from './pilotsim.service';

/**
 * Simulation routes.
 *
 * Every one is authenticated and the service re-checks the caller's role, so a
 * route added here without the guard still cannot leak. Identity comes from the
 * verified token and never from the body.
 */

const router = Router();
router.use(authenticate);

/** Wraps a handler so the caller's profile is always the source of identity. */
const h =
  <T>(fn: (req: Request, u: NonNullable<Request['profile']>) => Promise<T>, status = 200) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.profile) throw new AppError('Not authenticated', 401);
      return sendSuccess(res, await fn(req, req.profile), undefined, status);
    } catch (error) {
      return next(error);
    }
  };

const startSchema = z.object({
  body: z.object({
    challengeId: z.string().uuid(),
    // Bounded: the lower end keeps a smoke test quick, the upper end stops a
    // typo from queueing a job that runs until the process is restarted.
    runsPerCompany: z.number().int().min(50).max(20000).optional(),
    perturbationPasses: z.number().int().min(0).max(100).optional(),
    seed: z.number().int().min(0).max(2_000_000_000).optional(),
  }),
});

router.post(
  '/runs',
  validateRequest(startSchema),
  h(
    (req, u) =>
      sim.startRun(u, req.body.challengeId, {
        runsPerCompany: req.body.runsPerCompany,
        perturbationPasses: req.body.perturbationPasses,
        seed: req.body.seed,
      }),
    202,
  ),
);

router.get('/runs', h((req, u) => sim.listRuns(u, req.query.challengeId as string | undefined)));
router.get('/runs/:runId', h((req, u) => sim.getRun(u, req.params.runId)));
router.get(
  '/runs/:runId/results',
  h((req, u) =>
    sim.getResults(u, req.params.runId, Number(req.query.limit) || 100),
  ),
);
router.post('/runs/:runId/cancel', h((req, u) => sim.cancelRun(u, req.params.runId)));

export default router;
