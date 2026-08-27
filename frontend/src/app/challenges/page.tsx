import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { ChallengeList } from '@/components/sections/product/ChallengeList';
import { CHALLENGES } from '@/data/challenges';

export const metadata: Metadata = {
  title: 'Challenges',
  description:
    'Outcome-based departmental challenges, each published with its baseline, target and measurement criteria.',
};

export default function ChallengesPage() {
  const open = CHALLENGES.filter((c) => c.status === 'OPEN').length;

  return (
    <>
      <PageHeader
        index="01"
        eyebrow="Define · Discover"
        title="Challenges"
        lede="Every challenge is published as an outcome, not a product specification: a stated baseline, a target, the measurement criteria it will be judged on, and the pilot scope it is bounded to. Prior turnover and prior-supply experience are not qualifying criteria at pilot stage."
        aside={
          <dl className="flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <dt className="font-mono text-meta uppercase text-silver">Published</dt>
              <dd className="mt-2 font-display text-3xl leading-none text-ivory">
                {CHALLENGES.length}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-meta uppercase text-silver">Open now</dt>
              <dd className="mt-2 font-display text-3xl leading-none text-saffron">{open}</dd>
            </div>
          </dl>
        }
      />
      <ChallengeList challenges={CHALLENGES} />
    </>
  );
}
