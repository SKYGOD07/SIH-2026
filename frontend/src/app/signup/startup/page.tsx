'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { AuthShell, Field, Notice, SubmitButton } from '@/components/auth/AuthShell';

/**
 * Startup registration — the only public signup in Sarthi.
 *
 * Confirmation is a link, not a typed code.
 *
 * The six-digit OTP screen this replaces required the same browser tab that
 * started the signup to still be open when the code arrived, because the email
 * address lived in component state. That is a reasonable assumption on a
 * developer's laptop and a poor one for a deployed site: readers open mail on a
 * phone, or an hour later, or in a different browser, and the code then has
 * nowhere to be typed. A link carries its own credential and works from
 * anywhere.
 *
 * The redirect is built from `window.location.origin` at the moment of signup,
 * so the same code sends readers back to localhost in development, to the
 * preview URL on a Vercel preview deployment, and to the production domain in
 * production — with no build-time variable to forget.
 */
export default function StartupSignupPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    if (password.length < 8) {
      setError('Choose a password of at least 8 characters.');
      setBusy(false);
      return;
    }

    const { data, error: signUpError } = await getSupabaseClient().auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setBusy(false);
      return;
    }

    // With confirmation enabled Supabase returns a user but no session. If the
    // project ever has confirmation switched off a session arrives immediately,
    // and the callback route handles that case too — so this screen does not
    // need to know which way the project is configured.
    if (data.session) {
      window.location.assign('/auth/callback');
      return;
    }

    setSent(true);
    setBusy(false);
  }

  async function resend() {
    setError(null);
    setNotice(null);
    const { error: resendError } = await getSupabaseClient().auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (resendError) setError(resendError.message);
    else setNotice('Another link is on its way.');
  }

  if (sent) {
    return (
      <AuthShell
        eyebrow="Startup · Step 2 of 2"
        title="Check your email"
        lede={`We sent a confirmation link to ${email.trim()}. Open it on any device to finish signing up.`}
        back={{ href: '/login/startup', label: 'Back to sign in' }}
      >
        <Notice kind="error">{error}</Notice>
        <Notice kind="info">{notice}</Notice>

        <p className="text-[0.875rem] leading-relaxed text-chalk/55">
          The link signs you in and brings you straight to your workspace. It can be used once and
          expires after a while — if it has lapsed, request another below.
        </p>

        <button
          type="button"
          onClick={resend}
          className="mt-5 w-full rounded-[8px] border border-chalk/20 px-4 py-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-chalk transition-colors hover:border-signal/60 hover:text-signal"
        >
          Send another link
        </button>

        <p className="mt-4 text-[0.75rem] leading-relaxed text-chalk/40">
          Nothing arrived? Check the spam folder. Mail can take a minute or two.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Startup · Step 1 of 2"
      title="Create a startup account"
      lede="Registration is open to any startup. Departmental accounts are issued separately by an administrator."
      back={{ href: '/login', label: 'Back' }}
      footer={
        <p className="text-[0.8125rem] text-chalk/50">
          Already registered?{' '}
          <Link href="/login/startup" className="text-signal hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={register} noValidate>
        <Notice kind="error">{error}</Notice>

        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="At least 8 characters."
        />

        <SubmitButton busy={busy}>Create account</SubmitButton>
      </form>
    </AuthShell>
  );
}
