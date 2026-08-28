'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from '@/lib/gsap';
import { Counter, Label, SplitText } from '@/components/typography';
import {
  COMPARABLE_PILOTS,
  CONFIDENCE,
  DESIGN_RECOMMENDATIONS,
  RISK_REGISTER,
  SENSITIVITY,
  SIMULATION_INPUTS,
  SIMULATOR_DISCLAIMER,
} from '@/data/simulation';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

/**
 * THE SIMULATOR — the centre of the product.
 *
 * The problem statement names "sandbox or pilot design" as an activity but says
 * nothing about how a department should decide what a good pilot looks like.
 * That is the gap this fills: before any money is committed, the proposed pilot
 * is compared against every comparable pilot the state has already run, and the
 * design is corrected from that evidence.
 *
 * What it deliberately does NOT do is predict whether the solution will work.
 * Market and funding signals predict company survival, not solution efficacy,
 * and no department could act on a prediction anyway. Everything here is
 * descriptive statistics over the cited prior pilots — which is both defensible
 * in an audit and, unlike a forecast, actually actionable.
 *
 * Three outputs, in the order a department needs them:
 *   design      — how this pilot should be built
 *   risk        — what has gone wrong before, as preconditions
 *   confidence  — how often this profile worked, with the caveats attached
 */

