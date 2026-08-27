'use client';

import { createElement, useCallback, useRef, type ElementType, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { splitText, type SplitResult, type SplitType } from '@/lib/animations';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

export interface SplitTextProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** Granularity of the split. Lines read best for long copy, chars for short display words. */
  type?: SplitType;
  /** Wrap each target so it can slide out of an overflow-hidden box. */
  mask?: boolean;
  stagger?: number;
  delay?: number;
  duration?: number;
  /** ScrollTrigger start. Set `trigger={false}` to animate immediately on mount. */
  start?: string;
  trigger?: boolean;
  /** Called with the split result so a parent timeline can drive the targets itself. */
  onSplit?: (result: SplitResult) => void;
  /** When true the component only splits and does not animate — the parent owns the timeline. */
  manual?: boolean;
  id?: string;
}

/**
 * Splits its text content into lines / words / chars and reveals them.
 *
 * Re-splits on resize (debounced through ScrollTrigger's refresh) because line
 * grouping depends on layout, and reverts the DOM on unmount so React never
 * finds markup it did not create.
 */
export function SplitText({
  as = 'span',
  children,
  className,
  type = 'lines',
  mask = true,
  stagger = 0.06,
  delay = 0,
  duration = 1.05,
  start = 'top 84%',
  trigger = true,
  onSplit,
  manual = false,
  id,
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const splitRef = useRef<SplitResult | null>(null);

  const build = useCallback(() => {
    const el = ref.current;
    if (!el) return null;
    splitRef.current?.revert();
    const result = splitText(el, { type, mask });
    splitRef.current = result;
    onSplit?.(result);
    return result;
  }, [type, mask, onSplit]);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const result = build();
      if (!result || result.targets.length === 0) return;

      if (reduced) {
        gsap.set(result.targets, { yPercent: 0, opacity: 1 });
        return;
      }

      if (!manual) {
        gsap.fromTo(
          result.targets,
          { yPercent: 108, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration,
            delay,
            stagger,
            ease: 'expo.out',
            ...(trigger ? { scrollTrigger: { trigger: el, start, once: true } } : {}),
          },
        );
      }

      // Line grouping is layout-dependent: rebuild whenever ScrollTrigger does.
      const onRefresh = () => {
        if (type !== 'lines') return;
        const rebuilt = build();
        if (rebuilt) gsap.set(rebuilt.targets, { yPercent: 0, opacity: 1 });
      };
      ScrollTrigger.addEventListener('refreshInit', onRefresh);

      return () => {
        ScrollTrigger.removeEventListener('refreshInit', onRefresh);
        splitRef.current?.revert();
        splitRef.current = null;
      };
    },
    { scope: ref, dependencies: [reduced, type, manual] },
  );

  return createElement(as, { ref, id, className: cn(className) }, children);
}
