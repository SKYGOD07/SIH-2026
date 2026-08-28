import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Label } from '@/components/typography';
import { fetchDashboard } from '@/lib/api/mahainnovate';
import { PaymentTimingChart } from '@/components/dashboard/PaymentTimingChart';
import { EvidenceBaseChart } from '@/components/dashboard/EvidenceBaseChart';
import { OutcomeLedger, type OutcomeRow } from '@/components/dashboard/OutcomeLedger';
import { PLATFORM_METRICS } from '@/data/knowledge';
import { PATHWAY, TEMPLATES } from '@/data/pathway';
import { formatLakh } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Dashboard',
  description:
    'The department console: what is running, what is waiting on a decision, and what the corpus knows.',
};

// The console reflects live ledger state, so it must not be cached.
export const dynamic = 'force-dynamic';

const STATUS_TONE: Record<string, string> = {
  PAID: 'text-validated',
  APPROVED: 'text-validated',
  EVIDENCE_SUBMITTED: 'text-signal',
  IN_PROGRESS: 'text-signal',
  REJECTED: 'text-risk',
  LOCKED: 'text-chalk/50',
};

const STATUS_LABEL: Record<string, string> = {
  PAID: 'Paid',
  APPROVED: 'Approved',
  EVIDENCE_SUBMITTED: 'Awaiting validation',
  IN_PROGRESS: 'In progress',
  REJECTED: 'Returned',
  LOCKED: 'Locked',
};

/**
 * The department console.
 *
 * Deliberately minimal, and organised around the one question an officer opens
 * it to answer: *what needs me?* That queue is first, above the summary numbers,
 * because a dashboard that leads with totals is a report — this is a worklist.
 *
 * Rendered on the server from the API, with the demonstration fixtures as a
 * fallback. Whichever source served the page is stated on it, so fixtures are
 * never mistaken for live departmental data.
 */
