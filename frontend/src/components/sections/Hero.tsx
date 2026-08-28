'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, SCRUB } from '@/lib/gsap';
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
 * The hero reports its pin progress to the IntroProvider, so the navigation
 * capsule stays closed while the reader is on it and opens once it is past.
 *
 * Cost discipline: nothing in the scrubbed timeline animates `filter`. Depth is
 * carried by transform and opacity only, both composited.
 */

const OPENING = ['Every year,', 'governments', 'bet on startups', 'without', 'evidence.'];
const VERBS = ['Identify.', 'Simulate.', 'Prove.', 'Scale.'];

/** Stage label and one line of copy per verb, kept out of the markup. */
const VERB_LABELS = ['The problem', 'The design', 'The evidence', 'The reach'];

const VERB_COPY = [
  'Surface real departmental problems, and the startups that can actually solve them.',
  'Design the pilot from every comparable pilot the state has already run.',
  'Milestone contracts, measured outcomes, independent validation.',
  'What is proven in one ward transfers, with its evidence, to the next.',
];

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const openingRef = useRef<HTMLDivElement>(null);
  const verbsRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const sceneProgress = useRef(0);
  const reduced = usePrefersReducedMotion();
  const { canAnimate, setHeroComplete } = useIntro();

  /* --- Intro: plays once, as the curtain lifts ---------------------- */
  useGSAP(
    () => {
      if (!canAnimate) return;
      const root = rootRef.current;
      if (!root) return;

      /**
       * Reduced motion, or a tab that is not visible.
       *
       * A hidden tab never fires requestAnimationFrame, so a tween created now
       * would sit frozen on its from-state — the reader would return to an
       * apparently blank hero. Set the end state directly instead.
       */
      if (reduced || document.hidden) {
        gsap.set('[data-hero-inner]', { yPercent: 0 });
        gsap.set('[data-hero-chrome]', { opacity: 1, y: 0 });
        sceneProgress.current = reduced ? 1 : 0;
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
          const length = desktop ? 3.2 : tablet ? 2.6 : 1.9;

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
                // Drives the navigation capsule. Read from progress rather than
                // onLeave, which also fires during ScrollTrigger.refresh() and
                // would open the navbar while the reader is still on the hero.
                setHeroComplete(self.progress > 0.985);
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
          (i === 2 ? 'text-chalk' : 'text-chalk/70')
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
            'radial-gradient(ellipse 110% 85% at 70% 35%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 62%)',
        }}
      />

      {/*
        No canvas here. The 3D forms live in one page-wide layer (GlobalScene)
        so they travel continuously through every section instead of appearing
        and disappearing per screen.
      */}

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
            className="edge pointer-events-none absolute inset-0 z-[4] mx-auto flex w-full max-w-[110rem] items-center justify-center"
          >
            {VERBS.map((verb, i) => (
              <div
                key={verb}
                data-hero-verb
                className="edge absolute inset-x-0 mx-auto w-full max-w-[110rem] will-3d"
              >
                {/*
                  No card. Both reference sites set headline moments as bare type
                  on the ground — a glass panel around them turns a statement into
                  a widget, which is what made this read as an interface element
                  rather than as the argument.
                */}
                <span className="block font-mono text-meta uppercase text-signal">
                  {String(i + 1).padStart(2, '0')} — {VERB_LABELS[i]}
                </span>

                <span className="mt-5 block font-display text-display-xl font-normal text-chalk">
                  {verb}
                </span>

                <span className="mt-7 block max-w-[34ch] text-lg leading-snug text-chalk/55">
                  {VERB_COPY[i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer rail */}
        <div className="edge relative z-[5] mx-auto w-full max-w-[110rem] shrink-0">
          <div
            data-hero-chrome
            className="flex flex-wrap items-end justify-between gap-4 border-t border-chalk/15 pt-4"
          >
            <p className="max-w-[42ch] font-mono text-meta uppercase leading-relaxed text-chalk/50">
              {DEMO_NOTICE}
            </p>
            <div ref={cueRef} className="flex items-center gap-3">
              <span className="font-mono text-meta uppercase text-signal">Scroll</span>
              <span
                aria-hidden="true"
                className="block h-8 w-px bg-gradient-to-b from-signal to-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
