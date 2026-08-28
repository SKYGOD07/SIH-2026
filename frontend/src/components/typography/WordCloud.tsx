'use client';

import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { cn, seeded } from '@/lib/utils';

export interface WordCloudHandle {
  /** Animatable word elements, in the order the words were supplied. */
  words: HTMLElement[];
  /** Each word's scatter offset from centre, in pixels-at-render-time percent. */
  offsets: { x: number; y: number }[];
  container: HTMLDivElement | null;
}

export interface WordCloudProps {
  words: string[];
  className?: string;
  /** Scatter radius as a fraction of the container, roughly 0.2-0.5. */
  spread?: number;
  seed?: number;
  wordClassName?: string;
}

interface Placed {
  word: string;
  /** Percentage offsets from the container centre. */
  x: number;
  y: number;
  scale: number;
  rotate: number;
}

/**
 * Scattered words that a parent GSAP timeline pulls toward a centre.
 *
 * Placement is deterministic (seeded) so server and client markup match, and it
 * lives on an outer wrapper so GSAP owns the inner element's transform outright
 * — no fighting over a `calc()` inline transform.
 */
export const WordCloud = forwardRef<WordCloudHandle, WordCloudProps>(function WordCloud(
  { words, className, spread = 0.36, seed = 7, wordClassName },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<HTMLElement[]>([]);

  const placed = useMemo<Placed[]>(() => {
    const rand = seeded(seed);
    const count = words.length;
    return words.map((word, i) => {
      // Golden-angle ring stops words clustering; jitter stops it looking mechanical.
      const angle = i * 2.39996 + rand() * 0.6;
      const radius = spread * (0.5 + 0.5 * ((i + 1) / count)) * 100;
      return {
        word,
        x: Math.cos(angle) * radius * 1.5,
        y: Math.sin(angle) * radius,
        scale: 0.8 + rand() * 0.55,
        rotate: (rand() - 0.5) * 6,
      };
    });
  }, [words, spread, seed]);

  useImperativeHandle(
    ref,
    () => ({
      get words() {
        return wordRefs.current.filter(Boolean);
      },
      get offsets() {
        return placed.map((p) => ({ x: p.x, y: p.y }));
      },
      get container() {
        return containerRef.current;
      },
    }),
    [placed],
  );

  return (
    <div ref={containerRef} className={cn('relative h-full w-full', className)} aria-hidden="true">
      {placed.map((p, i) => (
        <div
          key={p.word + i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `calc(50% + ${p.x}%)`, top: `calc(50% + ${p.y}%)` }}
        >
          <span
            ref={(el) => {
              if (el) wordRefs.current[i] = el;
            }}
            data-word={p.word}
            data-offset-x={p.x}
            data-offset-y={p.y}
            className={cn(
              'block whitespace-nowrap font-display text-[clamp(0.75rem,2vw,1.75rem)] font-medium uppercase tracking-tight text-chalk/50 will-3d',
              wordClassName,
            )}
            style={{ transform: `scale(${p.scale}) rotate(${p.rotate}deg)` }}
          >
            {p.word}
          </span>
        </div>
      ))}
    </div>
  );
});
