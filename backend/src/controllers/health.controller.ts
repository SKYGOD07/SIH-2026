import { Request, Response } from 'express';

export class HealthController {
  check(req: Request, res: Response) {
    return res.status(200).json({
      success: true,
      message: 'Sarthi API is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
}

export const healthController = new HealthController();
