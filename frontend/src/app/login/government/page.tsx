import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/AuthShell';
import { SignInForm } from '@/components/auth/SignInForm';

export const metadata: Metadata = { title: 'Government sign in' };

/**
 * Government sign-in.
 *
 * There is no signup link on this page and no route behind one. Departmental
 * and evaluator accounts are issued by an administrator, which is what makes a
 * department attribution on a challenge mean something — a self-declared
 * "Executive Engineer, Pune Municipal Corporation" would be worth nothing.
 */
export default function GovernmentLoginPage() {
  return (
    <AuthShell
      eyebrow="Government"
      title="Sign in to your department account"
      back={{ href: '/login', label: 'Back' }}
      footer={
        <div className="space-y-3">
          <p className="rounded-[8px] border border-chalk/12 bg-chalk/[0.02] px-3.5 py-3 text-[0.8125rem] leading-relaxed text-chalk/55">
            Government access requires an administrator invitation. Departmental and
            evaluator accounts cannot be self-registered — if you have not received an
            invitation, contact your department administrator.
          </p>
          <p className="text-[0.8125rem] text-chalk/50">
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
