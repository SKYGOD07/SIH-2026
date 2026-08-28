'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useIntro } from './IntroProvider';
import { useLenis } from '@/lib/lenis/SmoothScrollProvider';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { Mark, MARK_TILES } from '@/components/brand/Mark';
import { seeded } from '@/lib/utils';

/**
 * The opening sequence.
 *
 * Modelled on the zexvro.in opener: a large blocky mark builds itself out of
 * rounded tiles, holds, then flies into the navigation capsule as the ground
 * parts.
 *
 * ── Why this is built the way it is ──────────────────────────────────────────
 *
 * An earlier version drove the exit from GSAP callbacks and gated the hand-off
 * on React state. That gave a screen whose only job is to get out of the way
 * several independent ways to fail — and it did: it could sit on top of the page
 * forever, leaving the site apparently dead.
 *
 * So the contract here is deliberately blunt:
 *
 *   1. ONE timeline, built once on mount. Nothing re-creates or reverts it.
 *   2. The page is released by a plain `setTimeout` on a fixed schedule, NOT by
 *      an animation callback. If GSAP stalls, is throttled, or never ticks, the
 *      page still opens on time.
 *   3. Readiness and reduced-motion can only make the exit *earlier*, never
 *      later, and a watchdog closes it out regardless.
 *   4. Clicking anywhere skips.
 *
 * The animation is decoration over a schedule. It is never load-bearing.
 */

/* --- the schedule, in seconds. The animation is built to fit it. --------- */
const T = {
  /** Tiles start arriving. */
  assembleStart: 0.25,
  /** Tiles have all landed (assembleStart + travel + stagger). */
  assembled: 3.05,
  /** The mark leaves for the navigation capsule. */
  flightStart: 3.5,
  /** The ground starts parting. */
  curtainStart: 4.1,
  /** The page is handed over. */
  done: 5.2,
} as const;

interface Scatter {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
}

/** Deterministic arrival vectors — art-directed depth, not a random cloud. */
function buildScatter(): Scatter[] {
  const rand = seeded(9173);
  return MARK_TILES.map(() => ({
    x: (rand() - 0.5) * 900,
    y: (rand() - 0.5) * 780,
    // Always from behind, so every tile travels toward the reader.
    z: -900 - rand() * 1400,
    rx: (rand() - 0.5) * 300,
    ry: (rand() - 0.5) * 300,
    rz: (rand() - 0.5) * 220,
  }));
}

