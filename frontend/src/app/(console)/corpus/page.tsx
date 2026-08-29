import type { Metadata } from 'next';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { AwaitingData } from '@/components/console/Figure';
import { fetchDashboard } from '@/lib/api/mahainnovate';

export const metadata: Metadata = {
  title: 'Evidence base',
  description: 'The closed pilots every new pilot design is derived from.',
};

export const dynamic = 'force-dynamic';

/**
 * Evidence base.
 *
 * Empty, and stating why. The corpus previously showed nineteen invented pilots across six domains. It has been emptied.
 */
export default async function Page() {
  const { source } = await fetchDashboard();

  return (
    <>
      <ConsoleHeader title="Evidence base" subtitle="No pilots have been closed." source={source} />

      <AwaitingData
        title="Evidence base is empty"
        holds="Closed pilots by domain, including the ones that missed their target, with the named cause of each miss."
        blockedBy="The corpus previously showed nineteen invented pilots across six domains. It has been emptied."
        next="Pilots being run and closed through the platform. Coverage, the reporting threshold and the thin-domain warning all compute from whatever is actually there."
      />
    </>
  );
}
