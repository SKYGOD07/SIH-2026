import { Request, Response, NextFunction } from 'express';
import { driverService } from '../services/driver.service';
import { sendSuccess } from '../utils/response';

export class DriverController {
  async getAllDrivers(req: Request, res: Response, next: NextFunction) {
    try {
      const drivers = await driverService.getAllDrivers();
      return sendSuccess(res, drivers, 'Drivers fetched successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getDriverById(req: Request, res: Response, next: NextFunction) {
    try {
      const driver = await driverService.getDriverById(req.params.id);
      return sendSuccess(res, driver, 'Driver fetched successfully');
    } catch (err) {
      return next(err);
    }
  }

  async updateAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await driverService.updateAvailability(
        req.params.id,
        req.body.isAvailable
      );
      return sendSuccess(res, result, 'Driver availability updated successfully');
    } catch (err) {
      return next(err);
    }
  }
}

export const driverController = new DriverController();
