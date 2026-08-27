'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

export interface CounterProps {
  /** Value counted to. */
  value: number;
  from?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Group with Indian digit separators (1,00,000). */
  grouped?: boolean;
  duration?: number;
  delay?: number;
  className?: string;
  start?: string;
  /** Tie the count to scroll progress across the trigger instead of firing once. */
  scrub?: boolean;
  'aria-label'?: string;
}

const formatter = (decimals: number, grouped: boolean) =>
  new Intl.NumberFormat(grouped ? 'en-IN' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouped,
  });

/**
 * GSAP-driven numeric counter.
 *
 * The final value is rendered into the DOM on the server and exposed to
 * assistive tech, so the number is correct and announced even when the
 * animation never runs.
 */
export function Counter({
  value,
  from = 0,
  decimals = 0,
  prefix = '',
  suffix = '',
  grouped = false,
  duration = 1.8,
  delay = 0,
  className,
  start = 'top 88%',
  scrub = false,
  ...rest
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  const fmt = formatter(decimals, grouped);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced) return;

      const state = { n: from };
      const write = () => {
        el.textContent = prefix + fmt.format(state.n) + suffix;
      };
      write();

      gsap.to(state, {
        n: value,
        duration,
        delay,
        ease: scrub ? 'none' : 'power2.out',
        onUpdate: write,
        scrollTrigger: scrub
          ? { trigger: el, start: 'top 92%', end: 'top 45%', scrub: 0.8 }
          : { trigger: el, start, once: true },
      });
    },
    { scope: ref, dependencies: [value, reduced] },
  );

  return (
    <span
      ref={ref}
      className={cn('tabular-nums', className)}
      aria-label={rest['aria-label'] ?? prefix + fmt.format(value) + suffix}
    >
      {prefix}
      {fmt.format(value)}
      {suffix}
    </span>
  );
}
