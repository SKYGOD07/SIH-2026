'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Card, Pill } from '@/components/console/primitives';
import { Icon } from '@/components/console/Icon';
import { UserSessionHistoryModal } from '@/components/console/UserSessionHistoryModal';

export function SessionSettingsCard() {
  const { loading, user, profile, signOut } = useAuth();
  const [showSessionModal, setShowSessionModal] = useState(false);

  if (loading) {
    return (
      <Card>
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-chalk/40">
          Session Management
        </span>
        <p className="mt-2 text-[0.8125rem] text-chalk/50">Loading session authentication details…</p>
      </Card>
    );
  }

  if (!user || !profile) {
    return (
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal font-bold">
            Session & Authentication
          </span>
          <Pill tone="risk">NO ACTIVE SESSION</Pill>
        </div>

        <p className="text-[0.8125rem] leading-relaxed text-chalk/65">
          You are currently not signed in. Sign in using a departmental or startup account to manage challenges, evaluations, and pilot evidence.
        </p>

        <div className="flex flex-wrap gap-3 pt-2 border-t border-chalk/[0.08]">
          <Link
            href="/login/government"
            className="rounded-lg bg-signal px-4 py-2.5 font-mono text-[0.75rem] font-bold text-void uppercase tracking-wider hover:bg-signal/90 transition-colors"
          >
            Government Officer Login
          </Link>
          <Link
            href="/login/startup"
            className="rounded-lg bg-chalk/10 border border-chalk/20 px-4 py-2.5 font-mono text-[0.75rem] font-bold text-chalk uppercase tracking-wider hover:bg-chalk/20 transition-colors"
          >
            Startup Login
          </Link>
        </div>
      </Card>
    );
  }

  const roleLabel = profile.role.replace(/_/g, ' ');

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-validated animate-pulse" />
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-validated font-bold">
            AUTHENTICATED SESSION
          </span>
        </div>
        <Pill tone="signal">{roleLabel}</Pill>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 pt-2">
        <div>
          <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/40">
            Account Holder
          </span>
          <p className="mt-0.5 font-display text-[1rem] font-bold text-chalk">{profile.displayName}</p>
          <p className="text-[0.75rem] text-chalk/50">{profile.email}</p>
        </div>

        {profile.departmentName && (
          <div>
            <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/40">
              Department & Designation
            </span>
            <p className="mt-0.5 font-display text-[0.9375rem] font-bold text-chalk">
              {profile.departmentName}
            </p>
            {profile.designation && (
              <p className="text-[0.75rem] text-chalk/50">{profile.designation}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-chalk/[0.08]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSessionModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-chalk/[0.08] hover:bg-chalk/[0.14] px-3.5 py-2 font-mono text-[0.6875rem] font-bold text-chalk uppercase tracking-wider transition-colors"
          >
            <Icon name="file" className="h-3.5 w-3.5 text-chalk/60" />
            Session Audit Logs (DB)
          </button>
        </div>

        <button
          type="button"
          onClick={async () => {
            try {
              let API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000').replace(/\/$/, '');
              if (!API_BASE.endsWith('/api')) API_BASE = `${API_BASE}/api`;
              await fetch(`${API_BASE}/auth/session/logout`, { method: 'POST' });
            } catch {}
            signOut();
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-risk/15 hover:bg-risk/25 border border-risk/30 px-3.5 py-2 font-mono text-[0.6875rem] font-bold text-risk uppercase tracking-wider transition-colors"
        >
          <Icon name="alert" className="h-3.5 w-3.5 text-risk" />
          End Session / Logout
        </button>
      </div>

      {showSessionModal && (
        <UserSessionHistoryModal
          userEmail={profile.email}
          userRole={profile.role}
          onClose={() => setShowSessionModal(false)}
        />
      )}
    </Card>
  );
}
