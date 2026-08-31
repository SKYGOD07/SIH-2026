import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, UserRole } from '@prisma/client';
import { canInviteUsers, env } from '../config/env';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

/**
 * Administrator provisioning.
 *
 * Government officers and evaluators are controlled accounts: there is no
 * public route that creates one, and no request body anywhere in the API that
 * can set a role. They exist because an administrator invited them here, which
 * is what makes "this user speaks for Pune Municipal Corporation" a claim the
 * platform can stand behind rather than a self-declaration.
 *
 * The Supabase secret key lives only in this process. It bypasses RLS and can
 * create users, so it is never returned, never logged, and never reaches a
 * client bundle.
 */

/** Roles an administrator may hand out. ADMIN is deliberately absent. */
export const INVITABLE_ROLES = [UserRole.GOVERNMENT_OFFICER, UserRole.EVALUATOR] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export function isInvitableRole(role: string): role is InvitableRole {
  return (INVITABLE_ROLES as readonly string[]).includes(role);
}

let adminClient: SupabaseClient | null = null;

/**
 * The privileged Supabase client, built lazily.
 *
 * Lazy because the rest of the API works without invitation support, and an
 * eagerly-constructed client would turn a missing optional secret into a boot
 * failure.
 */
function admin(): SupabaseClient {
  if (!canInviteUsers()) {
    throw new AppError(
      'Administrator invitations are not configured on this server',
      503,
      { hint: 'SUPABASE_SECRET_KEY is not set' },
    );
  }
  if (!adminClient) {
    adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}

export interface InviteInput {
  email: string;
  role: InvitableRole;
  displayName: string;
  departmentName?: string;
  designation?: string;
  /** Where the invitation link should land. */
  redirectTo?: string;
}

/**
 * Invite a government officer or evaluator.
 *
 * Order matters. Supabase creates the auth user first and returns its UUID; the
 * profile is written immediately afterwards carrying the authoritative role and
 * department. By the time the invited person first signs in, their profile
 * already exists with the right role, so `syncUserProfile` finds it and leaves
 * it alone rather than defaulting them to STARTUP.
 */
export async function inviteUser(input: InviteInput): Promise<UserProfile> {
  const { data, error } = await admin().auth.admin.inviteUserByEmail(input.email, {
    redirectTo: input.redirectTo,
  });

  if (error || !data?.user) {
    // Supabase's message is safe to surface (e.g. "user already registered")
    // and is the only useful thing an administrator can act on.
    throw new AppError(error?.message || 'Invitation could not be sent', 400);
  }

  return prisma.userProfile.upsert({
    where: { id: data.user.id },
    create: {
      id: data.user.id,
      email: input.email,
      displayName: input.displayName,
      role: input.role,
      departmentName: input.departmentName ?? null,
      designation: input.designation ?? null,
    },
    update: {
      displayName: input.displayName,
      role: input.role,
      departmentName: input.departmentName ?? null,
      designation: input.designation ?? null,
    },
  });
}

export interface ProvisionPatch {
  role?: InvitableRole;
  departmentName?: string | null;
  designation?: string | null;
  displayName?: string;
}

/**
 * Change an existing user's provisioning.
 *
 * Refuses to touch an ADMIN, and cannot grant ADMIN: privilege escalation
 * through this endpoint would make every other guard in the system decorative.
 * Promoting someone to administrator is a deliberate out-of-band act.
 */
export async function updateProvisioning(
  targetUserId: string,
  patch: ProvisionPatch,
): Promise<UserProfile> {
  const target = await prisma.userProfile.findUnique({ where: { id: targetUserId } });
  if (!target) throw new AppError('No such user', 404);

  if (target.role === UserRole.ADMIN) {
    throw new AppError('Administrator accounts cannot be modified through this API', 403);
  }

  return prisma.userProfile.update({
    where: { id: targetUserId },
    data: {
      ...(patch.role !== undefined && { role: patch.role }),
      ...(patch.displayName !== undefined && { displayName: patch.displayName }),
      ...(patch.departmentName !== undefined && { departmentName: patch.departmentName }),
      ...(patch.designation !== undefined && { designation: patch.designation }),
    },
  });
}

/**
 * Revoke or restore access.
 *
 * Implemented as a Supabase Auth ban rather than a column on UserProfile:
 * disabling someone has to stop them authenticating at all, and a flag this API
 * checks would still leave a valid token working against anything that forgot
 * to check it. The schema is unchanged, which this round wanted.
 */
export async function setAccessRevoked(targetUserId: string, revoked: boolean): Promise<void> {
  const target = await prisma.userProfile.findUnique({ where: { id: targetUserId } });
  if (!target) throw new AppError('No such user', 404);
  if (target.role === UserRole.ADMIN) {
    throw new AppError('Administrator accounts cannot be disabled through this API', 403);
  }

  const { error } = await admin().auth.admin.updateUserById(targetUserId, {
    ban_duration: revoked ? '876000h' : 'none',
  });
  if (error) throw new AppError(error.message || 'Could not change access', 400);
}

/** Onboarding overview for the administrator console. */
export async function listUsers() {
  const rows = await prisma.userProfile.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    displayName: r.displayName,
    role: r.role,
    departmentName: r.departmentName,
    designation: r.designation,
    createdAt: r.createdAt,
    /**
     * Whether the person has been through onboarding, inferred from the
     * placeholder `syncUserProfile` writes. Stated as an inference rather than
     * stored, because a stored flag and the actual fields drift apart.
     */
    onboardingComplete: r.displayName !== (r.email.split('@')[0] ?? ''),
  }));
}
