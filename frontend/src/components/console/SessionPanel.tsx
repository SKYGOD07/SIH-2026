'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';

export function SessionPanel() {
  const { loading, user, profile } = useAuth();

  if (loading) {
    return (
      <section className="rounded-[12px] border border-chalk/[0.10] bg-void-lift/60 p-4">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-chalk/40">
          Session
        </span>
        <p className="mt-2.5 text-[0.75rem] text-chalk/45">Checking session authentication…</p>
      </section>
    );
  }

  if (!user || !profile) {
    return (
      <section className="rounded-[14px] border border-chalk/[0.10] bg-void-lift/60 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-chalk/40 font-bold">
            GOVERNMENT ACCOUNT
          </span>
        </div>
        <p className="text-[0.78125rem] font-semibold text-chalk">Standard Officer Console</p>
        <p className="text-[0.71875rem] leading-relaxed text-chalk/50">
          Review challenges, evaluate startup responses, and track pilots.
        </p>
        <div className="pt-2 border-t border-chalk/[0.08]">
          <Link
            href="/settings"
            className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-signal hover:underline"
          >
            Manage Session in Settings ↗
          </Link>
        </div>
      </section>
    );
  }

  const roleLabel = profile.role.replace(/_/g, ' ');

  return (
    <section className="rounded-[14px] border border-chalk/[0.12] bg-void-lift/80 p-4 space-y-3 shadow-lg">
      {/* Signed In Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-validated" />
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-validated font-bold">
            ACTIVE SESSION
          </span>
        </div>
        <Link
          href="/settings"
          className="font-mono text-[0.5625rem] text-chalk/40 hover:text-signal uppercase tracking-wider"
        >
          Settings ↗
        </Link>
      </div>

      {/* User Info */}
      <div>
        <h3 className="font-display text-[0.9375rem] font-extrabold leading-tight text-chalk">
          {profile.displayName}
        </h3>
        <p className="mt-0.5 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/50">
          {roleLabel}
        </p>
        {profile.departmentName && (
          <p className="mt-1 text-[0.75rem] leading-relaxed text-chalk/70">
            {profile.departmentName}
            {profile.designation ? ` · ${profile.designation}` : ''}
          </p>
        )}
      </div>
    </section>
  );
}
