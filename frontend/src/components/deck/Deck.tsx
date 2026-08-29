'use client';

import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useIntro } from '@/components/motion/IntroProvider';
import { cn } from '@/lib/utils';

/**
 * The deck: the landing page read sideways.
 *
 * Vertical scroll is pinned and spent moving a row of full-viewport slides
 * horizontally, so the page behaves like a slideshow rather than a document.
 * That is the whole reason the content budget works — a slide holds what a
 * slide holds, and anything that does not fit has to go somewhere else instead
 * of silting up the bottom of a long page.
 *
 * Three things make this stable, and all three have bitten this page before:
 *
 *   - The end distance is a function, not a number. Recomputed on every
 *     refresh, so a font swap or a resize cannot leave the last slide
 *     unreachable or the pin overshooting into empty space.
 *   - The layout switch is CSS (`.deck-track`), keyed on the same condition as
 *     the matchMedia below. Narrow viewports and reduced-motion readers get the
 *     identical slides stacked vertically, which is also what the server
 *     renders — the deck is an enhancement, never a requirement.
 *   - Progress is reported through the intro context rather than read by the
 *     navigation itself. A pinned element sits still while the page scrolls, so
 *     a ScrollTrigger aimed at a slide from outside would measure nonsense.
 */

export interface DeckProps {
  children: ReactNode;
  /** Slide names, in order. Drawn in the rail along the bottom edge. */
  chapters: string[];
}

export function Deck({ children, chapters }: DeckProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const railFillRef = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  const { setHeroComplete } = useIntro();

  useGSAP(
    () => {
      const shell = shellRef.current;
      const track = trackRef.current;
      if (!shell || !track) return;

      const mm = gsap.matchMedia();

      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: shell,
            start: 'top top',
            end: () => '+=' + distance(),
            pin: true,
            anticipatePin: 1,
            // Light scrub only. Lenis already interpolates the input; layering a
            // long scrub on top of it reads as lag rather than as smoothness.
            scrub: 0.5,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              // The navigation opens once the first slide is behind the reader.
              setHeroComplete(self.progress > 0.5 / Math.max(chapters.length - 1, 1));

              if (railFillRef.current) {
                gsap.set(railFillRef.current, { scaleX: self.progress });
              }

              /*
               * The rail is fixed while the slides travel under it, so it has
               * to be told what it is currently sitting on: white hairlines
               * over the one full-bleed yellow slide would be invisible.
               */
              const slides = track.querySelectorAll('[data-slide]');
              const index = Math.round(self.progress * (slides.length - 1));
              const over = slides[index];
              if (railRef.current) {
                railRef.current.dataset.tone = over?.hasAttribute('data-invert')
                  ? 'invert'
                  : 'default';
              }
            },
          },
        });

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
          gsap.set(track, { x: 0 });
        };
      });

      // Stacked fallback: the same boundary, measured the ordinary way.
      mm.add('(max-width: 767px), (prefers-reduced-motion: reduce)', () => {
        const second = track.querySelector('[data-slide]:nth-of-type(2)');
        if (!second) return;
        const st = ScrollTrigger.create({
          trigger: second,
          start: 'top 88%',
          onEnter: () => setHeroComplete(true),
          onLeaveBack: () => setHeroComplete(false),
        });
        return () => st.kill();
      });

      return () => {
        mm.revert();
        setHeroComplete(false);
      };
    },
    { scope: shellRef, dependencies: [reduced, chapters.length, setHeroComplete] },
  );

  return (
    <div ref={shellRef} className="deck-shell ground-void">
      <div ref={trackRef} className="deck-track">
        {children}
      </div>
    </div>
  );
}

export interface SlideProps {
  id?: string;
  index: string;
  label: string;
  children: ReactNode;
  /** Full-bleed yellow. Deliberately rare — once in the deck. */
  invert?: boolean;
  className?: string;
}

/**
 * One slide.
 *
 * A fixed frame: index and label in the top corner, content in the middle, and
 * nothing else. The frame is what makes eight different slides read as one
 * deck, so it is not parameterised beyond the single inversion.
 */
export function Slide({ id, index, label, children, invert = false, className }: SlideProps) {
  return (
    <section
      id={id}
      data-slide
      aria-label={label}
      data-invert={invert ? '' : undefined}
      className={cn('deck-slide', invert ? 'ground-signal' : 'ground-void', className)}
    >
      <div className="edge nav-safe flex h-full w-full flex-col justify-center pb-[clamp(4rem,10vh,7rem)]">
        <span
          className={cn(
            'mb-[clamp(1.5rem,4vh,2.75rem)] inline-flex items-center gap-3 font-mono text-meta uppercase',
            invert ? 'text-void/60' : 'text-chalk/45',
          )}
        >
          <span className={invert ? 'text-void' : 'text-signal'}>{index}</span>
          <span aria-hidden="true" className="h-px w-8 bg-current opacity-30" />
          {label}
        </span>

        {children}
      </div>
    </section>
  );
}
