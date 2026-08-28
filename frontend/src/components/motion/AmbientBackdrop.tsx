'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useDeviceTier } from '@/hooks/useDeviceTier';

/**
 * The page's atmospheric ground.
 *
 * Soft colour pools sit behind everything, fixed to the viewport, drifting as
 * the reader scrolls. On the light palette these are very low-contrast — a
 * warm blush, a cool haze and a paper lift — because the point is that the
 * ground is never the same temperature twice, not that it is colourful.
 *
 * Performance is the design constraint: radial gradients with soft stops do the
 * blurring, never `filter: blur()`, which would re-rasterise a viewport-sized
 * layer every scroll frame. Only `transform` and `opacity` animate, so each pool
 * is a composited layer the GPU moves for free.
 */

interface Pool {
  background: string;
  size: string;
  from: { x: number; y: number; scale: number; opacity: number };
  to: { x: number; y: number; scale: number; opacity: number };
  period: number;
  drift: number;
}

const POOLS: Pool[] = [
  {
    // Warm blush — strongest early and through the outcome sections.
    background:
      'radial-gradient(circle, rgba(226,150,90,0.28) 0%, rgba(226,150,90,0.09) 36%, rgba(237,231,221,0) 68%)',
    size: '95vmax',
    from: { x: -20, y: -16, scale: 1, opacity: 0.8 },
    to: { x: 24, y: 32, scale: 1.3, opacity: 0.5 },
    period: 21,
    drift: 2.2,
  },
  {
    // Cool haze — the complement, keeping the bone from going uniformly warm.
    background:
      'radial-gradient(circle, rgba(150,172,192,0.3) 0%, rgba(150,172,192,0.1) 40%, rgba(237,231,221,0) 70%)',
    size: '110vmax',
    from: { x: 28, y: 24, scale: 1.2, opacity: 0.55 },
    to: { x: -22, y: -20, scale: 1, opacity: 0.8 },
    period: 27,
    drift: 2.9,
  },
  {
    // Paper lift — a near-white pool that keeps the ground from flattening.
    background:
      'radial-gradient(circle, rgba(255,253,248,0.75) 0%, rgba(255,253,248,0.3) 42%, rgba(237,231,221,0) 72%)',
    size: '80vmax',
    from: { x: 10, y: 36, scale: 1.1, opacity: 0.7 },
    to: { x: -14, y: -30, scale: 0.92, opacity: 0.5 },
    period: 34,
    drift: 1.7,
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

      const tweens: gsap.core.Tween[] = [];

      pools.forEach((el, i) => {
        const pool = POOLS[i];
        if (!pool) return;

        // -50 keeps the pool centred on its own box; GSAP writes the whole
        // transform, so Tailwind translate classes would simply be discarded.
        gsap.set(el, {
          xPercent: -50 + pool.from.x,
          yPercent: -50 + pool.from.y,
          scale: pool.from.scale,
          opacity: pool.from.opacity,
        });

        tweens.push(
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
        tweens.push(
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
        tweens.forEach((t) => {
          t.scrollTrigger?.kill();
          t.kill();
        });
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  // Mobile drops the third pool: least legible on a small viewport, first to
  // cost frames.
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
          style={{
            width: pool.size,
            height: pool.size,
            background: pool.background,
            // Fallback centring for the reduced-motion path, where no tween runs.
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}
