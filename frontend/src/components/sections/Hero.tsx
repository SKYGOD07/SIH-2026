'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, SCRUB } from '@/lib/gsap';
import { SceneCanvas } from '@/components/three/SceneCanvas';
import { LazyProblemForms } from '@/components/three/scenes';
import { useIntro } from '@/components/motion/IntroProvider';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { DEMO_NOTICE } from '@/data/challenges';

/**
 * The hero.
 *
 * Redesigned to convey the actual PS idea — not generic "government problems"
 * messaging. The 3D layer is atmospheric backdrop only (z-1), text always
 * on top (z-3+). This prevents the text overlap bug that occurred when lines
 * were interleaved with the 3D canvas at different z-indices.
 *
 * The hero also signals `completeHero()` when its scroll animation finishes,
 * so the Nav can defer its entrance for an immersive opening.
 *
 * Cost discipline: nothing in the scrubbed timeline animates `filter`. Depth is
 * carried by transform and opacity only, both composited.
 */

const OPENING = ['Every year,', 'governments', 'bet on startups', 'without', 'evidence.'];
const VERBS = ['Identify.', 'Simulate.', 'Prove.', 'Scale.'];

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const openingRef = useRef<HTMLDivElement>(null);
  const verbsRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const sceneProgress = useRef(0);
  const reduced = usePrefersReducedMotion();
  const { canAnimate, completeHero } = useIntro();

  /* --- Intro: plays once, as the curtain lifts ---------------------- */
  useGSAP(
    () => {
      if (!canAnimate) return;
      const root = rootRef.current;
      if (!root) return;

      if (reduced) {
        gsap.set('[data-hero-inner], [data-hero-chrome]', { yPercent: 0, opacity: 1 });
        sceneProgress.current = 1;
        completeHero();
        return;
      }

      // The intro targets the INNER span of each line; the scroll timeline
      // targets the OUTER line box. Separate elements, so the two never write
      // to the same transform.
      const tl = gsap.timeline({ delay: 0.1 });
      tl.fromTo(
        '[data-hero-inner]',
        { yPercent: 112 },
        { yPercent: 0, duration: 1.25, stagger: 0.08, ease: 'expo.out' },
      ).fromTo(
        '[data-hero-chrome]',
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' },
        0.55,
      );

      return () => tl.kill();
    },
    { scope: rootRef, dependencies: [canAnimate, reduced] },
  );

  /* --- Scroll choreography: pinned, scrubbed, transform-only -------- */
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
          const length = desktop ? 5.6 : tablet ? 4.4 : 3;

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: root,
              start: 'top top',
              end: () => '+=' + window.innerHeight * length,
              pin: true,
              scrub: SCRUB,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                sceneProgress.current = gsap.utils.clamp(0, 1, self.progress / 0.55);
              },
              onLeave: () => {
                completeHero();
              },
            },
          });

          gsap.set(verbPanels, { autoAlpha: 0, yPercent: 20, scale: 1.06 });

          tl.to(cueRef.current, { autoAlpha: 0, duration: 0.4 }, 0.05);

          /*
           * Lines separate — controlled fade-out, NO rotation to prevent overlap.
           * Each line moves in its own direction but stays legible and non-colliding.
           */
          tl.addLabel('fragment', 0.55);
          lines.forEach((line, i) => {
            const dir = i % 2 === 0 ? -1 : 1;
            tl.to(
              line,
              {
                xPercent: dir * (10 + i * 5),
                yPercent: (i - 2) * 18,
                scale: 0.92,
                opacity: 0,
                duration: 1.0,
                ease: 'power2.in',
              },
              'fragment+=' + i * 0.06,
            );
          });

          /* Lines clear; the object owns the frame. */
          tl.addLabel('assemble', 1.7);

          /* The four verbs — the pipeline stages. Each verb fully exits
           * before the next enters to prevent overlap. */
          tl.addLabel('verbs', 2.6);
          verbPanels.forEach((panel, i) => {
            const at = 'verbs+=' + i * 1.4;
            tl.to(panel, { autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.6, ease: 'expo.out' }, at);
            if (i < verbPanels.length - 1) {
              tl.to(
                panel,
                { autoAlpha: 0, yPercent: -24, scale: 0.9, duration: 0.6, ease: 'power2.in' },
                at + '+=0.75',
              );
            }
          });

          tl.to({}, { duration: 0.55 });

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

  /** One line of the opening statement. Text always above 3D. */
  const line = (word: string, i: number) => (
    <div
      key={word}
      data-hero-line
      className="line-mask origin-left will-3d"
      style={{
        marginLeft: `${[0, 4, 1, 8, 2][i]}%`,
        position: 'relative',
        zIndex: 3,
      }}
    >
      <span
        data-hero-inner
        className={
          'block font-display text-hero-line font-normal uppercase ' +
          (i === 2 ? 'text-ink' : 'text-ink/70')
        }
      >
        {word}
      </span>
    </div>
  );

  return (
    <section
      ref={rootRef}
      id="hero"
      className="relative h-[100svh] w-full overflow-hidden grain"
    >
      {/* Soft warm ground — a wash, not a flat fill. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 100% 80% at 72% 30%, #F6F2EA 0%, #EDE7DD 46%, #E4DCCE 100%)',
        }}
      />

      {/* Spatial layer — BEHIND text (z-1). Atmospheric only, never fighting type. */}
      <div className="absolute inset-0 z-[1]" aria-hidden="true">
        <SceneCanvas
          alwaysRender
          rootMargin="60% 0px"
          camera={{ position: [0, 0, 11], fov: 42 }}
        >
          <LazyProblemForms progress={sceneProgress} />
        </SceneCanvas>
      </div>

      <div className="relative z-[3] flex h-full flex-col pb-[clamp(1rem,3vh,2rem)]">
        <h1 className="sr-only">
          Every year, governments bet on startups without evidence. We help them identify, simulate, prove, and scale.
        </h1>

        <div className="relative min-h-0 flex-1">
          {/* Type layer — always above 3D. */}
          <div
            ref={openingRef}
            aria-hidden="true"
            className="edge pointer-events-none absolute inset-0 mx-auto flex w-full max-w-[110rem] flex-col justify-center gap-1"
            style={{ zIndex: 3 }}
          >
            {OPENING.map(line)}
          </div>

          <div
            ref={verbsRef}
            aria-hidden="true"
            className="edge pointer-events-none absolute inset-0 z-[4] mx-auto flex w-full max-w-[110rem] items-center"
          >
            {VERBS.map((verb, i) => (
              <div key={verb} data-hero-verb className="absolute inset-x-0 will-3d">
                <span className="block font-mono text-meta uppercase text-saffron">
                  {String(i + 1).padStart(2, '0')} / 04
                </span>
                <span className="mt-4 block font-display text-display-xl font-normal uppercase text-ink">
                  {verb}
                </span>
                <span className="mt-3 block max-w-[32ch] text-sm leading-relaxed text-ink-muted">
                  {[
                    'Surface real departmental problems. Match them to startups that can solve them.',
                    'Run the pilot through a RAG-enabled sandbox. Every recommendation traceable to evidence.',
                    'Milestone-based contracts. KPIs measured, not promised. Independent validation.',
                    'What works in one ward works statewide. Evidence-based procurement at scale.',
                  ][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer rail */}
        <div className="edge relative z-[5] mx-auto w-full max-w-[110rem] shrink-0">
          <div
            data-hero-chrome
            className="flex flex-wrap items-end justify-between gap-4 border-t border-ink/12 pt-4"
          >
            <p className="max-w-[42ch] font-mono text-meta uppercase leading-relaxed text-stone">
              {DEMO_NOTICE}
            </p>
            <div ref={cueRef} className="flex items-center gap-3">
              <span className="font-mono text-meta uppercase text-saffron">Scroll</span>
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
