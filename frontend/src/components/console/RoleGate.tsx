'use client';

import { useAuth } from '@/lib/auth/AuthProvider';
import type { UserRole } from '@/lib/auth/AuthProvider';

/**
 * Show children only to the listed roles.
 *
 * A presentation control, not a security boundary — anything it hides is still
 * in the page source. It is used for the settings sections that are merely
 * *irrelevant* to most users, such as where a threshold is defined in code.
 * Anything genuinely sensitive is omitted by the backend from the response
 * instead, which is why the AI panel's configuration block is absent rather
 * than hidden for non-administrators.
 */
export function RoleGate({
  roles,
  children,
  fallback = null,
}: {
  roles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { loading, profile } = useAuth();
  if (loading || !profile) return <>{fallback}</>;
  return roles.includes(profile.role) ? <>{children}</> : <>{fallback}</>;
}
