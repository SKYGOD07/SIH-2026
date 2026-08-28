'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import type { PaymentTiming } from '@/lib/api/mahainnovate';
import { cn } from '@/lib/utils';

/**
 * How long money actually took to reach the startup.
 *
 * The problem statement asks for timely startup payments, which is the one
 * outcome on this page that cannot be asserted — only measured. So it is drawn
 * rather than stated, and drawn against the service standard the pathway
 * commits to, because an elapsed figure with nothing to compare it to is
 * decoration.
 *
 * Each bar is split at approval. Time sitting in the department and time
 * sitting in the payment run are different failures with different fixes, and
 * a single elapsed total hides which one is happening.
 *
 * A milestone still waiting is drawn hollow, in the risk tone, at its current
 * age — never folded into the median. It is precisely the bar an officer
 * opened this page to find.
 */
export function PaymentTimingChart({ timing }: { timing: PaymentTiming }) {
  const ref = useRef<HTMLOListElement>(null);
  const reduced = usePrefersReducedMotion();

  // The scale runs to whatever is longest — the target, or the worst case — so
  // a breach is always visibly past the target rule rather than clipped at it.
  const longest = Math.max(
    timing.targetDays,
    ...timing.milestones.map((m) => m.daysToPay ?? m.waitingDays ?? 0),
  );
  const scale = longest * 1.12 || 1;
  const pct = (days: number) => (days / scale) * 100;

  useGSAP(
    () => {
      if (!ref.current || reduced) return;
      gsap.from('[data-bar]', {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 0.9,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
      });
    },
    { scope: ref, dependencies: [reduced] },
  );

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <p className="font-display text-display-sm font-extrabold text-chalk">
          {timing.medianDaysToPay ?? '—'}
          <span className="text-chalk/50"> day median, filed to paid</span>
        </p>
        <p className="font-mono text-meta uppercase text-chalk/50">
          {timing.settledCount} settled · {timing.breachedCount} over target
        </p>
      </div>

      <ol ref={ref} className="relative mt-8">
        {/* The service standard, drawn once across every bar. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 z-10 w-px border-l border-dashed border-chalk/35"
          style={{ left: `${pct(timing.targetDays)}%` }}
        >
          <span className="absolute -top-5 left-2 whitespace-nowrap font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-chalk/45">
            Target · {timing.targetDays}d
          </span>
        </span>

        {timing.milestones.map((m) => {
          const open = m.daysToPay === null;
          const waiting = m.waitingDays ?? 0;

          return (
            <li key={m.code} className="border-b border-chalk/12 py-4">
              <div className="flex items-baseline justify-between gap-6">
                <span className="flex items-baseline gap-4">
                  <span className="font-mono text-meta uppercase text-chalk/50">{m.code}</span>
                  <span className="text-sm text-chalk">{m.title}</span>
                </span>
                <span
                  className={cn(
                    'font-mono text-meta uppercase',
                    open
                      ? waiting > timing.targetDays
                        ? 'text-risk'
                        : 'text-signal'
                      : 'text-validated',
                  )}
                >
                  {open ? `waiting ${waiting}d` : `${m.daysToPay}d`}
                </span>
              </div>

              <div className="relative mt-3 h-2 w-full bg-chalk/[0.07]">
                {open ? (
                  // Hollow: this time has been spent, but nothing has completed.
                  <span
                    data-bar
                    className={cn(
                      'absolute inset-y-0 left-0 border',
                      waiting > timing.targetDays ? 'border-risk' : 'border-signal',
                    )}
                    style={{ width: `${pct(waiting)}%` }}
                  />
                ) : (
                  <>
                    <span
                      data-bar
                      className="absolute inset-y-0 left-0 bg-signal"
                      style={{ width: `${pct(m.daysToDecide ?? 0)}%` }}
                    />
                    <span
                      data-bar
                      className="absolute inset-y-0 bg-validated"
                      style={{
                        left: `${pct(m.daysToDecide ?? 0)}%`,
                        width: `${pct(m.daysToRelease ?? 0)}%`,
                      }}
                    />
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <ul className="mt-5 flex flex-wrap gap-x-7 gap-y-2 font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-chalk/45">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-2 w-4 bg-signal" /> With the department
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-2 w-4 bg-validated" /> In payment
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-2 w-4 border border-risk" /> Still waiting
        </li>
      </ul>
    </div>
  );
}
