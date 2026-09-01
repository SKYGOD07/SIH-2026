import type { Metadata } from 'next';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead } from '@/components/console/primitives';
import { DecisionQueue } from '@/components/console/DecisionQueue';
import { PortfolioOverview } from '@/components/console/PortfolioOverview';
import { RoleGate } from '@/components/auth/RoleGate';

export const metadata: Metadata = {
  title: 'Government console',
  description:
    'What needs a decision today: challenges awaiting review, pilots in flight, and evidence waiting on a department.',
};

export const dynamic = 'force-dynamic';

/**
 * The government workspace.
 *
 * Decision-first, and deliberately short. An officer opening this page is
 * asking one question — *what needs me?* — and every additional panel is
 * something they have to read past to answer it. The previous console led with
 * programme figures, which are context rather than a queue.
 *
 * A startup never reaches this route: `RoleGate` turns it away in the browser
 * and the API refuses the underlying calls regardless.
 */
export default function GovernmentDashboard() {
  return (
    <RoleGate roles={['GOVERNMENT_OFFICER', 'ADMIN']}>
      <ConsoleHeader
        title="What needs you"
        subtitle="Challenges you own, and where each one sits in the pathway."
        source="demonstration"
      />

      <section aria-label="Decision queue">
        <SectionHead title="Decision queue" />
        <DecisionQueue />
      </section>

      {/*
        What the platform can reach for. The queue answers "what needs me
        today"; without this the console reads as empty even while holding
        several hundred companies across two dozen fields.
      */}
      <section aria-label="Platform overview">
        <SectionHead title="What the platform holds" />
        <PortfolioOverview />
      </section>
    </RoleGate>
  );
}
