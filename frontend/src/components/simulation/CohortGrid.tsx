'use client';

import { useEffect, useState } from 'react';

/**
 * The cohort, resolving.
 *
 * One cell per company in the cohort. Cells darken as the current pass reaches
 * them, so the grid fills left to right while a pass runs and resets for the
 * next one. It is the work, drawn — not an animation timed to look like work.
 *
 * That distinction is the whole point, and it is the same argument `Radar.tsx`
 * makes: a progress display driven by a timer rather than by state is a spinner
 * in costume, and it lies in exactly the situation where honesty matters — when
 * the job has stalled. Here, if the run stops advancing the grid stops filling.
 *
 * Screened-out companies are drawn too, in a flat inactive tone. Seeing that
 * two thirds of the cohort was excluded is information; hiding them would make
 * a broken screen indistinguishable from a small eligible set.
 */

export function CohortGrid({
  cohortSize,
  eligibleCount,
  companiesDone,
  running,
}: {
  cohortSize: number;
  eligibleCount: number;
  companiesDone: number;
  running: boolean;
}) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  if (cohortSize === 0) {
    return (
      <div className="card flex h-[168px] items-center justify-center text-[0.75rem] text-chalk/35">
        Reading the cohort…
      </div>
    );
  }

  const excluded = cohortSize - eligibleCount;

  return (
    <div className="card p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/40">
          Cohort
        </span>
        <span className="font-mono text-[0.625rem] text-chalk/45">
          {companiesDone}/{eligibleCount} this pass · {excluded} screened out
        </span>
      </div>

      <div
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(7px, 1fr))' }}
        role="img"
        aria-label={`${companiesDone} of ${eligibleCount} eligible companies simulated in the current pass; ${excluded} of ${cohortSize} screened out`}
      >
        {Array.from({ length: cohortSize }, (_, i) => {
          // Eligible companies occupy the first slots, so the fill front is a
          // readable edge rather than scattered specks.
          const isEligible = i < eligibleCount;
          const done = isEligible && i < companiesDone;
          const atFront = running && !reduced && isEligible && i >= companiesDone && i < companiesDone + 3;

          return (
            <span
              key={i}
              className={`aspect-square rounded-[1px] ${
                done
                  ? 'bg-signal'
                  : atFront
                    ? 'animate-pulse bg-signal/45'
                    : isEligible
                      ? 'bg-chalk/15'
                      : 'bg-chalk/[0.055]'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
