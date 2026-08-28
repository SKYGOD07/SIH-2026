'use client';

import { createElement, forwardRef, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type DisplaySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE: Record<DisplaySize, string> = {
  xs: 'text-display-xs',
  sm: 'text-display-sm',
  md: 'text-display-md',
  lg: 'text-display-lg',
  xl: 'text-display-xl',
};

export interface DisplayTextProps {
  as?: ElementType;
  size?: DisplaySize;
  weight?: 'light' | 'regular' | 'medium' | 'bold' | 'black';
  className?: string;
  children: ReactNode;
  id?: string;
}

/*
 * The display face is Poppins, loaded at 600/700/800/900 only — it is set very
 * large and very heavy, and the lighter cuts have no use at that scale. These
 * names therefore map onto that range rather than onto the CSS scale: asking
 * for 400 here would get silently rounded up by the browser anyway, and a
 * weight nobody can predict is worse than a narrow one everybody can.
 */
const WEIGHT = {
  light: 'font-semibold',
  regular: 'font-bold',
  medium: 'font-extrabold',
  bold: 'font-extrabold',
  black: 'font-black',
} as const;

/**
 * The display typeface at editorial scale. Every large heading on the site goes
 * through this so the type ramp, tracking and balance stay consistent — and so
 * animation wrappers always have a predictable element to target.
 */
export const DisplayText = forwardRef<HTMLElement, DisplayTextProps>(function DisplayText(
  { as = 'h2', size = 'md', weight = 'medium', className, children, id },
  ref,
) {
  return createElement(
    as,
    {
      ref,
      id,
      className: cn('font-display uppercase', SIZE[size], WEIGHT[weight], className),
    },
    children,
  );
});
