import type { Metadata } from 'next';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead, StatCard, Card, Pill, Bar } from '@/components/console/primitives';
import { Icon } from '@/components/console/Icon';
import { PaymentTimingChart } from '@/components/dashboard/PaymentTimingChart';
import { fetchDashboard } from '@/lib/api/mahainnovate';
import { buildRailContext } from '@/lib/console/rail';
import { formatLakh } from '@/lib/utils';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Ledger',
  description:
    'The milestone ledger: evidence filed, decisions taken, money released, and the state machine that will not let those happen out of order.',
};

export const dynamic = 'force-dynamic';

/**
 * The milestone ledger.
 *
 * One rule, drawn rather than described:
 *
 *     evidence  →  approval  →  payment
 *
 * The chain across the top is that rule as a picture. It is worth the space
 * because the single most important property of this system is the thing it
 * *cannot* do — there is no path from filed evidence straight to a payment, and
 * a reader should be able to see that without reading a paragraph about it.
 *
 * Every figure here comes from the same snapshot the console header reports the
 * source of, so a fixture is never presented as a departmental record.
 */

/** The state machine, in order. Mirrors TRANSITIONS in the ledger service. */
const CHAIN = [
  { status: 'LOCKED', label: 'Locked' },
  { status: 'IN_PROGRESS', label: 'In progress' },
  { status: 'EVIDENCE_SUBMITTED', label: 'Evidence filed' },
  { status: 'APPROVED', label: 'Approved' },
  { status: 'PAID', label: 'Paid' },
] as const;

const STATUS: Record<string, { label: string; tone: 'signal' | 'validated' | 'risk' | 'chalk' }> = {
  PAID: { label: 'Paid', tone: 'validated' },
  APPROVED: { label: 'Approved', tone: 'validated' },
  EVIDENCE_SUBMITTED: { label: 'Awaiting you', tone: 'signal' },
  IN_PROGRESS: { label: 'In progress', tone: 'signal' },
  REJECTED: { label: 'Returned', tone: 'risk' },
  LOCKED: { label: 'Locked', tone: 'chalk' },
};

