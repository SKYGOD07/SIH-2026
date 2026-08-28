'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, SCRUB } from '@/lib/gsap';
import { MagneticButton } from '@/components/motion/MagneticButton';
import { TRUST_PRINCIPLE } from '@/data/evidence';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * The closing sequence.
 *
 * Everything is taken away — the network, the map, the numbers — until only
 * typography is left. Each couplet holds, then hands over to the next, and the
 * last frame is deliberately still: the page should end calm, not with one more
 * effect.
 */

const COUPLETS = [
  ['From problem', 'to proof.'],
  ['From proof', 'to procurement.'],
  ['From procurement', 'to scale.'],
];

export function FinaleSection() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      if (reduced) {
        gsap.set('[data-couplet]', { autoAlpha: 1, y: 0 });
        gsap.set('[data-signoff]', { autoAlpha: 1, y: 0 });
        return;
      }

      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', () => build(2.2));
      mm.add('(max-width: 767px)', () => build(1.6));

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

        // Residue of the earlier sections dissolving.
        tl.to('[data-residue]', { autoAlpha: 0, scale: 1.25, duration: 1.4, ease: 'power2.in' }, 0);

        const couplets = gsap.utils.toArray<HTMLElement>('[data-couplet]', root);
        couplets.forEach((el, i) => {
          const at = 0.5 + i * 1.15;
          tl.fromTo(
            el,
            { autoAlpha: 0, y: 44 },
            { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' },
            at,
          );
          tl.to(
            el,
            { autoAlpha: 0, y: -34, duration: 0.5, ease: 'power2.in' },
            at + 0.78,
          );
        });

        // The name, then the line under it, then the way in. Nothing after.
        tl.fromTo(
          '[data-wordmark]',
          { autoAlpha: 0, scale: 1.1 },
          { autoAlpha: 1, scale: 1, duration: 1, ease: 'expo.out' },
          4.1,
        );
        tl.fromTo(
          '[data-signoff]',
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.14, ease: 'expo.out' },
          4.7,
        );
        tl.to({}, { duration: 0.8 });

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
      id="finale"
      aria-label="From problem to scale"
      className="relative h-[100svh] w-full overflow-hidden ground-bone"
    >
      {/* the last of the network, fading out */}
      <div
        data-residue
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="hairline-grid h-[70%] w-[70%] opacity-40 mask-fade-y" />
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
        <div className="edge relative flex w-full max-w-[110rem] items-center justify-center">
          {COUPLETS.map(([a, b]) => (
            <p
              key={a}
              data-couplet
              className="absolute inset-x-0 font-display text-display-md font-medium uppercase leading-[0.88] text-ink opacity-0"
            >
              {a}
              <br />
              <span className="text-saffron">{b}</span>
            </p>
          ))}

          <div data-wordmark className="opacity-0">
            <h2 className="font-display text-display-lg font-bold uppercase leading-[0.85] tracking-[-0.045em] text-ink">
              MahaInnovate
            </h2>
          </div>
        </div>

        <div className="edge mt-12 flex w-full max-w-[110rem] flex-col items-center gap-8">
          <p data-signoff className="font-mono text-meta-lg uppercase text-stone opacity-0">
            Innovation procurement intelligence platform
          </p>

          <ul data-signoff className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 opacity-0">
            {TRUST_PRINCIPLE.map((t) => (
              <li key={t.term} className="font-mono text-meta uppercase">
                <span className="text-saffron">{t.term}</span>{' '}
                <span className="text-stone">{t.definition}</span>
              </li>
            ))}
          </ul>

          <div data-signoff className="opacity-0">
            <MagneticButton href="/dashboard" variant="solid" cursorLabel="enter">
              Enter platform <span aria-hidden="true">→</span>
            </MagneticButton>
          </div>
        </div>
      </div>
    </section>
  );
}
