'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead } from '@/components/console/primitives';
import { fetchApi } from '@/lib/api';

interface Milestone {
  id: string;
  code: string;
  title: string;
  description: string;
  status: string;
  payment: string;
  dueOn: string;
}

interface PilotDetail {
  id: string;
  department: string;
  status: string;
  contractValue: string;
  challenge: {
    id: string;
    title: string;
    problemStatement: string;
  };
  milestones: Milestone[];
}

export default function PilotDetailPage({ params }: { params: { id: string } }) {
  const [pilot, setPilot] = useState<PilotDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchApi<PilotDetail>(`/api/workflow/pilots/${params.id}`)
      .then((r) => {
        if (live) {
          setPilot(r);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (live) {
          setError(e instanceof Error ? e.message : 'Failed to fetch pilot details');
          setLoading(false);
        }
      });
    
    return () => { live = false; };
  }, [params.id]);

  if (loading) return <div className="p-8 text-chalk/50">Loading pilot details...</div>;
  if (error || !pilot) return <div className="p-8 text-risk">{error}</div>;

  return (
    <>
      <ConsoleHeader
        title="Pilot Execution"
        subtitle={`${pilot.department} · ${pilot.challenge.title}`}
        source="demonstration"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <section aria-label="Pilot Overview">
            <SectionHead title="Pilot Overview" />
            <div className="card p-6 space-y-4">
              <div>
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-chalk/40 block mb-1">Status</span>
                <div className="font-display text-[1.125rem] font-bold text-signal">{pilot.status}</div>
              </div>
              
              <div>
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-chalk/40 block mb-1">Contract Value</span>
                <div className="text-[0.875rem] text-chalk">₹{pilot.contractValue}</div>
              </div>

              <div>
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-chalk/40 block mb-1">Opportunity</span>
                <div className="text-[0.875rem] text-chalk">{pilot.challenge.title}</div>
                <Link 
                  href={`/startup/challenges/${pilot.challenge.id}`}
                  className="text-[0.75rem] text-signal hover:underline mt-1 inline-block"
                >
                  View challenge details ↗
                </Link>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <section aria-label="Milestones">
            <SectionHead title="Milestones & Evidence" />
            <div className="space-y-4">
              {pilot.milestones && pilot.milestones.length > 0 ? (
                pilot.milestones.map((m) => (
                  <div key={m.id} className="card p-6 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal block mb-1">
                          {m.code} · {m.status}
                        </span>
                        <h3 className="font-display text-[1.125rem] font-bold text-chalk">{m.title}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-[0.875rem] font-bold text-chalk">₹{m.payment}</div>
                        <div className="text-[0.75rem] text-chalk/50 mt-1">Due: {new Date(m.dueOn).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    <p className="text-[0.875rem] text-chalk/70 mt-2">{m.description}</p>
                    
                    {m.status === 'IN_PROGRESS' && (
                      <div className="mt-4 pt-4 border-t border-chalk/10">
                        <button className="bg-chalk/10 hover:bg-chalk/20 text-chalk px-4 py-2 rounded text-[0.8125rem] transition-colors">
                          Submit Evidence
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="card p-6 text-[0.875rem] text-chalk/50">
                  No milestones found for this pilot.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