export default async function LedgerPage() {
  const snapshot = await fetchDashboard();
  const { pilot, milestones, awaitingValidation, paymentTiming, source } = snapshot;
  const rail = buildRailContext(snapshot, new Date());

  const timingByCode = new Map(paymentTiming.milestones.map((m) => [m.code, m]));
  const releasedRatio = pilot.contractValue > 0 ? pilot.released / pilot.contractValue : 0;

  return (
    <>
      <ConsoleHeader
        title="Milestone ledger"
        subtitle={`${pilot.id} · every state change, in the order the rules allow`}
        source={source}
        notifications={rail.notifications}
      />

      <section aria-label="Position">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon="rupee"
            tone="validated"
            value={formatLakh(pilot.released)}
            label="Released"
          />
          <StatCard
            icon="check"
            tone="signal"
            value={formatLakh(pilot.approvedUnpaid)}
            label="Approved, not yet paid"
          />
          <StatCard
            icon="clock"
            tone={pilot.awaitingValidation > 0 ? 'risk' : 'chalk'}
            value={String(pilot.awaitingValidation)}
            label="Awaiting your validation"
          />
          <StatCard
            icon="lock"
            tone="chalk"
            value={formatLakh(pilot.outstanding)}
            label="Outstanding on the contract"
          />
        </div>
      </section>

      {/* --- the rule, drawn --- */}
      <section aria-label="How a milestone moves">
        <SectionHead title="How a milestone moves" meta="Enforced in code, not in guidance" />

        <Card>
          <ol className="flex flex-wrap items-stretch gap-y-4">
            {CHAIN.map((step, i) => (
              <li key={step.status} className="flex min-w-[8.5rem] flex-1 items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/30">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={cn(
                      'mt-1.5 block border-t pt-2.5 font-display text-[0.8125rem] font-bold uppercase tracking-[-0.01em]',
                      step.status === 'PAID'
                        ? 'border-validated text-validated'
                        : step.status === 'EVIDENCE_SUBMITTED'
                          ? 'border-signal text-signal'
                          : 'border-chalk/20 text-chalk/70',
                    )}
                  >
                    {step.label}
                  </span>
                </span>

                {i < CHAIN.length - 1 ? (
                  <Icon
                    name="chevronRight"
                    className="mt-4 h-3.5 w-3.5 shrink-0 text-chalk/25"
                    strokeWidth={2.2}
                  />
                ) : null}
              </li>
            ))}
          </ol>

          <p className="mt-6 border-t border-chalk/[0.06] pt-4 text-[0.8125rem] leading-relaxed text-chalk/50">
            There is no transition from{' '}
            <span className="text-signal">evidence filed</span> to{' '}
            <span className="text-validated">paid</span>. An officer cannot release a tranche early
            through this console, only by changing the service that refuses it — which leaves a
            diff.
          </p>
        </Card>
      </section>

      {/* --- the milestones themselves --- */}
      <section aria-label="Milestones">
        <SectionHead
          title="Milestones"
          meta={`${milestones.length} on ${pilot.id}`}
        />

        <Card className="mb-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
            <p className="font-display text-[1.5rem] font-extrabold leading-none tracking-[-0.03em] text-chalk">
              {formatLakh(pilot.released)}
              <span className="text-[0.9375rem] font-bold text-chalk/40">
                {' '}
                of {formatLakh(pilot.contractValue)}
              </span>
            </p>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-chalk/40">
              {Math.round(releasedRatio * 100)}% released
            </p>
          </div>
          <Bar value={releasedRatio} className="mt-4" />
        </Card>

        <ul className="flex flex-col gap-3">
          {milestones.map((m) => {
            const status = STATUS[m.status] ?? { label: m.status, tone: 'chalk' as const };
            const timing = timingByCode.get(m.code);
            const waiting = timing?.waitingDays ?? null;
            const late = waiting !== null && waiting > paymentTiming.targetDays;
            const queued = awaitingValidation.some((a) => a.code === m.code);

            return (
              <li key={m.id}>
                <Card className={cn(queued && 'border-signal/40')}>
                  <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                    <div className="min-w-0">
                      <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-chalk/35">
                        {m.code} · due {m.dueOn}
                      </span>
                      <h3 className="mt-1.5 font-display text-[1rem] font-extrabold uppercase tracking-[-0.02em] text-chalk">
                        {m.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-4">
                      <Pill tone={status.tone}>{status.label}</Pill>
                      <span className="font-display text-[1.0625rem] font-extrabold tabular-nums text-chalk">
                        {formatLakh(m.payment)}
                      </span>
                    </div>
                  </div>

                  {/* Timing, where there is any to report. */}
                  <dl className="mt-5 grid gap-x-8 gap-y-3 border-t border-chalk/[0.06] pt-4 sm:grid-cols-3">
                    <div>
                      <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/30">
                        With the department
                      </dt>
                      <dd className="mt-1 text-[0.8125rem] text-chalk/75">
                        {timing?.daysToDecide !== null && timing?.daysToDecide !== undefined
                          ? `${timing.daysToDecide} days to decide`
                          : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/30">
                        In payment
                      </dt>
                      <dd className="mt-1 text-[0.8125rem] text-chalk/75">
                        {timing?.daysToRelease !== null && timing?.daysToRelease !== undefined
                          ? `${timing.daysToRelease} days to release`
                          : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/30">
                        Filed to paid
                      </dt>
                      <dd
                        className={cn(
                          'mt-1 text-[0.8125rem] font-semibold',
                          timing?.daysToPay !== null && timing?.daysToPay !== undefined
                            ? 'text-validated'
                            : late
                              ? 'text-risk'
                              : 'text-chalk/50',
                        )}
                      >
                        {timing?.daysToPay !== null && timing?.daysToPay !== undefined
                          ? `${timing.daysToPay} days`
                          : waiting !== null
                            ? `waiting ${waiting} days`
                            : 'not started'}
                      </dd>
                    </div>
                  </dl>

                  {queued ? (
                    <p className="mt-4 flex items-center gap-2 rounded-[10px] bg-signal/[0.1] px-3 py-2.5 text-[0.78125rem] text-signal">
                      <Icon name="alert" className="h-3.5 w-3.5" strokeWidth={2} />
                      Evidence is filed. Nothing on this milestone is paid until you validate it.
                    </p>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Payment timing">
        <SectionHead
          title="Payment timing"
          meta={`Against a ${paymentTiming.targetDays}-day standard`}
        />
        <Card>
          <PaymentTimingChart timing={paymentTiming} />
        </Card>
      </section>
    </>
  );
}
