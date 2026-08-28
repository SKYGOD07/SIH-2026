'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from '@/lib/gsap';
import { Label, SplitText } from '@/components/typography';
import { PATHWAY, TEMPLATES, INTEGRATIONS } from '@/data/pathway';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

/**
 * The end-to-end mechanism, in one section.
 *
 * The problem statement names ten activities and seven standard templates. An
 * earlier build gave each of those its own pinned, full-height screen, which
 * made the page enormous without making the coverage any clearer. This is the
 * same content as one register the reader can scan in a single view and open
 * where they care — which is also how a department would actually read it.
 *
 * Not pinned. The whole section costs roughly one screen of scroll.
 */
export function PathwaySection() {
  const rootRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(4); // opens on Simulate, the new stage
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (!rootRef.current || reduced) return;

      gsap.from('[data-stage-row]', {
        autoAlpha: 0,
        x: -14,
        duration: 0.5,
        stagger: 0.04,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-stages]', start: 'top 84%', once: true },
      });

      gsap.from('[data-template]', {
        autoAlpha: 0,
        y: 14,
        duration: 0.5,
        stagger: 0.05,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-templates]', start: 'top 88%', once: true },
      });
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  const stage = PATHWAY[active];

  return (
    <section
      ref={rootRef}
      id="pathway"
      aria-label="The end-to-end pathway"
      className="relative w-full ground-paper py-[clamp(5rem,12vh,9rem)]"
    >
      <div className="edge mx-auto max-w-[110rem]">
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
          <div>
            <Label index="01">The mechanism</Label>
            <SplitText
              as="h2"
              type="lines"
              className="mt-6 max-w-[18ch] font-display text-display-md font-normal uppercase leading-[0.92] text-ink"
            >
              Ten stages. One record.
            </SplitText>
          </div>
          <p className="max-w-[40ch] text-pretty text-sm leading-relaxed text-ink-muted">
            Every activity the problem statement names, in order, each issuing the standard
            template that stage is responsible for. Nothing here is optional — this is the
            compliant pathway from a departmental problem to a scaled award.
          </p>
        </div>

        {/* --- stage register + detail --- */}
        <div className="mt-14 grid gap-x-14 gap-y-8 lg:grid-cols-[0.85fr_1.15fr]">
          <ol data-stages className="border-t border-ink/12">
            {PATHWAY.map((s, i) => (
              <li key={s.id} data-stage-row>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-current={i === active ? 'step' : undefined}
                  data-cursor="open"
                  className={cn(
                    'group flex w-full items-baseline gap-4 border-b border-ink/10 py-3 text-left transition-colors',
                    i === active ? 'text-ink' : 'text-ink/45 hover:text-ink',
                  )}
                >
                  <span
                    className={cn(
                      'font-mono text-meta tabular-nums',
                      i === active ? 'text-saffron' : 'text-stone',
                    )}
                  >
                    {s.index}
                  </span>
                  <span className="font-display text-xl uppercase leading-none">{s.label}</span>
                  {s.isOurs ? (
                    <span className="ml-auto border border-saffron/50 px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-saffron">
                      Our addition
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ol>

          <div className="lg:pt-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="font-mono text-meta uppercase text-saffron">
                  PS activity · {stage.psActivity}
                </span>
                <h3 className="mt-4 font-display text-display-sm font-normal uppercase leading-none text-ink">
                  {stage.label}
                </h3>

                <dl className="mt-8 space-y-6 border-t border-ink/12 pt-6">
                  <div>
                    <dt className="font-mono text-meta uppercase text-stone">Department</dt>
                    <dd className="mt-2 max-w-[52ch] text-base leading-relaxed text-ink">
                      {stage.government}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-meta uppercase text-stone">Startup</dt>
                    <dd className="mt-2 max-w-[52ch] text-base leading-relaxed text-ink">
                      {stage.startup}
                    </dd>
                  </div>
                  {stage.template ? (
                    <div>
                      <dt className="font-mono text-meta uppercase text-stone">Issues</dt>
                      <dd className="mt-2 text-base leading-relaxed text-saffron">
                        {stage.template}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* --- templates + integrations, the PS's other two named deliverables --- */}
        <div className="mt-20 grid gap-x-14 gap-y-12 lg:grid-cols-[1.4fr_0.85fr]">
          <div data-templates>
            <Label>Standard templates the mechanism provides</Label>
            <ul className="mt-6 grid gap-px sm:grid-cols-2 xl:grid-cols-3">
              {TEMPLATES.map((t) => (
                <li key={t.name} data-template className="border-t border-ink/15 pt-4 sm:pr-8">
                  <p className="font-display text-lg uppercase leading-tight text-ink">{t.name}</p>
                  <p className="mt-1.5 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-saffron">
                    {t.stage}
                  </p>
                  <p className="mt-2 max-w-[30ch] text-xs leading-relaxed text-ink-muted">{t.note}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Label>Integrations</Label>
            <ul className="mt-6">
              {INTEGRATIONS.map((it) => (
                <li key={it.name} className="border-b border-ink/10 py-4">
                  <p className="font-display text-lg uppercase leading-tight text-ink">{it.name}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{it.detail}</p>
                  <p className="mt-2 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-stone">
                    Used at · {it.use}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
