'use client';

import { useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from '@/lib/gsap';
import { Counter, Label } from '@/components/typography';
import { COMPLIANCE_LABEL } from '@/data/startups';
import type { Startup } from '@/types/platform';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn, formatLakh } from '@/lib/utils';

type SortKey = 'matchScore' | 'pilotSuccessScore' | 'governmentDeployments' | 'trl';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'matchScore', label: 'Match' },
  { key: 'pilotSuccessScore', label: 'Pilot record' },
  { key: 'governmentDeployments', label: 'Deployments' },
  { key: 'trl', label: 'Readiness' },
];

const COMPLIANCE_TONE: Record<Startup['complianceStatus'], string> = {
  VERIFIED: 'text-validated border-validated/60',
  IN_REVIEW: 'text-signal border-signal/50',
  ACTION_REQUIRED: 'text-risk border-risk/50',
};

/**
 * The startup register.
 *
 * Deliberately sortable by four different evidence signals rather than by a
 * single ranking. Funding is shown on the expanded record but is not a sort
 * key: making it one would quietly turn capital raised into the default measure
 * of quality, which is exactly the failure mode this platform argues against.
 */
export function StartupList({ startups }: { startups: Startup[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState<SortKey>('matchScore');
  const [openId, setOpenId] = useState<string | null>(null);
  const reduced = usePrefersReducedMotion();

  const sorted = useMemo(
    () => [...startups].sort((a, b) => b[sort] - a[sort]),
    [startups, sort],
  );

  useGSAP(
    () => {
      if (!ref.current || reduced) return;
      gsap.from('[data-startup-row]', {
        autoAlpha: 0,
        y: 24,
        duration: 0.65,
        stagger: 0.05,
        ease: 'expo.out',
        scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true },
      });
    },
    { scope: ref, dependencies: [reduced] },
  );

  return (
    <div ref={ref} className="edge mx-auto max-w-[110rem] pb-[clamp(5rem,12vh,9rem)]">
      <div className="flex flex-wrap items-baseline justify-between gap-6 border-b border-chalk/15 pb-4">
        <Label>Sort by evidence signal</Label>
        <div role="tablist" aria-label="Sort startups" className="flex flex-wrap gap-x-6 gap-y-2">
          {SORTS.map((s) => (
            <button
              key={s.key}
              role="tab"
              type="button"
              aria-selected={sort === s.key}
              onClick={() => setSort(s.key)}
              data-cursor="sort"
              className={cn(
                'relative py-1 font-mono text-meta uppercase transition-colors',
                sort === s.key ? 'text-chalk' : 'text-chalk/50 hover:text-chalk',
              )}
            >
              {s.label}
              {sort === s.key ? (
                <motion.span
                  layoutId="startup-sort"
                  className="absolute -bottom-[17px] left-0 h-px w-full bg-signal"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <ul>
        <AnimatePresence initial={false}>
          {sorted.map((s) => {
            const open = openId === s.id;
            return (
              <motion.li
                key={s.id}
                layout="position"
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                data-startup-row
                className="border-b border-chalk/15"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : s.id)}
                  aria-expanded={open}
                  aria-controls={`startup-${s.id}`}
                  data-cursor={open ? 'close' : 'view'}
                  className="group grid w-full grid-cols-1 items-baseline gap-x-8 gap-y-3 py-7 text-left md:grid-cols-[1fr_auto]"
                >
                  <span>
                    <span className="block font-display text-2xl uppercase leading-none text-chalk transition-colors group-hover:text-signal">
                      {s.name}
                    </span>
                    <span className="mt-2 block font-mono text-meta uppercase text-chalk/50">
                      {s.technologies.join(' · ')} — {s.headquarters}
                    </span>
                  </span>

                  <span className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
                    <span className="text-right">
                      <span className="block font-display text-2xl leading-none text-chalk tabular-nums">
                        {s.matchScore}%
                      </span>
                      <span className="mt-1 block font-mono text-[0.625rem] uppercase tracking-[0.12em] text-chalk/50">
                        match
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-display text-2xl leading-none text-chalk tabular-nums">
                        TRL {s.trl}
                      </span>
                      <span className="mt-1 block font-mono text-[0.625rem] uppercase tracking-[0.12em] text-chalk/50">
                        readiness
                      </span>
                    </span>
                    <span
                      className={cn(
                        'border px-3 py-1 font-mono text-[0.625rem] uppercase tracking-[0.14em]',
                        COMPLIANCE_TONE[s.complianceStatus],
                      )}
                    >
                      {COMPLIANCE_LABEL[s.complianceStatus]}
                    </span>
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      id={`startup-${s.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-10 pb-10 lg:grid-cols-[1fr_1.15fr]">
                        <div>
                          <p className="max-w-[46ch] text-base leading-relaxed text-chalk/75">
                            {s.summary}
                          </p>

                          <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
                            {[
                              { k: 'Gov deployments', v: s.governmentDeployments },
                              { k: 'Previous pilots', v: s.previousPilots },
                              { k: 'Pilot score', v: s.pilotSuccessScore, suffix: ' / 100' },
                            ].map((x) => (
                              <div key={x.k}>
                                <dt className="font-mono text-meta uppercase text-chalk/50">{x.k}</dt>
                                <dd className="mt-2 font-display text-2xl leading-none text-chalk">
                                  <Counter value={x.v} suffix={x.suffix ?? ''} duration={1.1} />
                                </dd>
                              </div>
                            ))}
                            <div>
                              <dt className="font-mono text-meta uppercase text-chalk/50">Founded</dt>
                              <dd className="mt-2 font-display text-2xl leading-none text-chalk">
                                {s.founded}
                              </dd>
                            </div>
                          </dl>

                          <p className="mt-8 border-t border-chalk/15 pt-4 text-xs leading-relaxed text-chalk/50">
                            Capital raised: {formatLakh(s.fundingRaised)}. Recorded as one evidence
                            signal among several. It carries no weight in the evaluation criteria
                            and is not a sortable ranking on this register.
                          </p>
                        </div>

                        <div>
                          <Label tone="accent">Evidence timeline</Label>
                          <ol className="mt-4">
                            {s.evidence.map((e, i) => (
                              <li
                                key={e.year + e.label + i}
                                className="flex items-baseline gap-5 border-b border-chalk/12 py-3"
                              >
                                <span className="w-12 shrink-0 font-mono text-meta uppercase text-chalk/50">
                                  {e.year}
                                </span>
                                <span className="w-28 shrink-0 font-mono text-meta uppercase text-signal">
                                  {e.label}
                                </span>
                                <span className="text-sm leading-snug text-chalk/70">{e.detail}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
