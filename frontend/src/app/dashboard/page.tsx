import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { MetricGrid } from '@/components/dashboard/MetricGrid';
import { PipelineFlow } from '@/components/dashboard/PipelineFlow';
import { AudienceToggle } from '@/components/motion/AudienceToggle';
import { AudiencePanel } from '@/components/dashboard/AudiencePanel';
import { Label } from '@/components/typography';
import { PLATFORM_METRICS } from '@/data/knowledge';
import { CHALLENGES } from '@/data/challenges';
import { PILOTS } from '@/data/pilots';
import { getStartup } from '@/data/startups';
import { formatLakh } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Dashboard',
  description:
    'The department console: active challenges, matched startups, running pilots, validated results and scale-ready decisions.',
};

export default function DashboardPage() {
  const attention = PILOTS.filter(
    (p) => p.milestones.some((m) => m.status === 'EVIDENCE_SUBMITTED'),
  );

  return (
    <>
      <PageHeader
        index="—"
        eyebrow="Department console"
        title="Dashboard"
        lede="One view of the pathway: what has been published, what is under evaluation, what is running under contract, and what is waiting on a decision."
        aside={<AudienceToggle />}
      />

      <div className="edge mx-auto max-w-[110rem] pb-[clamp(5rem,12vh,9rem)]">
        <MetricGrid metrics={PLATFORM_METRICS} />

        <div className="mt-16 grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Label tone="accent">Pipeline</Label>
            <PipelineFlow className="mt-6" />
          </div>

          <div>
            <Label>Needs a decision</Label>
            <ul className="mt-6">
              {attention.map((p) => {
                const filed = p.milestones.filter((m) => m.status === 'EVIDENCE_SUBMITTED');
                const startup = getStartup(p.startupId);
                return (
                  <li key={p.id} className="border-b border-ink/12 py-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <Link
                        href="/pilots"
                        data-cursor="open"
                        className="font-display text-xl uppercase leading-none text-ink transition-colors hover:text-saffron"
                      >
                        {p.title}
                      </Link>
                      <span className="font-mono text-meta uppercase text-saffron">
                        {filed.length} milestone{filed.length === 1 ? '' : 's'} awaiting validation
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-meta uppercase text-stone">
                      {startup?.name} ·{' '}
                      {filed.map((m) => `${m.code} ${formatLakh(m.payment)}`).join(' · ')}
                    </p>
                  </li>
                );
              })}
              {attention.length === 0 ? (
                <li className="py-6 font-mono text-meta uppercase text-stone">
                  Nothing awaiting validation.
                </li>
              ) : null}
            </ul>

            <Label className="mt-12 block">Recently published</Label>
            <ul className="mt-6">
              {CHALLENGES.filter((c) => c.status === 'OPEN').map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink/12 py-4"
                >
                  <Link
                    href="/challenges"
                    data-cursor="open"
                    className="text-base text-ink transition-colors hover:text-saffron"
                  >
                    {c.title}
                  </Link>
                  <span className="font-mono text-meta uppercase text-stone">
                    {c.applications} applications · {formatLakh(c.budget)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <AudiencePanel className="mt-20" />
      </div>
    </>
  );
}
