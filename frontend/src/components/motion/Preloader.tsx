'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useIntro } from './IntroProvider';
import { useLenis } from '@/lib/lenis/SmoothScrollProvider';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { seeded } from '@/lib/utils';

/**
 * The opening sequence.
 *
 * Modelled on the zexvro.in opener: a large blocky mark builds itself out of
 * rounded tiles in the centre of an empty screen, holds, then hands off to the
 * navigation as the page reveals underneath.
 *
 * The tiles do not simply fade in — they arrive from scattered positions and
 * lock into the grid. That is deliberate here rather than decorative: the whole
 * argument of this site is eight scattered procurement activities resolving into
 * one system, and the first thing the reader sees is that idea performed.
 *
 * Timing is gated on real readiness (fonts, window load, first frame) with a
 * failsafe, and the whole sequence is skipped on a hidden tab, where
 * requestAnimationFrame never fires and the animation would otherwise hang.
 */

/** 5 x 5 pixel grid spelling M. 1 = tile. */
const MARK: number[][] = [
  [1, 0, 0, 0, 1],
  [1, 1, 0, 1, 1],
  [1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
];

const GRID = 5;

interface Tile {
  key: string;
  row: number;
  col: number;
  /** Scatter offset the tile flies in from, in percent of the mark box. */
  fromX: number;
  fromY: number;
  rot: number;
  /** Distance from centre — drives the stagger so the mark builds outward. */
  dist: number;
}

function buildTiles(): Tile[] {
  const rand = seeded(3407);
  const tiles: Tile[] = [];
  const c = (GRID - 1) / 2;

  MARK.forEach((row, r) =>
    row.forEach((on, col) => {
      if (!on) return;
      tiles.push({
        key: `${r}-${col}`,
        row: r,
        col,
        // Scatter far enough to read as arrival, not as a nudge.
        fromX: (rand() - 0.5) * 620,
        fromY: (rand() - 0.5) * 620,
        rot: (rand() - 0.5) * 180,
        dist: Math.hypot(r - c, col - c),
      });
    }),
  );

  return tiles.sort((a, b) => a.dist - b.dist);
}

export function Preloader() {
  const { phase, beginReveal, complete } = useIntro();
  const lenis = useLenis();
  const reduced = usePrefersReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const tiles = useMemo(buildTiles, []);

  /* --- lock scrolling for the whole loading phase --- */
  useEffect(() => {
    document.body.dataset.loading = phase === 'ready' ? 'false' : 'true';
    if (!lenis) return;
    if (phase === 'ready') lenis.start();
    else {
      lenis.stop();
      lenis.scrollTo(0, { immediate: true });
    }
  }, [phase, lenis]);

  /**
   * A hidden tab never fires requestAnimationFrame, so GSAP's ticker does not
   * advance and the sequence would sit frozen forever. There is no animation
   * worth showing to a hidden tab, so skip straight to the finished state.
   */
  useEffect(() => {
    if (phase === 'ready') return;
    const skipIfHidden = () => {
      if (!document.hidden) return;
      beginReveal();
      complete();
    };
    skipIfHidden();
    document.addEventListener('visibilitychange', skipIfHidden);
    return () => document.removeEventListener('visibilitychange', skipIfHidden);
  }, [phase, beginReveal, complete]);

  /* --- genuine readiness signals --- */
  useEffect(() => {
    if (reduced) {
      setDone(true);
      return;
    }

    let alive = true;
    const marks = { fonts: false, load: false, frame: false };

    /**
     * Readiness alone is not enough to release the opener.
     *
     * On a warm cache every signal lands inside ~300ms, which would cut the
     * mark off mid-assembly — the reader would see a flash of tiles rather than
     * a logo. The sequence therefore also waits out a floor long enough for the
     * assembly to finish and hold. Slow connections are unaffected: readiness is
     * still the binding constraint there.
     */
    const ASSEMBLY_FLOOR = 2400;
    const started = performance.now();
    let floorTimer = 0;

    const release = () => {
      if (!alive) return;
      const waited = performance.now() - started;
      if (waited >= ASSEMBLY_FLOOR) setDone(true);
      else {
        window.clearTimeout(floorTimer);
        floorTimer = window.setTimeout(() => alive && setDone(true), ASSEMBLY_FLOOR - waited);
      }
    };

    const bump = (key: keyof typeof marks) => {
      if (!alive || marks[key]) return;
      marks[key] = true;
      if (Object.values(marks).every(Boolean)) release();
    };

    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) fonts.ready.then(() => bump('fonts'));
    else bump('fonts');

    if (document.readyState === 'complete') bump('load');
    else window.addEventListener('load', () => bump('load'), { once: true });

    requestAnimationFrame(() => requestAnimationFrame(() => bump('frame')));

    // Never hold the page hostage to a signal that does not arrive.
    const failsafe = window.setTimeout(() => alive && setDone(true), 5000);
    return () => {
      alive = false;
      window.clearTimeout(failsafe);
      window.clearTimeout(floorTimer);
    };
  }, [reduced]);

  /* --- the mark assembles --- */
  useGSAP(
    () => {
      if (!rootRef.current) return;

      if (reduced) {
        beginReveal();
        complete();
        return;
      }

      const tl = gsap.timeline();

      tl.fromTo(
        '[data-tile]',
        {
          x: (i: number) => tiles[i]?.fromX ?? 0,
          y: (i: number) => tiles[i]?.fromY ?? 0,
          rotate: (i: number) => tiles[i]?.rot ?? 0,
          scale: 0.2,
          opacity: 0,
        },
        {
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
          opacity: 1,
          duration: 1.15,
          ease: 'expo.out',
          // Centre-out, because the tiles are pre-sorted by distance.
          stagger: 0.045,
        },
      ).fromTo(
        '[data-preload-word]',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
        0.75,
      );

      return () => tl.kill();
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  /* --- hand off to the page --- */
  useGSAP(
    () => {
      if (!done || reduced || phase !== 'loading') return;
      const root = rootRef.current;
      if (!root) return;

      const tl = gsap.timeline({
        // Give the assembled mark a beat to read before it leaves.
        delay: 0.35,
        onComplete: () => {
          // The curtain hid the page while it settled; re-measure before
          // handing scroll control to ScrollTrigger.
          ScrollTrigger.refresh();
          complete();
        },
      });

      tl.to('[data-preload-word]', { opacity: 0, y: -8, duration: 0.35, ease: 'power2.in' })
        // The mark contracts and drifts toward the navigation, so the opener
        // reads as becoming the wordmark rather than simply disappearing.
        .to(
          '[data-mark]',
          {
            scale: 0.09,
            xPercent: -38,
            yPercent: -42,
            opacity: 0,
            duration: 1.05,
            ease: 'power3.inOut',
          },
          '-=0.2',
        )
        // Ground parts as two panels, revealing the hero already in motion.
        .to(
          '[data-curtain]',
          {
            yPercent: (i) => (i === 0 ? -101 : 101),
            duration: 1.05,
            ease: 'power4.inOut',
            onStart: beginReveal,
          },
          '-=0.55',
        )
        .set(root, { pointerEvents: 'none' });

      return () => tl.kill();
    },
    { scope: rootRef, dependencies: [done, reduced, phase] },
  );

  if (phase === 'ready') return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[120] overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label="Loading MahaInnovate"
    >
      {/* The ground, split so it can part. */}
      <div data-curtain className="absolute inset-x-0 top-0 h-1/2 bg-bone" />
      <div data-curtain className="absolute inset-x-0 bottom-0 h-1/2 bg-bone" />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[clamp(1.5rem,4vh,3rem)]">
        {/* --- the mark --- */}
        <div
          data-mark
          aria-hidden="true"
          className="relative"
          style={{
            width: 'clamp(11rem, 24vw, 22rem)',
            height: 'clamp(11rem, 24vw, 22rem)',
          }}
        >
          {tiles.map((t) => (
            <span
              key={t.key}
              data-tile
              className="absolute rounded-[18%] bg-ink will-3d"
              style={{
                // 5-column grid with a gutter, expressed as percentages so the
                // whole mark scales with one parent dimension.
                left: `${t.col * 20 + 1.6}%`,
                top: `${t.row * 20 + 1.6}%`,
                width: '16.8%',
                height: '16.8%',
              }}
            />
          ))}
        </div>

        <span
          data-preload-word
          className="font-mono text-[0.6875rem] uppercase tracking-[0.32em] text-ink/55"
        >
          MahaInnovate
        </span>
      </div>
    </div>
  );
}
