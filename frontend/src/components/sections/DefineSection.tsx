'use client';

import { useMemo, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, SCRUB } from '@/lib/gsap';
import { Label } from '@/components/typography';
import { DEFINE_EXAMPLE } from '@/data/challenges';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * DEFINE — turning a departmental note into a measurable challenge.
 *
 * The note is not replaced by the structured challenge; the two sit side by
 * side, and each structured field is drawn from a highlighted span of the
 * original. Ambiguity becoming measurable is the claim, and showing the span
 * each field came from is what makes it inspectable rather than magical.
 */

interface Segment {
  text: string;
  key?: string;
}

/** Splits the note into plain and highlighted segments, in reading order. */
function segmentNote(note: string, spans: readonly { key: string; span: string }[]): Segment[] {
  const marks = spans
    .map((s) => ({ key: s.key, start: note.indexOf(s.span), length: s.span.length }))
    .filter((m) => m.start >= 0)
    .sort((a, b) => a.start - b.start);

  const out: Segment[] = [];
  let cursor = 0;
  marks.forEach((m) => {
    if (m.start > cursor) out.push({ text: note.slice(cursor, m.start) });
    out.push({ text: note.slice(m.start, m.start + m.length), key: m.key });
    cursor = m.start + m.length;
  });
  if (cursor < note.length) out.push({ text: note.slice(cursor) });
  return out;
}

export function DefineSection() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const segments = useMemo(
    () => segmentNote(DEFINE_EXAMPLE.note, DEFINE_EXAMPLE.highlights),
    [],
  );

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      if (reduced) {
        gsap.set('[data-mark]', { backgroundColor: 'rgba(210,89,15,0.18)', color: '#17161a' });
        gsap.set('[data-extract]', { autoAlpha: 1, y: 0 });
        gsap.set('[data-structured]', { autoAlpha: 1, y: 0 });
        return;
      }

      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px)', () => build(5));
      mm.add('(max-width: 1023px)', () => build(3.2));

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

        tl.from('[data-note]', { autoAlpha: 0, y: 24, duration: 0.6 }, 0);
        tl.to('[data-scan]', { scaleY: 1, duration: 0.5, ease: 'power2.out' }, 0.4);
        tl.to('[data-scan]', { yPercent: 100, duration: 1.6, ease: 'none' }, 0.6);

        // Each field lights its source span and lands in the extraction column
        // at the same moment — the pairing has to be simultaneous to be read.
        DEFINE_EXAMPLE.highlights.forEach((h, i) => {
          const at = 0.75 + i * 0.42;
          tl.to(
            `[data-mark="${h.key}"]`,
            {
              backgroundColor: 'rgba(232,118,43,0.2)',
              color: '#17161a',
              duration: 0.3,
              ease: 'power2.out'
            },
            at,
          );
          tl.fromTo(
            `[data-extract="${h.key}"]`,
            { autoAlpha: 0, y: 16 },
            { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out' },
            at + 0.06,
          );
        });

        tl.to('[data-scan]', { autoAlpha: 0, duration: 0.3 }, 2.9);

        // The measurable challenge assembles last, out of what was extracted.
        tl.fromTo(
          '[data-structured]',
          { autoAlpha: 0, y: 34 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: 'expo.out'
          },
          3.05,
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
      id="define"
      aria-label="Define — turning a note into a measurable challenge"
      className="relative flex h-[100svh] w-full flex-col overflow-hidden ground-bone"
    >
      <div className="edge mx-auto w-full max-w-[110rem] pt-[calc(var(--nav-safe)+clamp(0.75rem,3vh,2.5rem))]">
        <Label index="01">Define</Label>
        <h2 className="mt-5 max-w-[20ch] font-display text-display-sm font-medium uppercase leading-[0.92] text-ink">
          Ambiguity in. Measurement out.
        </h2>
      </div>

      <div className="edge mx-auto grid w-full min-h-0 max-w-[110rem] flex-1 content-center gap-x-12 gap-y-10 overflow-y-auto py-8 lg:grid-cols-[1.05fr_0.75fr_1fr]">
        {/* --- the note as written --- */}
        <div data-note className="relative">
          <Label className="mb-5">Departmental note</Label>
          <div className="relative panel p-6">
            <div
              data-scan
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-16 origin-top scale-y-0 bg-gradient-to-b from-saffron/25 to-transparent"
            />
            <p className="text-pretty text-lg leading-[1.65] text-ink/70">
              {segments.map((seg, i) =>
                seg.key ? (
                  <span
                    key={i}
                    data-mark={seg.key}
                    className="rounded-[2px] px-0.5 transition-colors"
                  >
                    {seg.text}
                  </span>
                ) : (
                  <span key={i}>{seg.text}</span>
                ),
              )}
            </p>
            <p className="mt-6 border-t border-ink/12 pt-4 font-mono text-meta uppercase text-stone">
              Transport · received as written
            </p>
          </div>
        </div>

        {/* --- what was extracted, and from where --- */}
        <div>
          <Label className="mb-5" tone="accent">
            Extracted
          </Label>
          <dl className="space-y-4">
            {DEFINE_EXAMPLE.highlights.map((h) => (
              <div
                key={h.key}
                data-extract={h.key}
                className="border-l border-saffron/50 pl-4 opacity-0"
              >
                <dt className="font-mono text-meta uppercase text-saffron">{h.label}</dt>
                <dd className="mt-1.5 text-sm leading-snug text-ink">{h.value}</dd>
                <dd className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-stone">
                  from “{h.span}”
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* --- the measurable challenge --- */}
        <div className="space-y-6">
          <Label className="mb-1">Measurable challenge</Label>

          <div data-structured className="opacity-0">
            <span className="font-mono text-meta uppercase text-stone">Target</span>
            <p className="mt-2 font-display text-display-xs font-medium uppercase leading-[0.95] text-ink">
              30% reduction in unplanned breakdowns
            </p>
          </div>

          <div data-structured className="grid grid-cols-2 gap-6 border-t border-ink/12 pt-6 opacity-0">
            <div>
              <span className="font-mono text-meta uppercase text-stone">Pilot</span>
              <p className="mt-2 font-display text-2xl uppercase text-ink">
                {DEFINE_EXAMPLE.structured.pilot}
              </p>
            </div>
            <div>
              <span className="font-mono text-meta uppercase text-stone">Duration</span>
              <p className="mt-2 font-display text-2xl uppercase text-ink">
                {DEFINE_EXAMPLE.structured.duration}
              </p>
            </div>
          </div>

          <div data-structured className="border-t border-ink/12 pt-6 opacity-0">
            <span className="font-mono text-meta uppercase text-stone">Success metrics</span>
            <ul className="mt-3 space-y-2">
              {DEFINE_EXAMPLE.structured.metrics.map((m) => (
                <li key={m} className="flex items-baseline gap-3 text-sm text-ink/80">
                  <span aria-hidden="true" className="h-px w-4 shrink-0 bg-saffron" />
                  {m}
                </li>
              ))}
            </ul>
          </div>

          <p data-structured className="border-t border-ink/12 pt-5 text-xs leading-relaxed text-stone opacity-0">
            The department reviews and signs off the structured statement before it is published.
            Extraction is a drafting aid, not an approval.
          </p>
        </div>
      </div>
    </section>
  );
}
