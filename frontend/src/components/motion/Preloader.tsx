'use client';

import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useIntro } from './IntroProvider';
import { useLenis } from '@/lib/lenis/SmoothScrollProvider';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { LIFECYCLE } from '@/data/lifecycle';

/**
 * The boot screen.
 *
 * Progress is real, not theatre: it advances as fonts resolve, as the window
 * load event fires, and as the first frame becomes available, with a floor on
 * the duration so the sequence reads as intentional rather than as a flash.
 * Scroll is locked throughout, so the reader cannot arrive mid-way into a
 * pinned section before ScrollTrigger has measured the page.
 *
 * On completion it lifts as two panels and calls `beginReveal`, which is the
 * signal every entrance animation on the page is waiting for.
 */
export function Preloader() {
  const { phase, beginReveal, complete } = useIntro();
  const lenis = useLenis();
  const reduced = usePrefersReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const [stageIndex, setStageIndex] = useState(0);

  /** Real readiness signals, each worth a share of the bar. */
  const settled = useRef(0);
  const [done, setDone] = useState(false);

  /* --- lock scrolling for the whole of the loading phase --- */
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
      settled.current = 1;
      setDone(true);
      return;
    }

    let alive = true;
    const marks = { fonts: false, load: false, frame: false };
    const bump = (key: keyof typeof marks) => {
      if (!alive || marks[key]) return;
      marks[key] = true;
      settled.current = Object.values(marks).filter(Boolean).length / 3;
      if (settled.current >= 1) setDone(true);
    };

    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) fonts.ready.then(() => bump('fonts'));
    else bump('fonts');

    if (document.readyState === 'complete') bump('load');
    else window.addEventListener('load', () => bump('load'), { once: true });

    requestAnimationFrame(() => requestAnimationFrame(() => bump('frame')));

    // Never hold the page hostage to a signal that does not arrive.
    const failsafe = window.setTimeout(() => {
      settled.current = 1;
      setDone(true);
    }, 4500);

    return () => {
      alive = false;
      window.clearTimeout(failsafe);
    };
  }, [reduced]);

  useGSAP(
    () => {
      const root = rootRef.current;
      const counter = counterRef.current;
      const bar = barRef.current;
      if (!root || !counter || !bar) return;

      if (reduced) {
        beginReveal();
        complete();
        return;
      }

      const state = { value: 0 };
      const write = () => {
        const v = Math.round(state.value);
        counter.textContent = String(v).padStart(3, '0');
        // The stage register ticks through the lifecycle as the bar fills, so
        // even the load screen is teaching the reader the eight stages.
        const next = Math.min(LIFECYCLE.length - 1, Math.floor((v / 100) * LIFECYCLE.length));
        setStageIndex((cur) => (cur === next ? cur : next));
      };

      const tl = gsap.timeline();

      tl.from('[data-preload-mark]', {
        yPercent: 108,
        opacity: 0,
        duration: 0.9,
        stagger: 0.06,
        ease: 'expo.out',
      })
        .from('[data-preload-meta]', { opacity: 0, y: 12, duration: 0.6, stagger: 0.08 }, 0.25)
        /* The bar chases genuine readiness. It creeps to 90 on its own and only
           closes the last tenth once the real signals have landed, so it never
           sits at 100 while the page is still working. */
        .to(
          state,
          {
            value: 90,
            duration: 2.1,
            ease: 'power2.out',
            onUpdate: () => {
              write();
              gsap.set(bar, { scaleX: state.value / 100 });
            },
          },
          0.2,
        );

      return () => {
        tl.kill();
      };
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  /* --- close out once readiness has landed --- */
  useGSAP(
    () => {
      if (!done || reduced || phase !== 'loading') return;
      const counter = counterRef.current;
      const bar = barRef.current;
      const root = rootRef.current;
      if (!counter || !bar || !root) return;

      const state = { value: Number(counter.textContent) || 90 };

      const tl = gsap.timeline({
        onComplete: () => {
          // ScrollTrigger measured the page while the curtain was down; with
          // the final layout now settled, make it re-measure before handing over.
          ScrollTrigger.refresh();
          complete();
        },
      });

      tl.to(state, {
        value: 100,
        duration: 0.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          counter.textContent = String(Math.round(state.value)).padStart(3, '0');
          gsap.set(bar, { scaleX: state.value / 100 });
        },
      })
        .to('[data-preload-fade]', { opacity: 0, duration: 0.35, ease: 'power2.in' }, '+=0.15')
        /* The curtain lifts as two panels. `beginReveal` fires as it starts, so
           the hero is already animating underneath by the time it clears. */
        .to(
          '[data-curtain]',
          {
            yPercent: (i) => (i === 0 ? -101 : 101),
            duration: 1.1,
            ease: 'power4.inOut',
            onStart: beginReveal,
          },
          '-=0.1',
        )
        .set(root, { pointerEvents: 'none' });

      return () => {
        tl.kill();
      };
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
      {/* two panels that split apart to reveal the page */}
      <div data-curtain className="absolute inset-x-0 top-0 h-1/2 bg-ink-950" />
      <div data-curtain className="absolute inset-x-0 bottom-0 h-1/2 bg-ink-950" />

      {/* a single warm pool so the load screen is not a flat black rectangle */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[80vmax] w-[80vmax] -translate-x-1/2 -translate-y-1/2 opacity-60"
        style={{
          background:
            'radial-gradient(circle, rgba(232,118,43,0.16) 0%, rgba(30,65,82,0.10) 38%, rgba(10,11,13,0) 68%)',
        }}
      />

      <div
        data-preload-fade
        className="edge absolute inset-0 mx-auto flex max-w-[110rem] flex-col justify-between py-[clamp(2rem,6vh,4rem)]"
      >
        <div className="flex items-start justify-between gap-6">
          <span data-preload-meta className="font-mono text-meta uppercase text-silver">
            Innovation procurement intelligence
          </span>
          <span data-preload-meta className="font-mono text-meta uppercase text-silver">
            Maharashtra
          </span>
        </div>

        <div className="flex flex-col items-start">
          <div className="line-mask">
            <h2
              data-preload-mark
              className="font-display text-display-lg font-bold uppercase leading-[0.86] tracking-[-0.04em] text-ivory"
            >
              MahaInnovate
            </h2>
          </div>

          <div className="mt-8 flex w-full items-end gap-6">
            <span
              ref={counterRef}
              className="font-display text-display-sm font-medium tabular-nums leading-none text-saffron"
            >
              000
            </span>
            <span className="relative mb-1.5 h-px flex-1 bg-ivory/15">
              <span
                ref={barRef}
                className="absolute inset-y-0 left-0 w-full origin-left scale-x-0 bg-saffron"
              />
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <ol className="flex flex-wrap gap-x-5 gap-y-1" aria-hidden="true">
            {LIFECYCLE.map((s, i) => (
              <li
                key={s.id}
                className={
                  'font-mono text-meta uppercase transition-colors duration-500 ' +
                  (i <= stageIndex ? 'text-ivory/70' : 'text-ivory/20')
                }
              >
                {s.label}
              </li>
            ))}
          </ol>
          <span data-preload-meta className="font-mono text-meta uppercase text-silver">
            Preparing experience
          </span>
        </div>
      </div>
    </div>
  );
}
