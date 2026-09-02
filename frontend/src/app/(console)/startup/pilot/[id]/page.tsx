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

      {/* A refusal from the API is shown, not swallowed. The backend's reason
          — a milestone in the wrong state, an artefact already filed — is the
          only explanation the startup will get. */}
      {error && (
        <div className="card border-risk/30 p-4 text-[0.8125rem] text-risk">{error}</div>
      )}

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

          {/* AI-Assisted Pilot Review Panel */}
          <AIPilotReviewCard pilotId={pilot.id} />
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

/**
 * One artefact, filed against one milestone.
 *
 * The label is chosen from the contract's own list rather than typed freely.
 * A free-text label would drift — "baseline data" against a milestone that
 * requires "Baseline dataset" — and the approval check matches on that name,
 * so a typo would silently block payment with no visible cause.
 */
function EvidenceForm({
  options,
  busy,
  onSubmit,
}: {
  options: string[];
  busy: boolean;
  onSubmit: (label: string, reference: string) => Promise<void>;
}) {
  const [label, setLabel] = useState(options[0] ?? '');
  const [reference, setReference] = useState('');

  if (options.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-chalk/10 pt-4">
      <select
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        aria-label="Which artefact"
        className="rounded border border-chalk/15 bg-transparent px-3 py-2 text-[0.8125rem] text-chalk focus:border-signal/50 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="Reference — document ID, URL or file note"
        aria-label="Reference"
        className="min-w-[16rem] flex-1 rounded border border-chalk/15 bg-transparent px-3 py-2 text-[0.8125rem] text-chalk placeholder:text-chalk/30 focus:border-signal/50 focus:outline-none"
      />
      <button
        type="button"
        disabled={!label || reference.trim().length < 1 || busy}
        onClick={async () => {
          await onSubmit(label, reference.trim());
          setReference('');
        }}
        className="rounded bg-chalk/10 px-4 py-2 text-[0.8125rem] text-chalk transition-colors hover:bg-chalk/20 disabled:cursor-not-allowed disabled:opacity-35"
      >
        {busy ? 'Filing…' : 'Submit evidence'}
      </button>
    </div>
  );
}

function AIPilotReviewCard({ pilotId }: { pilotId: string }) {
  const [activeTask, setActiveTask] = useState<string>('ANALYZE');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{
    output: {
      summary: string;
      strengths?: string[];
      limitations?: string[];
      evidenceUsed?: string[];
      missingEvidence?: string[];
      questions?: string[];
    };
    assisted: boolean;
    provider: string;
    fallbackReason?: string;
  } | null>(null);

  async function runAiAction(endpoint: string, taskKey: string) {
    setLoading(true);
    setActiveTask(taskKey);
    try {
      const data = await fetchApi<{
        output: {
          summary: string;
          strengths?: string[];
          limitations?: string[];
          evidenceUsed?: string[];
          missingEvidence?: string[];
          questions?: string[];
        };
        assisted: boolean;
        provider: string;
        fallbackReason?: string;
      }>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ pilotId }),
      });
      setAnalysis(data);
    } catch {
      setAnalysis({
        output: {
          summary: 'Pilot progress is tracked against scheduled milestones and metrics.',
          strengths: ['Milestones defined with payment terms.'],
          limitations: ['Awaiting evidence verification.'],
          evidenceUsed: [],
        },
        assisted: false,
        provider: 'DETERMINISTIC',
        fallbackReason: 'AI service unreachable.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-label="AI-Assisted Pilot Review">
      <SectionHead title="AI-ASSISTED PILOT REVIEW" />
      <div className="card space-y-4 p-5">
        <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-signal">
          AI-ASSISTED ANALYSIS
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => runAiAction('/api/ai/analyse-pilot', 'ANALYZE')}
            disabled={loading}
            className={`rounded px-2.5 py-1.5 font-mono text-[0.625rem] font-bold uppercase tracking-[0.1em] transition-colors ${
              activeTask === 'ANALYZE'
                ? 'bg-signal text-void'
                : 'border border-chalk/15 bg-chalk/5 text-chalk/70 hover:bg-chalk/10'
            }`}
          >
            [ANALYZE PROGRESS]
          </button>

          <button
            type="button"
            onClick={() => runAiAction('/api/ai/explain-kpis', 'KPI')}
            disabled={loading}
            className={`rounded px-2.5 py-1.5 font-mono text-[0.625rem] font-bold uppercase tracking-[0.1em] transition-colors ${
              activeTask === 'KPI'
                ? 'bg-signal text-void'
                : 'border border-chalk/15 bg-chalk/5 text-chalk/70 hover:bg-chalk/10'
            }`}
          >
            [EXPLAIN KPI]
          </button>

          <button
            type="button"
            onClick={() => runAiAction('/api/ai/summarise-outcome', 'OUTCOME')}
            disabled={loading}
            className={`rounded px-2.5 py-1.5 font-mono text-[0.625rem] font-bold uppercase tracking-[0.1em] transition-colors ${
              activeTask === 'OUTCOME'
                ? 'bg-signal text-void'
                : 'border border-chalk/15 bg-chalk/5 text-chalk/70 hover:bg-chalk/10'
            }`}
          >
            [OUTCOME SUMMARY]
          </button>

          <button
            type="button"
            onClick={() => runAiAction('/api/ai/explain-scale', 'SCALE')}
            disabled={loading}
            className={`rounded px-2.5 py-1.5 font-mono text-[0.625rem] font-bold uppercase tracking-[0.1em] transition-colors ${
              activeTask === 'SCALE'
                ? 'bg-signal text-void'
                : 'border border-chalk/15 bg-chalk/5 text-chalk/70 hover:bg-chalk/10'
            }`}
          >
            [SCALE RECOMMENDATION]
          </button>
        </div>

        {loading && <p className="text-[0.8125rem] text-chalk/50">Analyzing pilot records with AI…</p>}

        {analysis && !loading && (
          <div className="space-y-3 rounded border border-chalk/10 bg-void/50 p-3 text-[0.8125rem]">
            <div className="flex items-center justify-between text-[0.7rem] text-chalk/40">
              <span>{analysis.assisted ? 'Generated by Ollama' : 'Fallback Mode'}</span>
              <span>{analysis.provider}</span>
            </div>
            <p className="leading-relaxed text-chalk/85">{analysis.output.summary}</p>

            {analysis.output.strengths && analysis.output.strengths.length > 0 && (
              <div>
                <span className="font-mono text-[0.5625rem] uppercase text-signal block mb-1">Strengths:</span>
                <ul className="list-disc list-inside text-chalk/70 space-y-0.5">
                  {analysis.output.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}

            {analysis.output.limitations && analysis.output.limitations.length > 0 && (
              <div>
                <span className="font-mono text-[0.5625rem] uppercase text-risk block mb-1">Limitations / Gaps:</span>
                <ul className="list-disc list-inside text-chalk/70 space-y-0.5">
                  {analysis.output.limitations.map((l, i) => <li key={i}>{l}</li>)}
                </ul>
              </div>
            )}

            {analysis.output.evidenceUsed && analysis.output.evidenceUsed.length > 0 && (
              <div className="text-[0.75rem] text-chalk/50 pt-1 border-t border-chalk/10">
                Evidence cited: {analysis.output.evidenceUsed.join(', ')}
              </div>
            )}
          </div>
        )}

        <p className="text-[0.6875rem] text-chalk/40 italic">
          Disclaimer: AI analysis is advisory only. AI cannot modify milestone state, evidence status, payment release, or government decisions.
        </p>
      </div>
    </section>
  );
}
