import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/AuthShell';

export const metadata: Metadata = { title: 'Sign in' };

/**
 * The entry point, and the one screen that states the platform's access model.
 *
 * The two paths are not two authentication systems — both are Supabase Auth.
 * They differ in provisioning: a startup registers itself, a department account
 * is issued. Saying that here, rather than hiding a missing signup button, is
 * the honest version: a government officer who arrives without an invitation
 * needs to know that is the process, not wonder whether the page is broken.
 */
export default function LoginSelectorPage() {
  return (
    <AuthShell
      wide
      eyebrow="Sarthi"
      title="Welcome to Sarthi"
      lede="The innovation procurement pathway for Government of Maharashtra departments and the startups that serve them."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="flex flex-col rounded-[12px] border border-chalk/12 bg-chalk/[0.02] p-6">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal">
            Startup
          </p>
          <h2 className="mt-2.5 font-display text-[1.125rem] font-bold tracking-[-0.01em] text-chalk">
            Register or sign in
          </h2>
          <p className="mt-2.5 flex-1 text-[0.8125rem] leading-relaxed text-chalk/55">
            Open to any startup. Create an account, verify your email, and complete your
            profile to be discoverable against departmental challenges.
          </p>
          <Link
            href="/login/startup"
            className="mt-6 block rounded-[8px] bg-signal px-4 py-2.5 text-center font-mono text-[0.75rem] uppercase tracking-[0.12em] text-void transition-opacity hover:opacity-90"
          >
            Continue as Startup
          </Link>
        </section>

        <section className="flex flex-col rounded-[12px] border border-chalk/12 bg-chalk/[0.02] p-6">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-chalk/45">
            Government
          </p>
          <h2 className="mt-2.5 font-display text-[1.125rem] font-bold tracking-[-0.01em] text-chalk">
            Sign in to your department account
          </h2>
          <p className="mt-2.5 flex-1 text-[0.8125rem] leading-relaxed text-chalk/55">
            Departmental and evaluator accounts are issued by an administrator. There is no
            public registration.
          </p>
          <Link
            href="/login/government"
            className="mt-6 block rounded-[8px] border border-chalk/25 px-4 py-2.5 text-center font-mono text-[0.75rem] uppercase tracking-[0.12em] text-chalk transition-colors hover:border-signal/60 hover:text-signal"
          >
            Continue as Government
          </Link>
        </section>
      </div>
    </AuthShell>
  );
}
