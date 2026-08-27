'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, SCRUB } from '@/lib/gsap';
import { WordCloud, type WordCloudHandle, Label } from '@/components/typography';
import { LIFECYCLE_WORDS } from '@/data/lifecycle';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * "A problem exists." — the eight things a department has to do, scattered,
 * pulled into one point, and named.
 *
 * The convergence is measured rather than authored: each word's travel is the
 * live delta between its own rect and the container centre, recalculated on
 * every ScrollTrigger refresh. That keeps the composition correct at any
 * viewport instead of only at the width it was designed on.
 */
export function ProblemStatement() {
  const rootRef = useRef<HTMLElement>(null);
  const cloudRef = useRef<WordCloudHandle>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const resolveRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<SVGSVGElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const root = rootRef.current;
      const cloud = cloudRef.current;
      const heading = headingRef.current;
      const resolve = resolveRef.current;
      if (!root || !cloud || !heading || !resolve) return;

      const words = cloud.words;
      const container = cloud.container;
      if (!container || words.length === 0) return;

      if (reduced) {
        gsap.set(resolve, { autoAlpha: 1 });
        return;
      }

      // Travel for one word: from where it is now to the centre of the field.
      const travel = (el: HTMLElement, axis: 'x' | 'y') => () => {
        const box = container.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        return axis === 'x'
          ? box.left + box.width / 2 - (r.left + r.width / 2)
          : box.top + box.height / 2 - (r.top + r.height / 2);
      };

      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', () => runTimeline(4));
      mm.add('(max-width: 767px)', () => runTimeline(2.6));

      function runTimeline(length: number) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: () => '+=' + window.innerHeight * length,
            pin: true,
            scrub: SCRUB,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // The scattered words drift before anything pulls them.
        tl.to(words, { opacity: 0.85, duration: 0.4, stagger: { amount: 0.4, from: 'random' } }, 0);

        // Connections appear as the words start moving — the network forms
        // during the convergence, not after it.
        tl.fromTo(
          linesRef.current,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.5 },
          0.55,
        );
        // `pathLength={1}` normalises every thread, so one dashoffset tween
        // draws them all regardless of their actual length — no Club plugin needed.
        tl.fromTo(
          '[data-thread]',
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 1.4, stagger: 0.03, ease: 'power2.inOut' },
          0.6,
        );

        tl.to(
          words,
          {
            x: (i, target) => travel(target as HTMLElement, 'x')(),
            y: (i, target) => travel(target as HTMLElement, 'y')(),
            scale: 0.42,
            opacity: 0.32,
            duration: 1.6,
            ease: 'power2.inOut',
            stagger: { amount: 0.5, from: 'edges' },
          },
          0.7,
        );

        tl.to(heading, { autoAlpha: 0, scale: 0.94, filter: 'blur(6px)', duration: 0.6 }, 1.5);
        tl.to(words, { opacity: 0, scale: 0.1, duration: 0.5 }, 2.1);
        tl.to(linesRef.current, { autoAlpha: 0, duration: 0.4 }, 2.1);
        tl.fromTo(
          resolve,
          { autoAlpha: 0, scale: 1.18, filter: 'blur(10px)' },
          { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 0.9, ease: 'expo.out' },
          2.35,
        );
        tl.to({}, { duration: 0.6 });

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      }

      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={rootRef}
      id="problem"
      aria-label="A problem exists"
      className="relative h-[100svh] w-full overflow-hidden bg-ink"
    >
      <div className="edge absolute inset-x-0 top-0 z-20 mx-auto max-w-[110rem] pt-[clamp(5.5rem,11vh,8rem)]">
        <Label index="00">The problem before the platform</Label>
      </div>

      {/* Threads that form as the words converge. */}
      <svg
        ref={linesRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {LIFECYCLE_WORDS.map((word, i) => {
          const a = i * 2.39996;
          const r = 34;
          const x = 50 + Math.cos(a) * r * 1.4;
          const y = 50 + Math.sin(a) * r;
          return (
            <line
              key={word}
              data-thread
              x1={x}
              y1={y}
              x2="50"
              y2="50"
              stroke="#e4762a"
              strokeOpacity="0.4"
              strokeWidth="0.12"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              strokeDasharray={1}
            />
          );
        })}
      </svg>

      <div className="absolute inset-0">
        <WordCloud ref={cloudRef} words={LIFECYCLE_WORDS} spread={0.34} seed={19} />
      </div>

      <div className="relative z-10 flex h-full items-center justify-center">
        <div ref={headingRef} className="edge text-center">
          <h2 className="font-display text-display-lg font-medium uppercase leading-[0.86] text-ivory">
            A problem
            <br />
            exists.
          </h2>
          <p className="mx-auto mt-8 max-w-[46ch] text-pretty text-base leading-relaxed text-silver">
            Eight things have to happen before an innovative solution can legally reach a
            department at scale. Today they happen in eight disconnected places, or they do not
            happen at all.
          </p>
        </div>

        <div
          ref={resolveRef}
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center opacity-0"
        >
          <span className="font-mono text-meta uppercase text-saffron">The pathway</span>
          <h2 className="mt-6 text-center font-display text-display-lg font-medium uppercase leading-[0.86] text-ivory">
            One system.
          </h2>
        </div>
      </div>
    </section>
  );
}
