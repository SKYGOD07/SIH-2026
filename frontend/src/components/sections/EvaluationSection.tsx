'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { Counter, Label, SplitText } from '@/components/typography';
import { EVALUATION_CRITERIA, EVALUATION_CHAIN } from '@/data/pilots';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * EVALUATE — "AI can analyse. Humans decide."
 *
 * The six criteria are extracted and scored, and then the composite is handed
 * to a panel. The chain at the foot of the section is the point of the whole
 * page: analysis, then review, then decision — each with a named owner. The
 * composite is drawn deliberately as an input, not as a verdict.
 */
export function EvaluationSection() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  const composite = Math.round(
    EVALUATION_CRITERIA.reduce((sum, c) => sum + c.score * c.weight, 0) /
      EVALUATION_CRITERIA.reduce((sum, c) => sum + c.weight, 0),
  );

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || reduced) return;

      // Criteria are extracted one at a time, then their bars fill together —
      // reading as separate signals assembling into one composite.
      gsap.from('[data-criterion]', {
        autoAlpha: 0,
        x: -26,
        duration: 0.7,
        stagger: 0.09,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-criteria]', start: 'top 80%', once: true },
      });

      gsap.fromTo(
        '[data-bar]',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.15,
          stagger: 0.07,
          ease: 'power3.out',
          scrollTrigger: { trigger: '[data-criteria]', start: 'top 74%', once: true },
        },
      );

      gsap.from('[data-chain-step]', {
        autoAlpha: 0,
        y: 26,
        duration: 0.75,
        stagger: 0.14,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-chain]', start: 'top 82%', once: true },
      });

      gsap.fromTo(
        '[data-chain-link]',
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 0.6,
          stagger: 0.14,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: '[data-chain]', start: 'top 82%', once: true },
        },
      );
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={rootRef}
      id="evaluate"
      aria-label="Evaluate — assisted analysis, human decision"
      className="relative w-full bg-ivory py-[clamp(6rem,14vh,11rem)] text-ink"
    >
      <div className="edge mx-auto max-w-[110rem]">
        <Label index="04" className="text-graphite-light">
          Evaluate
        </Label>

        <SplitText
          as="h2"
          type="lines"
          className="mt-6 max-w-[16ch] font-display text-display-md font-medium uppercase leading-[0.88] text-ink"
        >
          AI can analyse. Humans decide.
        </SplitText>

        <div className="mt-16 grid gap-x-16 gap-y-12 lg:grid-cols-[1.25fr_0.75fr]">
          {/* --- extracted criteria --- */}
          <div data-criteria>
            <div className="flex items-baseline justify-between gap-4 border-b border-ink/15 pb-3">
              <Label className="text-graphite-light">Extracted signals</Label>
              <Label className="text-graphite-light">Weight · Score</Label>
            </div>

            <ul className="mt-2">
              {EVALUATION_CRITERIA.map((c) => (
                <li key={c.label} data-criterion className="border-b border-ink/10 py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <span className="font-display text-xl uppercase leading-none text-ink">
                      {c.label}
                    </span>
                    <span className="flex items-baseline gap-4 font-mono text-meta uppercase text-graphite-light">
                      <span>{Math.round(c.weight * 100)}%</span>
                      <span className="font-display text-2xl tabular-nums text-ink">
                        <Counter value={c.score} duration={1.3} />
                      </span>
                    </span>
                  </div>

                  <div className="mt-3 h-px w-full bg-ink/10">
                    <span
                      data-bar
                      className="block h-px origin-left bg-saffron"
                      style={{ width: c.score + '%' }}
                    />
                  </div>

                  <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-graphite-light">
                    {c.basis}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* --- composite + chain --- */}
          <div className="lg:pt-8">
            <div className="border border-ink/15 p-8">
              <Label className="text-graphite-light">Weighted composite</Label>
              <p className="mt-4 font-display text-display-sm font-medium tabular-nums leading-none text-ink">
                <Counter value={composite} duration={1.8} />
                <span className="text-graphite-light"> / 100</span>
              </p>
              <p className="mt-5 text-sm leading-relaxed text-graphite-light">
                A weighted summary of the extracted signals, published alongside the criteria that
                produced it. It ranks the proposal for the panel. It does not award anything.
              </p>
            </div>

            <div data-chain className="mt-10">
              <Label className="text-graphite-light">Decision chain</Label>
              <ol className="mt-6 space-y-0">
                {EVALUATION_CHAIN.map((step, i) => (
                  <li key={step.step}>
                    <div data-chain-step className="py-3">
                      <span className="font-mono text-meta uppercase text-saffron">
                        {String(i + 1).padStart(2, '0')} · {step.role}
                      </span>
                      <p className="mt-2 font-display text-2xl uppercase leading-none text-ink">
                        {step.step}
                      </p>
                      <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-graphite-light">
                        {step.detail}
                      </p>
                    </div>
                    {i < EVALUATION_CHAIN.length - 1 ? (
                      <span
                        data-chain-link
                        aria-hidden="true"
                        className="ml-1 block h-8 w-px origin-top bg-ink/25"
                      />
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
