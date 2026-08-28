'use client';

import { useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { gsap } from '@/lib/gsap';
import { useDeviceTier } from '@/hooks/useDeviceTier';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

export interface MagneticButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  /** Pull strength as a fraction of the pointer offset. Keep it subtle. */
  strength?: number;
  variant?: 'solid' | 'outline' | 'ghost';
  cursorLabel?: string;
  type?: 'button' | 'submit';
  ariaLabel?: string;
}

const VARIANT = {
  solid: 'bg-saffron text-ink hover:bg-saffron-light border-saffron',
  outline: 'border-ink/25 text-ink hover:border-saffron hover:text-saffron',
  ghost: 'border-transparent text-stone hover:text-ink',
} as const;

/**
 * Button with a magnetic pull toward the pointer.
 *
 * The inner label counter-translates at a lower rate, which reads as depth
 * rather than as the whole button sliding. Disabled on touch and reduced-motion,
 * where it degrades to an ordinary button with a colour transition.
 */
export function MagneticButton({
  children,
  href,
  onClick,
  className,
  strength = 0.32,
  variant = 'outline',
  cursorLabel,
  type = 'button',
  ariaLabel,
}: MagneticButtonProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const { touch } = useDeviceTier();
  const reduced = usePrefersReducedMotion();
  const active = !touch && !reduced;

  const onMove = (e: React.PointerEvent) => {
    if (!active) return;
    const el = wrapRef.current;
    const label = labelRef.current;
    if (!el || !label) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    gsap.to(el, { x: dx * strength, y: dy * strength, duration: 0.5, ease: 'power3.out' });
    gsap.to(label, { x: dx * strength * 0.4, y: dy * strength * 0.4, duration: 0.6, ease: 'power3.out' });
  };

  const onLeave = () => {
    if (!active) return;
    gsap.to([wrapRef.current, labelRef.current], {
      x: 0,
      y: 0,
      duration: 0.8,
      ease: 'elastic.out(1, 0.45)',
    });
  };

  const classes = cn(
    'inline-flex items-center justify-center gap-2.5 border px-6 py-3 font-mono text-meta uppercase transition-colors duration-500 ease-editorial',
    VARIANT[variant],
    className,
  );

  const inner = (
    <span ref={labelRef} className="inline-flex items-center gap-2.5">
      {children}
    </span>
  );

  return (
    <div
      ref={wrapRef}
      className="inline-block will-3d"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {href ? (
        <Link href={href} className={classes} data-cursor={cursorLabel} aria-label={ariaLabel}>
          {inner}
        </Link>
      ) : (
        <button type={type} onClick={onClick} className={classes} data-cursor={cursorLabel} aria-label={ariaLabel}>
          {inner}
        </button>
      )}
    </div>
  );
}
