import { Request, Response, NextFunction } from 'express';
import { vehicleService } from '../services/vehicle.service';
import { sendSuccess } from '../utils/response';

export class VehicleController {
  async getAllVehicles(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicles = await vehicleService.getAllVehicles();
      return sendSuccess(res, vehicles, 'Vehicles retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getVehicleById(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicle = await vehicleService.getVehicleById(req.params.id);
      return sendSuccess(res, vehicle, 'Vehicle details retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }
}

export const vehicleController = new VehicleController();
