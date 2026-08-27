import { Router } from 'express';
import { z } from 'zod';
import { driverController } from '../controllers/driver.controller';
import { validateRequest } from '../middleware/validate';

const router = Router();

const updateAvailabilitySchema = z.object({
  body: z.object({
    isAvailable: z.boolean(),
  }),
});

router.get('/', driverController.getAllDrivers);
router.get('/:id', driverController.getDriverById);
router.patch(
  '/:id/availability',
  validateRequest(updateAvailabilitySchema),
  driverController.updateAvailability
);

export default router;
