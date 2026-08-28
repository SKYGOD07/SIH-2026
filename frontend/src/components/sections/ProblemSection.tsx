'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { Label, SplitText } from '@/components/typography';
import { DEPARTMENT_PAINS, STARTUP_PAINS } from '@/data/pathway';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * The problem, stated once.
 *
 * Two columns, because the problem statement describes two parties failing to
 * reach each other — a department that cannot buy innovation and a startup that
 * cannot sell to government. Showing them side by side makes the gap the subject
 * of the section, which is what the rest of the page then closes.
 *
 * Deliberately a short, static section. The earlier build spent three pinned
 * screens on this idea; it needed one.
 */
export function ProblemSection() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (!rootRef.current || reduced) return;

      gsap.from('[data-pain]', {
        autoAlpha: 0,
        y: 16,
        duration: 0.55,
        stagger: 0.045,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-pains]', start: 'top 82%', once: true },
      });

      gsap.fromTo(
        '[data-gap-rule]',
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 1.1,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: '[data-pains]', start: 'top 82%', once: true },
        },
      );
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={rootRef}
      id="problem"
      aria-label="The problem"
      className="relative w-full ground-void py-[clamp(5rem,12vh,9rem)]"
    >
      <div className="edge mx-auto max-w-[110rem]">
        <Label index="00">The problem</Label>

        <SplitText
          as="h2"
          type="lines"
          className="mt-6 max-w-[24ch] font-display text-display-md font-normal uppercase leading-[0.92] text-chalk"
        >
          Procurement built for standard goods, asked to buy the unproven.
        </SplitText>

        <div
          data-pains
          className="relative mt-16 grid gap-x-16 gap-y-12 md:grid-cols-2"
        >
          {/* the gap between the two columns, drawn */}
          <span
            data-gap-rule
            aria-hidden="true"
            className="absolute left-1/2 top-0 hidden h-full w-px origin-top bg-chalk/15 md:block"
          />

          <div>
            <Label tone="accent">Departments cannot</Label>
            <ul className="mt-6">
              {DEPARTMENT_PAINS.map((pain) => (
                <li
                  key={pain}
                  data-pain
                  className="border-b border-chalk/12 py-3 text-base leading-snug text-chalk"
                >
                  {pain}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Label tone="accent">Startups face</Label>
            <ul className="mt-6">
              {STARTUP_PAINS.map((pain) => (
                <li
                  key={pain}
                  data-pain
                  className="border-b border-chalk/12 py-3 text-base leading-snug text-chalk"
                >
                  {pain}
                </li>
              ))}
            </ul>
            <p className="mt-8 max-w-[38ch] text-sm leading-relaxed text-chalk/55">
              Neither side is behaving badly. The rules were written for buying desks and diesel,
              and they are being applied to buying something nobody has proven yet.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
