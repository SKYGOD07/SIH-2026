'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Deck, Slide } from './Deck';
import { useSlideReveal } from './useSlideReveal';
import { PATHWAY, DEPARTMENT_PAINS, STARTUP_PAINS } from '@/data/pathway';
import { cn } from '@/lib/utils';

/**
 * The landing deck.
 *
 * Eight slides, read sideways:
 *
 *   01 the pathway    02 the problem   03 the idea      04 the mechanism
 *   05 what is built  06 what it does  07 what it refuses   08 the way in
 *
 * The type is doing the work. Poppins at 800/900, set very large with tight
 * negative tracking, on black — weight rather than refinement, which is the
 * register the reference sites use and the one that survives being projected
 * on a wall at the back of a hall.
 *
 * The word budget is the design constraint. A slide gets a label, a headline
 * and one figure; anything that will not fit that shape belongs on a product
 * route or in the dashboard, where a reader who wants it is already going.
 */

/** The deck's one headline treatment. Heavy, tight, upper case. */
function Head({
  children,
  size = 'lg',
  invert = false,
  className,
}: {
  children: ReactNode;
  size?: 'lg' | 'xl' | 'md';
  invert?: boolean;
  className?: string;
}) {
  return (
    <h2
      data-reveal
      className={cn(
        'font-display font-black uppercase',
        size === 'xl' ? 'text-display-xl' : size === 'lg' ? 'text-display-lg' : 'text-display-md',
        invert ? 'text-void' : 'text-chalk',
        className,
      )}
    >
      {children}
    </h2>
  );
}

