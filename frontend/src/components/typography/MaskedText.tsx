'use client';

import { useRef, type ElementType, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';
import { DisplayText, type DisplaySize } from './DisplayText';

export interface MaskedTextProps {
  children: ReactNode;
  className?: string;
  size?: DisplaySize;
  as?: ElementType;
  /** Wipe direction. */
  direction?: 'up' | 'right';
  delay?: number;
  start?: string;
  /** Drive the wipe from scroll progress instead of a one-shot entrance. */
  scrub?: boolean;
}

/**
 * Clip-path wipe reveal for display headings.
 *
 * Distinct from SplitText: the glyphs never move, the mask does. Used where a
 * heading needs to feel uncovered rather than assembled.
 */
export function MaskedText({
  children,
  className,
  size = 'md',
  as = 'h2',
  direction = 'up',
  delay = 0,
  start = 'top 82%',
  scrub = false,
}: MaskedTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const target = el.firstElementChild;
      if (!target) return;

      if (reduced) {
        gsap.set(target, { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 });
        return;
      }

      const from =
        direction === 'up' ? 'inset(0% 0% 100% 0%)' : 'inset(0% 100% 0% 0%)';

      gsap.fromTo(
        target,
        { clipPath: from, opacity: 0.001 },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          opacity: 1,
          duration: 1.2,
          delay,
          ease: 'power4.inOut',
          scrollTrigger: scrub
            ? { trigger: el, start: 'top 90%', end: 'top 40%', scrub: 0.8 }
            : { trigger: el, start, once: true },
        },
      );
    },
    { scope: ref, dependencies: [reduced] },
  );

  return (
    <div ref={ref} className={cn('overflow-hidden', className)}>
      <DisplayText as={as} size={size}>
        {children}
      </DisplayText>
    </div>
  );
}
