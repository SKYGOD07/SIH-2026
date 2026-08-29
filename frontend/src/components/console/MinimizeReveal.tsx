'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { isConsoleHref, takeOrigin, radiusToCorner } from '@/lib/console/maximize';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * The console shrinking back into the link that dismissed it.
 *
 * The mirror of `MaximizeReveal`: entering the console, the shell grows out of
 * the point you clicked; leaving it, a cover contracts into the point you
 * clicked, revealing the landing page underneath. Same gesture, run backwards,
 * so the pair reads as one window opening and closing rather than as two
 * unrelated effects.
 *
 * It is an overlay rather than a clip on the page, and that is not a stylistic
 * choice. `clip-path` on an ancestor clips fixed-position descendants, and the
 * landing deck is pinned — ScrollTrigger pins by fixing the element. Clipping
 * the deck to animate it in would break the horizontal scroll for the length of
 * the animation and leave the pin measuring against a clipped box.
 *
 * The work happens in a layout effect. A passive effect runs after paint, which
 * would show one frame of the fully revealed deck before the cover appeared over
 * it — a flash precisely where the animation is supposed to be seamless.
 */

/** `useLayoutEffect` warns during server rendering; this never runs there. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function MinimizeReveal() {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  /** Where we were before this render. Null on the very first one. */
  const previous = useRef<string | null>(null);
  /** Set when a transition is armed, read by the animation below. */
  const armed = useRef<{ x: number; y: number } | null>(null);

  useIsomorphicLayoutEffect(() => {
    const from = previous.current;
    previous.current = pathname;

    const el = ref.current;
    if (!el || reduced) return;

    // Only the console-to-landing crossing. Everything else leaves the cover
    // where it is, which is invisible and inert.
    if (pathname !== '/' || !from || !isConsoleHref(from)) return;

    const origin = takeOrigin() ?? { x: window.innerWidth / 2, y: 0 };
    const radius = radiusToCorner(origin, window.innerWidth, window.innerHeight);

    // Painted covering the whole viewport before the browser gets a frame, so
    // the deck is never briefly visible underneath.
    el.dataset.minimizing = '';
    gsap.set(el, {
      ['--route-ox']: `${origin.x}px`,
      ['--route-oy']: `${origin.y}px`,
      ['--route-reveal']: `${radius}px`,
    });

    armed.current = origin;
  }, [pathname, reduced]);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !armed.current) return;
      armed.current = null;

      const tl = gsap.timeline({
        // The cover is removed from the layer entirely, not just made
        // transparent. A full-viewport element left behind would sit over the
        // deck for the rest of the session, and `pointer-events: none` only
        // hides that until something needs to hit-test through it.
        onComplete: () => {
          if (ref.current) delete ref.current.dataset.minimizing;
        },
      });

      tl.to(el, {
        ['--route-reveal']: '0px',
        duration: 0.75,
        ease: 'power3.inOut',
      });

      /*
       * Same insurance as the maximise, and it matters more here: a stranded
       * cover is a full-viewport black rectangle over the deck. It cannot be
       * clicked through to escape either, because the page underneath is what
       * the reader wanted and the cover is the thing hiding it.
       */
      const watchdog = window.setTimeout(() => {
        if (ref.current) delete ref.current.dataset.minimizing;
      }, 2500);

      return () => {
        window.clearTimeout(watchdog);
        tl.kill();
        if (ref.current) delete ref.current.dataset.minimizing;
      };
    },
    { dependencies: [pathname] },
  );

  return <div ref={ref} aria-hidden="true" className="route-minimize" />;
}
