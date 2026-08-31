'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { AuthShell, Field, Notice, SubmitButton } from '@/components/auth/AuthShell';

/**
 * Where an invitation link lands.
 *
 * The Supabase client is configured with `detectSessionInUrl`, so by the time
 * this renders it has already consumed the tokens the link carried and
 * established a session. All that remains is for the invited person to set a
 * password.
 *
 * What this screen conspicuously does not do is ask for a role or a department.
 * Those were assigned by the administrator who sent the invitation and are
 * already on the profile; offering them here would let an invited evaluator
 * promote themselves on the way in. The screen shows the assignment as
 * read-only so the person can check it is right — and tell the administrator if
 * it is not.
 */
export default function InviteCompletionPage() {
  const router = useRouter();
  const { user, profile, loading, refresh } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Give the client a moment to consume the URL hash before concluding the
    // link was bad.
    if (!loading && !user) {
      const t = setTimeout(() => router.replace('/login/government'), 1200);
      return () => clearTimeout(t);
    }
  }, [loading, user, router]);

  async function setPasswordAndContinue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) return setError('Choose a password of at least 8 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');

    setBusy(true);
    const { error: updateError } = await getSupabaseClient().auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setBusy(false);
      return;
    }

    await refresh();
    router.replace('/dashboard');
  }

  if (loading) {
    return (
      <AuthShell eyebrow="Invitation" title="Opening your invitation…">
        <p className="text-[0.875rem] text-chalk/50">One moment.</p>
      </AuthShell>
    );
  }

  if (!user) {
    return (
      <AuthShell
        eyebrow="Invitation"
        title="This invitation link is no longer valid"
        lede="Invitation links expire and can be used once. Ask your administrator to send a new one."
      >
        <p className="text-[0.875rem] text-chalk/50">Taking you to sign in…</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Invitation"
      title="Set your password"
      lede="Your account has been created by an administrator. Choose a password to finish."
    >
      {profile && (
        <dl className="mb-7 rounded-[10px] border border-chalk/12 bg-chalk/[0.02] p-4 text-[0.8125rem]">
          {[
            ['Account', profile.email],
            ['Role', profile.role.replace(/_/g, ' ').toLowerCase()],
            ['Department', profile.departmentName ?? '—'],
            ['Designation', profile.designation ?? '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-1">
              <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-chalk/40">
                {k}
              </dt>
              <dd className="text-right text-chalk/75">{v}</dd>
            </div>
          ))}
          <p className="mt-3 border-t border-chalk/10 pt-2.5 text-[0.75rem] leading-relaxed text-chalk/40">
            Assigned by your administrator. If anything here is wrong, ask them to correct it
            before you continue — it cannot be changed from this screen.
          </p>
        </dl>
      )}

      <form onSubmit={setPasswordAndContinue} noValidate>
        <Notice kind="error">{error}</Notice>

        <Field
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="At least 8 characters."
        />

        <Field
          label="Confirm password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <SubmitButton busy={busy}>Set password and continue</SubmitButton>
      </form>
    </AuthShell>
  );
}
