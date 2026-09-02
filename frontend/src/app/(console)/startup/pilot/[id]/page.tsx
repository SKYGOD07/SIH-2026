'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead } from '@/components/console/primitives';
import { fetchApi } from '@/lib/api';

interface Evidence {
  id: string;
  label: string;
  status: string;
  reviewNote: string | null;
  milestoneId: string | null;
}

interface Milestone {
  id: string;
  code: string;
  title: string;
  description: string;
  status: string;
  payment: string;
  dueOn: string;
  /** The artefacts this milestone's payment is conditional on. */
  evidenceRequired: string[];
  evidence: Evidence[];
  rejectionReason: string | null;
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
  const [filing, setFiling] = useState<string | null>(null);

  const load = useCallback(
    () => fetchApi<PilotDetail>(`/api/workflow/pilots/${params.id}`).then(setPilot),
    [params.id],
  );

  useEffect(() => {
    let live = true;
    load()
      .catch((e) => {
        if (live) setError(e instanceof Error ? e.message : 'Failed to fetch pilot details');
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => { live = false; };
  }, [load]);

  /**
   * File one artefact against a milestone.
   *
   * Filing is not claiming: the artefact arrives as SUBMITTED and stays there
   * until a government officer accepts it. That is why this returns the
   * milestone to the board rather than showing a success state — the next move
   * is not the startup's.
   */
  const fileEvidence = async (milestoneId: string, label: string, reference: string) => {
    setFiling(milestoneId);
    setError(null);
    try {
      await fetchApi(`/api/workflow/pilots/${params.id}/evidence`, {
        method: 'POST',
        body: JSON.stringify({ milestoneId, label, reference }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The filing was refused.');
    } finally {
      setFiling(null);
    }
  };

  if (loading) return <div className="p-8 text-chalk/50">Loading pilot details...</div>;
  if (!pilot) return <div className="p-8 text-risk">{error ?? 'Pilot not found.'}</div>;

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

                    {m.rejectionReason && m.status === 'REJECTED' && (
                      <p className="mt-2 border-l-2 border-risk/40 pl-3 text-[0.8125rem] text-risk/90">
                        Returned: {m.rejectionReason}
                      </p>
                    )}

                    {/* What this milestone owes, and what has actually been
                        filed against it. Showing the required list unfiled is
                        the point — it is the startup's to-do, not an error. */}
                    <div className="mt-4 pt-4 border-t border-chalk/10">
                      <span className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-chalk/35">
                        Required evidence
                      </span>
                      <ul className="mt-2 flex flex-col gap-1.5">
                        {(m.evidenceRequired ?? []).map((required) => {
                          const filed = (m.evidence ?? []).find(
                            (e) => e.label.toLowerCase() === required.toLowerCase(),
                          );
                          return (
                            <li key={required} className="flex flex-wrap items-center gap-x-3">
                              <span className="text-[0.8125rem] text-chalk/70">{required}</span>
                              <span
                                className={`font-mono text-[0.5625rem] uppercase tracking-[0.1em] ${
                                  !filed
                                    ? 'text-chalk/30'
                                    : filed.status === 'ACCEPTED'
                                      ? 'text-validated'
                                      : filed.status === 'REJECTED'
                                        ? 'text-risk'
                                        : 'text-signal'
                                }`}
                              >
                                {filed ? filed.status.toLowerCase() : 'not filed'}
                              </span>
                              {filed?.reviewNote && (
                                <span className="text-[0.6875rem] text-chalk/45">{filed.reviewNote}</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {(m.status === 'IN_PROGRESS' || m.status === 'REJECTED') && (
                      <EvidenceForm
                        options={m.evidenceRequired ?? []}
                        busy={filing === m.id}
                        onSubmit={(label, reference) => fileEvidence(m.id, label, reference)}
                      />
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
