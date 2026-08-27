import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import driverRoutes from './driver.routes';
import vehicleRoutes from './vehicle.routes';
import orderRoutes from './order.routes';
import trackingRoutes from './tracking.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/drivers', driverRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/orders', orderRoutes);
router.use('/tracking', trackingRoutes);
router.use('/admin', adminRoutes);

export default router;
