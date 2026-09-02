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
    /*
     * Verification gates the console. The backend refuses these requests too;
     * this only spares the reader a screen of failures.
     *
     * It no longer redirects to the signup page: that page has no verification
     * step any more, and sending a *government* user there was wrong in the
     * first place — they never signed up, they were invited. Both roles now get
     * the same honest instruction, which is to open the link they were emailed.
     */
    if (onboarding && !onboarding.emailVerified) {
      router.replace('/login/unverified');
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
      <div className="flex min-h-svh flex-col items-center justify-center bg-void px-5 text-center">
        <div className="max-w-md rounded-[12px] border border-risk/30 bg-risk/[0.08] p-5">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-risk font-bold">
            Connection Notice
          </p>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-chalk/80">
            {error}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3 border-t border-chalk/10 pt-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-md bg-signal px-3 py-1.5 font-mono text-[0.6875rem] uppercase tracking-wider text-void font-bold hover:bg-signal/90"
            >
              Retry
            </button>
            <a
              href="/"
              className="font-mono text-[0.6875rem] uppercase tracking-wider text-chalk/60 hover:text-chalk underline"
            >
              Return Home
            </a>
          </div>
        </div>
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
