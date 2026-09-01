'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useDeviceTier } from '@/hooks/useDeviceTier';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * The cursor — a gooey metaball trail.
 *
 * Taken from the silviasguotti.design reference, whose recipe is:
 *
 *   • a fixed wrapper at z-1000 carrying `filter: url(#goo)` and
 *     `mix-blend-mode: difference`
 *   • twenty absolutely-positioned white circles inside it
 *   • each circle scaled `1 - i * 0.05`, so the trail tapers
 *   • each circle chases the one in front of it, so they string out on movement
 *
 * The SVG filter is what makes it read as liquid rather than as twenty dots: a
 * heavy blur followed by a high-contrast alpha ramp, which fuses overlapping
 * shapes into one surface and pinches them apart as they separate. That is the
 * whole "floating molecules" effect — it is the filter, not the motion.
 *
 * `mix-blend-mode: difference` on white inverts whatever is underneath, so the
 * trail is dark navy over the bone ground and inverts cleanly over the dark
 * sections without needing a second colour.
 */

/** Dot count matches the reference; the head is smaller than it. */
const DOTS = 20;
/**
 * Head diameter.
 *
 * Reduced from the reference's 26px. At that size the goo blob sat over the
 * word being pointed at rather than beside it, which on a type-led page means
 * the cursor obscures the thing it is there to indicate.
 */
const HEAD_SIZE = 15;
/** How hard each dot chases its leader. Lower = longer, looser tail. */
const CHASE = 0.32;

export function CustomCursor() {
  const { touch, ready } = useDeviceTier();
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);

  const enabled = ready && !touch && !reduced;

  useEffect(() => {
    if (!enabled) {
      document.body.removeAttribute('data-cursor');
      return;
    }
    document.body.setAttribute('data-cursor', 'on');

    const wrap = wrapRef.current;
    if (!wrap) return;

    const dots = Array.from(wrap.children) as HTMLElement[];
    if (dots.length === 0) return;

    // Position state per dot, kept out of the DOM so the loop never reads layout.
    const xs = new Array(dots.length).fill(-100);
    const ys = new Array(dots.length).fill(-100);

    const pointer = { x: -100, y: -100 };
    let visible = false;
    /** Swells over interactive targets. */
    let scale = 1;
    let scaleTarget = 1;

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (!visible) {
        visible = true;
        gsap.to(wrap, { autoAlpha: 1, duration: 0.3 });
      }
    };

    const onLeave = () => {
      visible = false;
      gsap.to(wrap, { autoAlpha: 0, duration: 0.25 });
    };

    // One delegated listener rather than a handler per element.
    const onOver = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest(
        '[data-cursor], a, button, [role="button"], input, select, textarea',
      );
      scaleTarget = target ? 1.9 : 1;
    };

    const onDown = () => {
      scaleTarget *= 0.7;
    };
    const onUp = () => {
      scaleTarget = scaleTarget > 1.2 ? 1.9 : 1;
    };

    /**
     * One loop for the whole trail, driven off GSAP's ticker so it shares the
     * page's single animation frame rather than opening another one.
     *
     * Dot 0 chases the pointer; every other dot chases the dot in front of it.
     * That chain is what produces the tail — no per-dot easing curves, no
     * staggered tweens, just twenty followers at the same rate.
     */
    const tick = () => {
      scale += (scaleTarget - scale) * 0.12;

      let leadX = pointer.x;
      let leadY = pointer.y;

      for (let i = 0; i < dots.length; i++) {
        xs[i] += (leadX - xs[i]) * CHASE;
        ys[i] += (leadY - ys[i]) * CHASE;

        const taper = 1 - i * 0.05;
        dots[i].style.transform =
          `translate3d(${xs[i]}px, ${ys[i]}px, 0) scale(${taper * scale})`;

        leadX = xs[i];
        leadY = ys[i];
      }
    };

    gsap.ticker.add(tick);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
      document.body.removeAttribute('data-cursor');
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/*
        The gooey filter. A heavy blur, then a steep alpha curve that pushes
        blurred edges back to full opacity — overlapping circles fuse, separating
        ones pinch apart. Rendered into a zero-size SVG so it never paints.
      */}
      <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0">
        <defs>
          <filter id="cursor-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div
        ref={wrapRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 opacity-0"
        style={{
          zIndex: 1000,
          filter: 'url(#cursor-goo)',
          mixBlendMode: 'difference',
        }}
      >
        {Array.from({ length: DOTS }, (_, i) => (
          <span
            key={i}
            className="absolute left-0 top-0 block rounded-full bg-white"
            style={{
              width: HEAD_SIZE,
              height: HEAD_SIZE,
              // Centre each circle on its own coordinate.
              marginLeft: -HEAD_SIZE / 2,
              marginTop: -HEAD_SIZE / 2,
              willChange: 'transform',
            }}
          />
        ))}
      </div>
    </>
  );
}
