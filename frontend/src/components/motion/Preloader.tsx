'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
 * Modelled on the zexvro.in opener, with the two things that make it work:
 *
 *  DEPTH — the tiles do not fade in flat. They arrive from far back in Z with
 *  independent rotation on all three axes, through a real perspective, and
 *  decelerate into the grid. The mark is built in space, not composited.
 *
 *  CONNECTION — when it is done, the assembled mark does not vanish. It is
 *  measured against the navigation capsule's mark and flies into that exact
 *  position and scale, so the thing the reader watched being built becomes the
 *  logo they navigate with. That hand-off is the whole point of the sequence.
 *
 * Timing is gated on real readiness with a floor long enough for the assembly
 * to play, and the whole thing is skipped on a hidden tab, where
 * requestAnimationFrame never fires and the animation would otherwise hang.
 */

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
  const [done, setDone] = useState(false);
  const scatter = useMemo(buildScatter, []);

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
   * advance and the sequence would sit frozen forever. Nothing is worth showing
   * to a hidden tab, so skip straight to the finished state.
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

  /* --- genuine readiness, with a floor so the assembly always plays --- */
  useEffect(() => {
    if (reduced) {
      setDone(true);
      return;
    }

    let alive = true;
    const marks = { fonts: false, load: false, frame: false };

    // Fast, responsive loading floor so the mark assembles smoothly without stalling.
    const ASSEMBLY_FLOOR = 1200;
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

    // Hard failsafe: Never leave the user stuck on loading screen longer than 2.5s
    const failsafe = window.setTimeout(() => {
      if (alive) {
        setDone(true);
        beginReveal();
        complete();
      }
    }, 2500);
    return () => {
      alive = false;
      window.clearTimeout(failsafe);
      window.clearTimeout(floorTimer);
    };
  }, [reduced, beginReveal, complete]);

  /* --- the mark assembles out of depth --- */
  useGSAP(
    () => {
      if (!rootRef.current) return;

      if (reduced) {
        beginReveal();
        complete();
        return;
      }

      const tl = gsap.timeline({ delay: 0.25 });

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
      )
        .fromTo(
          '[data-preload-word]',
          { opacity: 0, y: 14, letterSpacing: '0.5em' },
          { opacity: 1, y: 0, letterSpacing: '0.32em', duration: 1.1, ease: 'expo.out' },
          1.15,
        )
        .fromTo(
          '[data-preload-rule]',
          { scaleX: 0 },
          { scaleX: 1, duration: 1.4, ease: 'power2.inOut' },
          1.25,
        )
        // A single slow breath so the assembled state is alive, not frozen,
        // during however long readiness still takes.
        .to(
          '[data-mark]',
          { scale: 1.025, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 },
          2.2,
        );

      return () => tl.kill();
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  /* --- the mark flies into the navigation capsule --- */
  useGSAP(
    () => {
      if (!done || reduced || phase !== 'loading') return;
      const root = rootRef.current;
      const mark = markRef.current;
      if (!root || !mark) return;

      /**
       * Measure the destination.
       *
       * The nav capsule is still translated out of view at this moment, so its
       * live rect is off by its entrance transform. Neutralising the transform
       * for one synchronous read — with no paint in between — gives the true
       * resting position to fly to.
       */
      const navMark = document.querySelector<HTMLElement>('[data-nav-mark]');
      let dx = 0;
      let dy = -window.innerHeight * 0.34;
      let ratio = 0.08;

      if (navMark) {
        const holder = navMark.closest<HTMLElement>('.pointer-events-auto');
        const prev = holder?.style.transform ?? '';
        const prevOpacity = holder?.style.opacity ?? '';
        if (holder) holder.style.transform = 'none';

        const from = mark.getBoundingClientRect();
        const to = navMark.getBoundingClientRect();

        if (holder) {
          holder.style.transform = prev;
          holder.style.opacity = prevOpacity;
        }

        if (to.width > 0 && from.width > 0) {
          ratio = to.width / from.width;
          dx = to.left + to.width / 2 - (from.left + from.width / 2);
          dy = to.top + to.height / 2 - (from.top + from.height / 2);
        }
      }

      // Kill any previous looping breathing animation on the mark
      gsap.killTweensOf('[data-mark]');

      const tl = gsap.timeline({
        // Let the assembled mark be read before it leaves.
        delay: 0.15,
        onComplete: () => {
          // The ground hid the page while it settled; re-measure before handing
          // scroll control to ScrollTrigger.
          ScrollTrigger.refresh();
          complete();
        },
      });

      // Stop the breathing loop cleanly before the flight takes over scale.
      tl.set('[data-mark]', { scale: 1 })
        .to(
          ['[data-preload-word]', '[data-preload-rule]'],
          { opacity: 0, y: -10, duration: 0.35, ease: 'power2.in' },
        )
        .to(
          mark,
          {
            x: dx,
            y: dy,
            scale: ratio,
            duration: 0.9,
            // Settles cleanly into position
            ease: 'power3.inOut',
            onStart: beginReveal,
          },
          '-=0.15',
        )
        // The ground parts once the mark is most of the way home
        .to(
          '[data-curtain]',
          { yPercent: (i) => (i === 0 ? -101 : 101), duration: 0.75, ease: 'power4.inOut' },
          '-=0.6',
        )
        .to(mark, { opacity: 0, duration: 0.25, ease: 'power2.in' }, '-=0.3')
        .set(root, { pointerEvents: 'none' });

      return () => tl.kill();
    },
    { scope: rootRef, dependencies: [done, reduced, phase, beginReveal, complete] },
  );

  if (phase === 'ready') return null;

  return (
    <div
      ref={rootRef}
      onClick={() => {
        beginReveal();
        complete();
      }}
      className="fixed inset-0 z-[120] overflow-hidden cursor-pointer"
      role="status"
      aria-live="polite"
      aria-label="Loading MahaInnovate (Click to skip)"
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
            className="font-mono text-[0.6875rem] uppercase text-ink/55"
            style={{ letterSpacing: '0.32em' }}
          >
            MahaInnovate
          </span>
        </div>
      </div>
    </div>
  );
}
