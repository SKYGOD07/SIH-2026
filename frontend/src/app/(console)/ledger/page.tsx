'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead } from '@/components/console/primitives';
import { RoleGate } from '@/components/auth/RoleGate';
import { fetchApi } from '@/lib/api';

/**
 * The payment ledger.
 *
 * One rule made visible: **evidence → approval → payment.** Every milestone is
 * shown at its position in that chain, so an officer can see at a glance what
 * is owed, what is waiting on the startup, and what is waiting on them.
 *
 * Nothing here can release money. The buttons that move a milestone live on the
 * pilot itself and are refused by the backend unless the transition is legal —
 * this page reads the chain rather than driving it, which is why it can show
 * every pilot at once without becoming a place where a tranche gets released by
 * accident.
 */

interface Milestone {
  id: string;
  code: string;
  title: string;
  payment: string | number;
  status: string;
  dueOn: string;
  approvedBy: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  rejectionReason: string | null;
  evidenceRequired: string[];
  evidence: { id: string; status: string; label: string }[];
}

interface PilotSummary {
  id: string;
  status: string;
  contractValue: string | number;
  challenge?: { title: string };
  startup?: { legalName: string; displayName: string | null };
}

interface FullPilot extends PilotSummary {
  milestones: Milestone[];
}

/** The chain, in order. Position is what the ledger is actually showing. */
const CHAIN = ['LOCKED', 'IN_PROGRESS', 'EVIDENCE_SUBMITTED', 'APPROVED', 'PAID'] as const;

const STATE: Record<string, { label: string; waiting: string; tone: string }> = {
  LOCKED: { label: 'Locked', waiting: 'Unlocks when the previous tranche is paid', tone: 'text-chalk/35' },
  IN_PROGRESS: { label: 'In progress', waiting: 'Waiting on the startup to file evidence', tone: 'text-chalk/60' },
  EVIDENCE_SUBMITTED: { label: 'Evidence filed', waiting: 'Waiting on your review', tone: 'text-signal' },
  APPROVED: { label: 'Approved', waiting: 'Cleared for payment', tone: 'text-validated' },
  PAID: { label: 'Paid', waiting: 'Released', tone: 'text-validated' },
  REJECTED: { label: 'Returned', waiting: 'Returned to the startup', tone: 'text-risk' },
};

export default function LedgerPage() {
  return (
    <RoleGate roles={['GOVERNMENT_OFFICER', 'EVALUATOR', 'ADMIN']}>
      <Ledger />
    </RoleGate>
  );
}

