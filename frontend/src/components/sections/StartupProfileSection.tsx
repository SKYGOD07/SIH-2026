'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { Counter, Label, SplitText } from '@/components/typography';
import { PRIMARY_STARTUP, COMPLIANCE_LABEL } from '@/data/startups';
import { formatLakh } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * VERIFY — the evidence profile behind a candidate.
 *
 * The evidence timeline is the argument of this section: founding, funding,
 * deployment, government pilot, validated result. Funding sits in that list as
 * one event among five, sized and coloured like the rest, because money raised
 * is a signal about investors, not about whether a solution works in a ward.
 */

const KIND_LABEL: Record<string, string> = {
  founding: 'Founding',
  funding: 'Funding',
  deployment: 'Deployment',
  pilot: 'Government pilot',
  validated: 'Validated result',
};

export function StartupProfileSection() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const s = PRIMARY_STARTUP;

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || reduced) return;

      gsap.from('[data-evidence-item]', {
        autoAlpha: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-evidence-timeline]', start: 'top 78%', once: true },
      });

      // The spine draws itself as the events arrive.
      gsap.fromTo(
        '[data-evidence-spine]',
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 1.4,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: '[data-evidence-timeline]', start: 'top 78%', once: true },
        },
      );

      gsap.from('[data-profile-stat]', {
        autoAlpha: 0,
        y: 22,
        duration: 0.7,
        stagger: 0.07,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-profile-stats]', start: 'top 84%', once: true },
      });
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  const stats = [
    { label: 'Technology', value: s.technologies.join(' + '), numeric: null },
    { label: 'Technology readiness', value: 'TRL ' + s.trl, numeric: null },
    { label: 'Government deployments', value: null, numeric: s.governmentDeployments },
    { label: 'Previous pilots', value: null, numeric: s.previousPilots },
    { label: 'Compliance', value: COMPLIANCE_LABEL[s.complianceStatus], numeric: null },
    { label: 'Pilot success score', value: null, numeric: s.pilotSuccessScore, suffix: ' / 100' },
  ];

  return (
    <section
      ref={rootRef}
      id="verify"
      aria-label="Verify — the evidence behind a candidate"
      className="relative w-full bg-ink py-[clamp(6rem,14vh,11rem)]"
    >
      <div className="edge mx-auto max-w-[110rem]">
        <Label index="03">Verify</Label>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-8">
          <SplitText
            as="h2"
            type="chars"
            stagger={0.028}
            className="font-display text-display-md font-medium uppercase leading-[0.88] text-ivory"
          >
            {s.name}
          </SplitText>
          <p className="max-w-[42ch] text-pretty text-base leading-relaxed text-silver">
            {s.summary}
          </p>
        </div>

        {/* --- the profile --- */}
        <dl
          data-profile-stats
          className="mt-14 grid gap-x-10 gap-y-8 border-t border-ivory/10 pt-10 sm:grid-cols-2 lg:grid-cols-3"
        >
          {stats.map((stat) => (
            <div key={stat.label} data-profile-stat>
              <dt className="font-mono text-meta uppercase text-silver">{stat.label}</dt>
              <dd className="mt-3 font-display text-3xl uppercase leading-none text-ivory">
                {stat.numeric !== null ? (
                  <Counter value={stat.numeric} suffix={stat.suffix ?? ''} duration={1.4} />
                ) : (
                  stat.value
                )}
              </dd>
            </div>
          ))}
        </dl>

        {/* --- the evidence timeline --- */}
        <div data-evidence-timeline className="mt-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Label tone="accent">Evidence timeline</Label>
            <p className="max-w-[46ch] text-xs leading-relaxed text-silver">
              Suitability is assessed from several independent evidence sources. Capital raised is
              recorded as one of them; it is not treated as a measure of quality, and it does not
              carry weight in the evaluation criteria.
            </p>
          </div>

          <ol className="relative mt-10 grid gap-y-10 md:grid-cols-5 md:gap-x-6">
            {/* the spine — horizontal on wide screens, vertical on narrow */}
            <span
              data-evidence-spine
              aria-hidden="true"
              className="absolute left-[3px] top-2 h-full w-px origin-top bg-gradient-to-b from-saffron/60 to-saffron/5 md:left-0 md:top-[7px] md:h-px md:w-full md:origin-left md:bg-gradient-to-r"
            />

            {s.evidence.map((e, i) => (
              <li key={e.year + e.label + i} data-evidence-item className="relative pl-8 md:pl-0 md:pt-8">
                <span
                  aria-hidden="true"
                  className={
                    'absolute left-0 top-1.5 block h-[7px] w-[7px] rounded-full md:top-1 ' +
                    (e.kind === 'validated' ? 'bg-validated' : 'bg-saffron')
                  }
                />
                <span className="block font-mono text-meta uppercase text-silver">{e.year}</span>
                <span className="mt-2 block font-display text-lg uppercase leading-tight text-ivory">
                  {KIND_LABEL[e.kind]}
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-ivory/65">{e.detail}</span>
                {e.kind === 'funding' ? (
                  <span className="mt-3 block font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver">
                    {formatLakh(s.fundingRaised)} · one signal, not a score
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
