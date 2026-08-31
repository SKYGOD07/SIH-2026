'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { AuthShell, Field, Notice, SubmitButton } from '@/components/auth/AuthShell';

/**
 * Startup registration — the only public signup in Sarthi.
 *
 * Two steps in one route rather than two pages, because the second step is
 * meaningless without the first: an OTP screen reached directly has no address
 * to verify against, and a user who reloads midway would land on a form that
 * cannot work. Keeping the email in component state makes that impossible.
 *
 * Verification is Supabase Auth's own email OTP. There is deliberately no
 * `otp_codes` table in this project: a second implementation of something the
 * auth provider already does correctly is a second thing to get wrong, and it
 * would have to store a credential.
 */
export default function StartupSignupPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
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

    const { error: signUpError } = await getSupabaseClient().auth.signUp({
      email: email.trim(),
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setBusy(false);
      return;
    }

    setNotice(`We sent a 6-digit code to ${email.trim()}.`);
    setStep('verify');
    setBusy(false);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const { error: verifyError } = await getSupabaseClient().auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });

    if (verifyError) {
      setError(verifyError.message);
      setBusy(false);
      return;
    }

    // Verification establishes the session. Pull the profile the backend
    // created on the first authenticated request, then collect the rest.
    await refresh();
    router.replace('/onboarding/startup');
  }

  async function resend() {
    setError(null);
    setNotice(null);
    const { error: resendError } = await getSupabaseClient().auth.resend({
      type: 'signup',
      email: email.trim(),
    });
    if (resendError) setError(resendError.message);
    else setNotice('A new code is on its way.');
  }

  if (step === 'verify') {
    return (
      <AuthShell
        eyebrow="Startup · Step 2 of 3"
        title="Verify your email"
        lede="Enter the 6-digit code we sent you. Verification is required once; ordinary sign-in afterwards is email and password only."
        back={{ href: '/login/startup', label: 'Back to sign in' }}
      >
        <form onSubmit={verify} noValidate>
          <Notice kind="error">{error}</Notice>
          <Notice kind="info">{notice}</Notice>

          <Field
            label="Verification code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
          />

          <SubmitButton busy={busy}>Verify and continue</SubmitButton>

          <button
            type="button"
            onClick={resend}
            className="mt-4 w-full font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-chalk/45 transition-colors hover:text-signal"
          >
            Resend code
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Startup · Step 1 of 3"
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
