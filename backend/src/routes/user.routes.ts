import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, requireRole(['ADMIN', 'DISPATCHER']), userController.getAllUsers);
router.get('/:id', authenticate, userController.getUserById);

export default router;
