'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, SCRUB } from '@/lib/gsap';
import { SceneCanvas } from '@/components/three/SceneCanvas';
import { SceneFallback } from '@/components/three/SceneFallback';
import { LazyProblemNode } from '@/components/three/scenes';
import { Label } from '@/components/typography';
import { useIntro } from '@/components/motion/IntroProvider';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { DEMO_NOTICE } from '@/data/challenges';

/**
 * The hero: one continuous transformation from a fragmented problem into a
 * four-verb statement of what the platform does.
 *
 * Two things govern the implementation:
 *
 * 1. LAYOUT. The type block is sized against `svh` as well as `vw` and sits in
 *    a flex column that reserves the navigation height and the footer rail, so
 *    five stacked lines can never run under the fixed nav or off the bottom of
 *    a short viewport.
 *
 * 2. COST. Nothing in the scrubbed timeline animates `filter`. Blurring
 *    viewport-scale type forces a full re-rasterisation on every scroll frame,
 *    and that single choice was what made the first pass feel heavy. Depth is
 *    carried by transform and opacity — both composited — with the softening
 *    read coming from a static blurred backdrop layer instead.
 *
 * Entrance is gated on the preloader: the intro plays as the curtain lifts,
 * never while the page is still resolving fonts.
 */

const OPENING = ['Government', 'problems', 'need', 'better', 'solutions.'];
const VERBS = ['Find them.', 'Test them.', 'Prove them.', 'Scale them.'];

