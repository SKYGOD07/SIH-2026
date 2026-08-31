'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Field, Notice, SubmitButton } from '@/components/auth/AuthShell';

/**
 * Email and password sign-in.
 *
 * Shared by the startup and government screens. They are the same
 * authentication — the difference between a startup and a department account is
 * provisioning and authorisation, not the credential check — so a second copy
 * of this form would be two places for a sign-in bug to live.
 *
 * There is deliberately no OTP step here. Verification is a first-time event;
 * sending a code on every sign-in would train users to expect one and make a
 * phishing prompt indistinguishable from the real thing.
 */
export function SignInForm({ redirectTo = '/dashboard' }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const { error: signInError } = await getSupabaseClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      // Supabase returns one message for a wrong password and an unknown
      // address alike, which is the right behaviour: distinguishing them tells
      // an attacker which addresses are registered.
      setError(signInError.message);
      setBusy(false);
      return;
    }

    // The provider picks the new session up from onAuthStateChange; this only
    // moves the user off the form.
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate>
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
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <SubmitButton busy={busy}>Sign in</SubmitButton>
    </form>
  );
}
