'use client';

import Link from 'next/link';
import { useAuth, type UserRole } from '@/lib/auth/AuthProvider';
import { workspaceFor } from '@/lib/nav/workspaces';

/**
 * Keeps a reader inside their own workspace.
 *
 * This is **navigation, not protection.** It exists so a startup who types a
 * government URL, follows a stale bookmark, or is sent a link by a teammate
 * gets a clear explanation and a way back — instead of a page of failed
 * requests. Every piece of data behind these routes is guarded by the API
 * against a verified token, and that guard is what actually decides.
 *
 * It offers a route home rather than redirecting silently. A reader who lands
 * somewhere they cannot go should be told why; a redirect that just happens
 * reads as the application losing their click.
 */
export function RoleGate({
  roles,
  children,
}: {
  roles: UserRole[];
  children: React.ReactNode;
}) {
  const { loading, profile } = useAuth();

  // Nothing is asserted until the role is known. Rendering the refusal first
  // and correcting it a moment later would accuse the reader of trespassing on
  // their own workspace.
  if (loading || !profile) return null;

  if (roles.includes(profile.role)) return <>{children}</>;

  const home = workspaceFor(profile.role);
  const permitted = roles.map((r) => r.replace(/_/g, ' ').toLowerCase()).join(' and ');

  return (
    <div className="flex min-h-[60svh] items-center justify-center px-5">
      <div className="max-w-sm text-center">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-signal">
          Not your workspace
        </p>
        <h1 className="mt-3 font-display text-[1.25rem] font-bold leading-tight text-chalk">
          This area belongs to {permitted} accounts
        </h1>
        <p className="mt-3 text-[0.875rem] leading-relaxed text-chalk/55">
          You are signed in as a {profile.role.replace(/_/g, ' ').toLowerCase()} account. Your
          own workspace has the equivalent view.
        </p>
        <Link
          href={home.home}
          className="mt-6 inline-block rounded-[8px] bg-signal px-4 py-2.5 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-void transition-opacity hover:opacity-90"
        >
          Go to {home.name}
        </Link>
      </div>
    </div>
  );
}
