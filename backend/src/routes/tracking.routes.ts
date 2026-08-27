import { Router } from 'express';
import { z } from 'zod';
import { trackingController } from '../controllers/tracking.controller';
import { validateRequest } from '../middleware/validate';

const router = Router();

const recordTelemetrySchema = z.object({
  body: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    speed: z.number().optional(),
    heading: z.number().optional(),
  }),
});

router.get('/:orderId', trackingController.getLiveTracking);
router.post('/telemetry', validateRequest(recordTelemetrySchema), trackingController.recordTelemetry);

export default router;
