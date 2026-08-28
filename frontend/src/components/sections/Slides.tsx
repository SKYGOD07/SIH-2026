'use client';

import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { Accent, Label } from '@/components/typography';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

/**
 * The three slides: the idea, what is built, what it does.
 *
 * These replace four prose-heavy sections that between them carried 650 words —
 * more than the entire reference site, which runs 274 words across its whole
 * page at roughly 23 words per screen.
 *
 * The rule applied here is that rule: one label, one headline, one figure, and
 * nothing else. Every fact that used to be a paragraph is either shown as a
 * moving graphic or cut. Detail that a reader genuinely needs lives on the
 * product routes and in the API, not stacked on the landing page.
 */

function Slide({
  index,
  label,
  headline,
  figure,
  footnote,
  tone = 'paper',
}: {
  index: string;
  label: string;
  headline: ReactNode;
  figure: ReactNode;
  footnote?: string;
  tone?: 'paper' | 'bone';
}) {
  return (
    <section
      aria-label={label}
      className={cn(
        'relative flex min-h-[100svh] w-full flex-col justify-center py-[clamp(5rem,12vh,9rem)]',
        tone === 'paper' ? 'ground-void' : 'ground-void',
      )}
    >
      <div className="edge mx-auto w-full max-w-[110rem]">
        <Label index={index}>{label}</Label>

        <h2 className="mt-8 max-w-[15ch] font-display text-display-lg font-normal text-chalk">
          {headline}
        </h2>

        <div className="mt-[clamp(3rem,8vh,6rem)]">{figure}</div>

        {footnote ? (
          <p className="mt-12 max-w-[44ch] font-mono text-meta uppercase leading-relaxed text-chalk/50">
            {footnote}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 01 — the idea                                                       */
/* ------------------------------------------------------------------ */

/** Five prior pilots converging into one designed pilot. */
function ConvergenceFigure() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (!ref.current || reduced) return;

      gsap.fromTo(
        '[data-thread]',
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          duration: 1.4,
          stagger: 0.12,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: ref.current, start: 'top 78%', once: true },
        },
      );

      gsap.from('[data-origin]', {
        opacity: 0,
        x: -30,
        duration: 0.8,
        stagger: 0.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: ref.current, start: 'top 78%', once: true },
      });

      gsap.from('[data-result]', {
        opacity: 0,
        scale: 0.4,
        transformOrigin: 'center',
        duration: 0.9,
        ease: 'back.out(1.6)',
        scrollTrigger: { trigger: ref.current, start: 'top 62%', once: true },
      });
    },
    { scope: ref, dependencies: [reduced] },
  );

  const rows = [0, 1, 2, 3, 4];

  return (
    <div ref={ref}>
      <svg viewBox="0 0 1000 260" className="h-auto w-full" aria-hidden="true">
        {rows.map((i) => {
          const y = 30 + i * 50;
          return (
            <g key={i}>
              <circle data-origin cx="60" cy={y} r="5" fill="#8A8780" />
              <path
                data-thread
                d={`M 72 ${y} C 380 ${y}, 520 130, 860 130`}
                fill="none"
                stroke="#D2590F"
                strokeOpacity="0.4"
                strokeWidth="1.2"
                vectorEffect="non-scaling-stroke"
                pathLength={1}
                strokeDasharray={1}
              />
            </g>
          );
        })}
        <circle data-result cx="880" cy="130" r="16" fill="#D2590F" />
      </svg>

      <div className="mt-6 flex justify-between font-mono text-meta uppercase text-chalk/50">
        <span>Every comparable pilot already run</span>
        <span className="text-signal">One designed pilot</span>
      </div>
    </div>
  );
}

export function IdeaSlide() {
  return (
    <Slide
      index="02"
      label="The idea"
      headline={
        <>
          Design the pilot from <Accent>evidence</Accent>, before it is funded.
        </>
      }
      figure={<ConvergenceFigure />}
      footnote="It does not predict success. It reads what comparable pilots needed."
    />
  );
}

/* ------------------------------------------------------------------ */
/* 02 — what is built                                                  */
/* ------------------------------------------------------------------ */

