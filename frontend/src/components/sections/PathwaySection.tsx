'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { Label, NumberedRow, Accent, SplitText } from '@/components/typography';
import { PATHWAY, TEMPLATES, INTEGRATIONS } from '@/data/pathway';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * The end-to-end mechanism.
 *
 * The problem statement names ten activities and seven standard templates. An
 * earlier version put them in a two-column register with a detail panel, which
 * made the reader scan a table — dense, and impossible to read in order.
 *
 * This is the same content laid out as the reference does it: one row per
 * stage, stepping progressively right, each with a single expressive headline
 * and one line of consequence. Nothing is hidden behind a click, and nothing
 * needs one.
 */

/** One line per stage. The headline says what changes; the row says for whom. */
const HEADLINES: { lead: string; accent: string; tail?: string }[] = [
  { lead: 'A problem becomes a', accent: 'measurable', tail: 'target' },
  { lead: 'Demand becomes', accent: 'visible' },
  { lead: 'Eligibility is', accent: 'cited', tail: 'not asserted' },
  { lead: 'Criteria are published', accent: 'before', tail: 'proposals' },
  { lead: 'The pilot is designed from', accent: 'evidence' },
  { lead: 'A bounded', accent: 'sandbox', tail: 'with terms settled' },
  { lead: 'Money is committed', accent: 'per milestone' },
  { lead: 'Payment follows', accent: 'proof' },
  { lead: 'Outcomes are verified', accent: 'independently' },
  { lead: 'Proof', accent: 'transfers', tail: 'to the next department' },
];

export function PathwaySection() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (!rootRef.current || reduced) return;

      gsap.from('[data-stages] > li', {
        autoAlpha: 0,
        y: 24,
        duration: 0.7,
        stagger: 0.06,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-stages]', start: 'top 82%', once: true },
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

  return (
    <section
      ref={rootRef}
      id="pathway"
      aria-label="The end-to-end pathway"
      className="relative w-full ground-void py-[clamp(6rem,15vh,11rem)]"
    >
      <div className="edge mx-auto max-w-[110rem]">
        <Label index="01">The mechanism</Label>

        <SplitText
          as="h2"
          type="lines"
          className="mt-8 max-w-[16ch] font-display text-display-lg font-normal text-chalk"
        >
          Ten stages. One record.
        </SplitText>

        <p className="mt-8 max-w-[46ch] text-pretty text-base leading-relaxed text-chalk/55">
          Every activity the problem statement names, in order, each issuing the standard template
          that stage is responsible for.
        </p>

        {/* --- the ten stages --- */}
        <ol data-stages className="mt-20 border-t border-chalk/15">
          {PATHWAY.map((stage, i) => {
            const h = HEADLINES[i];
            return (
              <NumberedRow
                key={stage.id}
                index={stage.index}
                label={`${stage.label} · ${stage.psActivity}`}
                step={i}
                active={Boolean(stage.isOurs)}
                headline={
                  <>
                    {h.lead} <Accent>{h.accent}</Accent>
                    {h.tail ? ` ${h.tail}` : ''}
                  </>
                }
                description={stage.government}
                aside={
                  stage.isOurs ? (
                    <span className="whitespace-nowrap border border-signal/50 px-2.5 py-1 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-signal">
                      Our addition
                    </span>
                  ) : stage.template ? (
                    <span className="block max-w-[16ch] font-mono text-[0.5625rem] uppercase leading-relaxed tracking-[0.12em] text-chalk/50">
                      {stage.template}
                    </span>
                  ) : null
                }
              />
            );
          })}
        </ol>

        {/* --- templates and integrations, kept to one quiet band --- */}
        <div className="mt-24 grid gap-x-16 gap-y-14 lg:grid-cols-[1.5fr_1fr]">
          <div data-templates>
            <Label>Standard templates provided</Label>
            <ul className="mt-8">
              {TEMPLATES.map((t) => (
                <li
                  key={t.name}
                  data-template
                  className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1 border-b border-chalk/12 py-4"
                >
                  <span className="font-display text-xl font-normal text-chalk">{t.name}</span>
                  <span className="font-mono text-meta uppercase text-chalk/50">{t.stage}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Label>Integrations</Label>
            <ul className="mt-8">
              {INTEGRATIONS.map((it) => (
                <li key={it.name} className="border-b border-chalk/12 py-4">
                  <p className="font-display text-xl font-normal text-chalk">{it.name}</p>
                  <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-chalk/55">
                    {it.detail}
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
