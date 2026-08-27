import { Router } from 'express';
import { vehicleController } from '../controllers/vehicle.controller';

const router = Router();

router.get('/', vehicleController.getAllVehicles);
router.get('/:id', vehicleController.getVehicleById);

export default router;
