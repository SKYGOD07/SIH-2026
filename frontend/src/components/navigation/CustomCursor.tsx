'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { useDeviceTier } from '@/hooks/useDeviceTier';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * The cursor.
 *
 * Modelled on the silviasguotti.design reference: a single solid disc in the
 * accent colour that trails the pointer, swells over anything interactive, and
 * carries a short label when the target names one.
 *
 * The disc is filled rather than outlined, which is the whole character of it —
 * an outline ring reads as a system cursor, a filled disc reads as a mark that
 * belongs to the page. `mix-blend-mode: difference` is deliberately not used:
 * on a warm bone ground it inverts the accent into a muddy cyan.
 *
 * Disabled on touch and under reduced motion, where the native cursor returns.
 */
export function CustomCursor() {
  const { touch, ready } = useDeviceTier();
  const reduced = usePrefersReducedMotion();
  const discRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [label, setLabel] = useState<string | null>(null);

  const enabled = ready && !touch && !reduced;

  useEffect(() => {
    if (!enabled) {
      document.body.removeAttribute('data-cursor');
      return;
    }
    document.body.setAttribute('data-cursor', 'on');

    const disc = discRef.current;
    if (!disc) return;

    // quickTo interpolates without churning a new tween every frame. A little
    // lag is what makes the disc feel like an object being dragged along rather
    // than a sprite pinned to the pointer.
    const toX = gsap.quickTo(disc, 'x', { duration: 0.34, ease: 'power3.out' });
    const toY = gsap.quickTo(disc, 'y', { duration: 0.34, ease: 'power3.out' });

    let shown = false;
    const onMove = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.to(disc, { autoAlpha: 1, duration: 0.3 });
      }
      toX(e.clientX);
      toY(e.clientY);
    };

    const onLeave = () => {
      shown = false;
      gsap.to(disc, { autoAlpha: 0, duration: 0.2 });
    };

    // One delegated listener rather than a handler per element.
    const onOver = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        '[data-cursor], a, button, [role="button"], input, select, textarea',
      );

      if (!target) {
        setLabel(null);
        gsap.to(disc, { scale: 1, duration: 0.4, ease: 'power3.out' });
        return;
      }

      const named = target.dataset.cursor;
      const hasLabel = Boolean(named) && named !== 'on';
      setLabel(hasLabel ? (named as string) : null);
      gsap.to(disc, {
        scale: hasLabel ? 3.4 : 2.1,
        duration: 0.45,
        ease: 'power3.out',
      });
    };

    const onDown = () => gsap.to(disc, { scale: 0.8, duration: 0.18 });
    const onUp = () => gsap.to(disc, { scale: 1, duration: 0.3 });

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
      document.body.removeAttribute('data-cursor');
    };
  }, [enabled]);

  // The label counter-scales against the disc so it stays a readable size at
  // every swell state.
  useEffect(() => {
    const el = labelRef.current;
    if (!el) return;
    gsap.set(el, { scale: label ? 1 / 3.4 : 1 });
  }, [label]);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100]">
      <div
        ref={discRef}
        className="absolute -left-[11px] -top-[11px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-saffron opacity-0"
      >
        <span
          ref={labelRef}
          className="whitespace-nowrap font-mono text-[0.625rem] uppercase tracking-[0.14em] text-bone-light"
        >
          {label}
        </span>
      </div>
    </div>
  );
}
