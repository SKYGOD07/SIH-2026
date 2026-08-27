import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { sendSuccess } from '../utils/response';

export class AdminController {
  async getDashboardMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await adminService.getDashboardMetrics();
      return sendSuccess(res, metrics, 'Admin dashboard metrics retrieved');
    } catch (err) {
      return next(err);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await adminService.getAuditLogs();
      return sendSuccess(res, logs, 'System audit logs retrieved');
    } catch (err) {
      return next(err);
    }
  }
}

export const adminController = new AdminController();
