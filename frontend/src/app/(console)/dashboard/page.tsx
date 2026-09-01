import type { Metadata } from 'next';
import Link from 'next/link';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead, Card } from '@/components/console/primitives';
import { DecisionQueue } from '@/components/console/DecisionQueue';
import { Figure } from '@/components/console/Figure';
import { Icon } from '@/components/console/Icon';
import { PROGRAMME_INTELLIGENCE } from '@/data/programs';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Console',
  description:
    'The department console: what needs a decision today, what the platform knows about government startup programmes, and where a challenge sits in the pathway.',
};

export const dynamic = 'force-dynamic';

/**
 * The department console.
 *
 * It answers one question — *what does this officer need to decide today?* —
 * and it is deliberately small. The previous version led with four stat cards,
 * two charts and a six-row outcome ledger, all of them reading invented records.
 * Density was standing in for usefulness.
 *
 * Three blocks, in the order an officer needs them:
 *
 *   1. The queue. What is waiting on a decision.
 *   2. Programme intelligence. What the platform actually knows, each figure
 *      carrying its source or saying plainly that it has none yet.
 *   3. The pathway. Where any given challenge sits between problem and scale.
 *
 * The queue is empty, and that is the correct state rather than a gap to fill.
 * No government challenge has been created on this platform, so there is nothing
 * to decide; a row here would be indistinguishable from a departmental one. The
 * shape of a queue item is shown as an inert skeleton so the design is legible
 * without anything being asserted.
 */

/** The pathway, from problem to scale. Process description — no figures. */
const PIPELINE = ['Problem', 'Match', 'Verify', 'Pilot', 'Measure', 'Scale'] as const;

/**
 * What a decision looks like when there is one.
 *
 * Rendered inert and captionless of any specific claim — no department, no
 * figure, no startup. It exists so the queue's design is readable while it is
 * empty, and so the empty state does not read as a rendering failure.
 */
function QueueSkeleton() {
  return (
    <li
      aria-hidden="true"
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-chalk/[0.06] px-[1.125rem] py-5 last:border-b-0"
    >
      <span className="flex min-w-0 items-center gap-4">
        <span className="h-2 w-2 shrink-0 rounded-full bg-chalk/12" />
        <span className="block h-3 w-[9rem] rounded-full bg-chalk/[0.07]" />
        <span className="hidden h-2.5 w-[13rem] rounded-full bg-chalk/[0.05] sm:block" />
      </span>
      <span className="block h-2.5 w-[5.5rem] rounded-full bg-chalk/[0.05]" />
    </li>
  );
}

export default function ConsolePage() {
  return (
    <>
      <ConsoleHeader
        title="What needs you"
        subtitle="Challenges you own, and where each one sits."
        source="demonstration"
      />

      {/* --- 1. the queue --------------------------------------------- */}
      <section aria-label="Decision queue">
        <SectionHead title="Decision queue" />
        {/*
          Read from the workflow API rather than stated here. A hardcoded
          empty state was correct while the platform held nothing and became
          a lie the moment a challenge existed — and worse, it is
          indistinguishable from a query that has broken.
        */}
        <DecisionQueue />
      </section>

      {/* --- 2. what the platform knows -------------------------------- */}
      <section aria-label="Programme intelligence">
        <SectionHead
          title="Programme intelligence"
          action="Both programmes"
          href="/intelligence"
        />

        <Card>
          <div className="grid gap-x-10 gap-y-9 sm:grid-cols-2 xl:grid-cols-3">
            {PROGRAMME_INTELLIGENCE.map((fact) => (
              <Figure key={fact.label} label={fact.label} data={fact.data} />
            ))}
          </div>

          <p className="mt-8 max-w-[68ch] border-t border-chalk/[0.08] pt-5 text-[0.78125rem] leading-relaxed text-chalk/40">
            The first figure is what MSInS publishes about its own programme. The other two are
            what this platform holds, which is nothing — those are different quantities, and
            reporting the published one as though it were the held one is how a prototype ends up
            claiming an index it does not have.
          </p>
        </Card>
      </section>

      {/* --- 3. the pathway -------------------------------------------- */}
      <section aria-label="Pathway">
        <SectionHead title="Pathway" meta="Where a challenge sits" />

        <Card>
          <ol className="flex flex-wrap items-stretch gap-y-4">
            {PIPELINE.map((stage, i) => (
              <li key={stage} className="flex min-w-[7rem] flex-1 items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/25">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={cn(
                      'mt-1.5 block border-t border-chalk/15 pt-2.5 font-display text-[0.8125rem] font-bold uppercase tracking-[-0.01em] text-chalk/70',
                    )}
                  >
                    {stage}
                  </span>
                </span>

                {i < PIPELINE.length - 1 ? (
                  <Icon
                    name="chevronRight"
                    className="mt-4 h-3.5 w-3.5 shrink-0 text-chalk/20"
                    strokeWidth={2.2}
                  />
                ) : null}
              </li>
            ))}
          </ol>

          <p className="mt-6 max-w-[68ch] border-t border-chalk/[0.06] pt-4 text-[0.78125rem] leading-relaxed text-chalk/45">
            Every challenge moves along this line once, and each step leaves a record. The detail
            lives on the step, not here — this is the map, not the workspace.
          </p>
        </Card>
      </section>
    </>
  );
}
