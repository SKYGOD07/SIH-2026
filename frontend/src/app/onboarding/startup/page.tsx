'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthProvider';
import { AuthShell, Field, Notice, SubmitButton } from '@/components/auth/AuthShell';

/**
 * Profile completion, after verification.
 *
 * Note which fields are here: a display name, and nothing else. Role,
 * department and designation are absent by design — they are privileged
 * assignments, the backend schema for this endpoint does not accept them, and a
 * startup that could type "GOVERNMENT_OFFICER" into its own profile would make
 * every authorisation check downstream meaningless.
 *
 * The richer startup record — sector, stage, DPIIT status — belongs to the
 * `Startup` model and is a later round. Collecting it now would mean writing
 * company facts with no source attached, which this project does not do.
 */
export default function StartupOnboardingPage() {
  const router = useRouter();
  const { user, profile, loading, onboarding, refresh } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login/startup');
  }, [loading, user, router]);

  useEffect(() => {
    if (profile && !displayName) {
      // Seed only from a name the user actually chose. The backend's
      // placeholder is the local part of the email, which is not a name.
      if (onboarding?.profileComplete) setDisplayName(profile.displayName);
    }
  }, [profile, onboarding, displayName]);

  if (loading) {
    return (
      <AuthShell eyebrow="Startup" title="Loading…">
        <p className="text-[0.875rem] text-chalk/50">Checking your session.</p>
      </AuthShell>
    );
  }

  if (user && onboarding && !onboarding.emailVerified) {
    return (
      <AuthShell
        eyebrow="Startup"
        title="Verify your email first"
        lede="Your account exists but the address has not been confirmed. Protected areas stay closed until it is."
        back={{ href: '/signup/startup', label: 'Back to verification' }}
      >
        <p className="text-[0.875rem] leading-relaxed text-chalk/55">
          Return to the verification step and enter the code we emailed you.
        </p>
      </AuthShell>
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await fetchApi('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      await refresh();
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.');
      setBusy(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Startup · Step 3 of 3"
      title="Complete your profile"
      lede="Your email is verified. Tell us what to call you."
    >
      <form onSubmit={save} noValidate>
        <Notice kind="error">{error}</Notice>

        <Field
          label="Display name"
          name="displayName"
          required
          minLength={2}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name or your company's"
          hint="Shown alongside anything you submit."
        />

        <SubmitButton busy={busy} disabled={displayName.trim().length < 2}>
          Finish
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
