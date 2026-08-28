'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

/**
 * The six outcomes the problem statement says the mechanism will be judged on,
 * each answered with a figure from this page rather than with a claim.
 *
 * This is the part of the console that exists for the person assessing the
 * mechanism rather than the officer running a pilot. Every row states where its
 * number came from, so a reader can go and check it — an outcome asserted in
 * prose and an outcome evidenced by the ledger look identical on a slide, and
 * only one of them survives being asked "from what?".
 *
 * Rows whose measurement is not yet possible say so. A blank is a finding.
 */

export interface OutcomeRow {
  /** The outcome, in the problem statement's own words. */
  outcome: string;
  /** The figure, or null where nothing can honestly be reported yet. */
  figure: string | null;
  /** Where the figure came from. */
  source: string;
}

export function OutcomeLedger({ rows }: { rows: OutcomeRow[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (!ref.current || reduced) return;
      gsap.from('[data-outcome]', {
        autoAlpha: 0,
        y: 16,
        duration: 0.6,
        stagger: 0.06,
        ease: 'expo.out',
        scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
      });
    },
    { scope: ref, dependencies: [reduced] },
  );

  return (
    <ol ref={ref} className="border-t border-chalk/15">
      {rows.map((row, i) => (
        <li
          key={row.outcome}
          data-outcome
          className="grid gap-x-8 gap-y-2 border-b border-chalk/12 py-5 md:grid-cols-[3rem_1fr_auto]"
        >
          <span className="font-mono text-meta uppercase text-chalk/40">
            {String(i + 1).padStart(2, '0')}
          </span>

          <span>
            <span className="block font-display text-base font-bold uppercase tracking-[-0.02em] text-chalk">
              {row.outcome}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-chalk/50">{row.source}</span>
          </span>

          <span
            className={cn(
              'self-center font-display text-xl font-extrabold tabular-nums md:text-right',
              row.figure ? 'text-signal' : 'text-chalk/35',
            )}
          >
            {row.figure ?? 'not yet measurable'}
          </span>
        </li>
      ))}
    </ol>
  );
}
