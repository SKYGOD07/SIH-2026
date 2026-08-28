'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

/**
 * What the corpus actually knows, by domain.
 *
 * The simulator's advice is only as good as the pilots behind it, so the shape
 * of the evidence base belongs on the console rather than buried in an API
 * response. Each bar is the pilots recorded in that domain; the filled portion
 * is the ones that met their target.
 *
 * The rule at four is the reporting threshold. Below it the simulator still
 * runs, but reports its confidence band as context rather than as a finding —
 * drawing the threshold makes that a visible property of the data instead of a
 * caveat in a footnote nobody reads.
 */

export interface DomainCoverage {
  domain: string;
  total: number;
  met: number;
}

/** Fewer comparable pilots than this and a confidence ratio is not a finding. */
const REPORTING_THRESHOLD = 4;

export function EvidenceBaseChart({
  domains,
  thinDomains,
}: {
  domains: DomainCoverage[];
  thinDomains: string[];
}) {
  const ref = useRef<HTMLOListElement>(null);
  const reduced = usePrefersReducedMotion();

  const longest = Math.max(REPORTING_THRESHOLD + 1, ...domains.map((d) => d.total));
  const pct = (n: number) => (n / longest) * 100;

  useGSAP(
    () => {
      if (!ref.current || reduced) return;
      gsap.from('[data-bar]', {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 0.85,
        stagger: 0.07,
        ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
      });
    },
    { scope: ref, dependencies: [reduced] },
  );

  return (
    <div>
      <ol ref={ref} className="relative">
        {/* The reporting threshold, drawn once across every bar. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 z-10 w-px border-l border-dashed border-chalk/35"
          style={{ left: `${pct(REPORTING_THRESHOLD)}%` }}
        >
          <span className="absolute -top-5 left-2 whitespace-nowrap font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-chalk/45">
            Advisable from {REPORTING_THRESHOLD}
          </span>
        </span>

        {domains.map((d) => {
          const thin = thinDomains.includes(d.domain);
          return (
            <li key={d.domain} className="border-b border-chalk/12 py-3.5">
              <div className="flex items-baseline justify-between gap-6">
                <span className="text-sm text-chalk">{d.domain.replace(/-/g, ' ')}</span>
                <span className="flex items-baseline gap-5 font-mono text-meta uppercase">
                  <span className="text-chalk/50">
                    {d.met} met of {d.total}
                  </span>
                  <span className={thin ? 'text-signal' : 'text-validated'}>
                    {thin ? 'too thin' : 'advisable'}
                  </span>
                </span>
              </div>

              <div className="relative mt-2.5 h-2 w-full bg-chalk/[0.07]">
                {/* Everything recorded, then the portion that met its target. */}
                <span
                  data-bar
                  className={cn(
                    'absolute inset-y-0 left-0 border',
                    thin ? 'border-signal/60' : 'border-validated/60',
                  )}
                  style={{ width: `${pct(d.total)}%` }}
                />
                <span
                  data-bar
                  className={cn('absolute inset-y-0 left-0', thin ? 'bg-signal' : 'bg-validated')}
                  style={{ width: `${pct(d.met)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ol>

      <ul className="mt-5 flex flex-wrap gap-x-7 gap-y-2 font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-chalk/45">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-2 w-4 bg-validated" /> Met its target
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-2 w-4 border border-validated/60" /> Recorded
        </li>
      </ul>
    </div>
  );
}
