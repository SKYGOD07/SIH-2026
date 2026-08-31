import type { Metadata } from 'next';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { AwaitingData } from '@/components/console/Figure';
import { fetchDashboard } from '@/lib/api/sarthi';

export const metadata: Metadata = {
  title: 'Startups',
  description: 'Startups on the register, and the evidence behind each.',
};

export const dynamic = 'force-dynamic';

/**
 * Startups.
 *
 * Empty, and stating why. The eight companies previously listed here, with match scores and funding raised, were invented. Real records need the MSInS winner directory and the SISFS portfolio, both of which are JavaScript applications that a plain fetch cannot read.
 */
export default async function Page() {
  const { source } = await fetchDashboard();

  return (
    <>
      <ConsoleHeader title="Startups" subtitle="No startup records have been ingested." source={source} />

      <AwaitingData
        title="Startups is empty"
        holds="Startups with their sector, state, recognition status, government programme participation and prior deployment evidence — each field carrying its source."
        blockedBy="The eight companies previously listed here, with match scores and funding raised, were invented. Real records need the MSInS winner directory and the SISFS portfolio, both of which are JavaScript applications that a plain fetch cannot read."
        next="Ingestion of the MSInS and SISFS listings. See docs/DATA-SOURCES.md for the three routes open to us."
      />
    </>
  );
}
