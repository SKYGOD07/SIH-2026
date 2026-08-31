import type { Metadata } from 'next';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { AwaitingData } from '@/components/console/Figure';
import { fetchDashboard } from '@/lib/api/sarthi';

export const metadata: Metadata = {
  title: 'Ledger',
  description: 'Evidence filed, decisions taken and money released, under a state machine that will not let those happen out of order.',
};

export const dynamic = 'force-dynamic';

/**
 * Milestone ledger.
 *
 * Empty, and stating why. No pilot has been contracted through this platform, so there is no ledger to keep.
 */
export default async function Page() {
  const { source } = await fetchDashboard();

  return (
    <>
      <ConsoleHeader title="Milestone ledger" subtitle="No pilot is under contract." source={source} />

      <AwaitingData
        title="Milestone ledger is empty"
        holds="Every milestone on every contracted pilot: the evidence filed against it, the departmental decision, and the date the tranche was released."
        blockedBy="No pilot has been contracted through this platform, so there is no ledger to keep."
        next="A challenge reaching the contracting stage. The state machine and the payment timing measurement are already built and will populate from the first milestone."
      />
    </>
  );
}
