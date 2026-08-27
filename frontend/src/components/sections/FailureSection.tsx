'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { Label, SplitText } from '@/components/typography';
import { FAILURE_RECORDS } from '@/data/knowledge';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * The failure registry.
 *
 * Short, and deliberately unglamorous. A pilot that misses its target still
 * produces a rule that the next department inherits — which is the only reason
 * a department can afford to try something unproven in the first place.
 */
export function FailureSection() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || reduced) return;

      gsap.from('[data-failure]', {
        autoAlpha: 0,
        y: 40,
        duration: 0.9,
        stagger: 0.14,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-failures]', start: 'top 80%', once: true },
      });

      // The lesson travels out of the failed pilot and into the graph.
      gsap.fromTo(
        '[data-lesson-trace]',
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          duration: 1.3,
          stagger: 0.2,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: '[data-failures]', start: 'top 74%', once: true },
        },
      );
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={rootRef}
      id="failure"
      aria-label="Failure registry"
      className="relative w-full bg-ink py-[clamp(5rem,12vh,9rem)]"
    >
      <div className="edge mx-auto max-w-[110rem]">
        <div className="flex flex-wrap items-end justify-between gap-8 border-t border-risk/40 pt-8">
          <div>
            <Label tone="risk">Failure registry</Label>
            <SplitText
              as="h2"
              type="chars"
              stagger={0.025}
              className="mt-5 font-display text-display-md font-medium uppercase leading-[0.88] text-ivory"
            >
              Failure is data.
            </SplitText>
          </div>
          <p className="max-w-[40ch] text-pretty text-base leading-relaxed text-silver">
            A pilot that misses its target is not a write-off. It is the only cheap way to learn a
            constraint before it is written into a full procurement.
          </p>
        </div>

        <ul data-failures className="mt-14 grid gap-10 lg:grid-cols-2">
          {FAILURE_RECORDS.map((f) => (
            <li key={f.id} data-failure className="panel p-8">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-2xl uppercase leading-none text-ivory">
                  {f.title}
                </h3>
                <span className="font-mono text-meta uppercase text-silver">{f.id}</span>
              </div>
              <p className="mt-2 font-mono text-meta uppercase text-silver">{f.department}</p>

              <dl className="mt-8 space-y-5">
                <div>
                  <dt className="font-mono text-meta uppercase text-risk">Result</dt>
                  <dd className="mt-1.5 text-base text-ivory/85">{f.result}</dd>
                </div>
                <div>
                  <dt className="font-mono text-meta uppercase text-silver">Cause</dt>
                  <dd className="mt-1.5 text-base text-ivory/85">{f.cause}</dd>
                </div>
                <div>
                  <dt className="font-mono text-meta uppercase text-saffron">Lesson</dt>
                  <dd className="mt-1.5 text-base text-ivory">{f.lesson}</dd>
                </div>
              </dl>

              {/* the trace from this record into the graph */}
              <svg
                viewBox="0 0 400 40"
                className="mt-8 h-10 w-full"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  data-lesson-trace
                  d="M 4 4 C 4 30, 200 10, 396 36"
                  fill="none"
                  stroke="#e4762a"
                  strokeOpacity="0.5"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1}
                />
              </svg>

              <p className="border-t border-ivory/10 pt-4 text-sm leading-relaxed text-validated-light">
                {f.ruleAdded}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
