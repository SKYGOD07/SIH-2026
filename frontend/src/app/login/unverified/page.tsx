'use client';

import Link from 'next/link';
import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { AuthShell, Notice } from '@/components/auth/AuthShell';

/**
 * Signed in, but the address is not confirmed yet.
 *
 * A real state rather than an error: the account exists and the password
 * worked, but the backend refuses anything that does real work until Supabase
 * marks the address confirmed. Saying that plainly is better than bouncing the
 * reader to a signup form they have already completed.
 */
export default function UnverifiedPage() {
  const { user, signOut } = useAuth();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setError(null);
    setNotice(null);
    if (!user?.email) return setError('No address on this session.');
    const { error: e } = await getSupabaseClient().auth.resend({
      type: 'signup',
      email: user.email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (e) setError(e.message);
    else setNotice('A new confirmation link is on its way.');
  }

  return (
    <AuthShell
      eyebrow="Almost there"
      title="Confirm your email to continue"
      lede={
        user?.email
          ? `We need to confirm ${user.email} before this account can be used.`
          : 'This account has not been confirmed yet.'
      }
    >
      <Notice kind="error">{error}</Notice>
      <Notice kind="info">{notice}</Notice>

      <p className="text-[0.875rem] leading-relaxed text-chalk/55">
        Open the link we emailed you. It works on any device and signs you in.
      </p>

      <button
        type="button"
        onClick={resend}
        className="mt-5 w-full rounded-[8px] bg-signal px-4 py-2.5 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-void hover:opacity-90"
      >
        Send another link
      </button>

      <button
        type="button"
        onClick={() => void signOut()}
        className="mt-3 w-full font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-chalk/45 hover:text-signal"
      >
        Sign out
      </button>

      <p className="mt-5 text-[0.75rem] text-chalk/40">
        Invited by an administrator?{' '}
        <Link href="/login/government" className="text-chalk/60 hover:text-signal">
          Government sign in
        </Link>
      </p>
    </AuthShell>
  );
}