const SERVICES: { id: string; name: string; state: 'live' | 'schema' }[] = [
  { id: 'BE-01', name: 'Pilot corpus', state: 'live' },
  { id: 'BE-02', name: 'Comparable retrieval', state: 'live' },
  { id: 'BE-03', name: 'Design & risk engine', state: 'live' },
  { id: 'BE-04', name: 'Policy retrieval', state: 'live' },
  { id: 'BE-05', name: 'Milestone ledger', state: 'live' },
  { id: 'BE-06', name: 'Feedback loop', state: 'live' },
];

function ServicesFigure() {
  const ref = useRef<HTMLOListElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (!ref.current || reduced) return;
      gsap.from('[data-service]', {
        opacity: 0,
        y: 18,
        duration: 0.6,
        stagger: 0.07,
        ease: 'expo.out',
        scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true },
      });
      gsap.fromTo(
        '[data-service-bar]',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.9,
          stagger: 0.07,
          ease: 'power3.out',
          scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true },
        },
      );
    },
    { scope: ref, dependencies: [reduced] },
  );

  return (
    <ol ref={ref} className="border-t border-chalk/15">
      {SERVICES.map((s) => (
        <li
          key={s.id}
          data-service
          className="flex items-center gap-6 border-b border-chalk/12 py-5 sm:gap-10"
        >
          <span className="w-16 shrink-0 font-mono text-meta uppercase text-chalk/50">{s.id}</span>
          <span className="flex-1 font-display text-2xl font-normal text-chalk">{s.name}</span>
          <span className="hidden h-px w-32 bg-chalk/12 sm:block">
            <span data-service-bar className="block h-px origin-left bg-validated" />
          </span>
          <span className="w-20 shrink-0 text-right font-mono text-meta uppercase text-validated">
            Running
          </span>
        </li>
      ))}
    </ol>
  );
}

export function BuiltSlide() {
  return (
    <Slide
      index="03"
      label="What is built"
      tone="bone"
      headline={
        <>
          Six services. <Accent>One</Accent> record.
        </>
      }
      figure={<ServicesFigure />}
      footnote="Database left out by design. Storage sits behind interfaces."
    />
  );
}

/* ------------------------------------------------------------------ */
/* 03 — what it does                                                   */
/* ------------------------------------------------------------------ */

function OutputsFigure() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (!ref.current || reduced) return;
      gsap.fromTo(
        '[data-band]',
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: 'left',
          duration: 1.1,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true },
        },
      );
      gsap.from('[data-output]', {
        opacity: 0,
        y: 20,
        duration: 0.7,
        stagger: 0.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true },
      });
    },
    { scope: ref, dependencies: [reduced] },
  );

  const outputs = [
    { n: '01', name: 'Pilot design', figure: '90 → 120 days', tone: 'bg-signal' },
    { n: '02', name: 'Risk register', figure: '2 preconditions', tone: 'bg-risk' },
    { n: '03', name: 'Confidence', figure: '2 of 5 met', tone: 'bg-validated' },
  ];

  return (
    <div ref={ref} className="grid gap-x-12 gap-y-10 sm:grid-cols-3">
      {outputs.map((o) => (
        <div key={o.n} data-output>
          <span className="font-mono text-meta uppercase text-chalk/50">{o.n}</span>
          <p className="mt-3 font-display text-display-xs font-normal text-chalk">{o.name}</p>
          <span className="mt-5 block h-[3px] w-full bg-chalk/12">
            <span data-band className={cn('block h-[3px] w-full origin-left', o.tone)} />
          </span>
          <p className="mt-4 font-mono text-meta uppercase text-chalk/55">{o.figure}</p>
        </div>
      ))}
    </div>
  );
}

export function CapabilitySlide() {
  return (
    <Slide
      index="04"
      label="What it does"
      headline={
        <>
          Three outputs. Each one <Accent>cited</Accent>.
        </>
      }
      figure={<OutputsFigure />}
      footnote="Every figure traces to the prior pilots it came from."
    />
  );
}
