'use client';

import { useEffect, useRef, useState } from 'react';
import { LIFECYCLE } from '@/data/lifecycle';
import { cn, clamp } from '@/lib/utils';

/**
 * Global progress indicator, expressed as the lifecycle rather than as a
 * scrollbar: the reader always knows which stage of the pathway the page is in.
 *
 * Reads scroll position directly in a rAF-throttled listener rather than
 * creating eight ScrollTriggers, and only renders on the landing story where
 * the stage mapping is meaningful.
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

  return (
    <>
      {/* Desktop: vertical rail on the left edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[max(1rem,calc((100vw-110rem)/2+1.25rem))] top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 lg:flex"
      >
        {LIFECYCLE.map((stage, i) => {
          const isActive = i === active;
          const isPast = i < active;
          return (
            <div key={stage.id} className="flex items-center gap-3">
              <span
                className={cn(
                  'block h-px transition-all duration-700 ease-editorial',
                  isActive ? 'w-7 bg-saffron' : isPast ? 'w-4 bg-ivory/45' : 'w-2.5 bg-ivory/20',
                )}
              />
              <span
                className={cn(
                  'font-mono text-[0.5625rem] uppercase tracking-[0.18em] transition-all duration-700 ease-editorial',
                  isActive
                    ? 'text-saffron opacity-100'
                    : isPast
                      ? 'text-ivory/45 opacity-100'
                      : 'text-ivory/25 opacity-70',
                )}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile / tablet: a single hairline with the active stage named */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden"
      >
        <div className="flex items-center gap-3 bg-gradient-to-t from-ink via-ink/80 to-transparent px-[var(--edge)] pb-3 pt-6">
          <span className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-saffron">
            {LIFECYCLE[active].index} {LIFECYCLE[active].label}
          </span>
          <span className="relative h-px flex-1 bg-ivory/15">
            <span
              className="absolute inset-y-0 left-0 bg-saffron transition-[width] duration-200 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </span>
        </div>
      </div>

      {/* Announced to assistive tech without the visual rail. */}
      <p className="sr-only" aria-live="polite">
        Lifecycle stage {LIFECYCLE[active].index}: {LIFECYCLE[active].label}
      </p>
    </>
  );
}
