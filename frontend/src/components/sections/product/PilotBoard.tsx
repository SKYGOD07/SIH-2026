'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from '@/lib/gsap';
import { Counter, Label } from '@/components/typography';
import { getStartup } from '@/data/startups';
import { getChallenge } from '@/data/challenges';
import type { Pilot, MilestoneStatus, PilotStatus } from '@/types/platform';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn, formatLakh } from '@/lib/utils';

const PILOT_STATUS: Record<PilotStatus, string> = {
  DESIGN: 'In design',
  RUNNING: 'Running',
  VALIDATION: 'In validation',
  DECIDED: 'Decided',
};

const MILESTONE_TONE: Record<MilestoneStatus, string> = {
  PAID: 'bg-validated',
  APPROVED: 'bg-validated',
  EVIDENCE_SUBMITTED: 'bg-saffron',
  IN_PROGRESS: 'bg-saffron/50',
  LOCKED: 'bg-ivory/12',
};

const MILESTONE_LABEL: Record<MilestoneStatus, string> = {
  PAID: 'Paid',
  APPROVED: 'Approved',
  EVIDENCE_SUBMITTED: 'Evidence filed',
  IN_PROGRESS: 'In progress',
  LOCKED: 'Locked',
};

/**
 * The pilot board.
 *
 * Each pilot is shown as its milestone chain, because that chain is the
 * contract: what has been evidenced, what has been approved, and therefore what
 * has been paid. The selected pilot expands into its measured outcome.
 */
