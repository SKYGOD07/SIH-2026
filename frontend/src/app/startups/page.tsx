import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { StartupList } from '@/components/sections/product/StartupList';
import { STARTUPS } from '@/data/startups';

export const metadata: Metadata = {
  title: 'Startups',
  description:
    'Candidate startups with their technology readiness, government deployment record, prior pilot outcomes and compliance standing.',
};

export default function StartupsPage() {
  const verified = STARTUPS.filter((s) => s.complianceStatus === 'VERIFIED').length;

  return (
    <>
      <PageHeader
        index="02"
        eyebrow="Discover · Verify"
        title="Startups"
        lede="Candidates are ranked against a specific challenge and shown with the evidence behind the ranking: technology readiness, prior government deployments, previous pilot outcomes and current compliance standing. Match scores order a shortlist for human review; they do not select a supplier."
        aside={
          <dl className="flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <dt className="font-mono text-meta uppercase text-stone">On register</dt>
              <dd className="mt-2 font-display text-3xl leading-none text-ink">
                {STARTUPS.length}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-meta uppercase text-stone">Compliance verified</dt>
              <dd className="mt-2 font-display text-3xl leading-none text-validated">
                {verified}
              </dd>
            </div>
          </dl>
        }
      />
      <StartupList startups={STARTUPS} />
    </>
  );
}
