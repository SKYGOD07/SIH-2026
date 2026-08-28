'use client';

import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useIntro } from './IntroProvider';
import { useLenis } from '@/lib/lenis/SmoothScrollProvider';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * The boot screen.
 *
 * Deliberately minimal, following the reference: a calm warm ground, one short
 * rule that fills, and a single line of mono caps. The previous version filled
 * the screen with a wordmark, a lifecycle ticker and a counter — busy, and the
 * opposite of what a load screen should feel like.
 *
 * Progress is real: it tracks font resolution, the window load event and first
 * frame availability, with a failsafe so a missing signal can never strand the
 * page. Scroll is locked throughout, so the reader cannot land mid-way into a
 * pinned section before ScrollTrigger has measured the document.
 */
export function Preloader() {
  const { phase, beginReveal, complete } = useIntro();
  const lenis = useLenis();
  const reduced = usePrefersReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

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

  /* --- gather genuine readiness signals --- */
  useEffect(() => {
    if (reduced) {
      setDone(true);
      return;
    }

    let alive = true;
    const marks = { fonts: false, load: false, frame: false };
    const bump = (key: keyof typeof marks) => {
      if (!alive || marks[key]) return;
      marks[key] = true;
      if (Object.values(marks).every(Boolean)) setDone(true);
    };

    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) fonts.ready.then(() => bump('fonts'));
    else bump('fonts');

    if (document.readyState === 'complete') bump('load');
    else window.addEventListener('load', () => bump('load'), { once: true });

    requestAnimationFrame(() => requestAnimationFrame(() => bump('frame')));

    // Never hold the page hostage to a signal that does not arrive.
    const failsafe = window.setTimeout(() => setDone(true), 4000);
    return () => {
      alive = false;
      window.clearTimeout(failsafe);
    };
  }, [reduced]);

  /* --- the bar creeps, then closes out once readiness lands --- */
  useGSAP(
    () => {
      const bar = barRef.current;
      if (!bar) return;

      if (reduced) {
        beginReveal();
        complete();
        return;
      }

      const tl = gsap.timeline();
      tl.fromTo('[data-preload-label]', { opacity: 0 }, { opacity: 1, duration: 0.6 })
        // Creeps to 88% on its own; the last stretch waits for real readiness,
        // so the bar never sits full while the page is still working.
        .fromTo(bar, { scaleX: 0 }, { scaleX: 0.88, duration: 2.2, ease: 'power2.out' }, 0.1);

      return () => tl.kill();
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  useGSAP(
    () => {
      if (!done || reduced || phase !== 'loading') return;
      const root = rootRef.current;
      const bar = barRef.current;
      if (!root || !bar) return;

      const tl = gsap.timeline({
        onComplete: () => {
          // The curtain hid the page while it settled; re-measure before handing
          // scroll control to ScrollTrigger.
          ScrollTrigger.refresh();
          complete();
        },
      });

      tl.to(bar, { scaleX: 1, duration: 0.45, ease: 'power2.inOut' })
        .to('[data-preload-fade]', { opacity: 0, duration: 0.3, ease: 'power2.in' }, '+=0.1')
        // Two panels part. `beginReveal` fires as they start, so the hero is
        // already animating underneath by the time they clear.
        .to(
          '[data-curtain]',
          {
            yPercent: (i) => (i === 0 ? -101 : 101),
            duration: 1.05,
            ease: 'power4.inOut',
            onStart: beginReveal,
          },
          '-=0.05',
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
      <div data-curtain className="absolute inset-x-0 top-0 h-1/2 bg-bone" />
      <div data-curtain className="absolute inset-x-0 bottom-0 h-1/2 bg-bone" />

      <div
        data-preload-fade
        className="absolute inset-0 flex flex-col items-center justify-center gap-5"
      >
        <span className="block h-px w-24 bg-ink/15">
          <span
            ref={barRef}
            className="block h-px w-full origin-left scale-x-0 bg-ink"
          />
        </span>
        <span
          data-preload-label
          className="font-mono text-[0.625rem] uppercase tracking-[0.22em] text-ink/60"
        >
          MahaInnovate
        </span>
      </div>
    </div>
  );
}
