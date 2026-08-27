'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { Counter, Label, SplitText } from '@/components/typography';
import { PRIMARY_PILOT } from '@/data/pilots';
import { PRIMARY_CHALLENGE } from '@/data/challenges';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { formatLakh, cn } from '@/lib/utils';

/**
 * MEASURE — milestone payments.
 *
 * The section exists to make one relationship unmissable: evidence, then
 * approval, then payment. Nothing unlocks earlier. This is the part of the
 * pathway that answers the startup-side problem — unclear payment milestones
 * and long cycles — so the sums, the trigger and the state are all on one line.
 */

const STATUS_COPY: Record<string, { label: string; tone: 'done' | 'live' | 'locked' }> = {
  PAID: { label: 'Paid', tone: 'done' },
  APPROVED: { label: 'Approved · payment released', tone: 'done' },
  EVIDENCE_SUBMITTED: { label: 'Evidence filed · under validation', tone: 'live' },
  IN_PROGRESS: { label: 'In progress', tone: 'live' },
  LOCKED: { label: 'Locked until previous milestone is approved', tone: 'locked' },
};

export function MilestonePaymentSection() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  const pilot = PRIMARY_PILOT;
  const total = pilot.milestones.reduce((sum, m) => sum + m.payment, 0);
  const released = pilot.milestones
    .filter((m) => m.status === 'PAID' || m.status === 'APPROVED')
    .reduce((sum, m) => sum + m.payment, 0);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || reduced) return;

      gsap.from('[data-tranche]', {
        autoAlpha: 0,
        y: 34,
        duration: 0.85,
        stagger: 0.11,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-tranches]', start: 'top 80%', once: true },
      });

      // The funding bar fills only as far as evidence has actually unlocked.
      gsap.fromTo(
        '[data-release-bar]',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.6,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: '[data-release]', start: 'top 84%', once: true },
        },
      );

      gsap.from('[data-rule-step]', {
        autoAlpha: 0,
        y: 18,
        duration: 0.7,
        stagger: 0.16,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-rule]', start: 'top 86%', once: true },
      });
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={rootRef}
      id="payments"
      aria-label="Milestone-based payment"
      className="relative w-full ground-ink py-[clamp(6rem,14vh,11rem)]"
    >
      <div className="edge mx-auto max-w-[110rem]">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <Label index="06">Measure & pay</Label>
            <SplitText
              as="h2"
              type="lines"
              className="mt-6 max-w-[17ch] font-display text-display-sm font-medium uppercase leading-[0.9] text-ivory"
            >
              Payment follows evidence. Never the other way round.
            </SplitText>
          </div>

          <div data-release className="min-w-[16rem]">
            <Label>Pilot value</Label>
            <p className="mt-3 font-display text-display-xs font-medium leading-none text-ivory">
              {formatLakh(total)}
            </p>
            <div className="mt-5 h-[3px] w-full bg-ivory/12">
              <span
                data-release-bar
                className="block h-[3px] origin-left bg-saffron"
                style={{ width: (released / total) * 100 + '%' }}
              />
            </div>
            <p className="mt-3 font-mono text-meta uppercase text-silver">
              {formatLakh(released)} released against approved evidence
            </p>
          </div>
        </div>

        {/* --- the tranches --- */}
        <ol data-tranches className="mt-16 grid gap-px border-t border-ivory/10 md:grid-cols-4">
          {pilot.milestones.map((m) => {
            const status = STATUS_COPY[m.status];
            return (
              <li
                key={m.id}
                data-tranche
                className={cn(
                  'border-t-2 pt-6 md:pr-8',
                  status.tone === 'done'
                    ? 'border-validated'
                    : status.tone === 'live'
                      ? 'border-saffron'
                      : 'border-ivory/15',
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-meta uppercase text-silver">{m.code}</span>
                  <span
                    className={cn(
                      'font-display text-3xl leading-none',
                      status.tone === 'locked' ? 'text-ivory/30' : 'text-ivory',
                    )}
                  >
                    <Counter
                      value={m.payment / 100000}
                      prefix="₹"
                      suffix="L"
                      duration={1.4}
                      aria-label={formatLakh(m.payment)}
                    />
                  </span>
                </div>

                <p className="mt-4 font-display text-xl uppercase leading-none text-ivory">
                  {m.title}
                </p>
                <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-ivory/60">
                  {m.description}
                </p>

                <p
                  className={cn(
                    'mt-5 font-mono text-meta uppercase',
                    status.tone === 'done'
                      ? 'text-validated-light'
                      : status.tone === 'live'
                        ? 'text-saffron'
                        : 'text-silver',
                  )}
                >
                  {status.label}
                </p>
              </li>
            );
          })}
        </ol>

        {/* --- the rule, stated --- */}
        <div data-rule className="mt-20 border-t border-ivory/10 pt-10">
          <ol className="flex flex-wrap items-center gap-x-8 gap-y-4">
            {['Evidence', 'Approval', 'Payment'].map((step, i) => (
              <li key={step} data-rule-step className="flex items-center gap-8">
                <span className="font-display text-display-xs font-medium uppercase leading-none text-ivory">
                  {step}
                </span>
                {i < 2 ? (
                  <span aria-hidden="true" className="font-display text-3xl text-saffron">
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-[68ch] text-pretty text-base leading-relaxed text-silver">
            Each tranche is contracted against named deliverables and released once the department
            validates the filed evidence. The startup knows what unlocks the next payment before
            the pilot starts, and the department never pays ahead of proof.
          </p>
        </div>
      </div>
    </section>
  );
}