export function PilotBoard({ pilots }: { pilots: Pilot[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(pilots[0]?.id ?? null);
  const reduced = usePrefersReducedMotion();

  const active = pilots.find((p) => p.id === selected) ?? pilots[0];
  const startup = active ? getStartup(active.startupId) : undefined;
  const challenge = active ? getChallenge(active.challengeId) : undefined;

  useGSAP(
    () => {
      if (!ref.current || reduced) return;
      gsap.from('[data-pilot-card]', {
        autoAlpha: 0,
        y: 30,
        duration: 0.7,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true },
      });
    },
    { scope: ref, dependencies: [reduced] },
  );

  if (!active) return null;

  const released = active.milestones
    .filter((m) => m.status === 'PAID' || m.status === 'APPROVED')
    .reduce((sum, m) => sum + m.payment, 0);
  const total = active.milestones.reduce((sum, m) => sum + m.payment, 0);

  return (
    <div ref={ref} className="edge mx-auto max-w-[110rem] pb-[clamp(5rem,12vh,9rem)]">
      <ul className="grid gap-px border-t border-ivory/10 lg:grid-cols-2">
        {pilots.map((p) => {
          const isActive = p.id === selected;
          const s = getStartup(p.startupId);
          return (
            <li key={p.id} data-pilot-card>
              <button
                type="button"
                onClick={() => setSelected(p.id)}
                aria-pressed={isActive}
                data-cursor="open"
                className={cn(
                  'group h-full w-full border-b border-ivory/10 py-7 pr-8 text-left transition-colors lg:pr-12',
                  isActive ? 'border-t-2 border-t-saffron' : 'border-t-2 border-t-transparent',
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <span className="font-mono text-meta uppercase text-silver">{p.id}</span>
                  <span
                    className={cn(
                      'font-mono text-meta uppercase',
                      p.status === 'DECIDED'
                        ? 'text-validated-light'
                        : p.status === 'VALIDATION'
                          ? 'text-saffron'
                          : 'text-silver',
                    )}
                  >
                    {PILOT_STATUS[p.status]}
                  </span>
                </div>

                <h2
                  className={cn(
                    'mt-3 font-display text-2xl uppercase leading-tight transition-colors',
                    isActive ? 'text-saffron' : 'text-ivory group-hover:text-saffron',
                  )}
                >
                  {p.title}
                </h2>
                <p className="mt-2 font-mono text-meta uppercase text-silver">
                  {s?.name} · {p.wards.length} sites
                </p>

                {/* milestone chain */}
                <ol className="mt-6 flex gap-1.5" aria-label="Milestone progress">
                  {p.milestones.map((m) => (
                    <li key={m.id} className="flex-1">
                      <span
                        className={cn('block h-1', MILESTONE_TONE[m.status])}
                        title={`${m.code} — ${MILESTONE_LABEL[m.status]}`}
                      />
                      <span className="mt-2 block font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver">
                        {m.code}
                      </span>
                    </li>
                  ))}
                </ol>
              </button>
            </li>
          );
        })}
      </ul>

      {/* --- selected pilot detail --- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div>
            <Label tone="accent">Milestones and payment</Label>
            <ol className="mt-6">
              {active.milestones.map((m) => (
                <li key={m.id} className="border-b border-ivory/10 py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                    <span className="flex items-baseline gap-4">
                      <span className="font-mono text-meta uppercase text-silver">{m.code}</span>
                      <span className="font-display text-xl uppercase leading-none text-ivory">
                        {m.title}
                      </span>
                    </span>
                    <span className="flex items-baseline gap-6">
                      <span
                        className={cn(
                          'font-mono text-meta uppercase',
                          m.status === 'PAID' || m.status === 'APPROVED'
                            ? 'text-validated-light'
                            : m.status === 'LOCKED'
                              ? 'text-silver/50'
                              : 'text-saffron',
                        )}
                      >
                        {MILESTONE_LABEL[m.status]}
                      </span>
                      <span className="font-display text-xl leading-none text-ivory tabular-nums">
                        {formatLakh(m.payment)}
                      </span>
                    </span>
                  </div>
                  <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-ivory/65">
                    {m.description}
                  </p>
                  <p className="mt-2 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver">
                    Evidence: {m.evidenceRequired.join(' · ')}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4">
              <span className="font-mono text-meta uppercase text-silver">
                Released against approved evidence
              </span>
              <span className="font-display text-2xl leading-none text-ivory">
                {formatLakh(released)} <span className="text-silver">/ {formatLakh(total)}</span>
              </span>
            </div>
          </div>

          <div>
            <Label>Context</Label>
            <dl className="mt-6 space-y-4">
              {[
                { k: 'Challenge', v: challenge?.title ?? '—' },
                { k: 'Department', v: challenge?.department ?? '—' },
                { k: 'Startup', v: startup?.name ?? '—' },
                { k: 'Sites', v: active.wards.join(', ') },
                {
                  k: 'Started',
                  v: new Date(active.startedOn).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }),
                },
              ].map((x) => (
                <div key={x.k} className="border-b border-ivory/8 pb-3">
                  <dt className="font-mono text-meta uppercase text-silver">{x.k}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-ivory">{x.v}</dd>
                </div>
              ))}
            </dl>

            {active.status === 'DECIDED' || active.status === 'VALIDATION' ? (
              <div className="mt-10">
                <Label tone="accent">Measured outcome</Label>
                <dl className="mt-4 space-y-3">
                  {active.metrics.map((m) => {
                    const delta = Math.round(((m.result - m.baseline) / m.baseline) * 100);
                    const good = m.direction === 'lower-is-better' ? delta < 0 : delta > 0;
                    return (
                      <div
                        key={m.label}
                        className="flex items-baseline justify-between gap-4 border-b border-ivory/8 pb-2"
                      >
                        <dt className="text-sm text-ivory/80">{m.label}</dt>
                        <dd className="flex items-baseline gap-4 font-mono text-meta uppercase">
                          <span className="text-silver">
                            {m.baseline}
                            {m.unit} → {m.result}
                            {m.unit}
                          </span>
                          <span className={good ? 'text-validated-light' : 'text-risk'}>
                            {delta < 0 ? '↓' : '↑'} {Math.abs(delta)}%
                          </span>
                        </dd>
                      </div>
                    );
                  })}
                </dl>

                {active.score > 0 ? (
                  <p className="mt-6 font-display text-4xl leading-none text-ivory">
                    <Counter value={active.score} duration={1.4} />
                    <span className="text-silver text-2xl"> / 100</span>
                    <span className="mt-2 block font-mono text-meta uppercase text-silver">
                      Independent validation score · decision: {active.decision}
                    </span>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
