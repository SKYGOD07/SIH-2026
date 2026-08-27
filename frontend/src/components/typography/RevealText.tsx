'use client';

import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

export interface RevealTextProps {
  children: ReactNode;
  className?: string;
  /** Direction the content travels in from. */
  from?: 'bottom' | 'top' | 'left' | 'right';
  distance?: number;
  delay?: number;
  duration?: number;
  start?: string;
  /** Stagger direct children instead of moving the block as one. */
  staggerChildren?: number;
}

/**
 * Block-level entrance for non-text content — cards, metric rows, figures.
 * Text reveals should use SplitText; this is for everything else.
 */
export function RevealText({
  children,
  className,
  from = 'bottom',
  distance = 28,
  delay = 0,
  duration = 1,
  start = 'top 86%',
  staggerChildren,
}: RevealTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const targets =
        staggerChildren !== undefined ? Array.from(el.children) : [el];
      if (targets.length === 0) return;

      const axis = from === 'left' || from === 'right' ? 'x' : 'y';
      const sign = from === 'bottom' || from === 'right' ? 1 : -1;

      if (reduced) {
        gsap.set(targets, { opacity: 1, x: 0, y: 0 });
        return;
      }

      gsap.fromTo(
        targets,
        { opacity: 0, [axis]: distance * sign },
        {
          opacity: 1,
          [axis]: 0,
          duration,
          delay,
          ease: 'power3.out',
          stagger: staggerChildren ?? 0,
          scrollTrigger: { trigger: el, start, once: true },
        },
      );
    },
    { scope: ref, dependencies: [reduced] },
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
