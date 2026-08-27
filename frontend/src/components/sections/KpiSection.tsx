'use client';

import { useMemo, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, SCRUB } from '@/lib/gsap';
import { Counter, Label } from '@/components/typography';
import { PRIMARY_PILOT } from '@/data/pilots';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { seeded, cn } from '@/lib/utils';

/**
 * MEASURE — "Don't ask whether it works. Measure it."
 *
 * The largest quantitative moment on the page. Baseline and result are drawn as
 * one continuous series rather than two numbers, so the improvement is a shape
 * before it is a figure — and the figure is derived from the series rather than
 * asserted next to it.
 */

const WEEKS = 13;

/** A plausible weekly water-loss series between the two measured endpoints. */
function buildSeries(baseline: number, result: number): number[] {
  const rand = seeded(4409);
  return Array.from({ length: WEEKS }, (_, i) => {
    const t = i / (WEEKS - 1);
    // Improvement is slow at first (deployment, baseline capture), then steepens.
    const eased = t < 0.3 ? t * 0.25 : 0.075 + Math.pow((t - 0.3) / 0.7, 0.75) * 0.925;
    const noise = (rand() - 0.5) * 0.8;
    return baseline + (result - baseline) * eased + noise;
  });
}

export function KpiSection() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  const water = PRIMARY_PILOT.metrics[0];
  const others = PRIMARY_PILOT.metrics.slice(1);
  const series = useMemo(() => buildSeries(water.baseline, water.result), [water]);

  const improvement = Math.round(((water.baseline - water.result) / water.baseline) * 100);

  const { linePath, areaPath } = useMemo(() => {
    const W = 1000;
    const H = 280;
    const min = 18;
    const max = 34;
    const pts = series.map((v, i) => {
      const x = (i / (WEEKS - 1)) * W;
      const y = H - ((v - min) / (max - min)) * H;
      return [x, y] as const;
    });
    const line = pts.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');
    return { linePath: line, areaPath: `${line} L ${W} ${H} L 0 ${H} Z` };
  }, [series]);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      if (reduced) {
        gsap.set('[data-kpi-line]', { strokeDashoffset: 0 });
        gsap.set('[data-kpi-area]', { autoAlpha: 1 });
        gsap.set('[data-kpi-after]', { autoAlpha: 1, y: 0 });
        gsap.set('[data-kpi-headline]', { autoAlpha: 1, scale: 1 });
        return;
      }

      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', () => build(5.5));
      mm.add('(max-width: 767px)', () => build(3.6));

      function build(length: number) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: () => '+=' + window.innerHeight * length,
            pin: true,
            scrub: SCRUB,
            anticipatePin: 1,
            invalidateOnRefresh: true
          }
        });

        tl.from('[data-kpi-baseline]', { autoAlpha: 0, y: 24, duration: 0.6 }, 0);

        // The series draws itself across the pin — the pilot happening, in one line.
        tl.fromTo(
          '[data-kpi-line]',
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 2.4, ease: 'none' },
          0.35,
        );
        tl.fromTo('[data-kpi-area]', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.6 }, 0.6);
        tl.fromTo(
          '[data-kpi-marker]',
          { autoAlpha: 0, scale: 0.4 },
          { autoAlpha: 1, scale: 1, duration: 0.4, stagger: 0.5, ease: 'back.out(2)' },
          1.2,
        );

        tl.fromTo(
          '[data-kpi-after]',
          { autoAlpha: 0, y: 28 },
          { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' },
          2.5,
        );

        // The headline lands last, after the evidence for it is on screen.
        tl.fromTo(
          '[data-kpi-headline]',
          { autoAlpha: 0, scale: 1.16 },
          { autoAlpha: 1, scale: 1, duration: 0.85, ease: 'expo.out' },
          3.1,
        );
        tl.from(
          '[data-kpi-secondary]',
          { autoAlpha: 0, y: 22, duration: 0.6, stagger: 0.09, ease: 'expo.out' },
          3.35,
        );
        tl.to({}, { duration: 0.7 });

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      }

      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={rootRef}
      id="kpi"
      aria-label="Measured pilot outcome"
      className="relative flex h-[100svh] w-full flex-col overflow-hidden ground-abyss"
    >
      <div className="edge mx-auto w-full max-w-[110rem] pt-[calc(var(--nav-safe)+clamp(0.75rem,3vh,2.5rem))]">
        <Label index="06">Outcome</Label>
        <h2 className="mt-5 max-w-[15ch] font-display text-display-sm font-medium uppercase leading-[0.9] text-ivory">
          Don’t ask whether it works. Measure it.
        </h2>
      </div>

      <div className="edge mx-auto grid w-full max-w-[110rem] flex-1 content-center gap-8 py-6 lg:grid-cols-[0.9fr_1.4fr]">
        {/* --- the numbers --- */}
        <div className="flex flex-col justify-center gap-10">
          <div data-kpi-baseline>
            <Label>Baseline · pre-pilot</Label>
            <p className="mt-3 font-display text-display-sm font-medium leading-none text-ivory/45">
              {water.baseline}
              {water.unit}
            </p>
            <p className="mt-2 font-mono text-meta uppercase text-silver">{water.label}</p>
          </div>

          <div data-kpi-after className="opacity-0">
            <Label tone="accent">After pilot · independently validated</Label>
            <p className="mt-3 font-display text-display-sm font-medium leading-none text-ivory">
              <Counter value={water.result} duration={1.6} />
              {water.unit}
            </p>
            <p className="mt-2 font-mono text-meta uppercase text-silver">{water.label}</p>
          </div>

          <div data-kpi-headline className="opacity-0">
            <p className="font-display text-display-md font-medium leading-[0.85] text-saffron">
              <Counter value={improvement} suffix="%" duration={1.4} />
            </p>
            <p className="mt-2 font-display text-2xl uppercase leading-none text-ivory">
              improvement
            </p>
          </div>
        </div>

        {/* --- the series --- */}
        <figure className="flex flex-col justify-center">
          <figcaption className="sr-only">
            Weekly non-revenue water loss across the pilot, falling from {water.baseline}% to{' '}
            {water.result}%.
          </figcaption>

          <svg
            viewBox="0 0 1000 280"
            className="h-auto w-full"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="kpi-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e8762b" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#e8762b" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* reference gridlines at whole percentages */}
            {[34, 30, 26, 22, 18].map((v) => {
              const y = 280 - ((v - 18) / 16) * 280;
              return (
                <g key={v}>
                  <line
                    x1="0"
                    y1={y}
                    x2="1000"
                    y2={y}
                    stroke="#f6f3ec"
                    strokeOpacity="0.08"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })}

            <path data-kpi-area d={areaPath} fill="url(#kpi-fill)" opacity="0" />
            <path
              data-kpi-line
              d={linePath}
              fill="none"
              stroke="#e8762b"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1}
              strokeLinecap="round"
            />
            <circle data-kpi-marker cx="0" cy={280 - ((water.baseline - 18) / 16) * 280} r="5" fill="#a6a49c" opacity="0" />
            <circle data-kpi-marker cx="1000" cy={280 - ((water.result - 18) / 16) * 280} r="6" fill="#e8762b" opacity="0" />
          </svg>

          <div className="mt-3 flex justify-between font-mono text-meta uppercase text-silver">
            <span>Week 01 · baseline</span>
            <span>Week 13 · validation</span>
          </div>
        </figure>
      </div>

      {/* --- secondary metrics --- */}
      <div className="edge mx-auto w-full max-w-[110rem] pb-[clamp(3rem,8vh,5rem)]">
        <dl className="grid gap-x-10 gap-y-6 border-t border-ivory/10 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((m) => {
            const delta = Math.round(((m.result - m.baseline) / m.baseline) * 100);
            const good =
              m.direction === 'lower-is-better' ? delta < 0 : delta > 0;
            return (
              <div key={m.label} data-kpi-secondary className="flex items-baseline justify-between gap-4">
                <dt className="font-mono text-meta uppercase text-silver">{m.label}</dt>
                <dd
                  className={cn(
                    'font-display text-2xl leading-none tabular-nums',
                    good ? 'text-validated-light' : 'text-risk',
                  )}
                >
                  {delta < 0 ? '↓' : '↑'} {Math.abs(delta)}%
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
