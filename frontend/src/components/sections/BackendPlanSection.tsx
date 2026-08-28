'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { Label, SplitText } from '@/components/typography';
import { BACKEND_PLAN } from '@/data/simulation';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

/**
 * What the frontend is standing in for.
 *
 * Deliberately on the page rather than hidden in a repo doc. The experience
 * above shows a working pathway; this section states plainly which parts are
 * real software today and which are the services still to be built, with the
 * inputs and outputs of each already fixed.
 *
 * Two reasons for it. Practically, it is the backend contract — the frontend
 * reads these shapes, so building against them cannot drift. Presentationally,
 * a demo that says exactly where it stops is far more credible than one that
 * lets the audience assume everything behind the animation is finished.
 */

const STATUS_TONE: Record<string, string> = {
  'Frontend represented': 'text-validated border-validated/40',
  'Schema defined': 'text-saffron border-saffron/40',
  'Not started': 'text-stone border-ink/20',
};

export function BackendPlanSection() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || reduced) return;

      gsap.from('[data-backend-card]', {
        autoAlpha: 0,
        y: 34,
        duration: 0.8,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-backend-grid]', start: 'top 82%', once: true },
      });

      gsap.fromTo(
        '[data-backend-rule]',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.1,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: root, start: 'top 78%', once: true },
        },
      );
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={rootRef}
      id="backend"
      aria-label="Backend plan"
      className="relative w-full ground-bone py-[clamp(5rem,12vh,9rem)]"
    >
      <div className="edge mx-auto max-w-[110rem]">
        <span
          data-backend-rule
          aria-hidden="true"
          className="mb-10 block h-px w-full origin-left bg-ink/15"
        />

        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
          <div>
            <Label>Reserved · phase two</Label>
            <SplitText
              as="h2"
              type="lines"
              className="mt-6 max-w-[18ch] font-display text-display-sm font-normal uppercase leading-[0.92] text-ink"
            >
              What sits behind this.
            </SplitText>
          </div>
          <p className="max-w-[46ch] text-pretty text-sm leading-relaxed text-ink-muted">
            The pathway above is the interface. These are the services that will drive it, with
            their inputs and outputs already fixed — the frontend reads these shapes today against
            demonstration data, so the contract cannot drift while the backend is built.
          </p>
        </div>

        <ol data-backend-grid className="mt-14 grid gap-px md:grid-cols-2 xl:grid-cols-3">
          {BACKEND_PLAN.map((cap) => (
            <li
              key={cap.id}
              data-backend-card
              className="flex flex-col border-t-2 border-ink/12 pt-6 md:pr-10"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-meta uppercase text-stone">{cap.id}</span>
                <span
                  className={cn(
                    'border px-2.5 py-1 font-mono text-[0.5625rem] uppercase tracking-[0.12em]',
                    STATUS_TONE[cap.status],
                  )}
                >
                  {cap.status}
                </span>
              </div>

              <h3 className="mt-4 font-display text-2xl uppercase leading-none text-ink">
                {cap.title}
              </h3>
              <p className="mt-3 max-w-[38ch] flex-1 text-sm leading-relaxed text-ink-muted">
                {cap.summary}
              </p>

              <dl className="mt-6 space-y-3 border-t border-ink/10 pt-4">
                <div>
                  <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-stone">
                    Consumes
                  </dt>
                  <dd className="mt-1.5 text-xs leading-relaxed text-ink/70">
                    {cap.inputs.join(' · ')}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-stone">
                    Returns
                  </dt>
                  <dd className="mt-1.5 text-xs leading-relaxed text-ink/70">
                    {cap.outputs.join(' · ')}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>

        <p className="mt-14 max-w-[80ch] border-t border-ink/12 pt-6 text-sm leading-relaxed text-ink-muted">
          <span className="font-mono text-meta uppercase text-saffron">Honest scope · </span>
          Everything above the fold is working frontend running on demonstration data. Nothing here
          is presented as a live government system, and the corpus the simulator reads is simulated
          — because the historical pilot record is not yet published in structured form, which is
          part of what this platform exists to fix.
        </p>
      </div>
    </section>
  );
}
