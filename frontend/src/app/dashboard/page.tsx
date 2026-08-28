import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Label } from '@/components/typography';
import { fetchDashboard } from '@/lib/api/mahainnovate';
import { PLATFORM_METRICS } from '@/data/knowledge';
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
  EVIDENCE_SUBMITTED: 'text-saffron',
  IN_PROGRESS: 'text-saffron',
  REJECTED: 'text-risk',
  LOCKED: 'text-stone',
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
                : 'border-ink/20 text-stone')
            }
          >
            {source === 'live' ? 'Live API' : 'Demonstration data'}
          </span>
        }
      />

      <div className="edge mx-auto max-w-[110rem] pb-[clamp(5rem,12vh,9rem)]">
        {/* --- the worklist --- */}
        <ol className="border-t border-ink/15">
          {awaitingValidation.map((item) => (
            <li
              key={`${item.pilotId}-${item.milestoneId}`}
              className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-ink/10 py-6"
            >
              <span className="flex items-baseline gap-5">
                <span className="font-mono text-meta uppercase text-stone">
                  {item.pilotId} · {item.code}
                </span>
                <Link
                  href="/pilots"
                  data-cursor="open"
                  className="font-display text-display-xs font-normal text-ink transition-colors hover:text-saffron"
                >
                  {item.title}
                </Link>
              </span>

              <span className="flex items-baseline gap-8">
                <span className="font-mono text-meta uppercase text-stone">
                  {item.filed} artefacts filed
                </span>
                <span className="font-display text-2xl text-ink">
                  {formatLakh(item.payment)}
                </span>
                <span className="font-mono text-meta uppercase text-saffron">
                  Validate →
                </span>
              </span>
            </li>
          ))}

          {awaitingValidation.length === 0 ? (
            <li className="border-b border-ink/10 py-8 font-mono text-meta uppercase text-stone">
              Nothing awaiting validation.
            </li>
          ) : null}
        </ol>

        {/* --- the pilot under contract --- */}
        <section className="mt-20 grid gap-x-14 gap-y-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <Label>Contract · {pilot.id}</Label>

            <p className="mt-6 font-display text-display-sm font-normal text-ink">
              {formatLakh(pilot.released)}
              <span className="text-stone"> of {formatLakh(pilot.contractValue)}</span>
            </p>
            <p className="mt-2 font-mono text-meta uppercase text-stone">
              released against approved evidence
            </p>

            <div className="mt-6 h-[3px] w-full bg-ink/10">
              <span
                className="block h-[3px] bg-saffron"
                style={{ width: `${releasedPct}%` }}
              />
            </div>

            <ol className="mt-10">
              {milestones.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink/10 py-3.5"
                >
                  <span className="flex items-baseline gap-4">
                    <span className="font-mono text-meta uppercase text-stone">{m.code}</span>
                    <span className="text-base text-ink">{m.title}</span>
                  </span>
                  <span className="flex items-baseline gap-6">
                    <span
                      className={
                        'font-mono text-meta uppercase ' + (STATUS_TONE[m.status] ?? 'text-stone')
                      }
                    >
                      {STATUS_LABEL[m.status] ?? m.status}
                    </span>
                    <span className="font-display text-lg text-ink">
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

            <p className="mt-6 font-display text-display-sm font-normal text-ink">
              {corpus.corpusSize}
              <span className="text-stone"> pilots recorded</span>
            </p>
            <p className="mt-2 max-w-[42ch] text-sm leading-relaxed text-ink-muted">
              Every closed pilot — including the ones that missed their target — is what the
              simulator reasons from. The base grows with each one.
            </p>

            <ol className="mt-8">
              {corpus.domains.map((d) => {
                const thin = corpus.thinDomains.includes(d.domain);
                return (
                  <li
                    key={d.domain}
                    className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink/10 py-3"
                  >
                    <span className="text-base text-ink">{d.domain.replace(/-/g, ' ')}</span>
                    <span className="flex items-baseline gap-5 font-mono text-meta uppercase">
                      <span className="text-stone">
                        {d.met} met of {d.total}
                      </span>
                      {thin ? (
                        <span className="text-saffron">too thin to advise</span>
                      ) : (
                        <span className="text-validated">advisable</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>

            <p className="mt-6 max-w-[46ch] text-xs leading-relaxed text-ink-muted">
              Domains marked thin have fewer than four comparable pilots. The simulator will still
              run against them, but reports its confidence band as context rather than as a finding.
            </p>
          </div>
        </section>

        {/* --- platform totals, deliberately last --- */}
        <section className="mt-20 border-t border-ink/15 pt-10">
          <Label>Across the platform</Label>
          <dl className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
            {PLATFORM_METRICS.map((m) => (
              <div key={m.label}>
                <dt className="font-mono text-meta uppercase text-stone">{m.label}</dt>
                <dd className="mt-3 font-display text-display-xs font-normal tabular-nums text-ink">
                  {m.value}
                  {m.unit ?? ''}
                </dd>
                <dd className="mt-2 text-xs leading-relaxed text-ink-muted">{m.hint}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
