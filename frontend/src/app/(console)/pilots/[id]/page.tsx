'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead } from '@/components/console/primitives';
import { RoleGate } from '@/components/auth/RoleGate';
import { useAuth } from '@/lib/auth/AuthProvider';
import { fetchApi } from '@/lib/api';

/**
 * One pilot, and the actions that move it.
 *
 * This is where the platform's central rule is actually operated:
 * **evidence is filed, evidence is judged, the milestone is approved, and only
 * then is money released.** Each step is a separate act by a named person.
 *
 * The buttons here are offered from the client's reading of the milestone
 * state, but the client's reading decides nothing — every action posts to an
 * endpoint that re-checks the transition table, re-counts accepted artefacts
 * and refuses anything out of order. A refusal is shown verbatim rather than
 * swallowed: "payment requires an approved milestone" is exactly what an
 * officer needs to see, and hiding it would make the rule invisible.
 */

interface Evidence {
  id: string;
  label: string;
  reference: string;
  status: string;
  submittedAt: string;
  reviewNote: string | null;
  milestoneId: string | null;
}

interface Milestone {
  id: string;
  code: string;
  title: string;
  description: string;
  payment: string | number;
  status: string;
  dueOn: string;
  approvedBy: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  rejectionReason: string | null;
  evidenceRequired: string[];
  evidence: Evidence[];
}

interface Metric {
  id: string;
  name: string;
  unit: string;
  baselineValue: number | null;
  targetValue: number;
  achievedValue: number | null;
  measuredAt: string | null;
  method: string;
  isPrimary: boolean;
}

interface Pilot {
  id: string;
  status: string;
  outcome: string | null;
  department: string;
  location: string | null;
  contractValue: string | number;
  durationDays: number;
  baselineDays: number;
  baselineQuality: string;
  scopeUnits: number;
  scopeUnitLabel: string;
  origin: string;
  challenge?: { id: string; title: string; targetMetric: string; targetValue: number | null };
  startup?: { id: string; legalName: string; displayName: string | null; city: string | null };
  milestones: Milestone[];
  metrics: Metric[];
}

interface TrailEvent {
  id: string;
  at: string;
  action: string;
  detail: string;
}

const MILESTONE_STATE: Record<string, { label: string; tone: string }> = {
  LOCKED: { label: 'Locked', tone: 'text-chalk/35' },
  IN_PROGRESS: { label: 'In progress', tone: 'text-chalk/60' },
  EVIDENCE_SUBMITTED: { label: 'Evidence filed', tone: 'text-signal' },
  APPROVED: { label: 'Approved', tone: 'text-validated' },
  PAID: { label: 'Paid', tone: 'text-validated' },
  REJECTED: { label: 'Returned', tone: 'text-risk' },
};

export default function PilotPage() {
  return (
    <RoleGate roles={['GOVERNMENT_OFFICER', 'EVALUATOR', 'ADMIN']}>
      <PilotDetail />
    </RoleGate>
  );
}

