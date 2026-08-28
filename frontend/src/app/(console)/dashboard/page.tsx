import type { Metadata } from 'next';
import Link from 'next/link';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead, StatCard, Card, Pill, Bar, FeatureCard } from '@/components/console/primitives';
import { Icon } from '@/components/console/Icon';
import { PaymentTimingChart } from '@/components/dashboard/PaymentTimingChart';
import { EvidenceBaseChart } from '@/components/dashboard/EvidenceBaseChart';
import { OutcomeLedger, type OutcomeRow } from '@/components/dashboard/OutcomeLedger';
import { fetchDashboard } from '@/lib/api/mahainnovate';
import { buildRailContext } from '@/lib/console/rail';
import { PATHWAY, TEMPLATES } from '@/data/pathway';
import { formatLakh } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Console',
  description:
    'The department console: what is waiting on a decision, what has been released, and what the evidence base knows.',
};

// The console reflects live ledger state, so it must not be cached.
export const dynamic = 'force-dynamic';

const STATUS: Record<string, { label: string; tone: 'signal' | 'validated' | 'risk' | 'chalk' }> = {
  PAID: { label: 'Paid', tone: 'validated' },
  APPROVED: { label: 'Approved', tone: 'validated' },
  EVIDENCE_SUBMITTED: { label: 'Awaiting you', tone: 'signal' },
  IN_PROGRESS: { label: 'In progress', tone: 'signal' },
  REJECTED: { label: 'Returned', tone: 'risk' },
  LOCKED: { label: 'Locked', tone: 'chalk' },
};

/**
 * The department console.
 *
 * Organised around the one question an officer opens it to answer: *what needs
 * me?* The overview strip is four figures, then the queue, then the two things
 * that are actually a decision, and only after all of that the measurement
 * sections. A dashboard that leads with totals is a report; this is a worklist
 * that happens to carry its evidence.
 *
 * Rendered on the server from the API with the demonstration fixtures as a
 * fallback, and whichever source served it is stated in the header — so a
 * fixture is never mistaken for departmental data.
 */
