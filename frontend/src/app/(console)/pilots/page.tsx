import type { Metadata } from 'next';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { AwaitingData } from '@/components/console/Figure';
import { Card, SectionHead } from '@/components/console/primitives';
import { fetchDashboard } from '@/lib/api/sarthi';
import { PAYMENT_RULE } from '@/data/pilots';

export const metadata: Metadata = {
  title: 'Pilots',
  description:
    'Bounded deployments under a signed agreement, with milestone evidence validated before any payment is released.',
};

export const dynamic = 'force-dynamic';

/**
 * Pilots.
 *
 * Empty. This page previously carried four invented pilots — sixteen milestones,
 * rupee values per tranche, real Pune ward names attached to a fabricated
 * deployment, measured outcome deltas, and a "90 / 100 independent validation
 * score" against a decision to scale. None of it had happened.
 *
 * What survives is the part that is ours to state rather than to report: the
 * rule the ledger enforces. That is a property of the mechanism, true before any
 * pilot exists, and it is the reason this page will be worth reading when one
 * does.
 */
export default async function PilotsPage() {
  const { source } = await fetchDashboard();

  return (
    <>
      <ConsoleHeader
        title="Pilots"
        subtitle="No pilots have been contracted."
        source={source}
      />

      <AwaitingData
        title="No pilots on record"
        holds="Each contracted pilot: its scope and boundary, milestone chain, evidence filed against each milestone, validated outcome metrics against baseline, and the scale decision with the evidence behind it."
        blockedBy="The four pilots previously shown here were invented, down to the ward names and the validation scores. They have been removed rather than relabelled."
        next="A challenge reaching contract. The pilot record is created from the pilot agreement template, and the ledger begins at its first milestone."
      />

      {/* --- what is true before any pilot exists --- */}
      <section aria-label="The rule">
        <SectionHead title="The rule a pilot is run under" meta="Enforced in code" />

        <Card>
          <p className="font-display text-[clamp(1.25rem,3vw,1.875rem)] font-extrabold uppercase tracking-[-0.03em] text-chalk">
            {PAYMENT_RULE}
          </p>

          <p className="mt-5 max-w-[68ch] text-[0.8125rem] leading-relaxed text-chalk/55">
            The milestone ledger is a state machine with no transition from filed evidence to
            paid. There is no argument to any method that releases an unapproved tranche, so an
            officer cannot release one early through this console — only by changing the service
            that refuses it, which leaves a diff.
          </p>

          <p className="mt-4 max-w-[68ch] text-[0.78125rem] leading-relaxed text-chalk/40">
            This is a property of the mechanism rather than a claim about any pilot, which is why
            it is still on the page while the records are not.
          </p>
        </Card>
      </section>
    </>
  );
}
