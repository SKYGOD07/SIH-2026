import type { Metadata } from 'next';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { AwaitingData } from '@/components/console/Figure';
import { fetchDashboard } from '@/lib/api/sarthi';

export const metadata: Metadata = {
  title: 'Challenges',
  description: 'Departmental problems written as outcome-based challenges.',
};

export const dynamic = 'force-dynamic';

/**
 * Challenges.
 *
 * Empty, and stating why. The six challenges previously listed here — with budgets, baselines and application counts — were invented for the prototype.
 */
export default async function Page() {
  const { source } = await fetchDashboard();

  return (
    <>
      <ConsoleHeader title="Challenges" subtitle="No challenges have been published." source={source} />

      <AwaitingData
        title="Challenges is empty"
        holds="Each departmental challenge: its outcome, baseline, target, metrics, budget envelope and named decision owner."
        blockedBy="The six challenges previously listed here — with budgets, baselines and application counts — were invented for the prototype."
        next="A department writing a challenge, starting from the problem statement template."
      />
    </>
  );
}