export default async function DashboardPage() {
  const snapshot = await fetchDashboard();
  const { corpus, pilot, awaitingValidation, milestones, source } = snapshot;

  const releasedPct = Math.round((pilot.released / pilot.contractValue) * 100);
  const { paymentTiming } = snapshot;

  /*
   * The six outcomes the problem statement names, each answered from figures
   * that are already on this page. Two of them cannot be measured from a single
   * pilot at all, and say so rather than borrowing a number that sounds close.
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
        paymentTiming.medianDaysToPay === null
          ? null
          : `${paymentTiming.medianDaysToPay}d median`,
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
      <PageHeader
        index="—"
        eyebrow="Department console"
        title="What needs you"
        lede="Milestones with evidence filed and waiting on a departmental decision. Nothing is paid until it clears this queue."
        aside={
          <span
            className={
              'border px-3 py-1.5 font-mono text-meta uppercase ' +
              (source === 'live'
                ? 'border-validated/50 text-validated'
                : 'border-chalk/20 text-chalk/50')
            }
          >
            {source === 'live' ? 'Live API' : 'Demonstration data'}
          </span>
        }
      />

      <div className="edge mx-auto max-w-[110rem] pb-[clamp(5rem,12vh,9rem)]">
        {/* --- the worklist --- */}
        <ol className="border-t border-chalk/15">
          {awaitingValidation.map((item) => (
            <li
              key={`${item.pilotId}-${item.milestoneId}`}
              className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-chalk/12 py-6"
            >
              <span className="flex items-baseline gap-5">
                <span className="font-mono text-meta uppercase text-chalk/50">
                  {item.pilotId} · {item.code}
                </span>
                <Link
                  href="/pilots"
                  data-cursor="open"
                  className="font-display text-display-xs font-bold text-chalk transition-colors hover:text-signal"
                >
                  {item.title}
                </Link>
              </span>

              <span className="flex items-baseline gap-8">
                <span className="font-mono text-meta uppercase text-chalk/50">
                  {item.filed} artefacts filed
                </span>
                <span className="font-display text-2xl text-chalk">
                  {formatLakh(item.payment)}
                </span>
                <span className="font-mono text-meta uppercase text-signal">
                  Validate →
                </span>
              </span>
            </li>
          ))}

          {awaitingValidation.length === 0 ? (
            <li className="border-b border-chalk/12 py-8 font-mono text-meta uppercase text-chalk/50">
              Nothing awaiting validation.
            </li>
          ) : null}
        </ol>

        {/* --- the pilot under contract --- */}
        <section className="mt-20 grid gap-x-14 gap-y-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <Label>Contract · {pilot.id}</Label>

            <p className="mt-6 font-display text-display-sm font-extrabold text-chalk">
              {formatLakh(pilot.released)}
              <span className="text-chalk/50"> of {formatLakh(pilot.contractValue)}</span>
            </p>
            <p className="mt-2 font-mono text-meta uppercase text-chalk/50">
              released against approved evidence
            </p>

            <div className="mt-6 h-[3px] w-full bg-chalk/12">
              <span
                className="block h-[3px] bg-signal"
                style={{ width: `${releasedPct}%` }}
              />
            </div>

            <ol className="mt-10">
              {milestones.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-chalk/12 py-3.5"
                >
                  <span className="flex items-baseline gap-4">
                    <span className="font-mono text-meta uppercase text-chalk/50">{m.code}</span>
                    <span className="text-base text-chalk">{m.title}</span>
                  </span>
                  <span className="flex items-baseline gap-6">
                    <span
                      className={
                        'font-mono text-meta uppercase ' + (STATUS_TONE[m.status] ?? 'text-chalk/50')
                      }
                    >
                      {STATUS_LABEL[m.status] ?? m.status}
                    </span>
                    <span className="font-display text-lg text-chalk">
                      {formatLakh(m.payment)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* --- what the corpus knows --- */}
          <div>
            <Label>Evidence base</Label>

            <p className="mt-6 font-display text-display-sm font-extrabold text-chalk">
              {corpus.corpusSize}
              <span className="text-chalk/50"> pilots recorded</span>
            </p>
            <p className="mt-2 max-w-[42ch] text-sm leading-relaxed text-chalk/55">
              Every closed pilot — including the ones that missed their target — is what the
              simulator reasons from. The base grows with each one.
            </p>

            <div className="mt-10">
              <EvidenceBaseChart domains={corpus.domains} thinDomains={corpus.thinDomains} />
            </div>

            <p className="mt-6 max-w-[46ch] text-xs leading-relaxed text-chalk/55">
              Domains marked thin have fewer than four comparable pilots. The simulator will still
              run against them, but reports its confidence band as context rather than as a finding.
            </p>
          </div>
        </section>

        {/* --- did the money actually move on time --- */}
        <section className="mt-20 border-t border-chalk/15 pt-10">
          <Label>Payment timing · {pilot.id}</Label>
          <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-chalk/55">
            The one outcome that cannot be asserted, only measured. Each milestone is timed from
            the moment its last evidence was filed to the moment the tranche was released, split at
            approval so a delay is attributable.
          </p>
          <div className="mt-10 max-w-[70rem]">
            <PaymentTimingChart timing={paymentTiming} />
          </div>
        </section>

        {/* --- the outcomes the PS judges the mechanism on --- */}
        <section className="mt-20">
          <Label>Against the expected outcomes</Label>
          <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-chalk/55">
            The six outcomes the problem statement names, each answered with a figure from this
            page and the place it came from.
          </p>
          <div className="mt-10">
            <OutcomeLedger rows={outcomes} />
          </div>
        </section>

        {/* --- platform totals, deliberately last --- */}
        <section className="mt-20 border-t border-chalk/15 pt-10">
          <Label>Across the platform</Label>
          <dl className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
            {PLATFORM_METRICS.map((m) => (
              <div key={m.label}>
                <dt className="font-mono text-meta uppercase text-chalk/50">{m.label}</dt>
                <dd className="mt-3 font-display text-display-xs font-extrabold tabular-nums text-chalk">
                  {m.value}
                  {m.unit ?? ''}
                </dd>
                <dd className="mt-2 text-xs leading-relaxed text-chalk/55">{m.hint}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
