'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { UserSessionHistoryModal } from '@/components/console/UserSessionHistoryModal';
import { Icon } from '@/components/console/Icon';

export function SessionPanel() {
  const { loading, user, profile, signOut } = useAuth();
  const [showSessionModal, setShowSessionModal] = useState(false);

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
      <section className="rounded-[14px] border border-chalk/[0.10] bg-void-lift/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal font-bold">
            NO SESSION
          </span>
          <span className="font-mono text-[0.5625rem] text-chalk/40 uppercase">Demo simulation</span>
        </div>

        <p className="text-[0.75rem] leading-relaxed text-chalk/60">
          Sign in to review challenges, compare startups and manage pilots.
        </p>

        {/* Login Controls */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-chalk/[0.08]">
          <Link
            href="/login/government"
            className="rounded-lg bg-signal px-3 py-2 text-center font-mono text-[0.6875rem] font-bold text-void uppercase tracking-wider hover:bg-signal/90 transition-colors"
          >
            Gov Login
          </Link>
          <Link
            href="/login/startup"
            className="rounded-lg bg-chalk/10 border border-chalk/20 px-3 py-2 text-center font-mono text-[0.6875rem] font-bold text-chalk uppercase tracking-wider hover:bg-chalk/20 transition-colors"
          >
            Startup Login
          </Link>
        </div>
      </section>
    );
  }

  const roleLabel = profile.role.replace(/_/g, ' ').toLowerCase();

  return (
    <section className="rounded-[14px] border border-chalk/[0.12] bg-void-lift/80 p-4 space-y-4 shadow-lg">
      {/* Signed In Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-validated animate-pulse" />
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-validated font-bold">
            SIGNED IN
          </span>
        </div>
        <button
          onClick={() => setShowSessionModal(true)}
          className="font-mono text-[0.625rem] text-signal hover:underline uppercase tracking-wider"
        >
          Session Logs (DB)
        </button>
      </div>

      {/* User Info */}
      <div>
        <h3 className="font-display text-[1rem] font-extrabold leading-tight text-chalk">
          {profile.displayName}
        </h3>
        <p className="mt-0.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-chalk/50">
          {roleLabel}
        </p>
        {profile.departmentName && (
          <p className="mt-1.5 text-[0.75rem] leading-relaxed text-chalk/70">
            {profile.departmentName}
            {profile.designation ? ` · ${profile.designation}` : ''}
          </p>
        )}
      </div>

      {/*
        A treasury card used to sit here, showing a government identifier
        (IN-GOV-…), a security code and a ₹50 Cr balance. Every one of those was
        fabricated. It has been removed rather than relabelled: an invented
        statutory identifier on a government console is the single most
        believable thing on the page, and this project's provenance rules
        forbid it outright. Real budget functionality, when it exists, belongs
        under Settings → Funding & Budget and must read from the database.
      */}

      {/* Action Bar: Session History & Logout */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-chalk/[0.08]">
        <button
          onClick={() => setShowSessionModal(true)}
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-chalk/[0.08] hover:bg-chalk/[0.14] px-3 py-2 font-mono text-[0.6875rem] font-bold text-chalk uppercase tracking-wider transition-colors"
        >
          <Icon name="file" className="h-3.5 w-3.5 text-chalk/60" />
          DB Logs
        </button>

        <button
          onClick={async () => {
            try {
              let API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000').replace(/\/$/, '');
              if (!API_BASE.endsWith('/api')) API_BASE = `${API_BASE}/api`;
              await fetch(`${API_BASE}/auth/session/logout`, { method: 'POST' });
            } catch {}
            signOut();
          }}
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-risk/15 hover:bg-risk/25 border border-risk/30 px-3 py-2 font-mono text-[0.6875rem] font-bold text-risk uppercase tracking-wider transition-colors"
        >
          <Icon name="alert" className="h-3.5 w-3.5 text-risk" />
          Logout
        </button>
      </div>

      {/* Session History Modal */}
      {showSessionModal && (
        <UserSessionHistoryModal
          userEmail={profile.email}
          userRole={profile.role}
          onClose={() => setShowSessionModal(false)}
        />
      )}
    </section>
  );
}