function PilotDetail() {
  const params = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [pilot, setPilot] = useState<Pilot | null>(null);
  const [trail, setTrail] = useState<TrailEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // An evaluator reads this page; only a government officer acts on it. That
  // split is the backend's — `assertGovernment` refuses the rest — and is
  // mirrored here so an evaluator is not shown buttons that would be rejected.
  const isGov = profile?.role === 'GOVERNMENT_OFFICER' || profile?.role === 'ADMIN';

  const load = useCallback(async () => {
    const [p, t] = await Promise.all([
      fetchApi<Pilot>(`/api/workflow/pilots/${params.id}`),
      fetchApi<TrailEvent[]>(`/api/workflow/pilots/${params.id}/trail`).catch(() => []),
    ]);
    setPilot(p);
    setTrail(t);
  }, [params.id]);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : 'Could not load this pilot.'));
  }, [load]);

  /** Every action goes through here so a refusal always reaches the screen. */
  const act = async (key: string, path: string, body?: unknown) => {
    setBusy(key);
    setError(null);
    try {
      await fetchApi(path, {
        method: 'POST',
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That action was refused.');
    } finally {
      setBusy(null);
    }
  };

  const money = (v: string | number) => {
    const n = Number(v);
    return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN')}` : '—';
  };

  if (error && !pilot) {
    return <p className="card border-risk/30 p-4 text-[0.8125rem] text-risk">{error}</p>;
  }
  if (!pilot) return <div className="card p-5 text-[0.8125rem] text-chalk/50">Loading…</div>;

  const primary = pilot.metrics.find((m) => m.isPrimary) ?? pilot.metrics[0];
  const paid = pilot.milestones.filter((m) => m.status === 'PAID');
  const released = paid.reduce((t, m) => t + Number(m.payment || 0), 0);
  const allPaid = pilot.milestones.length > 0 && paid.length === pilot.milestones.length;

  return (
    <>
      <ConsoleHeader
        title={pilot.challenge?.title ?? 'Pilot'}
        subtitle={`${pilot.startup?.displayName ?? pilot.startup?.legalName ?? 'Selected startup'} · ${pilot.department}${pilot.location ? ` · ${pilot.location}` : ''}`}
        source="demonstration"
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal">
          {pilot.status.replace(/_/g, ' ').toLowerCase()}
        </span>
        {pilot.origin === 'DEMO' && (
          <span className="rounded-full border border-chalk/25 px-2 py-0.5 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-chalk/55">
            Demo simulation
          </span>
        )}
        {pilot.outcome && (
          <span className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-validated">
            {pilot.outcome.replace(/_/g, ' ').toLowerCase()}
          </span>
        )}
        {pilot.startup && (
          <Link
            href={`/startups/${pilot.startup.id}`}
            className="ml-auto font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-signal hover:underline"
          >
            Open dossier ↗
          </Link>
        )}
      </div>

      {error && <p className="card border-risk/30 p-4 text-[0.8125rem] text-risk">{error}</p>}

      <section aria-label="Contract">
        <SectionHead title="Contract" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tile label="Value" value={money(pilot.contractValue)} />
          <Tile
            label="Released"
            value={money(released)}
            context={`${paid.length} of ${pilot.milestones.length} milestones`}
          />
          <Tile label="Duration" value={`${pilot.durationDays} days`} context={`${pilot.baselineDays}-day baseline`} />
          <Tile
            label="Scope"
            value={`${pilot.scopeUnits} ${pilot.scopeUnitLabel}${pilot.scopeUnits === 1 ? '' : 's'}`}
            context={`${pilot.baselineQuality.toLowerCase()} baseline`}
          />
        </div>
      </section>

      {primary && (
        <section aria-label="Measurement">
          <SectionHead title="Measurement" meta={primary.isPrimary ? 'primary KPI' : undefined} />
          <div className="card p-5">
            <p className="text-[0.9375rem] text-chalk">{primary.name}</p>
            <p className="mt-1 text-[0.75rem] text-chalk/45">{primary.method}</p>

            <div className="mt-4 grid grid-cols-3 gap-4 border-t border-chalk/[0.08] pt-4">
              <Figure label="Baseline" value={primary.baselineValue} unit={primary.unit} />
              <Figure label="Target" value={primary.targetValue} unit={primary.unit} />
              <Figure
                label="Achieved"
                value={primary.achievedValue}
                unit={primary.unit}
                pending="not yet measured"
              />
            </div>

            {/* Measurement is a claim about the world, so it is entered by a
                person and never inferred from milestones being paid. */}
            {isGov && primary.achievedValue === null && (
              <MeasurementForm
                busy={busy === 'measure'}
                unit={primary.unit}
                onSubmit={(v) =>
                  act('measure', `/api/workflow/metrics/${primary.id}/measurement`, {
                    achievedValue: v,
                  })
                }
              />
            )}
          </div>
        </section>
      )}

      <section aria-label="Milestones">
        <SectionHead title="Milestones" meta="evidence → approval → payment" />
        <div className="flex flex-col gap-3">
          {pilot.milestones.map((m) => (
            <MilestoneCard
              key={m.id}
              milestone={m}
              isGov={isGov}
              busy={busy}
              money={money}
              onAct={act}
            />
          ))}
        </div>
      </section>

      {isGov && pilot.status !== 'CLOSED' && (
        <section aria-label="Close">
          <SectionHead title="Close the pilot" />
          <div className="card p-5">
            <p className="max-w-[64ch] text-[0.8125rem] leading-relaxed text-chalk/60">
              Closing computes the outcome from the measured result against the target. It is not a
              judgement typed in by hand — which is why the measurement has to exist first.
            </p>
            <button
              type="button"
              disabled={!primary || primary.achievedValue === null || !allPaid || busy === 'close'}
              onClick={() => act('close', `/api/workflow/pilots/${pilot.id}/close`, { failureCauses: [] })}
              className="mt-4 rounded-[8px] border border-chalk/20 px-4 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-chalk transition-colors hover:border-signal/50 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {busy === 'close' ? 'Closing…' : 'Close pilot'}
            </button>
            {(!primary || primary.achievedValue === null) && (
              <p className="mt-2.5 text-[0.6875rem] text-chalk/40">
                Record the final measurement first.
              </p>
            )}
            {primary?.achievedValue !== null && !allPaid && (
              <p className="mt-2.5 text-[0.6875rem] text-chalk/40">
                {pilot.milestones.length - paid.length} milestone(s) still unpaid.
              </p>
            )}
          </div>
        </section>
      )}

      <section aria-label="Trail">
        <SectionHead title="Audit trail" meta={`${trail.length} event${trail.length === 1 ? '' : 's'}`} />
        <div className="card p-0">
          {trail.length === 0 ? (
            <p className="p-5 text-[0.8125rem] text-chalk/45">Nothing recorded yet.</p>
          ) : (
            <ul>
              {trail.map((e, i) => (
                <li
                  key={e.id}
                  className={`flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3 ${
                    i > 0 ? 'border-t border-chalk/[0.06]' : ''
                  }`}
                >
                  <span className="w-40 shrink-0 font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-signal">
                    {e.action.replace(/_/g, ' ').toLowerCase()}
                  </span>
                  <span className="flex-1 text-[0.8125rem] text-chalk/70">{e.detail}</span>
                  <span className="font-mono text-[0.625rem] text-chalk/35">
                    {new Date(e.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

function MilestoneCard({
  milestone: m,
  isGov,
  busy,
  money,
  onAct,
}: {
  milestone: Milestone;
  isGov: boolean;
  busy: string | null;
  money: (v: string | number) => string;
  onAct: (key: string, path: string, body?: unknown) => Promise<void>;
}) {
  const [reason, setReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const st = MILESTONE_STATE[m.status] ?? { label: m.status, tone: 'text-chalk/50' };
  const accepted = m.evidence.filter((e) => e.status === 'ACCEPTED').length;
  const canApprove = m.status === 'EVIDENCE_SUBMITTED' && accepted >= m.evidenceRequired.length;

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[0.6875rem] text-chalk/35">{m.code}</span>
            <span className={`font-mono text-[0.5625rem] uppercase tracking-[0.12em] ${st.tone}`}>
              {st.label}
            </span>
          </div>
          <p className="mt-1.5 text-[0.9375rem] text-chalk">{m.title}</p>
          <p className="mt-1 max-w-[68ch] text-[0.8125rem] leading-relaxed text-chalk/55">
            {m.description}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-[0.9375rem] text-chalk">{money(m.payment)}</p>
          <p className="mt-0.5 font-mono text-[0.625rem] text-chalk/35">
            due {new Date(m.dueOn).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
          </p>
        </div>
      </div>

      {m.rejectionReason && m.status === 'REJECTED' && (
        <p className="mt-3 border-l-2 border-risk/40 pl-3 text-[0.8125rem] text-risk/90">
          {m.rejectionReason}
        </p>
      )}

      {/* Required artefacts, each shown against what was actually filed. An
          empty row is the honest state — it is what blocks approval. */}
      <div className="mt-4 border-t border-chalk/[0.08] pt-3.5">
        <p className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-chalk/35">
          Evidence · {accepted} of {m.evidenceRequired.length} accepted
        </p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {m.evidenceRequired.map((required) => {
            const filed = m.evidence.find(
              (e) => e.label.toLowerCase() === required.toLowerCase(),
            );
            return (
              <li key={required} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-[0.8125rem] text-chalk/70">{required}</span>
                {filed ? (
                  <>
                    <span
                      className={`font-mono text-[0.5625rem] uppercase tracking-[0.1em] ${
                        filed.status === 'ACCEPTED'
                          ? 'text-validated'
                          : filed.status === 'REJECTED'
                            ? 'text-risk'
                            : 'text-signal'
                      }`}
                    >
                      {filed.status.toLowerCase()}
                    </span>
                    {isGov && filed.status === 'SUBMITTED' && (
                      <span className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy === `ev-${filed.id}`}
                          onClick={() =>
                            onAct(`ev-${filed.id}`, `/api/workflow/evidence/${filed.id}/review`, {
                              decision: 'ACCEPTED',
                            })
                          }
                          className="font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-validated hover:underline disabled:opacity-40"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={busy === `ev-${filed.id}`}
                          onClick={() =>
                            onAct(`ev-${filed.id}`, `/api/workflow/evidence/${filed.id}/review`, {
                              decision: 'REJECTED',
                              reviewNote: 'Did not evidence the milestone as specified.',
                            })
                          }
                          className="font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-risk hover:underline disabled:opacity-40"
                        >
                          Reject
                        </button>
                      </span>
                    )}
                  </>
                ) : (
                  <span className="font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-chalk/30">
                    not filed
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Filing evidence is the startup's act, and it happens in the startup's
          own workspace. There is no officer-side shortcut for it: an officer who
          could file the artefact would also be the one accepting it. */}
      {m.status === 'IN_PROGRESS' && (
        <p className="mt-3 text-[0.6875rem] text-chalk/40">
          Waiting on the startup to file the required artefacts.
        </p>
      )}

      {isGov && (m.status === 'EVIDENCE_SUBMITTED' || m.status === 'APPROVED') && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-chalk/[0.08] pt-3.5">
          {m.status === 'EVIDENCE_SUBMITTED' && (
            <>
              <button
                type="button"
                disabled={!canApprove || busy === `ap-${m.id}`}
                onClick={() => onAct(`ap-${m.id}`, `/api/workflow/milestones/${m.id}/approve`)}
                className="rounded-[8px] border border-chalk/20 px-3.5 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-chalk transition-colors hover:border-validated/50 disabled:cursor-not-allowed disabled:opacity-35"
              >
                {busy === `ap-${m.id}` ? 'Approving…' : 'Approve milestone'}
              </button>
              <button
                type="button"
                onClick={() => setShowReject((v) => !v)}
                className="rounded-[8px] border border-chalk/15 px-3.5 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-chalk/70 transition-colors hover:border-risk/40"
              >
                Return
              </button>
              {!canApprove && (
                <span className="text-[0.6875rem] text-chalk/40">
                  Approval needs all {m.evidenceRequired.length} artefacts accepted.
                </span>
              )}
            </>
          )}

          {m.status === 'APPROVED' && (
            <>
              <button
                type="button"
                disabled={busy === `pay-${m.id}`}
                onClick={() => onAct(`pay-${m.id}`, `/api/workflow/milestones/${m.id}/pay`)}
                className="rounded-[8px] bg-signal px-3.5 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-void transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {busy === `pay-${m.id}` ? 'Releasing…' : `Release ${money(m.payment)}`}
              </button>
              <span className="text-[0.6875rem] text-chalk/40">
                Approved by {m.approvedBy ?? 'a government user'}. Paying unlocks the next milestone.
              </span>
            </>
          )}
        </div>
      )}

      {showReject && (
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this being returned?"
            className="min-w-[16rem] flex-1 rounded-[8px] border border-chalk/15 bg-transparent px-3 py-2 text-[0.8125rem] text-chalk placeholder:text-chalk/30 focus:border-signal/50 focus:outline-none"
          />
          <button
            type="button"
            disabled={reason.trim().length < 4 || busy === `rj-${m.id}`}
            onClick={async () => {
              await onAct(`rj-${m.id}`, `/api/workflow/milestones/${m.id}/reject`, {
                reason: reason.trim(),
              });
              setReason('');
              setShowReject(false);
            }}
            className="rounded-[8px] border border-risk/40 px-3.5 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-risk transition-opacity hover:opacity-80 disabled:opacity-35"
          >
            Return to startup
          </button>
        </div>
      )}

      {m.paidAt && (
        <p className="mt-3 font-mono text-[0.625rem] text-chalk/35">
          Released {new Date(m.paidAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
        </p>
      )}
    </div>
  );
}

function MeasurementForm({
  unit,
  busy,
  onSubmit,
}: {
  unit: string;
  busy: boolean;
  onSubmit: (value: number) => Promise<void>;
}) {
  const [value, setValue] = useState('');
  const parsed = Number(value);
  const valid = value.trim() !== '' && Number.isFinite(parsed);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-chalk/[0.08] pt-3.5">
      <label className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-chalk/35">
        Achieved ({unit})
      </label>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        inputMode="decimal"
        placeholder="0"
        className="w-32 rounded-[8px] border border-chalk/15 bg-transparent px-3 py-2 text-[0.8125rem] text-chalk placeholder:text-chalk/30 focus:border-signal/50 focus:outline-none"
      />
      <button
        type="button"
        disabled={!valid || busy}
        onClick={async () => {
          await onSubmit(parsed);
          setValue('');
        }}
        className="rounded-[8px] border border-chalk/20 px-3.5 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-chalk transition-colors hover:border-signal/50 disabled:cursor-not-allowed disabled:opacity-35"
      >
        {busy ? 'Recording…' : 'Record measurement'}
      </button>
    </div>
  );
}

function Figure({
  label,
  value,
  unit,
  pending,
}: {
  label: string;
  value: number | null;
  unit: string;
  pending?: string;
}) {
  return (
    <div>
      <p className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-chalk/35">{label}</p>
      {value === null ? (
        <p className="mt-1.5 text-[0.8125rem] italic text-chalk/35">{pending ?? '—'}</p>
      ) : (
        <p className="mt-1 font-display text-[1.25rem] font-black leading-none text-chalk">
          {value}
          <span className="ml-1 font-mono text-[0.625rem] font-normal text-chalk/40">{unit}</span>
        </p>
      )}
    </div>
  );
}

function Tile({ label, value, context }: { label: string; value: string; context?: string }) {
  return (
    <div className="card p-4">
      <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/40">{label}</span>
      <p className="mt-1.5 font-display text-[1.375rem] font-black leading-none text-chalk">{value}</p>
      {context && <p className="mt-1.5 text-[0.6875rem] text-chalk/45">{context}</p>}
    </div>
  );
}