/** The single line under a headline. One line — never two. */
function Line({ children, invert = false }: { children: ReactNode; invert?: boolean }) {
  return (
    <p
      data-reveal
      className={cn(
        'mt-[clamp(1.25rem,3vh,2rem)] max-w-[46ch] text-[0.9375rem] leading-relaxed',
        invert ? 'text-void/70' : 'text-chalk/55',
      )}
    >
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ 01 */

function Opening() {
  const ref = useSlideReveal<HTMLDivElement>();
  return (
    <Slide index="01" label="MahaInnovate" id="deck-opening">
      <div ref={ref}>
        <Head size="xl" className="max-w-[13ch]">
          Identify. Pilot. Procure. Scale.
        </Head>
        <Line>
          A startup-friendly procurement pathway for Government of Maharashtra departments — one
          record from the first challenge to the final award.
        </Line>
      </div>
    </Slide>
  );
}

/* ------------------------------------------------------------------ 02 */

function Problem() {
  const ref = useSlideReveal<HTMLDivElement>();
  return (
    <Slide index="02" label="The problem" id="deck-problem">
      <div ref={ref}>
        <Head className="max-w-[16ch]">
          Rules written for desks and diesel, applied to the unproven.
        </Head>

        <div className="mt-[clamp(2rem,6vh,4rem)] grid max-w-[68rem] gap-x-14 gap-y-8 sm:grid-cols-2">
          <div data-reveal>
            <span className="font-mono text-meta uppercase text-signal">Departments cannot</span>
            <ul className="mt-4 border-t border-chalk/12">
              {DEPARTMENT_PAINS.slice(0, 4).map((pain) => (
                <li key={pain} className="border-b border-chalk/12 py-2.5 text-sm text-chalk/85">
                  {pain}
                </li>
              ))}
            </ul>
          </div>
          <div data-reveal>
            <span className="font-mono text-meta uppercase text-signal">Startups face</span>
            <ul className="mt-4 border-t border-chalk/12">
              {STARTUP_PAINS.slice(0, 4).map((pain) => (
                <li key={pain} className="border-b border-chalk/12 py-2.5 text-sm text-chalk/85">
                  {pain}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Slide>
  );
}

/* ------------------------------------------------------------------ 03 */

/** Every comparable pilot already run, converging into one designed pilot. */
function Convergence() {
  const rows = [0, 1, 2, 3, 4];
  return (
    <div data-reveal className="max-w-[60rem]">
      <svg viewBox="0 0 1000 220" className="h-auto w-full" aria-hidden="true">
        {rows.map((i) => {
          const y = 24 + i * 43;
          return (
            <g key={i}>
              <circle cx="46" cy={y} r="4" fill="#FFFFFF" fillOpacity="0.5" />
              <path
                d={`M 58 ${y} C 380 ${y}, 520 110, 856 110`}
                fill="none"
                stroke="#FFC400"
                strokeOpacity="0.45"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
        <circle cx="876" cy="110" r="14" fill="#FFC400" />
      </svg>
      <div className="mt-4 flex justify-between font-mono text-meta uppercase text-chalk/45">
        <span>Comparable pilots already run</span>
        <span className="text-signal">One designed pilot</span>
      </div>
    </div>
  );
}

function Idea() {
  const ref = useSlideReveal<HTMLDivElement>();
  return (
    <Slide index="03" label="What our idea is" id="deck-idea">
      <div ref={ref}>
        <Head className="max-w-[15ch]">Design the pilot from evidence, before it is funded.</Head>
        <div className="mt-[clamp(2rem,6vh,3.5rem)]">
          <Convergence />
        </div>
        <Line>
          It does not forecast success. It reads what comparable pilots actually needed, and turns
          that into scope, duration, milestones and thresholds.
        </Line>
      </div>
    </Slide>
  );
}

/* ------------------------------------------------------------------ 04 */

function Mechanism() {
  const ref = useSlideReveal<HTMLDivElement>();
  return (
    <Slide index="04" label="The mechanism" id="deck-mechanism">
      <div ref={ref}>
        <Head size="md" className="max-w-[18ch]">
          Ten stages. Seven templates. One record.
        </Head>

        <ol
          data-reveal
          className="mt-[clamp(2rem,6vh,3.5rem)] flex max-w-[76rem] flex-wrap gap-x-px gap-y-4"
        >
          {PATHWAY.map((stage) => (
            <li
              key={stage.id}
              className={cn(
                'min-w-[6.5rem] flex-1 border-t pt-3',
                stage.isOurs ? 'border-signal' : 'border-chalk/25',
              )}
            >
              <span
                className={cn(
                  'block font-mono text-[0.5625rem] uppercase tracking-[0.16em]',
                  stage.isOurs ? 'text-signal' : 'text-chalk/40',
                )}
              >
                {stage.index}
              </span>
              <span className="mt-1.5 block font-display text-sm font-bold uppercase tracking-[-0.01em] text-chalk">
                {stage.label}
              </span>
            </li>
          ))}
        </ol>

        <Line>
          Every stage the problem statement names, in its order. Stage 05 is the one addition: the
          simulation that designs the pilot before a rupee is committed.
        </Line>
      </div>
    </Slide>
  );
}

/* ------------------------------------------------------------------ 05 */

const SERVICES = [
  { id: 'BE-01', name: 'Pilot corpus' },
  { id: 'BE-02', name: 'Comparable retrieval' },
  { id: 'BE-03', name: 'Design & risk engine' },
  { id: 'BE-04', name: 'Policy retrieval' },
  { id: 'BE-05', name: 'Milestone ledger' },
  { id: 'BE-06', name: 'Feedback loop' },
];

function Built() {
  const ref = useSlideReveal<HTMLDivElement>();
  return (
    <Slide index="05" label="What we have built" id="deck-built">
      <div ref={ref}>
        <Head className="max-w-[12ch]">Six services. All running.</Head>

        <ol
          data-reveal
          className="mt-[clamp(1.75rem,5vh,3rem)] max-w-[64rem] border-t border-chalk/15"
        >
          {SERVICES.map((service) => (
            <li
              key={service.id}
              className="flex items-center gap-6 border-b border-chalk/12 py-3.5 sm:gap-10"
            >
              <span className="w-16 shrink-0 font-mono text-meta uppercase text-chalk/40">
                {service.id}
              </span>
              <span className="flex-1 font-display text-lg font-bold uppercase tracking-[-0.02em] text-chalk">
                {service.name}
              </span>
              <span className="shrink-0 font-mono text-meta uppercase text-validated">Running</span>
            </li>
          ))}
        </ol>

        <Line>
          Storage sits behind repository interfaces, so the database drops in without touching a
          single service.
        </Line>
      </div>
    </Slide>
  );
}

/* ------------------------------------------------------------------ 06 */

const OUTPUTS = [
  { n: '01', name: 'Pilot design', figure: '90 → 120 days', bar: 'bg-signal' },
  { n: '02', name: 'Risk register', figure: '2 preconditions', bar: 'bg-risk' },
  { n: '03', name: 'Confidence', figure: '2 of 5 met', bar: 'bg-validated' },
];

function Capability() {
  const ref = useSlideReveal<HTMLDivElement>();
  return (
    <Slide index="06" label="What it can do" id="deck-capability">
      <div ref={ref}>
        <Head className="max-w-[14ch]">Three outputs. Every one cited.</Head>

        <div
          data-reveal
          className="mt-[clamp(2rem,6vh,3.5rem)] grid max-w-[64rem] gap-x-12 gap-y-8 sm:grid-cols-3"
        >
          {OUTPUTS.map((output) => (
            <div key={output.n}>
              <span className="font-mono text-meta uppercase text-chalk/40">{output.n}</span>
              <p className="mt-2 font-display text-display-xs font-extrabold uppercase text-chalk">
                {output.name}
              </p>
              <span className="mt-4 block h-[3px] w-full bg-chalk/12">
                <span className={cn('block h-[3px] w-full', output.bar)} />
              </span>
              <p className="mt-3 font-mono text-meta uppercase text-chalk/55">{output.figure}</p>
            </div>
          ))}
        </div>

        <Line>Each figure traces back to the prior pilots it was derived from, by id.</Line>
      </div>
    </Slide>
  );
}

/* ------------------------------------------------------------------ 07 */

const REFUSALS = [
  'Predict whether a pilot will succeed',
  'Release payment before evidence is validated',
  'Record a failure without a named cause',
  'Answer a policy question it has no clause for',
];

function Refusals() {
  const ref = useSlideReveal<HTMLDivElement>();
  return (
    <Slide index="07" label="What it refuses" id="deck-refusals" invert>
      <div ref={ref}>
        <Head invert className="max-w-[14ch]">
          Four things it will not do.
        </Head>

        <ol
          data-reveal
          className="mt-[clamp(1.75rem,5vh,3rem)] max-w-[56rem] border-t border-void/20"
        >
          {REFUSALS.map((refusal, i) => (
            <li
              key={refusal}
              className="flex items-baseline gap-6 border-b border-void/20 py-3.5 text-void"
            >
              <span className="font-mono text-meta uppercase opacity-60">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-display text-lg font-bold uppercase tracking-[-0.02em]">
                {refusal}
              </span>
            </li>
          ))}
        </ol>

        <Line invert>
          A procurement system that cannot say no is not a procurement system. Each refusal is
          enforced in code, not in guidance.
        </Line>
      </div>
    </Slide>
  );
}

/* ------------------------------------------------------------------ 08 */

function WayIn() {
  const ref = useSlideReveal<HTMLDivElement>();
  return (
    <Slide index="08" label="The way in" id="deck-enter">
      <div ref={ref}>
        <Head size="xl" className="max-w-[11ch]">
          See it running.
        </Head>

        <div data-reveal className="mt-[clamp(2rem,5vh,3rem)] flex flex-wrap items-center gap-4">
          <Link
            href="/dashboard"
            data-cursor="enter"
            className="inline-flex items-center gap-3 rounded-full bg-chalk px-7 py-3.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-void transition-colors hover:bg-signal"
          >
            Open the dashboard
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/pilots"
            data-cursor="open"
            className="inline-flex items-center gap-3 rounded-full border border-chalk/25 px-7 py-3.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-chalk transition-colors hover:border-signal hover:text-signal"
          >
            Browse pilots
          </Link>
        </div>

        <Line>
          Smart India Hackathon · Government of Maharashtra · startup-friendly public procurement.
        </Line>
      </div>
    </Slide>
  );
}

/* ------------------------------------------------------------------ */

const CHAPTERS = [
  'Pathway',
  'Problem',
  'Idea',
  'Mechanism',
  'Built',
  'Capability',
  'Refusals',
  'Enter',
];

export function LandingDeck() {
  return (
    <Deck chapters={CHAPTERS}>
      <Opening />
      <Problem />
      <Idea />
      <Mechanism />
      <Built />
      <Capability />
      <Refusals />
      <WayIn />
    </Deck>
  );
}
