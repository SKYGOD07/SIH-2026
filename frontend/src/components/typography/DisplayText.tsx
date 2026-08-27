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

const WEIGHT = {
  light: 'font-light',
  regular: 'font-normal',
  medium: 'font-medium',
  bold: 'font-bold',
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
