import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/AuthShell';
import { SignInForm } from '@/components/auth/SignInForm';

export const metadata: Metadata = { title: 'Startup sign in' };

export default function StartupLoginPage() {
  return (
    <AuthShell
      eyebrow="Startup"
      title="Sign in"
      back={{ href: '/login', label: 'Back' }}
      footer={
        <div className="space-y-2.5 text-[0.8125rem] text-chalk/50">
          <p>
            New here?{' '}
            <Link href="/signup/startup" className="text-signal hover:underline">
              Create a startup account
            </Link>
          </p>
          <p>
            <Link href="/login/forgot" className="text-chalk/60 hover:text-signal">
              Forgotten your password?
            </Link>
          </p>
        </div>
      }
    >
      <SignInForm />
    </AuthShell>
  );
}