export function Preloader() {
  const { phase, beginReveal, complete } = useIntro();
  const lenis = useLenis();
  const reduced = usePrefersReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const scatter = useMemo(buildScatter, []);

  /** Each phase transition fires at most once, whoever gets there first. */
  const firedReveal = useRef(false);
  const firedComplete = useRef(false);

  const doReveal = useCallback(() => {
    if (firedReveal.current) return;
    firedReveal.current = true;
    beginReveal();
  }, [beginReveal]);

  const doComplete = useCallback(() => {
    if (firedComplete.current) return;
    firedComplete.current = true;
    doReveal();
    // The ground hid the page while it settled; re-measure before handing
    // scroll control to ScrollTrigger. Guarded because a failure here must not
    // prevent the page from opening.
    try {
      ScrollTrigger.refresh();
    } catch {
      /* measurement is best-effort; the page opens either way */
    }
    complete();
  }, [complete, doReveal]);

  /* --- scroll is locked only while the opener is actually up --- */
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
   * Whatever happens, the body is never left unscrollable.
   *
   * `data-loading` drives `overflow: hidden`, so if this component were ever
   * torn down between phases the page would be frozen with no way back.
   */
  useEffect(
    () => () => {
      document.body.dataset.loading = 'false';
    },
    [],
  );

  /* ------------------------------------------------------------------ */
  /* The schedule. This — not the animation — releases the page.         */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (phase === 'ready') return;

    // Nothing worth showing to a reader who asked for less motion, or to a tab
    // that is not visible (where requestAnimationFrame never fires and the
    // animation could not play anyway).
    if (reduced || document.hidden) {
      doComplete();
      return;
    }

    const timers = [
      window.setTimeout(doReveal, T.flightStart * 1000),
      window.setTimeout(doComplete, T.done * 1000),
      // Watchdog. Should never be reached; exists so that a stall in any of the
      // above can still not strand the reader behind a curtain.
      window.setTimeout(doComplete, 9000),
    ];

    // If the reader backgrounds the tab mid-sequence, stop performing to an
    // audience that cannot see it and hand the page over.
    const onHide = () => {
      if (document.hidden) doComplete();
    };
    document.addEventListener('visibilitychange', onHide);

    return () => {
      timers.forEach(window.clearTimeout);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [phase, reduced, doReveal, doComplete]);

  /** Click anywhere to skip. */
  const skip = useCallback(() => doComplete(), [doComplete]);

  /* ------------------------------------------------------------------ */
  /* The animation. Decoration over the schedule above.                  */
  /* ------------------------------------------------------------------ */
  useGSAP(
    () => {
      if (reduced || document.hidden || !rootRef.current || !markRef.current) return;
      const mark = markRef.current;

      /**
       * Measure where the mark is flying to.
       *
       * The navigation capsule is still translated out of view, so its live rect
       * is off by its entrance transform. Neutralising that transform for one
       * synchronous read — with no paint in between — gives the true resting
       * position. If the capsule is not found, the mark simply exits upward.
       */
      let dx = 0;
      let dy = -window.innerHeight * 0.34;
      let ratio = 0.08;

      const navMark = document.querySelector<HTMLElement>('[data-nav-mark]');
      if (navMark) {
        const holder = navMark.closest<HTMLElement>('.pointer-events-auto');
        const prevTransform = holder?.style.transform ?? '';
        if (holder) holder.style.transform = 'none';

        const from = mark.getBoundingClientRect();
        const to = navMark.getBoundingClientRect();

        if (holder) holder.style.transform = prevTransform;

        if (to.width > 0 && from.width > 0) {
          ratio = to.width / from.width;
          dx = to.left + to.width / 2 - (from.left + from.width / 2);
          dy = to.top + to.height / 2 - (from.top + from.height / 2);
        }
      }

      const tl = gsap.timeline();

      /* --- the mark assembles out of depth --- */
      tl.fromTo(
        '[data-tile]',
        {
          x: (i: number) => scatter[i]?.x ?? 0,
          y: (i: number) => scatter[i]?.y ?? 0,
          z: (i: number) => scatter[i]?.z ?? 0,
          rotationX: (i: number) => scatter[i]?.rx ?? 0,
          rotationY: (i: number) => scatter[i]?.ry ?? 0,
          rotationZ: (i: number) => scatter[i]?.rz ?? 0,
          opacity: 0,
        },
        {
          x: 0,
          y: 0,
          z: 0,
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          opacity: 1,
          duration: 1.9,
          ease: 'expo.out',
          // Centre-out: MARK_TILES is pre-sorted by distance from centre.
          stagger: 0.075,
        },
        T.assembleStart,
      )
        .fromTo(
          '[data-preload-word]',
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out' },
          1.4,
        )
        .fromTo(
          '[data-preload-rule]',
          { scaleX: 0 },
          { scaleX: 1, duration: 1.4, ease: 'power2.inOut' },
          1.5,
        )

        /* --- it leaves for the navigation capsule --- */
        .to(
          ['[data-preload-word]', '[data-preload-rule]'],
          { opacity: 0, y: -10, duration: 0.35, ease: 'power2.in' },
          T.flightStart - 0.3,
        )
        .to(
          mark,
          { x: dx, y: dy, scale: ratio, duration: 1.2, ease: 'power3.inOut' },
          T.flightStart,
        )

        /* --- and the ground parts behind it --- */
        .to(
          '[data-curtain]',
          { yPercent: (i) => (i === 0 ? -101 : 101), duration: 1.0, ease: 'power4.inOut' },
          T.curtainStart,
        )
        .to(mark, { opacity: 0, duration: 0.3, ease: 'power2.in' }, T.curtainStart + 0.5);

      return () => {
        tl.kill();
      };
    },
    // Built once. Nothing in the sequence may re-run or revert this.
    { scope: rootRef, dependencies: [] },
  );

  if (phase === 'ready') return null;

  return (
    <div
      ref={rootRef}
      onClick={skip}
      className="fixed inset-0 z-[120] cursor-pointer overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label="Loading MahaInnovate. Click to skip."
    >
      {/* The ground, split so it can part. */}
      <div data-curtain className="absolute inset-x-0 top-0 h-1/2 bg-bone" />
      <div data-curtain className="absolute inset-x-0 bottom-0 h-1/2 bg-bone" />

      {/* A soft pool so the ground is never a flat fill. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[90vmax] w-[90vmax] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'radial-gradient(circle, rgba(255,253,248,0.9) 0%, rgba(237,231,221,0.35) 42%, rgba(237,231,221,0) 70%)',
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Perspective lives on the wrapper so tiles travel through real depth. */}
        <div style={{ perspective: '1200px' }}>
          <Mark
            ref={markRef}
            data-mark
            tileAttr="data-tile"
            tileClassName="will-3d"
            radius="17%"
            className="[transform-style:preserve-3d]"
            style={{ width: 'clamp(15rem, min(52vw, 62svh), 44rem)' }}
          />
        </div>

        <div className="mt-[clamp(2rem,5vh,3.5rem)] flex flex-col items-center gap-4">
          <span
            data-preload-rule
            aria-hidden="true"
            className="block h-px w-[clamp(6rem,14vw,12rem)] origin-center bg-ink/25"
          />
          <span
            data-preload-word
            className="font-mono text-[0.6875rem] uppercase tracking-[0.32em] text-ink/55"
          >
            MahaInnovate
          </span>
        </div>
      </div>
    </div>
  );
}
