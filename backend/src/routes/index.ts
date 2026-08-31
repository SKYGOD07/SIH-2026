import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from '../auth/auth.routes';
import sarthiRoutes from '../sarthi/http/sarthi.routes';
import workflowRoutes from '../workflow/http/workflow.routes';

const router = Router();

router.use('/health', healthRoutes);

// Identity: who the caller is inside Sarthi, and who may hand out roles.
// Sign-in, sign-up and sign-out belong to Supabase Auth, not to this API.
router.use('/auth', authRoutes);

// The procurement lifecycle: challenge → match → evaluation → pilot →
// milestones/KPI/evidence → scale decision. Every route authenticated.
router.use('/workflow', workflowRoutes);

// Sarthi — the pilot design simulator. Still in-memory; orthogonal to the
// lifecycle above and scheduled for its own round.
router.use('/sarthi', sarthiRoutes);

export default router;
