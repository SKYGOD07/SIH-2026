'use client';

import { useRef, type ElementType, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { useDeck } from './Deck';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

/**
 * Text that is already on the page, and turns on as the reader reaches it.
 *
 * Every word is rendered from the first frame in a near-black that reads as
 * shape but not as language, and wipes to full strength left-to-right, scrubbed
 * against the reader's position. Nothing fades in from nothing and nothing
 * arrives late: the page is complete before it is read, and reading it is what
 * lights it.
 *
 * The mechanic is a two-stop gradient clipped to the glyphs with a single
 * animated stop — see `.wipe-unit` in globals.css. It is done per word rather
 * than per character everywhere except headlines: a headline is thirty units
 * and can afford the finer grain, while a paragraph split to characters is
 * several hundred elements for a difference nobody can see at reading size.
 *
 * Splitting happens during render, not in an effect, so the server emits the
 * finished markup. Splitting on the client would mean the first paint carries
 * unsplit text that is then torn apart, which shows.
 */

export interface WipeTextProps {
  children: string;
  as?: ElementType;
  /** Characters give a finer wipe; reserve them for short, large text. */
  split?: 'words' | 'chars';
  className?: string;
  /** The revealed colour. Defaults to white. */
  on?: string;
  /** The resting colour. Defaults to the near-black in the palette. */
  off?: string;
  /**
   * Where in the slide's travel the reveal runs, as a fraction of the viewport.
   * Lower `start` means it begins sooner after the slide's left edge appears.
   */
  start?: number;
  end?: number;
  /** Seconds between units. 0 wipes the whole block as one. */
  stagger?: number;
}

/** Split preserving spaces, so `white-space: pre` can hold the word shapes. */
function units(text: string, mode: 'words' | 'chars'): string[] {
  if (mode === 'chars') return Array.from(text);
  return text.split(/(\s+)/).filter((u) => u.length > 0);
}

export function WipeText({
  children,
  as: Tag = 'p',
  split = 'words',
  className,
  on = '#FFFFFF',
  off = '#252525',
  start = 0.85,
  end = 0.45,
  stagger = 0.06,
}: WipeTextProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const { container, mode } = useDeck();

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || reduced) return;

      const targets = gsap.utils.toArray<HTMLElement>('.wipe-unit', root);
      if (targets.length === 0) return;

      /*
       * Horizontal and stacked need different trigger geometry. In the deck the
       * slide travels past a fixed viewport, so start and end are measured on
       * the x axis against the container tween; stacked, it is an ordinary
       * vertical trigger. Getting this wrong does not error — it silently never
       * fires, which is why the two cases are written out rather than merged.
       */
      const horizontal = mode === 'horizontal' && container !== null;

      const tween = gsap.fromTo(
        targets,
        { '--wipe': '0%' },
        {
          '--wipe': '100%',
          ease: 'none',
          stagger,
          scrollTrigger: {
            trigger: root,
            containerAnimation: horizontal ? container : undefined,
            start: horizontal ? `left ${start * 100}%` : `top ${start * 100}%`,
            end: horizontal ? `left ${end * 100}%` : `top ${end * 100}%`,
            scrub: 0.4,
            invalidateOnRefresh: true,
          },
        },
      );

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: ref, dependencies: [reduced, container, mode, stagger, start, end] },
  );

  const parts = units(children, split);

  return (
    <Tag
      ref={ref}
      className={cn(
        // Until the deck reports which world it is in, no scrub can be attached
        // — so the text is shown at full strength rather than left unreadable.
        mode === 'stacked' && container === null ? 'wipe-static' : undefined,
        className,
      )}
      style={{ ['--wipe-on' as string]: on, ['--wipe-off' as string]: off }}
    >
      {parts.map((part, i) =>
        /^\s+$/.test(part) ? (
          <span key={i}> </span>
        ) : (
          <span key={i} className={split === 'chars' ? 'wipe-unit' : 'wipe-unit wipe-word'}>
            {part}
          </span>
        ),
      )}
    </Tag>
  );
}

/**
 * A non-text element that reveals on the same schedule.
 *
 * Figures, bars and diagrams cannot be gradient-clipped, so they get the plain
 * version of the same idea: present from the start, at low opacity, brought up
 * scrubbed against the same position the words use. Without this the graphics
 * would pop in fully formed against text that is still arriving, and the slide
 * would read as two unrelated animations.
 */
export function WipeReveal({
  children,
  className,
  start = 0.85,
  end = 0.5,
  from = 0.12,
}: {
  children: ReactNode;
  className?: string;
  start?: number;
  end?: number;
  /** Resting opacity. Never 0 — the point is that the page is already there. */
  from?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { container, mode } = useDeck();

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || reduced) return;

      const horizontal = mode === 'horizontal' && container !== null;

      const tween = gsap.fromTo(
        root,
        { opacity: from },
        {
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            containerAnimation: horizontal ? container : undefined,
            start: horizontal ? `left ${start * 100}%` : `top ${start * 100}%`,
            end: horizontal ? `left ${end * 100}%` : `top ${end * 100}%`,
            scrub: 0.4,
            invalidateOnRefresh: true,
          },
        },
      );

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: ref, dependencies: [reduced, container, mode, start, end, from] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
