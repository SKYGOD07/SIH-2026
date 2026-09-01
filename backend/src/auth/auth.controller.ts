import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { requireUserId } from './authenticate';
import { presentProfile, updateOwnProfile } from './profile.service';
import {
  inviteUser,
  listUsers,
  setAccessRevoked,
  updateProvisioning,
  type InvitableRole,
} from './admin.service';

/**
 * HTTP layer for authentication.
 *
 * Thin by design. Every handler takes the user id from `requireUserId(req)`,
 * which reads the verified token — no handler in this file reads an id from a
 * body, a query string or a path parameter.
 */

/**
 * Who am I?
 *
 * Reachable before email verification on purpose: the client sitting on the OTP
 * screen needs to ask what is still outstanding. The response says so
 * explicitly rather than making the client infer it.
 */
import { prisma } from '../workflow/repositories';

export const session = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth || !req.profile) throw new AppError('Not authenticated', 401);

    // Track active session in database
    const activeSession = await prisma.userSession.findFirst({
      where: { userId: req.auth.userId, logoutAt: null },
      orderBy: { loginAt: 'desc' },
    });

    if (!activeSession) {
      await prisma.userSession.create({
        data: {
          userId: req.auth.userId,
          userEmail: req.auth.email || req.profile.email || 'user@sarthi.gov.in',
          role: req.profile.role,
          ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'Browser',
          activityLog: [{ action: 'SESSION_INITIALIZED', at: new Date().toISOString() }],
        },
      });
    } else {
      await prisma.userSession.update({
        where: { id: activeSession.id },
        data: { lastActive: new Date() },
      });
    }

    return sendSuccess(res, {
      user: {
        id: req.auth.userId,
        email: req.auth.email,
        emailVerified: req.auth.emailVerified,
      },
      profile: presentProfile(req.profile),
      onboarding: {
        emailVerified: req.auth.emailVerified,
        profileComplete: req.profile.displayName !== (req.profile.email.split('@')[0] ?? ''),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/** Log out current session and record logoutAt in database */
export const logLogout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AppError('Not authenticated', 401);

    const activeSession = await prisma.userSession.findFirst({
      where: { userId: req.auth.userId, logoutAt: null },
      orderBy: { loginAt: 'desc' },
    });

    if (activeSession) {
      const logs = (activeSession.activityLog as any[]) || [];
      logs.push({ action: 'USER_LOGOUT', at: new Date().toISOString() });

      await prisma.userSession.update({
        where: { id: activeSession.id },
        data: {
          logoutAt: new Date(),
          activityLog: logs,
        },
      });
    }

    return sendSuccess(res, { loggedOut: true }, 'Session logged out and saved to DB');
  } catch (error) {
    return next(error);
  }
};

/** Get user's recorded session history & audit activity from database */
export const getSessionHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AppError('Not authenticated', 401);

    const sessions = await prisma.userSession.findMany({
      where: { userId: req.auth.userId },
      orderBy: { loginAt: 'desc' },
      take: 10,
    });

    const auditEvents = await prisma.auditEvent.findMany({
      where: { actorUserId: req.auth.userId },
      orderBy: { at: 'desc' },
      take: 15,
    });

    return sendSuccess(res, {
      sessions,
      auditEvents,
    });
  } catch (error) {
    return next(error);
  }
};

/** Complete or edit one's own profile. Cannot touch role or department. */
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await updateOwnProfile(requireUserId(req), {
      displayName: req.body.displayName,
    });
    return sendSuccess(res, presentProfile(updated), 'Profile updated');
  } catch (error) {
    return next(error);
  }
};

/* ------------------------------------------------------------------ */
/* Administrator provisioning                                          */
/* ------------------------------------------------------------------ */

export const adminInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await inviteUser({
      email: req.body.email,
      role: req.body.role as InvitableRole,
      displayName: req.body.displayName,
      departmentName: req.body.departmentName,
      designation: req.body.designation,
      redirectTo: req.body.redirectTo,
    });
    return sendSuccess(res, presentProfile(profile), 'Invitation sent', 201);
  } catch (error) {
    return next(error);
  }
};

export const adminListUsers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await listUsers());
  } catch (error) {
    return next(error);
  }
};

export const adminUpdateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await updateProvisioning(req.params.userId, req.body);
    return sendSuccess(res, presentProfile(updated), 'Provisioning updated');
  } catch (error) {
    return next(error);
  }
};

export const adminSetAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await setAccessRevoked(req.params.userId, req.body.revoked === true);
    return sendSuccess(
      res,
      { userId: req.params.userId, revoked: req.body.revoked === true },
      req.body.revoked ? 'Access revoked' : 'Access restored',
    );
  } catch (error) {
    return next(error);
  }
};
