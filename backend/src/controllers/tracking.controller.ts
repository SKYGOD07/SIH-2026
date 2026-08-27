import { Request, Response, NextFunction } from 'express';
import { trackingService } from '../services/tracking.service';
import { sendSuccess } from '../utils/response';

export class TrackingController {
  async getLiveTracking(req: Request, res: Response, next: NextFunction) {
    try {
      const tracking = await trackingService.getLiveTracking(req.params.orderId);
      return sendSuccess(res, tracking, 'Live tracking telemetry retrieved');
    } catch (err) {
      return next(err);
    }
  }

  async recordTelemetry(req: Request, res: Response, next: NextFunction) {
    try {
      const recorded = await trackingService.recordTelemetry(req.body);
      return sendSuccess(res, recorded, 'Telemetry point saved', 201);
    } catch (err) {
      return next(err);
    }
  }
}

export const trackingController = new TrackingController();
