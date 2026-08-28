'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { Label, SplitText } from '@/components/typography';
import { DECISION_BRANCHES, DECISION_EVIDENCE } from '@/data/pilots';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

/**
 * PROCURE — the decision point.
 *
 * Three branches exist as physically distinct paths, and only one is taken.
 * Drawing all three matters: a pathway that can only end in procurement is not
 * an evaluation, and "stop" has to be visibly available for the other two
 * outcomes to mean anything.
 */
export function DecisionSection() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || reduced) return;

      gsap.from('[data-branch]', {
        autoAlpha: 0,
        y: 44,
        duration: 0.9,
        stagger: 0.12,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-branches]', start: 'top 80%', once: true }
      });

      // The branch paths draw outward from a single point, then one thickens.
      gsap.fromTo(
        '[data-branch-path]',
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          duration: 1.2,
          stagger: 0.12,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: '[data-branches]', start: 'top 80%', once: true }
        },
      );

      gsap.from('[data-evidence-cell]', {
        autoAlpha: 0,
        y: 20,
        duration: 0.65,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-decision-evidence]', start: 'top 86%', once: true }
      });

      gsap.fromTo(
        '[data-verdict]',
        { autoAlpha: 0, scale: 1.1 },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: { trigger: '[data-verdict]', start: 'top 88%', once: true }
        },
      );
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={rootRef}
      id="procure"
      aria-label="Procurement decision"
      className="relative w-full ground-bone py-[clamp(6rem,14vh,11rem)]"
    >
      <div className="edge mx-auto max-w-[110rem]">
        <Label index="07">Procure</Label>
        <SplitText
          as="h2"
          type="lines"
          className="mt-6 max-w-[14ch] font-display text-display-md font-medium uppercase leading-[0.88] text-ink"
        >
          The pilot has spoken.
        </SplitText>

        {/* --- the three branches --- */}
        <div data-branches className="mt-16">
          <svg
            viewBox="0 0 1000 120"
            className="h-[120px] w-full"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {[
              { d: 'M 500 0 C 500 60, 167 60, 167 120', tone: '#5F9070', width: 2.5 },
              { d: 'M 500 0 L 500 120', tone: '#A6A49C', width: 1 },
              { d: 'M 500 0 C 500 60, 833 60, 833 120', tone: '#C0524A', width: 1 },
            ].map((b) => (
              <path
                key={b.d}
                data-branch-path
                d={b.d}
                fill="none"
                stroke={b.tone}
                strokeOpacity={b.width > 1 ? 0.9 : 0.35}
                strokeWidth={b.width}
                vectorEffect="non-scaling-stroke"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1}
              />
            ))}
          </svg>

          <ol className="grid gap-px sm:grid-cols-3">
            {DECISION_BRANCHES.map((b) => {
              const taken = b.id === 'scale';
              return (
                <li
                  key={b.id}
                  data-branch
                  aria-current={taken ? 'true' : undefined}
                  className={cn(
                    'border-t-2 pt-6 sm:pr-8',
                    b.tone === 'validated'
                      ? 'border-validated'
                      : b.tone === 'risk'
                        ? 'border-risk/50'
                        : 'border-ink/20',
                  )}
                >
                  <p
                    className={cn(
                      'font-display text-display-xs font-medium uppercase leading-none',
                      taken ? 'text-ink' : 'text-ink/40',
                    )}
                  >
                    {b.label}
                  </p>
                  <p
                    className={cn(
                      'mt-4 max-w-[34ch] text-sm leading-relaxed',
                      taken ? 'text-ink/70' : 'text-stone/70',
                    )}
                  >
                    {b.detail}
                  </p>
                  <p
                    className={cn(
                      'mt-5 font-mono text-meta uppercase',
                      taken ? 'text-validated' : 'text-stone/60',
                    )}
                  >
                    {taken ? 'Recorded for this pilot' : 'Available outcome'}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>

        {/* --- the evidence the decision rests on --- */}
        <div className="mt-20 grid gap-12 lg:grid-cols-[1fr_1fr]">
          <div data-decision-evidence>
            <Label>Decision basis</Label>
            <dl className="mt-6 grid grid-cols-2 gap-px border-t border-ink/12">
              {DECISION_EVIDENCE.map((e) => (
                <div key={e.label} data-evidence-cell className="border-b border-ink/12 py-5 pr-6">
                  <dt className="font-mono text-meta uppercase text-stone">{e.label}</dt>
                  <dd className="mt-2 font-display text-3xl uppercase leading-none text-ink">
                    {e.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 max-w-[52ch] text-xs leading-relaxed text-stone">
              The decision, its basis and any dissent are recorded together. A later department
              reading this file sees what was decided and why.
            </p>
          </div>

          <div className="flex items-center">
            <div data-verdict className="opacity-0">
              <span className="font-mono text-meta uppercase text-validated">
                Recorded decision
              </span>
              <p className="mt-5 font-display text-display-sm font-medium uppercase leading-[0.88] text-ink">
                Proceed to procurement
              </p>
              <p className="mt-6 max-w-[42ch] text-base leading-relaxed text-stone">
                A compliant procurement pathway opens on the strength of validated pilot evidence —
                not on the strength of the pitch that started it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
