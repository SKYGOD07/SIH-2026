import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import { services } from '../container';
import { SimulationRequest, PilotRecord } from '../domain/types';

/**
 * HTTP layer.
 *
 * Thin by design: parse, delegate, respond. No branching on domain rules here —
 * those live in the services, where they are testable without a request object
 * and cannot be bypassed by adding a second route later.
 *
 * Validation has already run in middleware by the time these are reached, so the
 * casts below are safe rather than hopeful.
 */

export const simulate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await services.simulator.simulate(req.body as SimulationRequest);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const ask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question, decisionOwner } = req.body as {
      question: string;
      decisionOwner?: string;
    };
    const answer = services.rag.answer(question, decisionOwner);
    // An unanswerable question is a 200 with `unanswered: true`, not a 404:
    // the corpus was searched successfully and returned nothing relevant, which
    // is a legitimate answer and one the interface needs to show verbatim.
    return sendSuccess(res, answer);
  } catch (error) {
    return next(error);
  }
};

export const getLedger = async (req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await services.ledger.get(req.params.pilotId));
  } catch (error) {
    return next(error);
  }
};

export const getLedgerTrail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await services.ledger.trail(req.params.pilotId));
  } catch (error) {
    return next(error);
  }
};

export const submitEvidence = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pilotId, milestoneId } = req.params;
    const { actor, evidence } = req.body;
    const ledger = await services.ledger.submitEvidence(pilotId, milestoneId, actor, evidence);
    return sendSuccess(res, ledger, 'Evidence filed and awaiting departmental validation');
  } catch (error) {
    return next(error);
  }
};

export const approveMilestone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pilotId, milestoneId } = req.params;
    const ledger = await services.ledger.approve(pilotId, milestoneId, req.body.actor);
    return sendSuccess(res, ledger, 'Milestone approved; payment may now be released');
  } catch (error) {
    return next(error);
  }
};

export const rejectMilestone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pilotId, milestoneId } = req.params;
    const { actor, reason } = req.body;
    const ledger = await services.ledger.reject(pilotId, milestoneId, actor, reason);
    return sendSuccess(res, ledger, 'Milestone returned to the startup');
  } catch (error) {
    return next(error);
  }
};

export const payMilestone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pilotId, milestoneId } = req.params;
    const ledger = await services.ledger.pay(pilotId, milestoneId, req.body.actor);
    return sendSuccess(res, ledger, 'Payment released against approved evidence');
  } catch (error) {
    return next(error);
  }
};

export const closePilot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await services.feedback.close(req.body as PilotRecord);
    return sendSuccess(
      res,
      result,
      'Pilot closed and written to the corpus; future simulations will draw on it',
      201,
    );
  } catch (error) {
    return next(error);
  }
};

export const corpusCoverage = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await services.feedback.coverage());
  } catch (error) {
    return next(error);
  }
};

/**
 * Everything the department console needs, in one call.
 *
 * The dashboard would otherwise fan out to four endpoints and stitch the result
 * together on the client, which puts the shape of the page into the browser.
 */
export const dashboard = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const coverage = await services.feedback.coverage();
    const ledger = await services.ledger.get('PL-3311');
    const summary = await services.ledger.summary('PL-3311');

    const awaiting = ledger.milestones
      .filter((m) => m.status === 'EVIDENCE_SUBMITTED')
      .map((m) => ({
        pilotId: ledger.pilotId,
        milestoneId: m.id,
        code: m.code,
        title: m.title,
        payment: m.payment,
        filed: m.evidence.length,
      }));

    return sendSuccess(res, {
      corpus: coverage,
      pilot: { id: ledger.pilotId, ...summary },
      awaitingValidation: awaiting,
      milestones: ledger.milestones.map((m) => ({
        id: m.id,
        code: m.code,
        title: m.title,
        status: m.status,
        payment: m.payment,
        dueOn: m.dueOn,
      })),
    });
  } catch (error) {
    return next(error);
  }
};
