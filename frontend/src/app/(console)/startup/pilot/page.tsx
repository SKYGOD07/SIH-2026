'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead } from '@/components/console/primitives';
import { fetchApi } from '@/lib/api';

interface Pilot {
  id: string;
  department: string;
  status: string;
  contractValue: string;
  challenge: {
    id: string;
    title: string;
  };
}

export default function StartupPilotPage() {
  const [pilots, setPilots] = useState<Pilot[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchApi<Pilot[]>('/api/workflow/pilots/mine')
      .then((r) => live && setPilots(r))
      .catch((e) => live && setError(e instanceof Error ? e.message : 'Failed to fetch pilot data'));
    
    return () => { live = false; };
  }, []);

  return (
    <>
      <ConsoleHeader
        title="My pilot"
        subtitle="Your contracted pilots with the government."
        source="demonstration"
      />

      {error && (
        <p className="card border-risk/30 p-4 text-[0.8125rem] text-risk">{error}</p>
      )}

      <section aria-label="My Pilots">
        <SectionHead title="Active Pilots" />
        
        {pilots === null ? (
          <div className="card p-5 text-[0.8125rem] text-chalk/50">Loading pilot data…</div>
        ) : pilots.length === 0 ? (
          <div className="card p-5">
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-chalk/40">
              No active pilot
            </span>
            <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-chalk/60">
              You have not been selected for any pilots yet. When a government department selects your response, your pilot contract, milestones, and evidence uploads will appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pilots.map((pilot) => (
              <div key={pilot.id} className="card p-5 flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal">
                      {pilot.status}
                    </span>
                    <p className="mt-2 font-display text-[1.125rem] font-bold leading-tight text-chalk">
                      {pilot.challenge.title}
                    </p>
                    <p className="mt-1 text-[0.8125rem] text-chalk/60">
                      {pilot.department}
                    </p>
                  </div>
                  <Link
                    href={`/startup/pilot/${pilot.id}`}
                    className="shrink-0 rounded bg-signal px-3 py-1.5 font-display text-[0.8125rem] font-semibold text-black hover:bg-white transition-colors"
                  >
                    Manage Pilot
                  </Link>
                </div>
                
                <div className="text-[0.8125rem] text-chalk/80">
                  <strong className="text-chalk">Contract Value:</strong> ₹{pilot.contractValue}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
