'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import { ScrollTrigger } from '@/lib/gsap';

export type ProgressRef = MutableRefObject<number>;

/**
 * Bridges scroll position into the render loop as a mutable ref.
 *
 * Deliberately not React state: a scrubbed 3D scene needs the value every
 * frame, and re-rendering the component tree 60 times a second to deliver a
 * float is how these pages end up at 20 FPS. ScrollTrigger writes the ref;
 * useFrame reads it.
 */
export function useScrollProgress(
  trigger: MutableRefObject<HTMLElement | null>,
  options: { start?: string; end?: string } = {},
): ProgressRef {
  const progress = useRef(0);

  useEffect(() => {
    const el = trigger.current;
    if (!el) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: options.start ?? 'top bottom',
      end: options.end ?? 'bottom top',
      onUpdate: (self) => {
        progress.current = self.progress;
      },
    });
    return () => st.kill();
  }, [trigger, options.start, options.end]);

  return progress;
}

/** Frame-rate independent smoothing toward a target. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}
