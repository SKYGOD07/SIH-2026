import { Prisma, UserProfile, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import type { AuthenticatedIdentity } from './verifyToken';

/**
 * UserProfile synchronisation.
 *
 * Supabase Auth owns `auth.users`; this table is the application's own view of
 * the same person, keyed by the identical UUID. Synchronisation is done here in
 * TypeScript rather than by a Postgres trigger on `auth.users`, so the rule is
 * visible in the repository, testable, and changeable without a migration.
 *
 * Two invariants hold everywhere in this file:
 *
 *   1. A public signup can only ever produce STARTUP. Role is never read from a
 *      request. GOVERNMENT_OFFICER, EVALUATOR and ADMIN exist only because an
 *      administrator provisioned them.
 *
 *   2. The upsert never downgrades an existing profile. An invited government
 *      officer has a profile row before they ever sign in; their first request
 *      must not overwrite the role that invitation assigned.
 */

export type SyncedProfile = UserProfile;

/** The one role a person can obtain without an administrator. */
const SELF_SERVE_ROLE: UserRole = UserRole.STARTUP;

/**
 * Return the caller's profile, creating it if this is their first request.
 *
 * Idempotent by construction: the create branch runs only when no row exists,
 * and the update branch touches only fields Supabase Auth owns (the email
 * address), never role or department.
 */
export async function syncUserProfile(identity: AuthenticatedIdentity): Promise<SyncedProfile> {
  const existing = await prisma.userProfile.findUnique({ where: { id: identity.userId } });

  if (existing) {
    // Keep the address in step with Supabase Auth, which owns it. Nothing else
    // is synchronised: role and department are the application's to assign.
    if (identity.email && identity.email !== existing.email) {
      return prisma.userProfile.update({
        where: { id: identity.userId },
        data: { email: identity.email },
      });
    }
    return existing;
  }

  if (!identity.email) {
    throw new AppError('Cannot create a profile for a user with no email address', 422);
  }

  try {
    return await prisma.userProfile.create({
      data: {
        id: identity.userId,
        email: identity.email,
        // A placeholder the onboarding form replaces. Deliberately the local
        // part of the address rather than an invented human name.
        displayName: identity.email.split('@')[0] ?? 'New user',
        role: SELF_SERVE_ROLE,
      },
    });
  } catch (error) {
    // Two concurrent first requests race here; the loser reads the winner's row
    // rather than failing, which is what makes this safe to call on every call.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const row = await prisma.userProfile.findUnique({ where: { id: identity.userId } });
      if (row) return row;
    }
    throw error;
  }
}

/**
 * Fields a user may change about themselves.
 *
 * Note what is absent: `role`, `departmentName`, `designation` and `startupId`.
 * Those are privileged assignments. A startup user editing their own profile
 * cannot become a government officer, and a government officer cannot move
 * themselves into another department to see its challenges.
 */
export interface SelfEditableProfile {
  displayName: string;
}

export async function updateOwnProfile(
  userId: string,
  patch: SelfEditableProfile,
): Promise<SyncedProfile> {
  return prisma.userProfile.update({
    where: { id: userId },
    data: { displayName: patch.displayName },
  });
}

/**
 * What the client is allowed to see about itself.
 *
 * A serialiser rather than returning the row directly, so a column added later
 * is not exposed by accident.
 */
export function presentProfile(profile: UserProfile) {
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.displayName,
    role: profile.role,
    departmentName: profile.departmentName,
    designation: profile.designation,
    startupId: profile.startupId,
    createdAt: profile.createdAt,
  };
}