export default async function ConsolePage() {
  const snapshot = await fetchDashboard();
  const { corpus, pilot, awaitingValidation, milestones, paymentTiming, source } = snapshot;
  const rail = buildRailContext(snapshot, new Date());

  const releasedRatio = pilot.contractValue > 0 ? pilot.released / pilot.contractValue : 0;
  const nextDecision = awaitingValidation[0];
  const paidCount = milestones.filter((m) => m.status === 'PAID').length;

  /*
   * The six outcomes the problem statement names, each answered from figures
   * already on this page. Two cannot be measured from a single pilot at all,
   * and say so rather than borrowing a number that sounds close.
   */
  const outcomes: OutcomeRow[] = [
    {
      outcome: 'Faster discovery and testing',
      figure: `${PATHWAY.length} stages`,
      source: 'The pathway from challenge to scale decision, each stage recorded.',
    },
    {
      outcome: 'Higher quality pilots',
      figure: `${corpus.corpusSize} pilots`,
      source: 'Comparable pilots the simulator designs each new pilot against.',
    },
    {
      outcome: 'Reduced departmental risk',
      figure: `${TEMPLATES.length} templates`,
      source: 'Standard problem, evaluation, agreement, data/IP, security, risk and pathway forms.',
    },
    {
      outcome: 'Timely startup payments',
      figure:
        paymentTiming.medianDaysToPay === null ? null : `${paymentTiming.medianDaysToPay}d median`,
      source: `Filed to paid, against a ${paymentTiming.targetDays}-day standard. ${paymentTiming.settledCount} settled, ${paymentTiming.breachedCount} over.`,
    },
    {
      outcome: 'Evidence-based procurement decisions',
      figure: `${corpus.domains.length} domains`,
      source: 'Domains with recorded outcomes the next decision can be argued from.',
    },
    {
      outcome: 'Scaling across departments or districts',
      figure: null,
      source: 'Needs a validated pilot to have transferred to a second department. None yet has.',
    },
  ];

  return (
    <>
      <ConsoleHeader
        title="What needs you"
        subtitle="Milestones with evidence filed and waiting on a departmental decision."
        source={source}
        notifications={rail.notifications}
      />

      {/* --- the four figures --- */}
      <section aria-label="Overview">
        <SectionHead title="Overview" action="Open the ledger" href="/ledger" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon="clock"
            tone="signal"
            value={String(pilot.awaitingValidation)}
            label="Awaiting your validation"
            trend={nextDecision ? `${nextDecision.code} filed` : undefined}
            direction="down"
            href="/ledger"
          />
          <StatCard
            icon="rupee"
            tone="validated"
            value={formatLakh(pilot.released)}
            label={`Released of ${formatLakh(pilot.contractValue)}`}
            trend={`${paidCount} of ${milestones.length} milestones`}
            href="/ledger"
          />
          <StatCard
            icon="trend"
            tone={
              paymentTiming.medianDaysToPay !== null &&
              paymentTiming.medianDaysToPay <= paymentTiming.targetDays
                ? 'validated'
                : 'risk'
            }
            value={
              paymentTiming.medianDaysToPay === null ? '—' : `${paymentTiming.medianDaysToPay}d`
            }
            label="Median, filed to paid"
            trend={`${paymentTiming.targetDays}-day standard`}
          />
          <StatCard
            icon="corpus"
            tone="chalk"
            value={String(corpus.corpusSize)}
            label="Pilots in the evidence base"
            trend={`${corpus.thinDomains.length} domains too thin`}
            direction="down"
            href="/corpus"
          />
        </div>
      </section>

      {/* --- the two things that are a decision --- */}
      <section aria-label="Decisions">
        <SectionHead title="Decisions open" meta={`${pilot.id}`} />

        <div className="grid gap-5 md:grid-cols-2">
          {nextDecision ? (
            <FeatureCard
              variant="accent"
              eyebrow="Awaiting validation"
              title={`${nextDecision.code} · ${nextDecision.title}`}
              description={`${nextDecision.filed} artefacts filed against the evidence this milestone requires. Approval unlocks ${formatLakh(nextDecision.payment)} and the milestone after it.`}
              meta={formatLakh(nextDecision.payment)}
              action="Validate"
              href="/ledger"
            />
          ) : (
            <Card className="flex min-h-[13.5rem] flex-col justify-center text-center">
              <Icon name="check" className="mx-auto h-6 w-6 text-validated" />
              <p className="mt-3 font-display text-[1.0625rem] font-extrabold uppercase tracking-[-0.02em] text-chalk">
                Queue clear
              </p>
              <p className="mt-2 text-[0.8125rem] text-chalk/45">
                Nothing is waiting on a departmental decision.
              </p>
            </Card>
          )}

          <FeatureCard
            variant="dark"
            eyebrow="When the pilot closes"
            title="Scale, extend or stop"
            description="The decision is recorded with the evidence behind it and a compliant procurement route — including when the decision is to stop, which the evidence base needs just as much."
            meta="Template TPL-07"
            action="Open the template"
            href="/templates"
          />
        </div>
      </section>

      {/* --- the queue itself --- */}
      <section aria-label="Validation queue">
        <SectionHead title="Validation queue" action="All milestones" href="/ledger" />

        <Card className="p-0">
          <ul>
            {awaitingValidation.map((item) => (
              <li key={`${item.pilotId}-${item.milestoneId}`}>
                <Link
                  href="/ledger"
                  data-cursor="open"
                  className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-chalk/[0.06] px-[1.125rem] py-4 transition-colors last:border-b-0 hover:bg-chalk/[0.03]"
                >
                  <span className="flex min-w-0 items-center gap-4">
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-chalk/35">
                      {item.pilotId} · {item.code}
                    </span>
                    <span className="truncate text-[0.875rem] font-semibold text-chalk">
                      {item.title}
                    </span>
                  </span>

                  <span className="flex items-center gap-5">
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-chalk/40">
                      {item.filed} artefacts
                    </span>
                    <span className="font-display text-[0.9375rem] font-extrabold tabular-nums text-chalk">
                      {formatLakh(item.payment)}
                    </span>
                    <Pill tone="signal">Validate</Pill>
                  </span>
                </Link>
              </li>
            ))}

            {awaitingValidation.length === 0 ? (
              <li className="px-[1.125rem] py-8 text-center text-[0.8125rem] text-chalk/40">
                Nothing awaiting validation.
              </li>
            ) : null}
          </ul>
        </Card>
      </section>

      {/* --- the contract, and where the money is --- */}
      <section aria-label="Contract">
        <SectionHead title={`Contract · ${pilot.id}`} action="Full ledger" href="/ledger" />

        <Card>
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
            <p className="font-display text-[1.75rem] font-extrabold leading-none tracking-[-0.03em] text-chalk">
              {formatLakh(pilot.released)}
              <span className="text-[1rem] font-bold text-chalk/40">
                {' '}
                of {formatLakh(pilot.contractValue)}
              </span>
            </p>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-chalk/40">
              released against approved evidence
            </p>
          </div>

          <Bar value={releasedRatio} className="mt-4" />

          <ul className="mt-6">
            {milestones.map((m) => {
              const status = STATUS[m.status] ?? { label: m.status, tone: 'chalk' as const };
              return (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-chalk/[0.06] py-3 last:border-b-0"
                >
                  <span className="flex min-w-0 items-center gap-4">
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-chalk/35">
                      {m.code}
                    </span>
                    <span className="truncate text-[0.8125rem] text-chalk">{m.title}</span>
                  </span>
                  <span className="flex items-center gap-5">
                    <Pill tone={status.tone}>{status.label}</Pill>
                    <span className="font-display text-[0.8125rem] font-bold tabular-nums text-chalk/70">
                      {formatLakh(m.payment)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      {/* --- did the money actually move on time --- */}
      <section aria-label="Payment timing">
        <SectionHead
          title="Payment timing"
          meta={`${paymentTiming.settledCount} settled · ${paymentTiming.breachedCount} over target`}
        />
        <Card>
          <p className="mb-7 max-w-[58ch] text-[0.8125rem] leading-relaxed text-chalk/50">
            The one expected outcome that cannot be asserted, only measured. Each milestone is timed
            from the moment its last evidence was filed to the moment the tranche was released,
            split at approval so a delay is attributable.
          </p>
          <PaymentTimingChart timing={paymentTiming} />
        </Card>
      </section>

      {/* --- what the corpus knows --- */}
      <section aria-label="Evidence base">
        <SectionHead title="Evidence base" action="All domains" href="/corpus" />
        <Card>
          <p className="mb-8 max-w-[58ch] text-[0.8125rem] leading-relaxed text-chalk/50">
            Every closed pilot, including the ones that missed their target, is what the simulator
            reasons from. Domains below the threshold still run, but report confidence as context
            rather than as a finding.
          </p>
          <EvidenceBaseChart domains={corpus.domains} thinDomains={corpus.thinDomains} />
        </Card>
      </section>

      {/* --- the outcomes the PS judges the mechanism on --- */}
      <section aria-label="Expected outcomes">
        <SectionHead title="Against the expected outcomes" meta="Problem statement" />
        <Card className="p-0">
          <div className="p-[1.125rem] pb-0">
            <p className="max-w-[58ch] text-[0.8125rem] leading-relaxed text-chalk/50">
              The six outcomes the problem statement names, each answered with a figure from this
              page and the place it came from.
            </p>
          </div>
          <div className="p-[1.125rem]">
            <OutcomeLedger rows={outcomes} />
          </div>
        </Card>
      </section>
    </>
  );
}
