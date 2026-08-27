'use client';

import { useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from '@/lib/gsap';
import { Label } from '@/components/typography';
import type { Challenge, ChallengeStatus } from '@/types/platform';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn, formatLakh } from '@/lib/utils';

const STATUS_LABEL: Record<ChallengeStatus, string> = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  EVALUATION: 'Under evaluation',
  PILOT: 'In pilot',
  CLOSED: 'Closed',
};

const STATUS_TONE: Record<ChallengeStatus, string> = {
  DRAFT: 'text-silver border-ivory/20',
  OPEN: 'text-saffron border-saffron/60',
  EVALUATION: 'text-ivory border-ivory/40',
  PILOT: 'text-validated-light border-validated/60',
  CLOSED: 'text-silver/60 border-ivory/12',
};

const FILTERS = ['All', 'Open', 'In pilot', 'Closed'] as const;
type Filter = (typeof FILTERS)[number];

/**
 * The challenge register.
 *
 * An editorial list rather than a card grid: challenges are documents with a
 * baseline and a target, and a row lets those sit next to each other where a
 * card would push them into separate boxes. Expansion is in place, so the
 * reader never loses their position in the register.
 */
export function ChallengeList({ challenges }: { challenges: Challenge[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<Filter>('All');
  const [openId, setOpenId] = useState<string | null>(challenges[0]?.id ?? null);
  const reduced = usePrefersReducedMotion();

  const visible = useMemo(() => {
    if (filter === 'All') return challenges;
    const wanted: Record<Exclude<Filter, 'All'>, ChallengeStatus> = {
      Open: 'OPEN',
      'In pilot': 'PILOT',
      Closed: 'CLOSED',
    };
    return challenges.filter((c) => c.status === wanted[filter]);
  }, [challenges, filter]);

  useGSAP(
    () => {
      if (!ref.current || reduced) return;
      gsap.from('[data-challenge-row]', {
        autoAlpha: 0,
        y: 26,
        duration: 0.7,
        stagger: 0.06,
        ease: 'expo.out',
        scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true },
      });
    },
    { scope: ref, dependencies: [reduced] },
  );

  return (
    <div ref={ref} className="edge mx-auto max-w-[110rem] pb-[clamp(5rem,12vh,9rem)]">
      {/* --- filters --- */}
      <div
        role="tablist"
        aria-label="Filter challenges by status"
        className="flex flex-wrap gap-x-6 gap-y-2 border-b border-ivory/10 pb-4"
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            type="button"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            data-cursor="filter"
            className={cn(
              'relative py-1 font-mono text-meta uppercase transition-colors',
              filter === f ? 'text-ivory' : 'text-silver hover:text-ivory',
            )}
          >
            {f}
            {filter === f ? (
              <motion.span
                layoutId="challenge-filter"
                className="absolute -bottom-[17px] left-0 h-px w-full bg-saffron"
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              />
            ) : null}
          </button>
        ))}
      </div>

      <ul>
        {visible.map((c) => {
          const open = openId === c.id;
          return (
            <li key={c.id} data-challenge-row className="border-b border-ivory/10">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : c.id)}
                aria-expanded={open}
                aria-controls={`challenge-${c.id}`}
                data-cursor={open ? 'close' : 'view'}
                className="group grid w-full grid-cols-1 items-baseline gap-x-8 gap-y-3 py-8 text-left md:grid-cols-[7rem_1fr_auto]"
              >
                <span className="font-mono text-meta uppercase text-silver">{c.id}</span>

                <span>
                  <span className="block font-display text-2xl uppercase leading-tight text-ivory transition-colors group-hover:text-saffron md:text-3xl">
                    {c.title}
                  </span>
                  <span className="mt-2 block font-mono text-meta uppercase text-silver">
                    {c.department} · {c.location}
                  </span>
                </span>

                <span className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
                  <span className="font-display text-xl leading-none text-ivory">
                    {formatLakh(c.budget)}
                  </span>
                  <span
                    className={cn(
                      'border px-3 py-1 font-mono text-[0.625rem] uppercase tracking-[0.14em]',
                      STATUS_TONE[c.status],
                    )}
                  >
                    {STATUS_LABEL[c.status]}
                  </span>
                </span>
              </button>

              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    id={`challenge-${c.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-10 pb-10 md:grid-cols-[7rem_1fr_1fr] md:gap-x-8">
                      <div className="hidden md:block" />

                      <div>
                        <Label tone="accent">Target outcome</Label>
                        <p className="mt-3 max-w-[46ch] text-base leading-relaxed text-ivory/85">
                          {c.target}
                        </p>

                        <Label className="mt-8 block">As received</Label>
                        <p className="mt-3 max-w-[52ch] border-l border-ivory/20 pl-4 text-sm italic leading-relaxed text-silver">
                          “{c.rawNote}”
                        </p>
                      </div>

                      <div>
                        <Label>Measurement</Label>
                        <dl className="mt-3">
                          {c.measurement.map((m) => (
                            <div
                              key={m.label}
                              className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ivory/8 py-3"
                            >
                              <dt className="text-sm text-ivory/80">{m.label}</dt>
                              <dd className="font-mono text-meta uppercase text-silver">
                                {m.baseline} <span className="text-saffron">→</span> {m.target}
                              </dd>
                            </div>
                          ))}
                        </dl>

                        <dl className="mt-6 grid grid-cols-3 gap-6">
                          {[
                            { k: 'Pilot scope', v: c.pilotScope },
                            { k: 'Duration', v: c.duration + ' days' },
                            { k: 'Applications', v: String(c.applications) },
                          ].map((x) => (
                            <div key={x.k}>
                              <dt className="font-mono text-meta uppercase text-silver">{x.k}</dt>
                              <dd className="mt-1.5 text-sm text-ivory">{x.v}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>

      {visible.length === 0 ? (
        <p className="py-16 text-center font-mono text-meta uppercase text-silver">
          No challenges with this status.
        </p>
      ) : null}
    </div>
  );
}
