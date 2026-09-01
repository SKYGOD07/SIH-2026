'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { workspaceFor } from '@/lib/nav/workspaces';

/**
 * The old shared console address, now a router.
 *
 * `/dashboard` used to render one page for everybody, which is what made a
 * startup and a government officer look like the same product. It is kept as a
 * route rather than deleted because links to it exist — in bookmarks, in the
 * sign-in redirect, and in this repository's own history — and a 404 would be
 * a worse answer than a redirect to the workspace the reader actually has.
 *
 * `replace` rather than `push`, so Back does not return here and bounce again.
 */
export default function DashboardRedirect() {
  const router = useRouter();
  const { loading, user, profile } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    router.replace(workspaceFor(profile?.role).home);
  }, [loading, user, profile, router]);

  return (
    <div className="flex min-h-[50svh] items-center justify-center">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-chalk/40">
        Opening your workspace…
      </p>
    </div>
  );
}
