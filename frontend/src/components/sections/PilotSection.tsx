'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap, SCRUB } from '@/lib/gsap';
import { SceneCanvas } from '@/components/three/SceneCanvas';
import { SceneFallback } from '@/components/three/SceneFallback';
import { LazyPilotCity } from '@/components/three/scenes';
import { Label } from '@/components/typography';
import { PRIMARY_PILOT } from '@/data/pilots';
import { PRIMARY_CHALLENGE } from '@/data/challenges';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { clamp, formatLakh } from '@/lib/utils';

/**
 * PILOT — the sandbox.
 *
 * The abstraction stops here: a stylised ward, and a solution deployed into it.
 * Each milestone changes the environment physically rather than changing a
 * label, so "the pilot ran" is something the reader watches rather than reads.
 */
export function PilotSection() {
  const rootRef = useRef<HTMLElement>(null);
  const sceneProgress = useRef(0);
  const [milestone, setMilestone] = useState(0);
  const reduced = usePrefersReducedMotion();

  const pilot = PRIMARY_PILOT;
  const milestones = pilot.milestones;

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      if (reduced) {
        sceneProgress.current = 1;
        setMilestone(milestones.length - 1);
        return;
      }

      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', () => build(6.5));
      mm.add('(max-width: 767px)', () => build(4.2));

      function build(length: number) {
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
              sceneProgress.current = self.progress;
              const next = clamp(
                Math.floor(self.progress * milestones.length),
                0,
                milestones.length - 1,
              );
              setMilestone((current) => (current === next ? current : next));
            },
          },
        });
        tl.to({}, { duration: 1 });
        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      }

      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [reduced, milestones.length] },
  );

  const current = milestones[milestone];

  return (
    <section
      ref={rootRef}
      id="pilot"
      aria-label="Pilot — a controlled sandbox deployment"
      className="relative h-[100svh] w-full overflow-hidden ground-ink"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <SceneCanvas
          camera={{ position: [-7, 9.5, 12], fov: 40 }}
          fallback={<SceneFallback variant="ward" />}
        >
          <LazyPilotCity progress={sceneProgress} />
        </SceneCanvas>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,10,9,0.8)_0%,rgba(10,10,9,0.1)_40%,rgba(10,10,9,0.94)_88%)]"
      />

      <div className="edge relative z-10 mx-auto flex h-full max-w-[110rem] flex-col justify-between pb-[clamp(4rem,10vh,7rem)] pt-[calc(var(--nav-safe)+clamp(0.75rem,3vh,2.5rem))]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <Label index="05">Pilot sandbox</Label>
            <h2 className="mt-5 max-w-[16ch] font-display text-display-sm font-medium uppercase leading-[0.9] text-ivory">
              {PRIMARY_CHALLENGE.title}
            </h2>
          </div>

          <dl className="grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-4">
            {[
              { k: 'Scope', v: PRIMARY_CHALLENGE.pilotScope },
              { k: 'Duration', v: PRIMARY_CHALLENGE.duration + ' days' },
              { k: 'Value', v: formatLakh(PRIMARY_CHALLENGE.budget) },
              { k: 'Department', v: PRIMARY_CHALLENGE.department },
            ].map((item) => (
              <div key={item.k}>
                <dt className="font-mono text-meta uppercase text-silver">{item.k}</dt>
                <dd className="mt-1.5 text-sm text-ivory">{item.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          {/* --- milestone rail --- */}
          <ol className="flex flex-wrap items-stretch gap-px border-t border-ivory/10 pt-6">
            {milestones.map((m, i) => (
              <li key={m.id} className="min-w-[7rem] flex-1">
                <div
                  aria-current={i === milestone ? 'step' : undefined}
                  className={
                    'flex items-baseline gap-3 border-t-2 pt-3 transition-colors duration-500 ' +
                    (i === milestone
                      ? 'border-saffron text-saffron'
                      : i < milestone
                        ? 'border-validated text-ivory/60'
                        : 'border-ivory/15 text-ivory/25')
                  }
                >
                  <span className="font-mono text-meta uppercase">{m.code}</span>
                  <span className="font-display text-lg uppercase leading-none">{m.title}</span>
                </div>
              </li>
            ))}
          </ol>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
            >
              <div>
                <p className="max-w-[52ch] text-pretty text-lg leading-relaxed text-ivory/85">
                  {current.description}
                </p>
                <p className="mt-4 font-mono text-meta uppercase text-silver">
                  Due {new Date(current.dueOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="border-l border-ivory/15 pl-6">
                <Label tone="accent">Evidence required before approval</Label>
                <ul className="mt-4 space-y-2">
                  {current.evidenceRequired.map((e) => (
                    <li key={e} className="flex items-baseline gap-3 text-sm text-ivory/80">
                      <span aria-hidden="true" className="h-px w-4 shrink-0 bg-saffron" />
                      {e}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 font-mono text-meta uppercase text-silver">
                  Releases {formatLakh(current.payment)} on approval
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
