'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { AuthShell, Field, Notice, SubmitButton } from '@/components/auth/AuthShell';

/**
 * Password reset request.
 *
 * The response is the same whether or not the address is registered. That is
 * deliberate: a form that says "no such account" is an account enumeration
 * oracle, and for a platform whose users include named government officers,
 * confirming which official addresses are registered is a real disclosure.
 *
 * The reset link lands on the invitation screen, which sets a password against
 * whatever session the link established — the two flows need the same thing.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const { error: resetError } = await getSupabaseClient().auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}/auth/invite` : undefined,
      },
    );

    // Only a transport failure is surfaced. An unknown address is not an error
    // the user gets to observe.
    if (resetError && resetError.status && resetError.status >= 500) {
      setError('Could not send the email just now. Please try again.');
      setBusy(false);
      return;
    }

    setSent(true);
    setBusy(false);
  }

  if (sent) {
    return (
      <AuthShell
        eyebrow="Password reset"
        title="Check your email"
        lede={`If an account exists for ${email.trim()}, a reset link is on its way.`}
        back={{ href: '/login', label: 'Back to sign in' }}
      >
        <p className="text-[0.875rem] leading-relaxed text-chalk/55">
          The link opens a page where you can set a new password. It expires after a short
          time and can be used once.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Password reset"
      title="Reset your password"
      lede="We will email you a link to set a new one."
      back={{ href: '/login', label: 'Back' }}
      footer={
        <p className="text-[0.8125rem] text-chalk/50">
          Remembered it?{' '}
          <Link href="/login" className="text-signal hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} noValidate>
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
        <SubmitButton busy={busy}>Send reset link</SubmitButton>
      </form>
    </AuthShell>
  );
}
