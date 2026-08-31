import { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { TokenError, verifyAccessToken, type AuthenticatedIdentity } from './verifyToken';
import { syncUserProfile, type SyncedProfile } from './profile.service';

/**
 * Authentication and authorisation middleware.
 *
 * The single rule this module exists to enforce: the authenticated identity
 * comes from a verified token and from nowhere else. `req.body.userId`,
 * `req.query.userId` and `req.params.userId` are never consulted for identity —
 * they are caller-supplied strings, and treating one as an identity is how an
 * API lets anybody act as anybody.
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by `authenticate`. Present only on authenticated routes. */
      auth?: AuthenticatedIdentity;
      /** Set by `authenticate`. The synchronised UserProfile. */
      profile?: SyncedProfile;
    }
  }
}

function bearerFrom(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim() || null;
}

/**
 * Require a valid Supabase access token, and synchronise the profile.
 *
 * The upsert happens here rather than only at signup because a user can be
 * created outside this API — an admin invitation, or the Supabase dashboard —
 * and would otherwise reach the application with no profile row. Doing it on
 * every authenticated request makes the first request self-healing, and the
 * upsert is idempotent so the repeat cost is one indexed lookup.
 */
export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const token = bearerFrom(req);
  if (!token) {
    return next(new AppError('Authorization header missing or malformed', 401));
  }

  try {
    const identity = await verifyAccessToken(token);
    req.auth = identity;
    req.profile = await syncUserProfile(identity);
    return next();
  } catch (error) {
    if (error instanceof TokenError) {
      return next(new AppError('Invalid or expired access token', 401));
    }
    return next(error);
  }
};

/**
 * Require a confirmed email address.
 *
 * Kept separate from `authenticate` so the session endpoint stays reachable
 * before verification — the client needs to be able to ask "who am I and what
 * do I still owe?" while sitting on the OTP screen. Everything that does real
 * work sits behind this.
 */
export const requireVerifiedEmail = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.auth) return next(new AppError('Not authenticated', 401));
  if (!req.auth.emailVerified) {
    return next(
      new AppError('Email address is not yet verified', 403, {
        code: 'EMAIL_NOT_VERIFIED',
      }),
    );
  }
  return next();
};

/**
 * Require one of the given roles.
 *
 * The role is read from the persisted profile, not from the token: role lives
 * in the application's own table and is assigned by provisioning, so a user who
 * edits their own JWT claims — or simply posts a role in a request body —
 * changes nothing here.
 */
export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth || !req.profile) return next(new AppError('Not authenticated', 401));
    if (!roles.includes(req.profile.role)) {
      return next(new AppError('Access denied: insufficient permissions', 403));
    }
    return next();
  };

/** The authenticated user id, or a 500 if a route forgot `authenticate`. */
export function requireUserId(req: Request): string {
  if (!req.auth?.userId) {
    throw new AppError('Route is missing the authenticate middleware', 500);
  }
  return req.auth.userId;
}
