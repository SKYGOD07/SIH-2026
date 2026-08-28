import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { PilotBoard } from '@/components/sections/product/PilotBoard';
import { PILOTS } from '@/data/pilots';

export const metadata: Metadata = {
  title: 'Pilots',
  description:
    'Controlled sandbox deployments under milestone contracts, with filed evidence, approvals, payments and measured outcomes.',
};

export default function PilotsPage() {
  const running = PILOTS.filter((p) => p.status === 'RUNNING' || p.status === 'VALIDATION').length;

  return (
    <>
      <PageHeader
        index="05"
        eyebrow="Pilot · Measure"
        title="Pilots"
        lede="A pilot is a bounded deployment under a signed agreement, with data and IP terms settled before it starts. Each milestone names the evidence that must be filed, and payment is released only once the department validates it."
        aside={
          <dl className="flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <dt className="font-mono text-meta uppercase text-stone">On record</dt>
              <dd className="mt-2 font-display text-3xl leading-none text-ink">{PILOTS.length}</dd>
            </div>
            <div>
              <dt className="font-mono text-meta uppercase text-stone">Live</dt>
              <dd className="mt-2 font-display text-3xl leading-none text-saffron">{running}</dd>
            </div>
          </dl>
        }
      />
      <PilotBoard pilots={PILOTS} />
    </>
  );
}
