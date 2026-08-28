'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { Counter, Label, SplitText } from '@/components/typography';
import { PRIMARY_PILOT, DECISION_EVIDENCE } from '@/data/pilots';
import { SCALE_STEPS } from '@/data/maharashtra';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn, formatLakh } from '@/lib/utils';

/**
 * Contract, measure, pay, validate, scale — the back half of the pathway in one
 * section.
 *
 * These were five separate pinned screens in the earlier build. They are one
 * argument, not five: evidence unlocks payment, measurement produces a result,
 * the result produces a decision, and the decision transfers. Splitting that
 * across five full-height sections buried the causal chain that makes it work.
 */

const MILESTONE_LABEL: Record<string, string> = {
  PAID: 'Paid',
  APPROVED: 'Approved',
  EVIDENCE_SUBMITTED: 'Evidence filed',
  IN_PROGRESS: 'In progress',
  LOCKED: 'Locked',
};

export function OutcomeSection() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  const pilot = PRIMARY_PILOT;
  const total = pilot.milestones.reduce((s, m) => s + m.payment, 0);
  const released = pilot.milestones
    .filter((m) => m.status === 'PAID' || m.status === 'APPROVED')
    .reduce((s, m) => s + m.payment, 0);

  const water = pilot.metrics[0];
  const improvement = Math.round(((water.baseline - water.result) / water.baseline) * 100);

  useGSAP(
    () => {
      if (!rootRef.current || reduced) return;

      gsap.from('[data-tranche]', {
        autoAlpha: 0,
        y: 24,
        duration: 0.6,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-tranches]', start: 'top 86%', once: true },
      });

      gsap.fromTo(
        '[data-release-bar]',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.3,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: '[data-tranches]', start: 'top 86%', once: true },
        },
      );

      gsap.from('[data-scale-step]', {
        autoAlpha: 0,
        y: 18,
        duration: 0.55,
        stagger: 0.09,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-scale]', start: 'top 88%', once: true },
      });
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={rootRef}
      id="outcome"
      aria-label="Contract, measure, pay and scale"
      className="relative w-full ground-paper py-[clamp(5rem,12vh,9rem)]"
    >
      <div className="edge mx-auto max-w-[110rem]">
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
          <div>
            <Label index="07">Contract · measure · pay · scale</Label>
            <SplitText
              as="h2"
              type="lines"
              className="mt-6 max-w-[18ch] font-display text-display-md font-normal uppercase leading-[0.92] text-ink"
            >
              Payment follows evidence.
            </SplitText>
          </div>
          <p className="max-w-[42ch] text-pretty text-sm leading-relaxed text-ink-muted">
            Each tranche is contracted against named deliverables and released only once the
            department validates the filed evidence. The startup knows what unlocks the next
            payment before the pilot starts; the department never pays ahead of proof.
          </p>
        </div>

        {/* --- milestones and payment --- */}
        <div data-tranches className="mt-14">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <ol className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {['Evidence', 'Approval', 'Payment'].map((step, i) => (
                <li key={step} className="flex items-center gap-6">
                  <span className="font-display text-xl uppercase leading-none text-ink">
                    {step}
                  </span>
                  {i < 2 ? (
                    <span aria-hidden="true" className="text-saffron">
                      →
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
            <span className="font-mono text-meta uppercase text-stone">
              {formatLakh(released)} released of {formatLakh(total)}
            </span>
          </div>

          <div className="mt-4 h-[3px] w-full bg-ink/10">
            <span
              data-release-bar
              className="block h-[3px] origin-left bg-saffron"
              style={{ width: (released / total) * 100 + '%' }}
            />
          </div>

          <ol className="mt-8 grid gap-px md:grid-cols-4">
            {pilot.milestones.map((m) => {
              const done = m.status === 'PAID' || m.status === 'APPROVED';
              const live = m.status === 'EVIDENCE_SUBMITTED' || m.status === 'IN_PROGRESS';
              return (
                <li
                  key={m.id}
                  data-tranche
                  className={cn(
                    'border-t-2 pt-5 md:pr-8',
                    done ? 'border-validated' : live ? 'border-saffron' : 'border-ink/15',
                  )}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-meta uppercase text-stone">{m.code}</span>
                    <span
                      className={cn(
                        'font-display text-2xl leading-none',
                        done || live ? 'text-ink' : 'text-ink/35',
                      )}
                    >
                      {formatLakh(m.payment)}
                    </span>
                  </div>
                  <p className="mt-3 font-display text-lg uppercase leading-none text-ink">
                    {m.title}
                  </p>
                  <p className="mt-2 max-w-[30ch] text-xs leading-relaxed text-ink-muted">
                    Requires · {m.evidenceRequired.join(' · ')}
                  </p>
                  <p
                    className={cn(
                      'mt-3 font-mono text-meta uppercase',
                      done ? 'text-validated' : live ? 'text-saffron' : 'text-stone',
                    )}
                  >
                    {MILESTONE_LABEL[m.status]}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>

        {/* --- measured outcome + decision --- */}
        <div className="mt-20 grid gap-x-14 gap-y-12 border-t border-ink/12 pt-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <Label tone="accent">Independently validated outcome</Label>

            <div className="mt-6 flex flex-wrap items-end gap-x-12 gap-y-6">
              <div>
                <span className="font-mono text-meta uppercase text-stone">Baseline</span>
                <p className="mt-2 font-display text-display-sm font-normal leading-none text-ink/45">
                  {water.baseline}
                  {water.unit}
                </p>
              </div>
              <span aria-hidden="true" className="pb-3 font-display text-3xl text-saffron">
                →
              </span>
              <div>
                <span className="font-mono text-meta uppercase text-stone">After pilot</span>
                <p className="mt-2 font-display text-display-sm font-normal leading-none text-ink">
                  <Counter value={water.result} duration={1.4} />
                  {water.unit}
                </p>
              </div>
              <div>
                <span className="font-mono text-meta uppercase text-saffron">Improvement</span>
                <p className="mt-2 font-display text-display-sm font-normal leading-none text-saffron">
                  <Counter value={improvement} suffix="%" duration={1.4} />
                </p>
              </div>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-x-10 gap-y-4">
              {pilot.metrics.slice(1).map((m) => {
                const delta = Math.round(((m.result - m.baseline) / m.baseline) * 100);
                const good = m.direction === 'lower-is-better' ? delta < 0 : delta > 0;
                return (
                  <div
                    key={m.label}
                    className="flex items-baseline justify-between gap-4 border-b border-ink/10 pb-2"
                  >
                    <dt className="font-mono text-meta uppercase text-stone">{m.label}</dt>
                    <dd
                      className={cn(
                        'font-display text-lg leading-none tabular-nums',
                        good ? 'text-validated' : 'text-risk',
                      )}
                    >
                      {delta < 0 ? '↓' : '↑'} {Math.abs(delta)}%
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>

          <div>
            <Label>Scale-up decision</Label>
            <dl className="mt-6 grid grid-cols-2 gap-px">
              {DECISION_EVIDENCE.map((e) => (
                <div key={e.label} className="border-b border-ink/10 py-4 pr-6">
                  <dt className="font-mono text-meta uppercase text-stone">{e.label}</dt>
                  <dd className="mt-1.5 font-display text-xl uppercase leading-none text-ink">
                    {e.value}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-8 font-display text-display-xs font-normal uppercase leading-none text-ink">
              Proceed to procurement
            </p>
            <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-ink-muted">
              Scale, extend or stop — recorded with its evidence base. Stop is a real outcome: the
              lesson is filed and becomes a precondition on the next comparable challenge.
            </p>
          </div>
        </div>

        {/* --- scale --- */}
        <div data-scale className="mt-20 border-t border-ink/12 pt-10">
          <Label>Prove once. Scale where it fits.</Label>
          <ol className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {SCALE_STEPS.map((s) => (
              <li key={s.label + s.count} data-scale-step>
                <p className="font-display text-display-xs font-normal leading-none text-ink">
                  <Counter value={s.count} duration={1} />
                  <span className="ml-2 font-mono text-meta uppercase text-saffron">{s.unit}</span>
                </p>
                <p className="mt-2 max-w-[28ch] text-xs leading-relaxed text-ink-muted">{s.note}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
