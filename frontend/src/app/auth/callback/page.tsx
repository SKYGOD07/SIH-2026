'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { workspaceFor } from '@/lib/nav/workspaces';
import { AuthShell } from '@/components/auth/AuthShell';

/**
 * Where a confirmation link lands.
 *
 * Replaces the six-digit code screen. A typed OTP needs the browser that typed
 * it to still hold the signup state, which is exactly what breaks on a deployed
 * site: the reader opens the mail on a phone, or an hour later, or in another
 * browser, and the code has nowhere to go. A link carries its own credential
 * and works from any device — so the flow is now signup → check your inbox →
 * click → signed in.
 *
 * The Supabase client is configured with `detectSessionInUrl`, so by the time
 * this renders it has already consumed the token the link carried. All that is
 * left is to decide where the reader belongs, which follows from their role.
 *
 * No origin is hardcoded anywhere. The link is built from
 * `window.location.origin` at signup time, so the same code works on localhost,
 * on a Vercel preview deployment and in production without a build-time
 * variable that someone will eventually forget to change.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { loading, user, profile } = useAuth();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Surface an error the link itself reports, rather than sitting on a
    // spinner while the reader wonders whether it worked.
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash.includes('error')) {
      setFailed(true);
      return;
    }

    if (loading) return;

    if (!user) {
      // Give the client a moment to consume the token before concluding the
      // link was bad; `detectSessionInUrl` resolves asynchronously.
      const t = setTimeout(() => setFailed(true), 2500);
      return () => clearTimeout(t);
    }

    router.replace(workspaceFor(profile?.role).home);
  }, [loading, user, profile, router]);

  if (failed) {
    return (
      <AuthShell
        eyebrow="Sign in"
        title="This link is no longer valid"
        lede="Confirmation links expire and can be used once. Sign in with your password, or request a new link."
      >
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="rounded-[8px] bg-signal px-4 py-2.5 text-center font-mono text-[0.75rem] uppercase tracking-[0.12em] text-void hover:opacity-90"
          >
            Go to sign in
          </Link>
          <Link
            href="/login/forgot"
            className="text-center font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-chalk/50 hover:text-signal"
          >
            Send a new link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Sign in" title="Confirming your account…">
      <p className="text-[0.875rem] leading-relaxed text-chalk/55">
        One moment. You will be taken to your workspace.
      </p>
    </AuthShell>
  );
}
