'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger, SCRUB } from '@/lib/gsap';
import { SceneCanvas } from '@/components/three/SceneCanvas';
import { SceneFallback } from '@/components/three/SceneFallback';
import { LazyProblemNode } from '@/components/three/scenes';
import { Label } from '@/components/typography';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { DEMO_NOTICE } from '@/data/challenges';

/**
 * The hero: one continuous transformation from a fragmented problem into a
 * four-verb statement of what the platform does.
 *
 * Everything here is a single pinned, scrubbed GSAP timeline. The words, the
 * camera and the 3D assembly all read from the same progress, which is why it
 * reads as one movement rather than seven animations that happen to follow each
 * other. Nothing fades in and out on its own schedule.
 */

const OPENING = ['Government', 'problems', 'need', 'better', 'solutions.'];
const VERBS = ['Find them.', 'Test them.', 'Prove them.', 'Scale them.'];

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const openingRef = useRef<HTMLDivElement>(null);
  const verbsRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const sceneProgress = useRef(0);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const root = rootRef.current;
      const opening = openingRef.current;
      const verbs = verbsRef.current;
      if (!root || !opening || !verbs) return;

      const openingWords = gsap.utils.toArray<HTMLElement>('[data-hero-word]', opening);
      const verbPanels = gsap.utils.toArray<HTMLElement>('[data-hero-verb]', verbs);

      if (reduced) {
        // Reduced motion keeps the story: the opening statement resolves to the
        // final verb, in place, with no pinning and no scrubbing.
        gsap.set(openingWords, { opacity: 1, y: 0, scale: 1, filter: 'none' });
        gsap.set(verbPanels, { opacity: 0 });
        gsap.set(verbPanels[verbPanels.length - 1], { opacity: 1, y: 0 });
        sceneProgress.current = 1;
        return;
      }

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
          const length = desktop ? 6.2 : tablet ? 5 : 3.4;
          const blur = desktop ? 12 : 5;

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
                // The 3D object assembles across the first ~55% of the pin,
                // reading from the same scroll the type reads from.
                sceneProgress.current = gsap.utils.clamp(0, 1, self.progress / 0.55);
              },
            },
          });

          gsap.set(verbPanels, { autoAlpha: 0, yPercent: 26, scale: 1.12 });

          /* --- Stage 1: the statement holds, dominant ------------------- */
          tl.addLabel('hold').to(cueRef.current, { autoAlpha: 0, duration: 0.4 }, 0.05);

          /* --- Stage 2: the statement fragments ------------------------- */
          tl.addLabel('fragment', 0.6);
          openingWords.forEach((word, i) => {
            const dir = i % 2 === 0 ? -1 : 1;
            const depth = (i - (openingWords.length - 1) / 2) / openingWords.length;
            tl.to(
              word,
              {
                xPercent: dir * (18 + i * 9),
                yPercent: depth * 40,
                rotate: dir * (1.5 + i * 0.8),
                scale: 0.9 + Math.abs(depth) * 0.35,
                filter: `blur(${blur * 0.5}px)`,
                duration: 1.1,
                ease: 'power2.in',
              },
              'fragment+=' + i * 0.06,
            );
          });

          /* --- Stage 3: fragments clear, the object takes the frame ----- */
          tl.addLabel('assemble', 1.9);
          tl.to(
            openingWords,
            {
              autoAlpha: 0,
              scale: 1.5,
              filter: `blur(${blur}px)`,
              duration: 0.9,
              stagger: 0.05,
              ease: 'power2.in',
            },
            'assemble',
          );

          /* --- Stages 4-7: the four verbs ------------------------------- */
          tl.addLabel('verbs', 3.1);
          verbPanels.forEach((panel, i) => {
            const at = 'verbs+=' + i * 1.15;
            tl.to(
              panel,
              {
                autoAlpha: 1,
                yPercent: 0,
                scale: 1,
                filter: 'blur(0px)',
                duration: 0.6,
                ease: 'expo.out',
              },
              at,
            );
            // The last verb is the resting frame — it does not leave.
            if (i < verbPanels.length - 1) {
              tl.to(
                panel,
                {
                  autoAlpha: 0,
                  yPercent: -22,
                  scale: 0.88,
                  filter: `blur(${blur * 0.6}px)`,
                  duration: 0.55,
                  ease: 'power2.in',
                },
                at + '+=0.72',
              );
            }
          });

          tl.to({}, { duration: 0.6 }); // let the final frame settle before release

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
      className="relative h-[100svh] w-full overflow-hidden bg-ink grain"
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

      {/* --- vignette keeps the type legible over the object --- */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,10,9,0.15)_0%,rgba(10,10,9,0.72)_78%)]"
      />

      {/* --- typographic layer --- */}
      <div className="relative z-10 flex h-full items-center">
        <h1 className="sr-only">
          Government problems need better solutions. Find them, test them, prove them, scale them.
        </h1>

        <div
          ref={openingRef}
          aria-hidden="true"
          className="edge mx-auto w-full max-w-[110rem]"
        >
          {OPENING.map((word, i) => (
            <div
              key={word}
              data-hero-word
              className="will-3d origin-left font-display text-display-lg font-medium uppercase leading-[0.84] text-ivory"
              style={{
                // Deliberate asymmetry: the statement steps across the frame
                // rather than sitting in a centred block.
                marginLeft: `${[0, 6, 2, 11, 4][i]}%`,
                opacity: word === 'problems' ? 1 : 0.62,
                color: word === 'problems' ? '#f5f2ec' : undefined,
              }}
            >
              {word}
            </div>
          ))}
        </div>

        <div
          ref={verbsRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center"
        >
          {VERBS.map((verb, i) => (
            <div
              key={verb}
              data-hero-verb
              className="edge absolute inset-x-0 mx-auto max-w-[110rem] will-3d"
            >
              <span className="block font-mono text-meta uppercase text-saffron">
                {String(i + 1).padStart(2, '0')} / 04
              </span>
              <span className="mt-4 block font-display text-display-xl font-medium uppercase leading-[0.82] text-ivory">
                {verb}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* --- footer rail --- */}
      <div className="edge absolute inset-x-0 bottom-0 z-10 mx-auto max-w-[110rem] pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-ivory/10 pt-4">
          <Label className="max-w-[38ch] leading-relaxed">{DEMO_NOTICE}</Label>
          <div ref={cueRef} className="flex items-center gap-3">
            <Label tone="accent">Scroll</Label>
            <span aria-hidden="true" className="block h-8 w-px bg-gradient-to-b from-saffron to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
