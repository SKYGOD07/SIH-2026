/**
 * Single registration point for GSAP + plugins.
 * Every module that animates imports from here so plugins are registered
 * exactly once and tree-shaking cannot drop the registration side effect.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Observer } from 'gsap/Observer';
import { Flip } from 'gsap/Flip';

if (typeof window !== 'undefined' && !(gsap.core as any).__mahaRegistered) {
  gsap.registerPlugin(ScrollTrigger, Observer, Flip);
  gsap.defaults({ ease: 'power3.out', duration: 0.9 });
  gsap.config({ nullTargetWarn: false });
  // ScrollTrigger recalculates on resize; debounce so mobile URL-bar
  // show/hide doesn't thrash pinned sections.
  ScrollTrigger.config({ ignoreMobileResize: true, autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load' });
  (gsap.core as any).__mahaRegistered = true;
}

export { gsap, ScrollTrigger, Observer, Flip };

/** Shared easing vocabulary — keeps timing consistent across sections. */
export const EASE = {
  out: 'power3.out',
  inOut: 'power2.inOut',
  expo: 'expo.out',
  editorial: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

/** Standard scrub value. Slight lag = weight, without input lag. */
export const SCRUB = 0.85;
