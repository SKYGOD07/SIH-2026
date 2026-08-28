'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * Play a slide's entrance the first time it is actually on screen.
 *
 * ScrollTrigger is the wrong instrument inside the deck: the slides are
 * translated horizontally by a tween, so a trigger would have to be told about
 * that container animation, and every slide would need threading through to it.
 * An IntersectionObserver measures painted geometry instead, which already
 * accounts for the transform — so the same hook works unchanged whether the
 * deck is running sideways or stacked vertically on a phone.
 *
 * Fires once. A slide re-entering on the way back should already be composed;
 * replaying it turns a scroll backwards into a flicker.
 */
export function useSlideReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const root = ref.current;
    if (!root || reduced) return;

    const targets = gsap.utils.toArray<HTMLElement>('[data-reveal]', root);
    if (targets.length === 0) return;

    gsap.set(targets, { autoAlpha: 0, y: 22 });

    let played = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || played) continue;
          played = true;
          observer.disconnect();
          gsap.to(targets, {
            autoAlpha: 1,
            y: 0,
            duration: 0.85,
            stagger: 0.075,
            ease: 'expo.out',
          });
        }
      },
      // A third of the slide showing is enough to commit: any later and the
      // reveal starts after the reader has already read the headline.
      { threshold: 0.33 },
    );

    observer.observe(root);
    return () => {
      observer.disconnect();
      gsap.set(targets, { clearProps: 'opacity,visibility,transform' });
    };
  }, [reduced]);

  return ref;
}
