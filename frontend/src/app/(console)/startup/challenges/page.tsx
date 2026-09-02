'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead } from '@/components/console/primitives';
import { fetchApi } from '@/lib/api';

interface OpenChallenge {
  id: string;
  department: string;
  title: string;
  problemStatement: string;
  domain: string;
  targetMetric: string;
  budgetEnvelope?: string;
  hasResponded: boolean;
}

export default function StartupOpportunitiesPage() {
  const [challenges, setChallenges] = useState<OpenChallenge[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchApi<OpenChallenge[]>('/api/workflow/challenges/open')
      .then((r) => live && setChallenges(r))
      .catch((e) => live && setError(e instanceof Error ? e.message : 'Failed to fetch opportunities'));
    
    return () => { live = false; };
  }, []);

  const open = (challenges ?? []).filter((c) => !c.hasResponded);

  return (
    <>
      <ConsoleHeader
        title="Opportunities"
        subtitle="Open challenges seeking startup solutions."
        source="demonstration"
      />

      {error && (
        <p className="card border-risk/30 p-4 text-[0.8125rem] text-risk">{error}</p>
      )}

      <section aria-label="Open Opportunities">
        <SectionHead title="Open Challenges" />
        
        {challenges === null ? (
          <div className="card p-5 text-[0.8125rem] text-chalk/50">Loading opportunities…</div>
        ) : open.length === 0 ? (
          <div className="card p-5">
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal">
              Nothing open
            </span>
            <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-chalk/60">
              No department has published a challenge you have not already answered.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {open.map((c) => (
              <div key={c.id} className="card p-5 flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal">
                      Open
                    </span>
                    <p className="mt-2 font-display text-[1.125rem] font-bold leading-tight text-chalk">
                      {c.title}
                    </p>
                    <p className="mt-1 text-[0.8125rem] text-chalk/60">
                      {c.department} · {c.domain}
                    </p>
                  </div>
                  <Link
                    href={`/startup/challenges/${c.id}`}
                    className="shrink-0 rounded bg-signal px-3 py-1.5 font-display text-[0.8125rem] font-semibold text-black hover:bg-white transition-colors"
                  >
                    View opportunity
                  </Link>
                </div>
                
                {c.budgetEnvelope && (
                  <div className="text-[0.8125rem] text-chalk/80 mt-2">
                    <strong className="text-chalk">Budget Envelope:</strong> ₹{c.budgetEnvelope}
                  </div>
                )}
                <div className="text-[0.8125rem] text-chalk/80">
                  <strong className="text-chalk">Target Metric:</strong> {c.targetMetric}
                </div>
                <div className="text-[0.8125rem] leading-relaxed text-chalk/70 line-clamp-3">
                  {c.problemStatement}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
