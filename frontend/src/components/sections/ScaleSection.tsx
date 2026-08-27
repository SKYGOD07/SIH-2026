'use client';

import { useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap, SCRUB } from '@/lib/gsap';
import { Counter, Label } from '@/components/typography';
import {
  DISTRICTS,
  INTERIOR_LINES,
  MAHARASHTRA_PATH,
  MAP_VIEWBOX,
  NETWORK_EDGES,
  SCALE_STEPS,
  getDistrict,
} from '@/data/maharashtra';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { clamp, cn } from '@/lib/utils';

/**
 * SCALE — one proven pilot, offered outward across Maharashtra.
 *
 * SVG rather than WebGL: the map is line work and precise point positions, which
 * is exactly what vector geometry is for, and it costs a fraction of a third
 * canvas on the page. The state outline is a deliberate abstraction, not a
 * survey boundary.
 */
export function ScaleSection() {
  const rootRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const reduced = usePrefersReducedMotion();

  const active = useMemo(() => new Set<string>(SCALE_STEPS[step].districts), [step]);

  // Only edges whose endpoints are both live are drawn.
  const liveEdges = useMemo(
    () =>
      NETWORK_EDGES.filter(([a, b]) => active.has(a) && active.has(b)).map(([a, b]) => {
        const from = getDistrict(a);
        const to = getDistrict(b);
        return from && to ? { id: a + '-' + b, x1: from.x, y1: from.y, x2: to.x, y2: to.y } : null;
      }).filter((e): e is NonNullable<typeof e> => Boolean(e)),
    [active],
  );

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      if (reduced) {
        setStep(SCALE_STEPS.length - 1);
        gsap.set('[data-map-outline], [data-map-interior]', { strokeDashoffset: 0 });
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
              const next = clamp(
                Math.floor(self.progress * SCALE_STEPS.length),
                0,
                SCALE_STEPS.length - 1,
              );
              setStep((current) => (current === next ? current : next));
            },
          },
        });

        // The state draws itself before anything is placed on it.
        tl.fromTo(
          '[data-map-outline]',
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' },
          0,
        );
        tl.fromTo(
          '[data-map-interior]',
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 1, stagger: 0.08, ease: 'power2.out' },
          0.7,
        );
        tl.to({}, { duration: 3 });

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      }

      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  const current = SCALE_STEPS[step];
  const final = step === SCALE_STEPS.length - 1;

  return (
    <section
      ref={rootRef}
      id="scale"
      aria-label="Scale across Maharashtra"
      className="relative h-[100svh] w-full overflow-hidden ground-abyss"
    >
      {/* --- the map --- */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox={MAP_VIEWBOX}
          className="h-[78%] w-auto max-w-[92%] opacity-95"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="scale-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e4762a" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#e4762a" stopOpacity="0" />
            </radialGradient>
          </defs>

          {INTERIOR_LINES.map((d) => (
            <path
              key={d}
              data-map-interior
              d={d}
              fill="none"
              stroke="#f5f2ec"
              strokeOpacity="0.1"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1}
            />
          ))}

          <path
            data-map-outline
            d={MAHARASHTRA_PATH}
            fill="rgba(245,242,236,0.02)"
            stroke="#a9a69c"
            strokeOpacity="0.55"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1}
            strokeLinejoin="round"
          />

          {/* network edges between live points */}
          <AnimatePresence>
            {liveEdges.map((e) => (
              <motion.line
                key={e.id}
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                stroke="#e4762a"
                strokeOpacity="0.42"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </AnimatePresence>

          {/* district points */}
          {DISTRICTS.map((d) => {
            const live = active.has(d.id);
            const origin = d.id === 'pune';
            return (
              <g key={d.id}>
                {live ? (
                  <motion.circle
                    cx={d.x}
                    cy={d.y}
                    r={origin ? 46 : 26}
                    fill="url(#scale-glow)"
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: `${d.x}px ${d.y}px` }}
                  />
                ) : null}
                <motion.circle
                  cx={d.x}
                  cy={d.y}
                  animate={{
                    r: live ? (origin ? 7 : 5) : 2.5,
                    fillOpacity: live ? 1 : 0.22,
                  }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  fill={live ? '#e4762a' : '#a9a69c'}
                />
                {live ? (
                  <motion.text
                    x={d.x + 12}
                    y={d.y + 4}
                    initial={{ opacity: 0, x: d.x + 4 }}
                    animate={{ opacity: 1, x: d.x + 12 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="font-mono"
                    fontSize="13"
                    letterSpacing="1.6"
                    fill="#f5f2ec"
                    fillOpacity="0.75"
                  >
                    {d.label.toUpperCase()}
                  </motion.text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,10,9,0.82)_0%,rgba(10,10,9,0)_28%,rgba(10,10,9,0)_62%,rgba(10,10,9,0.9)_100%)]"
      />

      <div className="edge relative z-10 mx-auto flex h-full max-w-[110rem] flex-col justify-between pb-[clamp(4rem,10vh,7rem)] pt-[calc(var(--nav-safe)+clamp(0.75rem,3vh,2.5rem))]">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div>
            <Label index="08">Scale</Label>
            <h2 className="mt-5 max-w-[18ch] font-display text-display-sm font-medium uppercase leading-[0.9] text-ivory">
              Prove once. Scale where it fits.
            </h2>
          </div>

          <ol className="hidden shrink-0 space-y-1.5 sm:block">
            {SCALE_STEPS.map((s, i) => (
              <li
                key={s.label + s.count}
                className={cn(
                  'flex items-baseline gap-4 font-mono text-meta uppercase transition-colors duration-500',
                  i === step ? 'text-saffron' : i < step ? 'text-ivory/50' : 'text-ivory/20',
                )}
              >
                <span className="w-6 text-right tabular-nums">{s.count}</span>
                <span>{s.unit}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.label + current.count}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-display text-display-md font-medium leading-none text-ivory">
                <Counter value={current.count} duration={0.8} />
              </p>
              <p className="mt-3 font-mono text-meta-lg uppercase text-saffron">{current.unit}</p>
              <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-silver">{current.note}</p>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {final ? (
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-[36ch] text-pretty text-sm leading-relaxed text-silver"
              >
                Where it fits is a judgement each department makes on its own conditions. What
                transfers is the evidence and the pathway — not an obligation to adopt.
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
