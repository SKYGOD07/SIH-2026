'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead } from '@/components/console/primitives';
import { RoleGate } from '@/components/auth/RoleGate';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthProvider';

/**
 * The startup workspace.
 *
 * A different question from the government dashboard, and therefore a different
 * page rather than the same one with rows hidden. A startup is not choosing
 * between candidates; it is looking after one company and asking what it owes
 * next — finish the profile, answer an open challenge, file the evidence a
 * milestone is waiting on.
 *
 * Everything shown is the caller's own. There is no registry of other
 * companies here and no route to one: the API would refuse it, and offering it
 * would suggest otherwise.
 */

interface Company {
  id: string;
  legalName: string;
  displayName: string | null;
  sector: string;
  oneLineDescription: string | null;
}
interface Completeness {
  percent: number;
  requiredMissing: string[];
  readyToPublish: boolean;
}
interface OpenChallenge {
  id: string;
  title: string;
  department: string;
  targetMetric: string;
  origin: string;
  hasResponded: boolean;
}

export default function StartupDashboard() {
  return (
    <RoleGate roles={['STARTUP']}>
      <StartupHome />
    </RoleGate>
  );
}

function StartupHome() {
  const { profile } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [completeness, setCompleteness] = useState<Completeness | null>(null);
  const [challenges, setChallenges] = useState<OpenChallenge[] | null>(null);
  const [needsCompany, setNeedsCompany] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    // A startup account with no company yet is a real state, not an error: the
    // teammate has signed up but not claimed one of the demonstration
    // companies. It gets its own panel rather than an empty dashboard.
    if (!profile.startupId) {
      setNeedsCompany(true);
      return;
    }

    let live = true;
    fetchApi<{ startup: Company; completeness: Completeness }>('/api/workflow/company/me')
      .then((r) => {
        if (!live) return;
        setCompany(r.startup);
        setCompleteness(r.completeness);
      })
      .catch((e) => live && setError(e instanceof Error ? e.message : 'Could not load your company.'));

    fetchApi<OpenChallenge[]>('/api/workflow/challenges/open')
      .then((r) => live && setChallenges(r))
      .catch(() => live && setChallenges([]));

    return () => {
      live = false;
    };
  }, [profile]);

  if (needsCompany) {
    return (
      <>
        <ConsoleHeader
          title="Your next step"
          subtitle="Claim the company you are representing in this simulation."
          source="demonstration"
        />
        <div className="card p-6">
          <Eyebrow>No company yet</Eyebrow>
          <p className="mt-2.5 max-w-[56ch] text-[0.875rem] leading-relaxed text-chalk/60">
            Your account is not yet linked to a company. In this simulation each teammate
            claims one of the demonstration companies, and a company can be claimed only once.
          </p>
          <Link href="/startup/company" className="mt-5 inline-block text-signal hover:underline">
            Claim a company ↗
          </Link>
        </div>
      </>
    );
  }

  const name = company?.displayName || company?.legalName || 'Your company';
  const open = (challenges ?? []).filter((c) => !c.hasResponded);
  const applied = (challenges ?? []).filter((c) => c.hasResponded);

  return (
    <>
      <ConsoleHeader
        title="Your next step"
        subtitle={company ? `${name} · ${company.sector}` : 'Loading your company…'}
        source="demonstration"
      />

      {error && (
        <p className="card border-risk/30 p-4 text-[0.8125rem] text-risk">{error}</p>
      )}

      {/* --- the company, and what it still owes ------------------------ */}
      <section aria-label="My company">
        <SectionHead title="My company" />
        <div className="card p-5">
          <p className="font-display text-[1.0625rem] font-bold leading-tight text-chalk">{name}</p>
          {company?.oneLineDescription && (
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-chalk/60">
              {company.oneLineDescription}
            </p>
          )}

          {completeness && (
            <div className="mt-4 border-t border-chalk/[0.08] pt-4">
              <div className="flex items-baseline justify-between gap-3">
                <Eyebrow>Profile completion</Eyebrow>
                <span className="font-display text-[1.125rem] font-bold text-chalk">
                  {completeness.percent}%
                </span>
              </div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-chalk/10">
                <div
                  className="h-full bg-signal"
                  style={{ width: `${completeness.percent}%` }}
                />
              </div>
              {/*
                Named, not counted. "3 fields missing" tells a reader they have
                work without telling them what — and a percentage alone invites
                filling boxes to move a bar.
              */}
              {completeness.requiredMissing.length > 0 && (
                <p className="mt-2.5 text-[0.75rem] leading-relaxed text-chalk/45">
                  Still required: {completeness.requiredMissing.join(', ')}
                </p>
              )}
            </div>
          )}

          <Link href="/startup/company" className="mt-4 inline-block text-[0.8125rem] text-signal hover:underline">
            Edit company profile ↗
          </Link>
        </div>
      </section>

      {/* --- opportunities --------------------------------------------- */}
      <section aria-label="Opportunities">
        <SectionHead title="Opportunities" />
        {challenges === null ? (
          <div className="card p-5 text-[0.8125rem] text-chalk/50">Loading…</div>
        ) : open.length === 0 ? (
          <div className="card p-5">
            <Eyebrow>Nothing open</Eyebrow>
            <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-chalk/60">
              No department has published a challenge you have not already answered.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {open.map((c) => (
              <div key={c.id} className="card flex flex-wrap items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Eyebrow>Open</Eyebrow>
                  </div>
                  <p className="mt-2 font-display text-[1rem] font-bold leading-tight text-chalk">
                    {c.title}
                  </p>
                  <p className="mt-1 text-[0.75rem] text-chalk/50">
                    {c.department} · target: {c.targetMetric}
                  </p>
                </div>
                <Link
                  href={`/startup/challenges/${c.id}`}
                  className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-signal hover:underline"
                >
                  View opportunity ↗
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- what has been submitted ------------------------------------ */}
      <section aria-label="My applications">
        <SectionHead title="My applications" />
        {applied.length === 0 ? (
          <div className="card p-5">
            <Eyebrow muted>None yet</Eyebrow>
            <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-chalk/60">
              Answering a challenge puts it here, with its status.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {applied.map((c) => (
              <div key={c.id} className="card flex flex-wrap items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                  <Eyebrow>Submitted</Eyebrow>
                  <p className="mt-2 font-display text-[1rem] font-bold leading-tight text-chalk">
                    {c.title}
                  </p>
                  <p className="mt-1 text-[0.75rem] text-chalk/50">
                    A department is reviewing responses. You will see a decision here.
                  </p>
                </div>
                <Link
                  href={`/startup/challenges/${c.id}`}
                  className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-signal hover:underline"
                >
                  View response ↗
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function Eyebrow({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={`font-mono text-[0.625rem] uppercase tracking-[0.16em] ${
        muted ? 'text-chalk/40' : 'text-signal'
      }`}
    >
      {children}
    </span>
  );
}
