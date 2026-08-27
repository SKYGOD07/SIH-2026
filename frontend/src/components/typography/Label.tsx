'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps {
  children: ReactNode;
  className?: string;
  /** Small monospace index shown before the label, e.g. "03". */
  index?: string;
  tone?: 'default' | 'accent' | 'validated' | 'risk';
  size?: 'sm' | 'md';
  as?: 'span' | 'div' | 'p';
}

const TONE = {
  default: 'text-silver',
  accent: 'text-saffron',
  validated: 'text-validated-light',
  risk: 'text-risk',
} as const;

/**
 * Uppercase monospace metadata label. The counterweight to the display type —
 * every section uses one to name itself.
 */
export function Label({
  children,
  className,
  index,
  tone = 'default',
  size = 'sm',
  as: Tag = 'span',
}: LabelProps) {
  return (
    <Tag
      className={cn(
        'inline-flex items-center gap-2.5 font-mono uppercase',
        size === 'sm' ? 'text-meta' : 'text-meta-lg',
        TONE[tone],
        className,
      )}
    >
      {index ? (
        <>
          <span className="text-saffron">{index}</span>
          <span aria-hidden="true" className="h-px w-6 bg-current opacity-30" />
        </>
      ) : null}
      {children}
    </Tag>
  );
}
