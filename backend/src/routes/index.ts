import { Router } from 'express';
import healthRoutes from './health.routes';
import sarthiRoutes from '../sarthi/http/sarthi.routes';

const router = Router();

router.use('/health', healthRoutes);

// Sarthi — the innovation procurement pathway.
router.use('/sarthi', sarthiRoutes);

export default router;
