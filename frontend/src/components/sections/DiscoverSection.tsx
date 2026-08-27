'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap, SCRUB } from '@/lib/gsap';
import { SceneCanvas } from '@/components/three/SceneCanvas';
import { SceneFallback } from '@/components/three/SceneFallback';
import { LazyStartupNetwork } from '@/components/three/scenes';
import { Counter, Label } from '@/components/typography';
import { DISCOVERY_FUNNEL, SHORTLIST } from '@/data/startups';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn, clamp } from '@/lib/utils';

/**
 * DISCOVER — 2,481 startups narrowed to three, visibly.
 *
 * Each step of the funnel names the rule that produced it. A shortlist that
 * appears without its filtering rules is the thing departments cannot defend in
 * a procurement review, so the rule travels with the number here.
 */
export function DiscoverSection() {
  const rootRef = useRef<HTMLElement>(null);
  const sceneProgress = useRef(0);
  const [step, setStep] = useState(0);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      if (reduced) {
        sceneProgress.current = 1;
        setStep(DISCOVERY_FUNNEL.length - 1);
        return;
      }

      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', () => build(6));
      mm.add('(max-width: 767px)', () => build(4));

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
                Math.floor(self.progress * DISCOVERY_FUNNEL.length),
                0,
                DISCOVERY_FUNNEL.length - 1,
              );
              setStep((current) => (current === next ? current : next));
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
    { scope: rootRef, dependencies: [reduced] },
  );

  const current = DISCOVERY_FUNNEL[step];
  const atShortlist = step === DISCOVERY_FUNNEL.length - 1;

  return (
    <section
      ref={rootRef}
      id="discover"
      aria-label="Discover — finding candidate startups"
      className="relative h-[100svh] w-full overflow-hidden ground-abyss"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <SceneCanvas
          camera={{ position: [0, 0, 16], fov: 44 }}
          fallback={<SceneFallback variant="field" />}
        >
          <LazyStartupNetwork progress={sceneProgress} />
        </SceneCanvas>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(10,10,9,0.9)_0%,rgba(10,10,9,0.25)_45%,rgba(10,10,9,0.85)_100%)]"
      />

      <div className="edge relative z-10 mx-auto flex h-full max-w-[110rem] flex-col justify-between pb-[clamp(4rem,10vh,7rem)] pt-[calc(var(--nav-safe)+clamp(0.75rem,3vh,2.5rem))]">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div>
            <Label index="02">Discover</Label>
            <h2 className="mt-5 max-w-[18ch] font-display text-display-sm font-medium uppercase leading-[0.92] text-ivory">
              Every filter, on the record.
            </h2>
          </div>

          <ol className="hidden shrink-0 space-y-2 sm:block" aria-label="Discovery funnel">
            {DISCOVERY_FUNNEL.map((f, i) => (
              <li
                key={f.rule}
                className={cn(
                  'flex items-baseline gap-4 font-mono text-meta uppercase transition-colors duration-500',
                  i === step ? 'text-saffron' : i < step ? 'text-ivory/50' : 'text-ivory/20',
                )}
              >
                <span className="w-16 text-right tabular-nums">{f.count.toLocaleString('en-IN')}</span>
                <span aria-hidden="true" className="h-px w-5 bg-current opacity-40" />
                <span>{f.caption}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-10">
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={current.rule}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="block font-display text-display-md font-medium tabular-nums leading-none text-ivory">
                  <Counter value={current.count} grouped duration={0.9} />
                </span>
                <span className="mt-4 block font-mono text-meta-lg uppercase text-saffron">
                  {current.caption}
                </span>
                <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-silver">
                  Filter applied: {current.rule.toLowerCase()}.
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* The three finalists, revealed only once the field has actually resolved. */}
          <AnimatePresence>
            {atShortlist ? (
              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap gap-x-10 gap-y-5"
              >
                {SHORTLIST.map((s, i) => (
                  <motion.li
                    key={s.id}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * i, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    className="min-w-[9rem]"
                  >
                    <span className="block font-display text-2xl uppercase leading-none text-ivory">
                      {s.name}
                    </span>
                    <span className="mt-2 block font-mono text-meta uppercase text-saffron">
                      {s.matchScore}% match
                    </span>
                    <span className="mt-1 block font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver">
                      TRL {s.trl} · {s.governmentDeployments} gov deployments
                    </span>
                  </motion.li>
                ))}
              </motion.ul>
            ) : null}
          </AnimatePresence>
        </div>

        <p className="mt-6 max-w-[62ch] border-t border-ivory/10 pt-4 text-xs leading-relaxed text-silver">
          Match scores rank candidates for human review. They do not select a supplier, and no
          award follows from them.
        </p>
      </div>
    </section>
  );
}