const TABS = [
  { id: 'design', label: 'Pilot design' },
  { id: 'risk', label: 'Risk register' },
  { id: 'confidence', label: 'Confidence' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const OUTCOME_TONE = {
  'Target met': 'text-validated',
  'Partially met': 'text-saffron',
  'Target missed': 'text-risk',
} as const;

/** What the pathway looks like with and without this stage. */
const DELTA = [
  {
    without: 'Pilot scope and duration set by whoever drafted the note',
    with: 'Set from the bands that comparable pilots actually needed',
  },
  {
    without: 'Known failure modes rediscovered at the department’s expense',
    with: 'Prior failures become preconditions before award',
  },
  {
    without: 'Milestones split evenly because that is the default',
    with: 'Weighted to where outcome risk actually sits',
  },
  {
    without: 'A pilot that misses target is written off',
    with: 'Partial-credit floor preserves the evidence it produced',
  },
];

export function SimulatorSection() {
  const rootRef = useRef<HTMLElement>(null);
  const [tab, setTab] = useState<TabId>('design');
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (!rootRef.current || reduced) return;

      // Inputs, then the retrieved corpus, then the output — the order the
      // simulation actually runs in.
      gsap.from('[data-sim-input]', {
        autoAlpha: 0,
        x: -16,
        duration: 0.5,
        stagger: 0.04,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-sim-inputs]', start: 'top 86%', once: true },
      });

      gsap.from('[data-sim-comparable]', {
        autoAlpha: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.07,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-sim-corpus]', start: 'top 84%', once: true },
      });

      gsap.fromTo(
        '[data-sim-similarity]',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.95,
          stagger: 0.06,
          ease: 'power3.out',
          scrollTrigger: { trigger: '[data-sim-corpus]', start: 'top 84%', once: true },
        },
      );

      gsap.from('[data-delta-row]', {
        autoAlpha: 0,
        y: 16,
        duration: 0.55,
        stagger: 0.07,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-delta]', start: 'top 88%', once: true },
      });
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={rootRef}
      id="simulate"
      aria-label="Pilot design and risk simulator"
      className="relative w-full ground-bone py-[clamp(5rem,12vh,9rem)]"
    >
      <div className="edge mx-auto max-w-[110rem]">
        {/* --- thesis --- */}
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
          <div>
            <Label index="05" tone="accent">
              The simulator · our addition to the pathway
            </Label>
            <SplitText
              as="h2"
              type="lines"
              className="mt-6 max-w-[16ch] font-display text-display-md font-normal uppercase leading-[0.9] text-ink"
            >
              Design the pilot before you fund it.
            </SplitText>
          </div>
          <p className="max-w-[46ch] text-pretty text-base leading-relaxed text-ink-muted">
            Maharashtra has already run pilots like this one. Every one of them — the successes and
            especially the failures — is evidence about how the next should be built. The simulator
            reads that record and returns a design, a risk register and a confidence band, each
            traceable to the pilots it came from.
          </p>
        </div>

        {/* --- the pipeline --- */}
        <div className="mt-16 grid gap-x-10 gap-y-12 lg:grid-cols-[0.8fr_1fr_1.35fr]">
          {/* 1 · inputs */}
          <div data-sim-inputs>
            <Label>01 · Inputs</Label>
            <dl className="mt-6 border-t border-ink/12">
              {SIMULATION_INPUTS.map((input) => (
                <div key={input.key} data-sim-input className="border-b border-ink/10 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="font-mono text-meta uppercase text-stone">{input.label}</dt>
                    <span className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-stone/70">
                      {input.origin}
                    </span>
                  </div>
                  <dd className="mt-1.5 text-sm leading-snug text-ink">{input.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* 2 · retrieval — the RAG step, made visible */}
          <div data-sim-corpus>
            <div className="flex items-baseline justify-between gap-3">
              <Label tone="accent">02 · Comparable pilots</Label>
              <span className="font-mono text-meta uppercase text-stone">
                {COMPARABLE_PILOTS.length} of 47
              </span>
            </div>

            <ul className="mt-6 border-t border-ink/12">
              {COMPARABLE_PILOTS.map((p) => (
                <li key={p.id} data-sim-comparable className="border-b border-ink/10 py-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-meta uppercase text-stone">{p.id}</span>
                    <span className={cn('font-mono text-meta uppercase', OUTCOME_TONE[p.outcome])}>
                      {p.outcome}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium leading-snug text-ink">{p.title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{p.note}</p>

                  <div className="mt-2.5 flex items-center gap-3">
                    <span className="h-px flex-1 bg-ink/10">
                      <span
                        data-sim-similarity
                        className="block h-px origin-left bg-saffron"
                        style={{ width: p.similarity * 100 + '%' }}
                      />
                    </span>
                    <span className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-stone">
                      {Math.round(p.similarity * 100)}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* 3 · output */}
          <div>
            <Label>03 · Output</Label>

            <div
              role="tablist"
              aria-label="Simulator output"
              className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-b border-ink/12 pb-3"
            >
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  type="button"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  data-cursor="view"
                  className={cn(
                    'relative py-1 font-mono text-meta uppercase transition-colors',
                    tab === t.id ? 'text-ink' : 'text-stone hover:text-ink',
                  )}
                >
                  {t.label}
                  {tab === t.id ? (
                    <motion.span
                      layoutId="sim-tab"
                      className="absolute -bottom-[13px] left-0 h-px w-full bg-saffron"
                      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                    />
                  ) : null}
                </button>
              ))}
            </div>

            <div className="min-h-[22rem]">
              <AnimatePresence mode="wait">
                {tab === 'design' ? (
                  <motion.dl
                    key="design"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-5"
                  >
                    {DESIGN_RECOMMENDATIONS.map((r) => (
                      <div key={r.field} className="border-b border-ink/10 py-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                          <dt className="font-display text-lg uppercase leading-none text-ink">
                            {r.field}
                          </dt>
                          <dd className="flex items-baseline gap-3 font-mono text-meta uppercase">
                            <span className={r.changed ? 'text-stone line-through' : 'text-stone'}>
                              {r.proposed}
                            </span>
                            {r.changed ? (
                              <>
                                <span aria-hidden="true" className="text-saffron">
                                  →
                                </span>
                                <span className="text-saffron">{r.recommended}</span>
                              </>
                            ) : (
                              <span className="text-validated">unchanged</span>
                            )}
                          </dd>
                        </div>
                        <dd className="mt-2 max-w-[56ch] text-sm leading-relaxed text-ink-muted">
                          {r.rationale}
                        </dd>
                        <dd className="mt-1.5 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-stone">
                          From {r.sources.join(' · ')}
                        </dd>
                      </div>
                    ))}
                  </motion.dl>
                ) : null}

                {tab === 'risk' ? (
                  <motion.ul
                    key="risk"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-5"
                  >
                    {RISK_REGISTER.map((r) => (
                      <li key={r.id} className="border-b border-ink/10 py-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                          <span className="font-mono text-meta uppercase text-stone">
                            {r.id} · {r.observedIn}
                          </span>
                          <span
                            className={cn(
                              'font-mono text-meta uppercase',
                              r.severity === 'High' ? 'text-risk' : 'text-saffron',
                            )}
                          >
                            {r.severity}
                          </span>
                        </div>
                        <p className="mt-2 max-w-[52ch] text-base leading-snug text-ink">{r.risk}</p>
                        <p className="mt-2.5 max-w-[56ch] border-l-2 border-saffron pl-4 text-sm leading-relaxed text-ink-muted">
                          <span className="font-mono text-meta uppercase text-saffron">
                            Precondition ·{' '}
                          </span>
                          {r.precondition}
                        </p>
                      </li>
                    ))}
                  </motion.ul>
                ) : null}

                {tab === 'confidence' ? (
                  <motion.div
                    key="confidence"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-5"
                  >
                    <div className="flex items-end gap-8 border-b border-ink/10 pb-5">
                      <p className="font-display text-display-sm font-normal leading-none text-ink">
                        <Counter value={CONFIDENCE.met} duration={1.2} />
                        <span className="text-stone"> / {CONFIDENCE.total}</span>
                      </p>
                      <p className="max-w-[28ch] pb-1 text-sm leading-relaxed text-ink-muted">
                        met their contracted target. {CONFIDENCE.partial} more partially met it.
                      </p>
                    </div>

                    <div className="mt-4 flex h-2 w-full overflow-hidden">
                      <span
                        className="block bg-validated"
                        style={{ width: (CONFIDENCE.met / CONFIDENCE.total) * 100 + '%' }}
                      />
                      <span
                        className="block bg-saffron"
                        style={{ width: (CONFIDENCE.partial / CONFIDENCE.total) * 100 + '%' }}
                      />
                      <span
                        className="block bg-risk"
                        style={{ width: (CONFIDENCE.missed / CONFIDENCE.total) * 100 + '%' }}
                      />
                    </div>

                    <p className="mt-4 max-w-[50ch] text-sm leading-relaxed text-ink">
                      {CONFIDENCE.statement}
                    </p>
                    <p className="mt-3 max-w-[50ch] border-l-2 border-ink/20 pl-4 text-sm leading-relaxed text-ink-muted">
                      {CONFIDENCE.caveat}
                    </p>

                    <Label className="mt-8 block">What most changed the outcome</Label>
                    <ol className="mt-3">
                      {SENSITIVITY.map((s) => (
                        <li
                          key={s.variable}
                          className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink/10 py-3"
                        >
                          <span className="text-sm font-medium text-ink">{s.variable}</span>
                          <span className="flex items-baseline gap-4 font-mono text-meta uppercase">
                            <span className="text-saffron">{s.detail}</span>
                            <span className="w-20 text-right text-stone">{s.effect}</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* --- the delta: what changes because this stage exists --- */}
        <div data-delta className="mt-20 border-t border-ink/12 pt-10">
          <Label>What changes</Label>
          <ul className="mt-6">
            {DELTA.map((d) => (
              <li
                key={d.with}
                data-delta-row
                className="grid gap-x-10 gap-y-1 border-b border-ink/10 py-4 md:grid-cols-2"
              >
                <span className="text-sm leading-relaxed text-stone line-through decoration-stone/40">
                  {d.without}
                </span>
                <span className="text-sm leading-relaxed text-ink">{d.with}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-10 max-w-[86ch] text-sm leading-relaxed text-ink-muted">
          <span className="font-mono text-meta uppercase text-saffron">Scope of this tool · </span>
          {SIMULATOR_DISCLAIMER}
        </p>
      </div>
    </section>
  );
}