function Ledger() {
  const [pilots, setPilots] = useState<FullPilot[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const list = await fetchApi<PilotSummary[]>('/api/workflow/pilots/mine');
        // The list endpoint does not carry milestones, so each pilot is opened
        // for its chain. Fine at this scale; if a department ever runs dozens,
        // this wants a dedicated ledger endpoint rather than N requests.
        const full = await Promise.all(
          list.map((p) => fetchApi<FullPilot>(`/api/workflow/pilots/${p.id}`)),
        );
        if (live) setPilots(full);
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : 'Could not load the ledger.');
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const money = (v: string | number) => {
    const n = Number(v);
    return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN')}` : '—';
  };

  const all = (pilots ?? []).flatMap((p) => p.milestones ?? []);
  const paid = all.filter((m) => m.status === 'PAID');
  const awaitingReview = all.filter((m) => m.status === 'EVIDENCE_SUBMITTED');
  const approvedUnpaid = all.filter((m) => m.status === 'APPROVED');
  const sum = (ms: Milestone[]) => ms.reduce((t, m) => t + Number(m.payment || 0), 0);
  const contracted = (pilots ?? []).reduce((t, p) => t + Number(p.contractValue || 0), 0);

  return (
    <>
      <ConsoleHeader
        title="Evidence & ledger"
        subtitle="Evidence, approval, payment — in that order, for every contracted milestone."
        source="demonstration"
      />

      {error && <p className="card border-risk/30 p-4 text-[0.8125rem] text-risk">{error}</p>}

      {pilots === null ? (
        <div className="card p-5 text-[0.8125rem] text-chalk/50">Loading…</div>
      ) : pilots.length === 0 ? (
        <div className="card p-6">
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal">
            Nothing contracted
          </span>
          <p className="mt-2.5 max-w-[58ch] text-[0.875rem] leading-relaxed text-chalk/60">
            The ledger fills when a pilot is contracted. Milestones, the evidence each one
            requires, and the tranche it releases all come from that contract.
          </p>
          <Link href="/challenges" className="mt-5 inline-block font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-signal hover:underline">
            Review challenges ↗
          </Link>
        </div>
      ) : (
        <>
          <section aria-label="Position">
            <SectionHead title="Position" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Tile label="Contracted" value={money(contracted)} />
              <Tile label="Paid" value={money(sum(paid))} context={`${paid.length} of ${all.length} milestones`} />
              <Tile
                label="Awaiting your review"
                value={String(awaitingReview.length)}
                context={awaitingReview.length ? money(sum(awaitingReview)) : 'nothing filed'}
                urgent={awaitingReview.length > 0}
              />
              <Tile
                label="Approved, unpaid"
                value={String(approvedUnpaid.length)}
                context={approvedUnpaid.length ? money(sum(approvedUnpaid)) : 'none'}
              />
            </div>
          </section>

          {pilots.map((p) => (
            <section key={p.id} aria-label={p.challenge?.title ?? 'Pilot'}>
              <SectionHead
                title={p.challenge?.title ?? 'Pilot'}
                meta={p.startup?.displayName ?? p.startup?.legalName ?? undefined}
              />
              <div className="card p-0">
                <ul>
                  {(p.milestones ?? []).map((m, i) => {
                    const st = STATE[m.status] ?? { label: m.status, waiting: '', tone: 'text-chalk/50' };
                    const accepted = (m.evidence ?? []).filter((e) => e.status === 'ACCEPTED').length;
                    return (
                      <li
                        key={m.id}
                        className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 ${
                          i > 0 ? 'border-t border-chalk/[0.06]' : ''
                        }`}
                      >
                        <span className="w-8 shrink-0 font-mono text-[0.6875rem] text-chalk/35">{m.code}</span>

                        <div className="min-w-[12rem] flex-1">
                          <p className="text-[0.875rem] text-chalk/85">{m.title}</p>
                          <p className={`mt-0.5 text-[0.6875rem] ${st.tone}`}>
                            {st.waiting}
                            {m.rejectionReason ? ` — ${m.rejectionReason}` : ''}
                          </p>
                        </div>

                        {/* Evidence, counted. "2 of 3 accepted" is the fact that
                            decides whether approval is even reachable. */}
                        <span className="shrink-0 font-mono text-[0.625rem] text-chalk/45">
                          {accepted}/{m.evidenceRequired.length} evidence
                        </span>

                        <ChainDots status={m.status} />

                        <span className="w-24 shrink-0 text-right font-mono text-[0.75rem] text-chalk/70">
                          {money(m.payment)}
                        </span>
                        <span
                          className={`w-24 shrink-0 text-right font-mono text-[0.5625rem] uppercase tracking-[0.1em] ${st.tone}`}
                        >
                          {st.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          ))}

          <p className="max-w-[74ch] text-[0.75rem] leading-relaxed text-chalk/40">
            No tranche is released from this page. Payment requires an approved milestone, and
            approval requires every named artefact to be filed and accepted — the backend refuses
            any other order.
          </p>
        </>
      )}
    </>
  );
}

/** The chain as five dots, so position is visible without reading the label. */
function ChainDots({ status }: { status: string }) {
  const reached = CHAIN.indexOf(status as (typeof CHAIN)[number]);
  return (
    <span className="flex shrink-0 items-center gap-1" aria-hidden>
      {CHAIN.map((s, i) => (
        <span
          key={s}
          title={s.replace(/_/g, ' ').toLowerCase()}
          className={`h-1.5 w-1.5 rounded-full ${
            status === 'REJECTED'
              ? 'bg-risk/50'
              : i <= reached && reached >= 0
                ? 'bg-signal'
                : 'bg-chalk/15'
          }`}
        />
      ))}
    </span>
  );
}

function Tile({
  label,
  value,
  context,
  urgent,
}: {
  label: string;
  value: string;
  context?: string;
  urgent?: boolean;
}) {
  return (
    <div className={`card p-4 ${urgent ? 'border-signal/40' : ''}`}>
      <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/40">{label}</span>
      <p className="mt-1.5 font-display text-[1.375rem] font-black leading-none text-chalk">{value}</p>
      {context && <p className="mt-1.5 text-[0.6875rem] text-chalk/45">{context}</p>}
    </div>
  );
}
