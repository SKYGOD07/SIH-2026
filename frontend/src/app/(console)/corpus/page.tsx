import type { Metadata } from 'next';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead, StatCard, Card, Pill } from '@/components/console/primitives';
import { Icon } from '@/components/console/Icon';
import { EvidenceBaseChart } from '@/components/dashboard/EvidenceBaseChart';
import { fetchDashboard } from '@/lib/api/mahainnovate';
import { buildRailContext } from '@/lib/console/rail';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Evidence base',
  description:
    'What the corpus knows, by domain — and where it knows too little to advise. The pilots every new pilot design is derived from.',
};

export const dynamic = 'force-dynamic';

/** Fewer comparable pilots than this and a confidence ratio is not a finding. */
const REPORTING_THRESHOLD = 4;

/**
 * The evidence base.
 *
 * Every recommendation the simulator makes is a reading of the pilots recorded
 * here, so the shape of this page is the honest answer to "how much should I
 * trust that?". It leads with coverage rather than with volume: a corpus of
 * twenty pilots spread thinly across eight domains advises worse than one of
 * twelve concentrated in three, and a single headline count hides exactly that.
 *
 * Thin domains are given their own section rather than a footnote. They are the
 * actionable part of this page — each one is a request for the next closed
 * pilot in that area, including the ones that failed.
 */
export default async function CorpusPage() {
  const snapshot = await fetchDashboard();
  const { corpus, source } = snapshot;
  const rail = buildRailContext(snapshot, new Date());

  const totalMet = corpus.domains.reduce((s, d) => s + d.met, 0);
  const totalRecorded = corpus.domains.reduce((s, d) => s + d.total, 0);
  const advisable = corpus.domains.filter((d) => !corpus.thinDomains.includes(d.domain));
  const thin = corpus.domains.filter((d) => corpus.thinDomains.includes(d.domain));

  return (
    <>
      <ConsoleHeader
        title="Evidence base"
        subtitle="The closed pilots every new pilot design is derived from"
        source={source}
        notifications={rail.notifications}
      />

      <section aria-label="Coverage">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon="corpus"
            tone="chalk"
            value={String(corpus.corpusSize)}
            label="Pilots recorded"
          />
          <StatCard
            icon="check"
            tone="validated"
            value={`${totalMet} of ${totalRecorded}`}
            label="Met their target"
          />
          <StatCard
            icon="shield"
            tone="validated"
            value={String(advisable.length)}
            label="Domains advisable"
          />
          <StatCard
            icon="alert"
            tone="signal"
            value={String(thin.length)}
            label={`Domains under ${REPORTING_THRESHOLD} pilots`}
            trend="reported as context"
            direction="down"
          />
        </div>
      </section>

      <section aria-label="By domain">
        <SectionHead title="By domain" meta={`Threshold at ${REPORTING_THRESHOLD} pilots`} />
        <Card>
          <p className="mb-8 max-w-[62ch] text-[0.8125rem] leading-relaxed text-chalk/50">
            Each bar is the pilots recorded in that domain; the filled portion met its target. A
            pilot that missed is worth as much here as one that succeeded — more, often, because it
            is what the risk register is built from.
          </p>
          <EvidenceBaseChart domains={corpus.domains} thinDomains={corpus.thinDomains} />
        </Card>
      </section>

      {/* --- what the corpus is short of --- */}
      <section aria-label="Where the base is thin">
        <SectionHead title="Where the base is thin" meta="What to close next" />

        {thin.length === 0 ? (
          <Card className="text-center">
            <Icon name="check" className="mx-auto h-6 w-6 text-validated" />
            <p className="mt-3 text-[0.8125rem] text-chalk/50">
              Every domain clears the reporting threshold.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {thin.map((d) => (
              <Card key={d.domain}>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-[0.9375rem] font-extrabold uppercase tracking-[-0.02em] text-chalk">
                    {d.domain.replace(/-/g, ' ')}
                  </h3>
                  <Pill tone="signal">Too thin</Pill>
                </div>

                <p className="mt-3 text-[0.8125rem] leading-relaxed text-chalk/55">
                  {d.total} recorded, {d.met} met. Needs {REPORTING_THRESHOLD - d.total} more closed{' '}
                  {REPORTING_THRESHOLD - d.total === 1 ? 'pilot' : 'pilots'} before a confidence
                  ratio here is a finding rather than context.
                </p>

                <div className="mt-4 flex items-center gap-1.5">
                  {Array.from({ length: REPORTING_THRESHOLD }, (_, i) => (
                    <span
                      key={i}
                      aria-hidden="true"
                      className={cn(
                        'h-1.5 flex-1 rounded-full',
                        i < d.total ? 'bg-signal' : 'bg-chalk/12',
                      )}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-label="How the base grows">
        <SectionHead title="How the base grows" meta="Feedback loop · BE-06" />
        <Card>
          <ol className="grid gap-6 md:grid-cols-3">
            {[
              {
                n: '01',
                title: 'A pilot closes',
                body: 'Its outcome, metrics against baseline, and — if it missed — the named cause are written to the corpus.',
              },
              {
                n: '02',
                title: 'A cause is required',
                body: 'A failure filed without a named cause is refused. An uncaused failure teaches the next pilot nothing.',
              },
              {
                n: '03',
                title: 'The next design reads it',
                body: 'Duration, scope, milestone split and thresholds for the next comparable pilot shift accordingly.',
              },
            ].map((step) => (
              <li key={step.n}>
                <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-signal">
                  {step.n}
                </span>
                <h4 className="mt-2 border-t border-chalk/15 pt-3 font-display text-[0.875rem] font-bold uppercase tracking-[-0.02em] text-chalk">
                  {step.title}
                </h4>
                <p className="mt-2 text-[0.78125rem] leading-relaxed text-chalk/50">{step.body}</p>
              </li>
            ))}
          </ol>
        </Card>
      </section>
    </>
  );
}
