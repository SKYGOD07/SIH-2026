'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead } from '@/components/console/primitives';
import { RoleGate } from '@/components/auth/RoleGate';
import { fetchApi } from '@/lib/api';

/**
 * Contracted pilots.
 *
 * Reads `/workflow/pilots/mine`, which returns the caller's own — a government
 * officer sees pilots on challenges they own, a startup sees its own pilot.
 * The same endpoint serves both because ownership is resolved server-side from
 * the verified token, not from a role check in the browser.
 */

interface PilotRow {
  id: string;
  status: string;
  outcome: string | null;
  department: string;
  location: string | null;
  contractValue: string | number;
  durationDays: number;
  origin: string;
  createdAt: string;
  challenge?: { title: string; targetMetric: string; targetValue: number | null };
  startup?: { legalName: string; displayName: string | null };
}

const STATUS: Record<string, { label: string; tone: 'signal' | 'muted' | 'done' | 'risk' }> = {
  PLANNED: { label: 'Planned', tone: 'muted' },
  ACTIVE: { label: 'Active', tone: 'signal' },
  AWAITING_VALIDATION: { label: 'Awaiting validation', tone: 'signal' },
  CLOSED: { label: 'Closed', tone: 'done' },
  CANCELLED: { label: 'Cancelled', tone: 'risk' },
};

export default function PilotsPage() {
  return (
    <RoleGate roles={['GOVERNMENT_OFFICER', 'EVALUATOR', 'ADMIN']}>
      <Pilots />
    </RoleGate>
  );
}

function Pilots() {
  const [rows, setRows] = useState<PilotRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi<PilotRow[]>('/api/workflow/pilots/mine')
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load pilots.'));
  }, []);

  const money = (v: string | number) => {
    const n = Number(v);
    return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN')}` : '—';
  };

  return (
    <>
      <ConsoleHeader
        title="Pilots"
        subtitle="Contracted pilots and where each one has reached."
        source="demonstration"
      />

      {error && <p className="card border-risk/30 p-4 text-[0.8125rem] text-risk">{error}</p>}

      <section aria-label="Pilots">
        <SectionHead title="Contracted" meta={rows ? `${rows.length}` : undefined} />

        {rows === null ? (
          <div className="card p-5 text-[0.8125rem] text-chalk/50">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="card p-6">
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal">
              No pilot yet
            </span>
            <p className="mt-2.5 max-w-[58ch] text-[0.875rem] leading-relaxed text-chalk/60">
              A pilot exists once a startup has been selected against a challenge. Review the
              candidates on a challenge and select one — the pilot, its milestone chain and its
              measurement are created by that decision.
            </p>
            <Link
              href="/challenges"
              className="mt-5 inline-block font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-signal hover:underline"
            >
              Review challenges ↗
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((p) => {
              const s = STATUS[p.status] ?? { label: p.status, tone: 'muted' as const };
              return (
                <Link
                  key={p.id}
                  href={`/pilots/${p.id}`}
                  className="card block p-5 transition-colors hover:border-signal/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-mono text-[0.625rem] uppercase tracking-[0.16em] ${
                            s.tone === 'signal'
                              ? 'text-signal'
                              : s.tone === 'done'
                                ? 'text-validated'
                                : s.tone === 'risk'
                                  ? 'text-risk'
                                  : 'text-chalk/40'
                          }`}
                        >
                          {s.label}
                        </span>
                        {p.origin === 'DEMO' && (
                          <span className="rounded-full border border-chalk/25 px-2 py-0.5 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-chalk/55">
                            Demo simulation
                          </span>
                        )}
                        {/* An outcome only exists once a pilot has closed. */}
                        {p.outcome && (
                          <span className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-chalk/55">
                            {p.outcome.replace(/_/g, ' ').toLowerCase()}
                          </span>
                        )}
                      </div>

                      <p className="mt-2 font-display text-[1.0625rem] font-bold leading-tight text-chalk">
                        {p.challenge?.title ?? 'Pilot'}
                      </p>
                      <p className="mt-1 text-[0.8125rem] text-chalk/55">
                        {p.startup?.displayName ?? p.startup?.legalName ?? 'Selected startup'}
                        {p.location ? ` · ${p.location}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-signal">
                      Open ↗
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-chalk/[0.08] pt-3.5 sm:grid-cols-4">
                    <Fact label="Department" value={p.department} />
                    <Fact label="Contract" value={money(p.contractValue)} />
                    <Fact label="Duration" value={`${p.durationDays} days`} />
                    <Fact
                      label="Target"
                      value={
                        p.challenge?.targetValue != null
                          ? `${p.challenge.targetValue} · ${p.challenge.targetMetric}`
                          : (p.challenge?.targetMetric ?? '—')
                      }
                    />
                  </dl>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-chalk/35">{label}</dt>
      <dd className="mt-1 truncate text-[0.8125rem] text-chalk/75" title={value}>
        {value}
      </dd>
    </div>
  );
}
