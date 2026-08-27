'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useDeviceTier } from '@/hooks/useDeviceTier';

/**
 * The page's atmospheric ground.
 *
 * Three soft colour pools sit behind everything, fixed to the viewport, and
 * travel across it as the reader scrolls. This is what stops the site reading
 * as a stack of black rectangles: the ground is always a different temperature
 * from the section above it, so the choreography has something to move against.
 *
 * Performance is the whole design constraint here. The pools are radial
 * gradients with soft stops — never `filter: blur()`, which would re-rasterise
 * a viewport-sized layer on every scroll frame. Only `transform` and `opacity`
 * are animated, so each pool is a composited layer the GPU moves for free.
 */

interface Pool {
  /** Gradient definition. Soft stops do the blurring, at no per-frame cost. */
  background: string;
  size: string;
  /** Start / end positions as viewport percentages, driven by scroll. */
  from: { x: number; y: number; scale: number; opacity: number };
  to: { x: number; y: number; scale: number; opacity: number };
  /** Idle drift period in seconds — keeps the ground alive when scroll stops. */
  period: number;
  drift: number;
}

const POOLS: Pool[] = [
  {
    // Warm — follows the reader, brightest through the pilot and outcome run.
    background:
      'radial-gradient(circle, rgba(232,118,43,0.20) 0%, rgba(232,118,43,0.07) 34%, rgba(10,11,13,0) 66%)',
    size: '95vmax',
    from: { x: -22, y: -18, scale: 1, opacity: 0.75 },
    to: { x: 26, y: 34, scale: 1.35, opacity: 0.5 },
    period: 19,
    drift: 2.4,
  },
  {
    // Cool — the complement. Present from the start, dominant in the middle.
    background:
      'radial-gradient(circle, rgba(30,65,82,0.34) 0%, rgba(22,44,54,0.14) 38%, rgba(10,11,13,0) 68%)',
    size: '110vmax',
    from: { x: 30, y: 26, scale: 1.2, opacity: 0.5 },
    to: { x: -24, y: -22, scale: 1, opacity: 0.8 },
    period: 26,
    drift: 3.1,
  },
  {
    // Neutral lift — keeps the deepest blacks off the floor.
    background:
      'radial-gradient(circle, rgba(246,243,236,0.055) 0%, rgba(246,243,236,0.018) 40%, rgba(10,11,13,0) 70%)',
    size: '75vmax',
    from: { x: 8, y: 40, scale: 1.1, opacity: 0.6 },
    to: { x: -12, y: -34, scale: 0.9, opacity: 0.45 },
    period: 33,
    drift: 1.8,
  },
];

export function AmbientBackdrop() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { lowPower, tier } = useDeviceTier();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || reduced) return;

      const pools = gsap.utils.toArray<HTMLElement>('[data-pool]', root);
      if (pools.length === 0) return;

      // One ScrollTrigger for the whole document rather than one per pool.
      const ctx: gsap.core.Tween[] = [];

      pools.forEach((el, i) => {
        const pool = POOLS[i];
        if (!pool) return;

        // -50 keeps the pool centred on its own box; GSAP writes the whole
        // transform, so Tailwind's translate classes would simply be discarded.
        gsap.set(el, {
          xPercent: -50 + pool.from.x,
          yPercent: -50 + pool.from.y,
          scale: pool.from.scale,
          opacity: pool.from.opacity,
          force3D: true,
        });

        ctx.push(
          gsap.to(el, {
            xPercent: -50 + pool.to.x,
            yPercent: -50 + pool.to.y,
            scale: pool.to.scale,
            opacity: pool.to.opacity,
            ease: 'none',
            scrollTrigger: {
              trigger: document.documentElement,
              start: 'top top',
              end: 'bottom bottom',
              // A long scrub: the ground lags the page, which reads as depth.
              scrub: 1.6,
              invalidateOnRefresh: true,
            },
          }),
        );

        // Idle drift, so the backdrop breathes when the reader stops scrolling.
        // Runs on a separate transform axis to avoid fighting the scroll tween.
        ctx.push(
          gsap.to(el, {
            x: '+=' + pool.drift + 'vw',
            y: '-=' + pool.drift * 0.7 + 'vh',
            duration: pool.period,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          }),
        );
      });

      return () =>
        ctx.forEach((t) => {
          t.scrollTrigger?.kill();
          t.kill();
        });
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  // Mobile gets two pools instead of three: the third is the least legible on a
  // small viewport and the first to cost frames.
  const visible = tier === 'mobile' || lowPower ? POOLS.slice(0, 2) : POOLS;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {visible.map((pool, i) => (
        <div
          key={i}
          data-pool
          className="absolute left-1/2 top-1/2 will-change-transform"
          /* Centring is applied by GSAP (xPercent/yPercent -50). Under reduced
             motion no tween runs, so the fallback transform below stands in. */
          style={{
            width: pool.size,
            height: pool.size,
            background: pool.background,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}