/** Horizontal step per line — deliberate asymmetry, not a centred block. */
const INDENT = [0, 7, 2.5, 12, 4.5];

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const openingRef = useRef<HTMLDivElement>(null);
  const verbsRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const sceneProgress = useRef(0);
  const reduced = usePrefersReducedMotion();
  const { canAnimate } = useIntro();

  /* ------------------------------------------------------------------ */
  /* Intro — plays once, as the curtain lifts                            */
  /* ------------------------------------------------------------------ */
  useGSAP(
    () => {
      if (!canAnimate) return;
      const root = rootRef.current;
      if (!root) return;

      if (reduced) {
        gsap.set('[data-hero-inner], [data-hero-chrome]', { yPercent: 0, opacity: 1 });
        sceneProgress.current = 1;
        return;
      }

      // The intro targets the INNER span of each line; the scroll timeline
      // targets the OUTER line box. Separate elements, so the two never write
      // to the same transform and fight each other.
      const tl = gsap.timeline({ delay: 0.12 });

      tl.fromTo(
        '[data-hero-inner]',
        { yPercent: 112 },
        { yPercent: 0, duration: 1.15, stagger: 0.075, ease: 'expo.out' },
      )
        .fromTo(
          '[data-hero-rule]',
          { scaleX: 0 },
          { scaleX: 1, duration: 1, ease: 'power3.inOut' },
          0.35,
        )
        .fromTo(
          '[data-hero-chrome]',
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.09, ease: 'power3.out' },
          0.5,
        );

      return () => tl.kill();
    },
    { scope: rootRef, dependencies: [canAnimate, reduced] },
  );

  /* ------------------------------------------------------------------ */
  /* Scroll choreography — pinned, scrubbed, transform-only              */
  /* ------------------------------------------------------------------ */
  useGSAP(
    () => {
      const root = rootRef.current;
      const opening = openingRef.current;
      const verbs = verbsRef.current;
      if (!root || !opening || !verbs || reduced) return;

      const lines = gsap.utils.toArray<HTMLElement>('[data-hero-line]', opening);
      const verbPanels = gsap.utils.toArray<HTMLElement>('[data-hero-verb]', verbs);

      const mm = gsap.matchMedia();

      mm.add(
        {
          desktop: '(min-width: 1024px)',
          tablet: '(min-width: 768px) and (max-width: 1023px)',
          mobile: '(max-width: 767px)',
        },
        (context) => {
          const { desktop, tablet } = context.conditions as Record<string, boolean>;
          // Mobile gets a materially shorter pinned run — the same beats, less
          // scrolling, rather than the desktop sequence squeezed down.
          const length = desktop ? 5.6 : tablet ? 4.4 : 3;

          const tl = gsap.timeline({
            defaults: { force3D: true },
            scrollTrigger: {
              trigger: root,
              start: 'top top',
              end: () => '+=' + window.innerHeight * length,
              pin: true,
              pinSpacing: true,
              scrub: SCRUB,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                // The 3D object assembles across the first ~55% of the pin,
                // reading from the same scroll the type reads from.
                sceneProgress.current = gsap.utils.clamp(0, 1, self.progress / 0.55);
              },
            },
          });

          gsap.set(verbPanels, { autoAlpha: 0, yPercent: 22, scale: 1.08 });

          /* --- Stage 1: the statement holds, dominant ------------------- */
          tl.to(cueRef.current, { autoAlpha: 0, duration: 0.4 }, 0.05);

          /* --- Stage 2: the statement fragments ------------------------- */
          tl.addLabel('fragment', 0.55);
          lines.forEach((line, i) => {
            const dir = i % 2 === 0 ? -1 : 1;
            const depth = (i - (lines.length - 1) / 2) / lines.length;
            tl.to(
              line,
              {
                xPercent: dir * (16 + i * 8),
                yPercent: depth * 46,
                rotate: dir * (1.2 + i * 0.7),
                // Receding scale + falling opacity reads as depth without the
                // per-frame raster cost of a blur.
                scale: 0.86 + Math.abs(depth) * 0.3,
                opacity: 0.32,
                duration: 1.15,
                ease: 'power2.in',
              },
              'fragment+=' + i * 0.06,
            );
          });

          /* --- Stage 3: fragments clear, the object takes the frame ----- */
          tl.addLabel('assemble', 1.85);
          tl.to(
            lines,
            {
              autoAlpha: 0,
              scale: 1.55,
              yPercent: (i) => (i - 2) * 90,
              duration: 0.95,
              stagger: 0.05,
              ease: 'power2.in',
            },
            'assemble',
          );
          tl.to('[data-hero-rule]', { scaleX: 0, duration: 0.5 }, 'assemble');

          /* --- Stages 4-7: the four verbs ------------------------------- */
          tl.addLabel('verbs', 3);
          verbPanels.forEach((panel, i) => {
            const at = 'verbs+=' + i * 1.1;
            tl.to(
              panel,
              { autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.6, ease: 'expo.out' },
              at,
            );
            // The last verb is the resting frame — it does not leave.
            if (i < verbPanels.length - 1) {
              tl.to(
                panel,
                { autoAlpha: 0, yPercent: -20, scale: 0.9, duration: 0.55, ease: 'power2.in' },
                at + '+=0.7',
              );
            }
          });

          tl.to({}, { duration: 0.55 }); // let the final frame settle before release

          return () => {
            tl.scrollTrigger?.kill();
            tl.kill();
          };
        },
      );

      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={rootRef}
      id="hero"
      className="relative h-[100svh] w-full overflow-hidden grain"
    >
      {/* --- spatial layer --- */}
      <div className="absolute inset-0" aria-hidden="true">
        <SceneCanvas
          alwaysRender
          rootMargin="60% 0px"
          camera={{ position: [0, 0, 12.5], fov: 40 }}
          fallback={<SceneFallback variant="orbit" />}
        >
          <LazyProblemNode progress={sceneProgress} />
        </SceneCanvas>
      </div>

      {/* Legibility scrim. Two layers: a centre vignette for the type, and a
          warm floor pool so the frame is never neutral black. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 120% 90% at 22% 45%, rgba(7,8,10,0.86) 0%, rgba(7,8,10,0.42) 42%, rgba(7,8,10,0.1) 70%), radial-gradient(ellipse 70% 60% at 82% 78%, rgba(232,118,43,0.13) 0%, rgba(7,8,10,0) 62%)',
        }}
      />

      {/*
        Layout column: navigation safe area at the top, footer rail at the
        bottom, type block centred in whatever is left. This is what keeps the
        hero clear of the fixed nav at every viewport height.
      */}
      <div className="relative z-10 flex h-full flex-col nav-safe pb-[clamp(1rem,3vh,2rem)]">
        <h1 className="sr-only">
          Government problems need better solutions. Find them, test them, prove them, scale them.
        </h1>

        {/* --- type stage --- */}
        <div className="relative min-h-0 flex-1">
          <div
            ref={openingRef}
            aria-hidden="true"
            className="edge absolute inset-0 mx-auto flex w-full max-w-[110rem] flex-col justify-center"
          >
            {OPENING.map((word, i) => (
              <div
                key={word}
                data-hero-line
                className="line-mask origin-left will-3d"
                style={{ marginLeft: `${INDENT[i]}%` }}
              >
                <span
                  data-hero-inner
                  className={
                    'block font-display text-hero-line font-medium uppercase ' +
                    (word === 'problems' ? 'text-ivory' : 'text-ivory/55')
                  }
                >
                  {word}
                </span>
              </div>
            ))}

            <span
              data-hero-rule
              aria-hidden="true"
              className="mt-[clamp(1rem,2.5vh,2rem)] block h-px w-[38%] origin-left bg-gradient-to-r from-saffron to-transparent"
            />
          </div>

          <div
            ref={verbsRef}
            aria-hidden="true"
            className="edge pointer-events-none absolute inset-0 mx-auto flex w-full max-w-[110rem] items-center"
          >
            {VERBS.map((verb, i) => (
              <div key={verb} data-hero-verb className="absolute inset-x-0 will-3d">
                <span className="block font-mono text-meta uppercase text-saffron">
                  {String(i + 1).padStart(2, '0')} / 04
                </span>
                <span className="mt-4 block font-display text-display-xl font-medium uppercase text-ivory">
                  {verb}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* --- footer rail --- */}
        <div className="edge mx-auto w-full max-w-[110rem] shrink-0">
          <div
            data-hero-chrome
            className="flex flex-wrap items-end justify-between gap-4 border-t border-ivory/10 pt-4"
          >
            <Label className="max-w-[38ch] leading-relaxed">{DEMO_NOTICE}</Label>
            <div ref={cueRef} className="flex items-center gap-3">
              <Label tone="accent">Scroll</Label>
              <span
                aria-hidden="true"
                className="block h-8 w-px bg-gradient-to-b from-saffron to-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
