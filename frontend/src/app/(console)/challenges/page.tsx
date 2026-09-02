'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead } from '@/components/console/primitives';
import { RoleGate } from '@/components/auth/RoleGate';
import { fetchApi } from '@/lib/api';

/**
 * The officer's challenges.
 *
 * This page used to explain why it was empty — correct while the platform held
 * nothing, and wrong the moment challenges existed. Worse, a hardcoded empty
 * state is indistinguishable from a query that has broken, so the page could
 * not tell an officer the difference between "you have none" and "this is
 * failing".
 *
 * It now reads the workflow API. The empty state is still a real empty state:
 * if the officer genuinely owns no challenge it says so and offers the way to
 * create one, rather than filling itself with an illustrative row that would
 * read exactly like a departmental one.
 */

interface ChallengeRow {
  id: string;
  title: string;
  department: string;
  problemStatement: string;
  domain: string;
  targetMetric: string;
  targetValue: number | null;
  budgetEnvelope: string | number | null;
  pilotDurationDays: number | null;
  status: string;
  origin: string;
  createdAt: string;
}

/** Where each status sits in the pathway, so the list reads as a process. */
const STAGE: Record<string, { label: string; tone: 'signal' | 'muted' | 'done' }> = {
  DRAFT: { label: 'Not yet published', tone: 'muted' },
  PUBLISHED: { label: 'Open for responses', tone: 'signal' },
  MATCHING: { label: 'Awaiting your review', tone: 'signal' },
  UNDER_EVALUATION: { label: 'Under evaluation', tone: 'signal' },
  PILOT_READY: { label: 'Startup selected', tone: 'done' },
  CLOSED: { label: 'Closed', tone: 'muted' },
};

export default function ChallengesPage() {
  return (
    <RoleGate roles={['GOVERNMENT_OFFICER', 'ADMIN']}>
      <Challenges />
    </RoleGate>
  );
}

function Challenges() {
  const [rows, setRows] = useState<ChallengeRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi<ChallengeRow[]>('/api/workflow/challenges/mine')
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load your challenges.'));
  }, []);

  const money = (v: string | number | null) => {
    if (v === null) return '—';
    const n = Number(v);
    return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN')}` : '—';
  };

  return (
    <>
      <ConsoleHeader
        title="Challenges"
        subtitle="Problems your department has published, and where each one sits."
        source="demonstration"
      />

      {error && <p className="card border-risk/30 p-4 text-[0.8125rem] text-risk">{error}</p>}

      <section aria-label="Challenges">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <SectionHead title="Your challenges" meta={rows ? `${rows.length}` : undefined} />
          <Link
            href="/challenges/new"
            className="rounded-[8px] bg-signal px-4 py-2 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-void transition-opacity hover:opacity-90"
          >
            + Create Challenge
          </Link>
        </div>

        {rows === null ? (
          <div className="card p-5 text-[0.8125rem] text-chalk/50">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="card p-6">
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal">
              None yet
            </span>
            <p className="mt-2.5 max-w-[58ch] text-[0.875rem] leading-relaxed text-chalk/60">
              You have not published a challenge. A challenge states a departmental problem as an
              outcome — the target is what a pilot is later measured against, so it has to be
              written before startups can respond.
            </p>
            <Link
              href="/government/discover"
              className="mt-5 inline-block font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-signal hover:underline"
            >
              Start from a problem ↗
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((c) => {
              const stage = STAGE[c.status] ?? { label: c.status, tone: 'muted' as const };
              return (
                <Link
                  key={c.id}
                  href={`/challenges/${c.id}`}
                  className="card block p-5 transition-colors hover:border-signal/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-mono text-[0.625rem] uppercase tracking-[0.16em] ${
                            stage.tone === 'signal'
                              ? 'text-signal'
                              : stage.tone === 'done'
                                ? 'text-validated'
                                : 'text-chalk/40'
                          }`}
                        >
                          {stage.label}
                        </span>
                        {/* Disclosure travels with the row, not just the detail page. */}
                        {c.origin === 'DEMO' && (
                          <span className="rounded-full border border-chalk/25 px-2 py-0.5 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-chalk/55">
                            Demo simulation
                          </span>
                        )}
                      </div>

                      <p className="mt-2 font-display text-[1.0625rem] font-bold leading-tight text-chalk">
                        {c.title}
                      </p>
                      <p className="mt-1.5 max-w-[76ch] line-clamp-2 text-[0.8125rem] leading-relaxed text-chalk/55">
                        {c.problemStatement}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-signal">
                      Review ↗
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-chalk/[0.08] pt-3.5 sm:grid-cols-4">
                    <Fact label="Department" value={c.department} />
                    <Fact
                      label="Target"
                      value={c.targetValue !== null ? `${c.targetValue} · ${c.targetMetric}` : c.targetMetric}
                    />
                    <Fact label="Pilot budget" value={money(c.budgetEnvelope)} />
                    <Fact
                      label="Pilot length"
                      value={c.pilotDurationDays ? `${c.pilotDurationDays} days` : '—'}
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
