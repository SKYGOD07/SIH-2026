'use client';

import { forwardRef, type ReactNode } from 'react';
import { Label } from '@/components/typography';
import { cn } from '@/lib/utils';

export interface SectionProps {
  id: string;
  /** Lifecycle index, e.g. "03". Shown with the eyebrow. */
  index?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
  /** Full-bleed sections opt out of the max-width shell. */
  bleed?: boolean;
  /** Inverted (ivory) sections break the dark run and mark a change of register. */
  tone?: 'dark' | 'light';
  'aria-label'?: string;
}

/**
 * Section shell: consistent vertical rhythm, edge gutters and the eyebrow that
 * names where in the pathway the reader is. Sections that pin manage their own
 * height and pass `bleed`.
 */
export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { id, index, eyebrow, children, className, bleed = false, tone = 'dark', ...rest },
  ref,
) {
  return (
    <section
      ref={ref}
      id={id}
      aria-label={rest['aria-label'] ?? eyebrow ?? undefined}
      className={cn(
        'relative',
        tone === 'light' ? 'bg-ivory text-ink' : 'bg-ink text-ivory',
        className,
      )}
    >
      {eyebrow ? (
        <div className="edge relative z-10 mx-auto max-w-[110rem] pt-[clamp(3.5rem,9vh,7rem)]">
          <Label index={index} tone={tone === 'light' ? 'default' : 'default'}>
            {eyebrow}
          </Label>
        </div>
      ) : null}
      <div className={cn(bleed ? '' : 'edge mx-auto max-w-[110rem]')}>{children}</div>
    </section>
  );
});
