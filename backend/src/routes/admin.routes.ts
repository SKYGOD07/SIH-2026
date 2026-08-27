import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/metrics', authenticate, requireRole(['ADMIN']), adminController.getDashboardMetrics);
router.get('/audit-logs', authenticate, requireRole(['ADMIN']), adminController.getAuditLogs);

export default router;
