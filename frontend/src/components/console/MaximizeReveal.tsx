'use client';

import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { takeOrigin, radiusToCorner } from '@/lib/console/maximize';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * The console maximising into view.
 *
 * A circle opening from wherever the reader clicked, revealing the whole shell —
 * sidebar, content and rail together, so it reads as one window being maximised
 * rather than three panels arriving separately.
 *
 * It runs exactly once per entry into the console, and gets that for free from
 * the router: this component sits inside the console layout, which Next keeps
 * mounted across every route beneath it. Clicking from `/dashboard` to `/ledger`
 * does not remount the layout, so the effect does not re-run, so the animation
 * does not replay. Moving in from outside does remount it, which is precisely
 * when the animation is wanted.
 *
 * Two details that are not decoration:
 *
 * The clip is removed the moment it finishes. `clip-path` clips fixed-position
 * descendants, and the console has two — the mobile navigation bar and the
 * notifications panel. Leaving the property applied at 100% would look identical
 * and quietly break both.
 *
 * And the shell starts fractionally small and settles to full size. A circle
 * opening over a static page is a wipe; the same circle over content that is
 * itself growing is a window being maximised, which is the difference the word
 * is doing here.
 */
export function MaximizeReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      // Consumed either way, so a stored origin can never apply to a later
      // arrival — including the one where the reader has asked for less motion.
      const origin = takeOrigin();
      if (reduced) return;

      /*
       * No origin means the reader did not arrive by clicking a link — a typed
       * URL, a refresh, a back button. Opening from the top centre is the least
       * arbitrary choice available: it is where the navigation sits, and it
       * reads as the page dropping in rather than as a circle from nowhere.
       */
      const from = origin ?? { x: window.innerWidth / 2, y: 0 };
      const radius = radiusToCorner(from, window.innerWidth, window.innerHeight);

      el.dataset.maximizing = '';
      gsap.set(el, {
        ['--console-ox']: `${from.x}px`,
        ['--console-oy']: `${from.y}px`,
        ['--console-reveal']: '0px',
        scale: 0.985,
        transformOrigin: `${from.x}px ${from.y}px`,
      });

      const tl = gsap.timeline({
        onComplete: () => {
          // Both properties are removed, not left at their end values — see the
          // note above about clipping fixed descendants.
          delete el.dataset.maximizing;
          gsap.set(el, { clearProps: 'transform,scale,transformOrigin' });
        },
      });

      tl.to(el, {
        ['--console-reveal']: `${radius}px`,
        duration: 0.85,
        ease: 'power3.inOut',
      }).to(el, { scale: 1, duration: 0.9, ease: 'power3.out' }, 0);

      return () => {
        tl.kill();
        if (ref.current) {
          delete ref.current.dataset.maximizing;
          gsap.set(ref.current, { clearProps: 'transform,scale,transformOrigin' });
        }
      };
    },
    { dependencies: [] },
  );

  return (
    <div ref={ref} className="console-maximize">
      {children}
    </div>
  );
}
