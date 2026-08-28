'use client';

import { Counter } from '@/components/typography';
import type { PlatformMetric } from '@/types/platform';
import { cn } from '@/lib/utils';

/**
 * The platform metric row. Shared by the landing-page system preview and the
 * real dashboard route so the two cannot drift apart — the cinematic section is
 * showing the product, not an illustration of it.
 */
export function MetricGrid({
  metrics,
  tone = 'dark',
  className,
}: {
  metrics: PlatformMetric[];
  tone?: 'dark' | 'light';
  className?: string;
}) {
  const light = tone === 'light';
  return (
    <dl
      className={cn(
        'grid gap-px border-t sm:grid-cols-2 lg:grid-cols-5',
        light ? 'border-ink/15' : 'border-ink/12',
        className,
      )}
    >
      {metrics.map((m) => (
        <div
          key={m.label}
          data-metric
          className={cn(
            'border-b py-6 pr-6',
            light ? 'border-ink/10' : 'border-ink/12',
          )}
        >
          <dt
            className={cn(
              'font-mono text-meta uppercase',
              light ? 'text-ink-muted' : 'text-stone',
            )}
          >
            {m.label}
          </dt>
          <dd
            className={cn(
              'mt-4 font-display text-display-xs font-medium leading-none tabular-nums',
              light ? 'text-ink' : 'text-ink',
            )}
          >
            <Counter value={m.value} suffix={m.unit ?? ''} duration={1.6} />
          </dd>
          <dd
            className={cn(
              'mt-3 text-xs leading-relaxed',
              light ? 'text-ink-muted' : 'text-stone',
            )}
          >
            {m.hint}
          </dd>
        </div>
      ))}
    </dl>
  );
}
