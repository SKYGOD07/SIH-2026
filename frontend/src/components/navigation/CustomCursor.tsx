'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { useDeviceTier } from '@/hooks/useDeviceTier';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * Minimal two-part cursor: a dot that tracks precisely and a ring that lags.
 *
 * Interactive targets opt in with `data-cursor="view"` (or any label) and the
 * ring grows to carry that label. Disabled entirely on touch/coarse pointers
 * and under reduced-motion, where the native cursor is restored.
 */
export function CustomCursor() {
  const { touch, ready } = useDeviceTier();
  const reduced = usePrefersReducedMotion();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);

  const enabled = ready && !touch && !reduced;

  useEffect(() => {
    if (!enabled) {
      document.body.removeAttribute('data-cursor');
      return;
    }
    document.body.setAttribute('data-cursor', 'on');

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // quickTo gives an interpolated follow without a per-frame tween churn.
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.09, ease: 'power3.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.09, ease: 'power3.out' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.42, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.42, ease: 'power3.out' });

    let visible = false;
    const onMove = (e: PointerEvent) => {
      if (!visible) {
        visible = true;
        gsap.to([dot, ring], { autoAlpha: 1, duration: 0.25 });
      }
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };

    const onLeave = () => {
      visible = false;
      gsap.to([dot, ring], { autoAlpha: 0, duration: 0.2 });
    };

    // One delegated listener rather than per-element handlers.
    const onOver = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        '[data-cursor], a, button, [role="button"], input, select, textarea',
      );
      if (!target) {
        setLabel(null);
        gsap.to(ring, { scale: 1, duration: 0.35, ease: 'power3.out' });
        return;
      }
      const custom = target.dataset.cursor;
      setLabel(custom && custom !== 'on' ? custom : null);
      gsap.to(ring, {
        scale: custom && custom !== 'on' ? 2.7 : 1.75,
        duration: 0.4,
        ease: 'power3.out',
      });
    };

    const onDown = () => gsap.to(ring, { scale: 0.85, duration: 0.18 });
    const onUp = () => gsap.to(ring, { scale: 1, duration: 0.28 });

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

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100]">
      <div
        ref={ringRef}
        className="absolute -left-5 -top-5 flex h-10 w-10 items-center justify-center rounded-full border border-ivory/45 opacity-0 mix-blend-difference"
      >
        {label ? (
          <span className="scale-[0.38] whitespace-nowrap font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ivory">
            {label}
          </span>
        ) : null}
      </div>
      <div
        ref={dotRef}
        className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 rounded-full bg-ivory opacity-0 mix-blend-difference"
      />
    </div>
  );
}
