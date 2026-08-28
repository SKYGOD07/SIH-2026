'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { Counter } from '@/components/typography';
import { PIPELINE_STAGES } from '@/data/knowledge';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

/**
 * The lifecycle as a funnel with real counts at each stage.
 *
 * The bar widths are proportional to the counts, so the narrowing is honest:
 * most published challenges do not reach a scale decision, and the shape says
 * so without a caption having to.
 */
export function PipelineFlow({
  tone = 'dark',
  className,
}: {
  tone?: 'dark' | 'light';
  className?: string;
}) {
  const ref = useRef<HTMLOListElement>(null);
  const reduced = usePrefersReducedMotion();
  const light = tone === 'light';
  const max = Math.max(...PIPELINE_STAGES.map((s) => s.value));

  useGSAP(
    () => {
      if (!ref.current || reduced) return;
      gsap.fromTo(
        '[data-pipeline-bar]',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.1,
          stagger: 0.09,
          ease: 'power3.out',
          scrollTrigger: { trigger: ref.current, start: 'top 84%', once: true },
        },
      );
      gsap.from('[data-pipeline-row]', {
        autoAlpha: 0,
        x: -20,
        duration: 0.6,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: ref.current, start: 'top 84%', once: true },
      });
    },
    { scope: ref, dependencies: [reduced] },
  );

  return (
    <ol ref={ref} className={cn('space-y-4', className)}>
      {PIPELINE_STAGES.map((s, i) => (
        <li key={s.label} data-pipeline-row>
          <div className="flex items-baseline justify-between gap-4">
            <span
              className={cn(
                'font-mono text-meta uppercase',
                light ? 'text-ink-muted' : 'text-stone',
              )}
            >
              {String(i + 1).padStart(2, '0')} · {s.label}
            </span>
            <span
              className={cn(
                'font-display text-xl leading-none tabular-nums',
                light ? 'text-ink' : 'text-ink',
              )}
            >
              <Counter value={s.value} duration={1.3} />
            </span>
          </div>
          <div className={cn('mt-2 h-[3px] w-full', light ? 'bg-ink/10' : 'bg-ink/12')}>
            <span
              data-pipeline-bar
              className="block h-[3px] origin-left bg-saffron"
              style={{ width: (s.value / max) * 100 + '%' }}
            />
          </div>
          <p
            className={cn(
              'mt-1.5 text-xs',
              light ? 'text-ink-muted' : 'text-stone',
            )}
          >
            {s.hint}
          </p>
        </li>
      ))}
    </ol>
  );
}
