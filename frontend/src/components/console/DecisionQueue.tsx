'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthProvider';

/**
 * What is waiting on a decision.
 *
 * Reads the officer's own challenges from the workflow API. The queue used to
 * be an inert skeleton with the caption "neither exists yet" — correct when the
 * platform held nothing, and wrong the moment a challenge was created. A
 * hardcoded empty state is indistinguishable from a broken query, which is the
 * failure this replaces.
 *
 * The empty state is still an empty state. If the officer genuinely has no
 * challenges the card says so and offers the way to make one; it never fills
 * itself with an illustrative row that would read as a real departmental one.
 */

interface ChallengeRow {
  id: string;
  title: string;
  department: string;
  status: string;
  origin: string;
  demoScenario: string | null;
  targetMetric: string;
  targetValue: number | null;
}

const NEEDS_DECISION = new Set(['MATCHING', 'UNDER_EVALUATION', 'PILOT_READY']);

export function DecisionQueue() {
  const { loading: authLoading, profile } = useAuth();
  const [rows, setRows] = useState<ChallengeRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !profile) return;
    // A startup has no decision queue; it has responses. Asking for one would
    // be a guaranteed 403 on every console load.
    if (profile.role === 'STARTUP') {
      setRows([]);
      return;
    }
    let live = true;
    fetchApi<ChallengeRow[]>('/api/workflow/challenges/mine')
      .then((r) => live && setRows(r))
      .catch((e) => live && setError(e instanceof Error ? e.message : 'Could not load challenges.'));
    return () => {
      live = false;
    };
  }, [authLoading, profile]);

  if (authLoading || rows === null) {
    if (error) {
      return (
        <Card>
          <Label tone="risk">Unavailable</Label>
          <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-chalk/60">{error}</p>
        </Card>
      );
    }
    return (
      <Card>
        <Label>Loading</Label>
        <p className="mt-2.5 text-[0.8125rem] text-chalk/50">Reading your challenges…</p>
      </Card>
    );
  }

  const waiting = rows.filter((c) => NEEDS_DECISION.has(c.status));
  const drafts = rows.filter((c) => c.status === 'DRAFT' || c.status === 'PUBLISHED');

  if (rows.length === 0) {
    return (
      <Card>
        <Label>Awaiting data</Label>
        <p className="mt-2.5 max-w-[52ch] text-[0.8125rem] leading-relaxed text-chalk/60">
          This queue fills when you create a challenge and the matching engine has startup
          records to run against. You have not created one yet, so it is empty rather than
          populated with an illustrative pilot that would look exactly like a real one.
        </p>
        <Link
          href="/challenges"
          className="mt-4 inline-block font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-signal hover:underline"
        >
          Create a challenge ↗
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {[...waiting, ...drafts].map((c) => (
        <Card key={c.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Label tone={NEEDS_DECISION.has(c.status) ? 'signal' : 'muted'}>
                  {c.status.replace(/_/g, ' ')}
                </Label>
                {c.origin === 'DEMO' && <Label tone="muted">Demo scenario</Label>}
              </div>
              <p className="mt-2 font-display text-[1rem] font-bold leading-tight text-chalk">
                {c.title}
              </p>
              <p className="mt-1 text-[0.75rem] text-chalk/50">
                {c.department} · target: {c.targetMetric}
                {c.targetValue !== null ? ` ${c.targetValue}` : ''}
              </p>
            </div>
            <Link
              href={`/challenges/${c.id}`}
              className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-signal hover:underline"
            >
              Review ↗
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="card p-5">{children}</div>;
}

function Label({
  children,
  tone = 'signal',
}: {
  children: React.ReactNode;
  tone?: 'signal' | 'muted' | 'risk';
}) {
  const cls =
    tone === 'signal'
      ? 'text-signal'
      : tone === 'risk'
        ? 'text-risk'
        : 'text-chalk/40';
  return (
    <span className={`font-mono text-[0.625rem] uppercase tracking-[0.16em] ${cls}`}>
      {children}
    </span>
  );
}
