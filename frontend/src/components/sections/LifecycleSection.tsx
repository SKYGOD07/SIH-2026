'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap, ScrollTrigger, SCRUB } from '@/lib/gsap';
import { SceneCanvas } from '@/components/three/SceneCanvas';
import { SceneFallback } from '@/components/three/SceneFallback';
import { LazyLifecycleOrbit } from '@/components/three/scenes';
import { Label } from '@/components/typography';
import { LIFECYCLE } from '@/data/lifecycle';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useLenis } from '@/lib/lenis/SmoothScrollProvider';
import { cn, clamp } from '@/lib/utils';

/**
 * The lifecycle mechanism.
 *
 * Scroll is the timeline controller: it drives the orbital scene through a
 * progress ref, and separately sets the active stage index in React state.
 * The 3D updates every frame; the DOM updates eight times. Keeping those two
 * rates apart is what stops the section re-rendering itself to a standstill.
 */
export function LifecycleSection() {
  const rootRef = useRef<HTMLElement>(null);
  const sceneProgress = useRef(0);
  const [active, setActive] = useState(0);
  const reduced = usePrefersReducedMotion();
  const lenis = useLenis();
  /** The live pinned trigger, so the stage register can seek within it. */
  const triggerRef = useRef<ScrollTrigger | null>(null);

  /**
   * Clicking a stage seeks the pinned scroll range rather than setting state:
   * with a scrubbed timeline, state set directly would be overwritten by the
   * next scroll frame, and the 3D would not follow.
   */
  const seekToStage = (index: number) => {
    const st = triggerRef.current;
    if (!st) {
      setActive(index);
      return;
    }
    const ratio = index / (LIFECYCLE.length - 1);
    const target = st.start + (st.end - st.start) * ratio;
    if (lenis) lenis.scrollTo(target, { duration: 1.1 });
    else window.scrollTo({ top: target, behavior: 'smooth' });
  };

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      if (reduced) {
        sceneProgress.current = 0.5;
        return;
      }

      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', () => build(6.5));
      mm.add('(max-width: 767px)', () => build(4));

      function build(length: number) {
        const st = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: () => '+=' + window.innerHeight * length,
            pin: true,
            scrub: SCRUB,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            // No snapping here: ScrollTrigger's snap drives the scroll position
            // itself, which fights Lenis for control of the same value. The
            // stage register below gives the reader discrete targets instead.
            onUpdate: (self) => {
              sceneProgress.current = self.progress;
              const next = clamp(
                Math.round(self.progress * (LIFECYCLE.length - 1)),
                0,
                LIFECYCLE.length - 1,
              );
              setActive((current) => (current === next ? current : next));
            },
          },
        });
        st.to({}, { duration: 1 });
        triggerRef.current = st.scrollTrigger ?? null;
        return () => {
          triggerRef.current = null;
          st.scrollTrigger?.kill();
          st.kill();
        };
      }

      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  const stage = LIFECYCLE[active];

  return (
    <section
      ref={rootRef}
      id="lifecycle"
      aria-label="The eight-stage procurement lifecycle"
      className="relative h-[100svh] w-full overflow-hidden ground-abyss"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <SceneCanvas
          camera={{ position: [0, 1.4, 11], fov: 42 }}
          fallback={<SceneFallback variant="orbit" />}
        >
          <LazyLifecycleOrbit progress={sceneProgress} />
        </SceneCanvas>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(7,8,10,0)_25%,rgba(7,8,10,0.82)_80%)]"
      />

      <div className="edge relative z-10 mx-auto flex h-full max-w-[110rem] flex-col justify-between pb-[clamp(4rem,10vh,7rem)] pt-[calc(var(--nav-safe)+clamp(0.75rem,3vh,2.5rem))]">
        <div className="flex items-start justify-between gap-8">
          <div>
            <Label index="—">The pathway</Label>
            <h2 className="mt-5 max-w-[16ch] font-display text-display-sm font-medium uppercase leading-[0.92] text-ivory">
              Eight stages. One record.
            </h2>
          </div>

          {/* The stage register: always visible, so the reader can see the whole
              pathway while looking at one part of it. */}
          <ol className="hidden shrink-0 gap-x-8 gap-y-1 sm:grid sm:grid-cols-2">
            {LIFECYCLE.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  aria-current={i === active ? 'step' : undefined}
                  className={cn(
                    'flex items-baseline gap-3 py-1 font-mono text-meta uppercase transition-colors duration-500',
                    i === active
                      ? 'text-saffron'
                      : i < active
                        ? 'text-ivory/55'
                        : 'text-ivory/25',
                  )}
                  onClick={() => seekToStage(i)}
                  data-cursor="go"
                >
                  <span>{s.index}</span>
                  <span>{s.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="max-w-[62rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-baseline gap-5">
                <span className="font-mono text-meta-lg text-saffron">{stage.index}</span>
                <h3 className="font-display text-display-sm font-medium uppercase leading-[0.9] text-ivory">
                  {stage.label}
                </h3>
              </div>
              <p className="mt-5 max-w-[52ch] text-pretty text-lg leading-relaxed text-ivory/80">
                {stage.summary}
              </p>

              <dl className="mt-8 grid gap-6 border-t border-ivory/10 pt-6 sm:grid-cols-3">
                <div>
                  <dt className="font-mono text-meta uppercase text-silver">Government</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-ivory/70">{stage.government}</dd>
                </div>
                <div>
                  <dt className="font-mono text-meta uppercase text-silver">Startup</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-ivory/70">{stage.startup}</dd>
                </div>
                <div>
                  <dt className="font-mono text-meta uppercase text-silver">Standard template</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-saffron">{stage.artifact}</dd>
                </div>
              </dl>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
