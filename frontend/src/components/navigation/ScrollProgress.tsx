'use client';

import { useEffect, useRef, useState } from 'react';
import { LIFECYCLE } from '@/data/lifecycle';
import { cn, clamp } from '@/lib/utils';

/**
 * Global progress indicator, expressed as the lifecycle rather than as a
 * scrollbar: the reader always knows which stage of the pathway they are in.
 *
 * The desktop rail is deliberately narrow — eight ticks and one rotated stage
 * name, together under 3rem wide — so it sits inside the page gutter and never
 * collides with the content column, which starts at 5vw. Position is read in a
 * rAF-throttled scroll listener rather than through eight ScrollTriggers.
 */
export function ScrollProgress({ enabled = true }: { enabled?: boolean }) {
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const read = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? clamp(window.scrollY / max, 0, 1) : 0);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [enabled]);

  if (!enabled) return null;

  const active = clamp(Math.floor(progress * LIFECYCLE.length), 0, LIFECYCLE.length - 1);
  const stage = LIFECYCLE[active];

  return (
    <>
      {/* Desktop: narrow tick rail inside the left gutter */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-start gap-3 lg:flex"
      >
        <ol className="flex flex-col gap-2.5">
          {LIFECYCLE.map((s, i) => (
            <li key={s.id}>
              <span
                className={cn(
                  'block h-px transition-all duration-700 ease-editorial',
                  i === active
                    ? 'w-6 bg-saffron'
                    : i < active
                      ? 'w-3.5 bg-ink/45'
                      : 'w-2 bg-ink/20',
                )}
              />
            </li>
          ))}
        </ol>

        {/* Rotated so the rail stays inside the gutter at any viewport width. */}
        <span
          className="mt-4 whitespace-nowrap font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-saffron transition-opacity duration-500"
          style={{ writingMode: 'vertical-rl' }}
        >
          {stage.index} {stage.label}
        </span>
      </div>

      {/* Mobile / tablet: a single hairline with the active stage named */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <div className="flex items-center gap-3 bg-gradient-to-t from-bone via-bone/80 to-transparent px-[var(--edge)] pb-3 pt-6">
          <span className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-saffron">
            {stage.index} {stage.label}
          </span>
          <span className="relative h-px flex-1 bg-ink/15">
            <span
              className="absolute inset-y-0 left-0 bg-saffron transition-[width] duration-200 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </span>
        </div>
      </div>

      {/* Announced to assistive tech without the visual rail. */}
      <p className="sr-only" aria-live="polite">
        Lifecycle stage {stage.index}: {stage.label}
      </p>
    </>
  );
}
