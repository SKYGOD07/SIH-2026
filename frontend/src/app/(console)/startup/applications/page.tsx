'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead } from '@/components/console/primitives';
import { fetchApi } from '@/lib/api';

interface Application {
  challengeId: string;
  status: string;
  submittedAt: string | null;
  challenge: {
    id: string;
    department: string;
    title: string;
    targetMetric: string;
  };
}

export default function StartupApplicationsPage() {
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchApi<Application[]>('/api/workflow/responses/mine')
      .then((r) => live && setApplications(r))
      .catch((e) => live && setError(e instanceof Error ? e.message : 'Failed to fetch applications'));
    
    return () => { live = false; };
  }, []);

  return (
    <>
      <ConsoleHeader
        title="My applications"
        subtitle="Challenges you have responded to."
        source="demonstration"
      />

      {error && (
        <p className="card border-risk/30 p-4 text-[0.8125rem] text-risk">{error}</p>
      )}

      <section aria-label="Submitted Applications">
        <SectionHead title="Submitted Responses" />
        
        {applications === null ? (
          <div className="card p-5 text-[0.8125rem] text-chalk/50">Loading applications…</div>
        ) : applications.length === 0 ? (
          <div className="card p-5">
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-chalk/40">
              None yet
            </span>
            <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-chalk/60">
              Answering a challenge puts it here, with its status.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {applications.map((app) => (
              <div key={app.challengeId} className="card p-5 flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal">
                      {app.status === 'SUBMITTED' ? 'Submitted' : 'Draft'}
                    </span>
                    <p className="mt-2 font-display text-[1.125rem] font-bold leading-tight text-chalk">
                      {app.challenge.title}
                    </p>
                    <p className="mt-1 text-[0.8125rem] text-chalk/60">
                      {app.challenge.department}
                    </p>
                  </div>
                  <Link
                    href={`/startup/challenges/${app.challenge.id}`}
                    className="shrink-0 rounded bg-signal px-3 py-1.5 font-display text-[0.8125rem] font-semibold text-black hover:bg-white transition-colors"
                  >
                    View response
                  </Link>
                </div>
                
                <div className="text-[0.8125rem] text-chalk/80">
                  <strong className="text-chalk">Target Metric:</strong> {app.challenge.targetMetric}
                </div>
                {app.submittedAt && (
                  <div className="text-[0.8125rem] text-chalk/80">
                    <strong className="text-chalk">Submitted On:</strong> {new Date(app.submittedAt).toLocaleDateString()}
                  </div>
                )}
                <div className="mt-2 border-t border-chalk/[0.08] pt-3 text-[0.8125rem] text-chalk/60">
                  A department is reviewing responses. You will see a decision here if selected for a pilot.
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
