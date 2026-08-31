import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { validateRequest } from '../middleware/validate';
import { authenticate, requireRole, requireVerifiedEmail } from './authenticate';
import * as controller from './auth.controller';
import {
  inviteUserSchema,
  setAccessSchema,
  updateOwnProfileSchema,
  updateProvisioningSchema,
} from './auth.schemas';

/**
 * Authentication API.
 *
 * Note what is not here: there is no login route, no signup route and no logout
 * route. Supabase Auth owns those and the browser talks to it directly — adding
 * proxies here would be a second authentication system, with a second set of
 * bugs, for no gain.
 *
 * What this API owns is everything that follows a verified token: who the user
 * is inside Sarthi, what role they hold, and who is allowed to hand out roles.
 */
const router = Router();

/* --- the caller's own identity --- */

// Deliberately not behind `requireVerifiedEmail`: the OTP screen needs it.
router.get('/session', authenticate, controller.session);

router.patch(
  '/profile',
  authenticate,
  requireVerifiedEmail,
  validateRequest(updateOwnProfileSchema),
  controller.updateProfile,
);

/* --- administrator provisioning --- */

const adminOnly = [authenticate, requireVerifiedEmail, requireRole(UserRole.ADMIN)] as const;

router.get('/admin/users', ...adminOnly, controller.adminListUsers);

router.post(
  '/admin/invitations',
  ...adminOnly,
  validateRequest(inviteUserSchema),
  controller.adminInvite,
);

router.patch(
  '/admin/users/:userId',
  ...adminOnly,
  validateRequest(updateProvisioningSchema),
  controller.adminUpdateUser,
);

router.patch(
  '/admin/users/:userId/access',
  ...adminOnly,
  validateRequest(setAccessSchema),
  controller.adminSetAccess,
);

export default router;
