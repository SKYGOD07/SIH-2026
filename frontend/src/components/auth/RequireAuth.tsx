'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type UserRole } from '@/lib/auth/AuthProvider';

/**
 * Client-side route guard for the console.
 *
 * This is **user experience, not security.** Anyone can edit client state; the
 * only thing standing between a request and the data is the backend's token
 * verification and role guard. This component exists so a signed-out visitor
 * sees a sign-in page instead of an empty console, and so a startup does not
 * spend time in a screen whose every request will 403.
 *
 * It renders nothing until auth resolves, which avoids the flash of a console
 * shell that then disappears.
 */
export function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: UserRole[];
}) {
  const router = useRouter();
  const { loading, user, profile, onboarding, error } = useAuth();

  useEffect(() => {
    // A background refresh is not a sign-out. Redirecting while one is in
    // flight would bounce a signed-in reader to /login on every tab switch.
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }
    // Verification gates the console. The backend refuses these requests too;
    // this only spares the user a screen of failures.
    if (onboarding && !onboarding.emailVerified) {
      router.replace('/signup/startup');
      return;
    }
    if (onboarding && !onboarding.profileComplete && profile?.role === 'STARTUP') {
      router.replace('/onboarding/startup');
    }
  }, [loading, user, profile, onboarding, router]);

  /*
   * Only the *first* resolution blanks the page.
   *
   * Once a profile is in hand, a later load is a background refresh and the
   * console keeps rendering through it. Gating on `loading` alone tore the
   * whole shell down and rebuilt it — replaying the maximise animation — every
   * time the auth client revalidated, which it does whenever the tab regains
   * focus. The reader experienced that as the application reloading on every
   * tab switch.
   */
  if (loading && !profile) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-void">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-chalk/40">
          Checking session…
        </p>
      </div>
    );
  }

  if (!user) return null;

  if (error) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-void px-5">
        <p className="max-w-sm rounded-[8px] border border-red-400/30 bg-red-400/[0.07] px-4 py-3 text-center text-[0.8125rem] leading-relaxed text-red-300">
          {error}
        </p>
      </div>
    );
  }

  if (roles && profile && !roles.includes(profile.role)) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-void px-5">
        <div className="max-w-sm text-center">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-chalk/40">
            Not available to your account
          </p>
          <p className="mt-3 text-[0.875rem] leading-relaxed text-chalk/55">
            This area is limited to {roles.map((r) => r.replace(/_/g, ' ').toLowerCase()).join(' and ')}{' '}
            accounts.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
