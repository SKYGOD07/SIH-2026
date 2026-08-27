'use client';

import type { ReactNode } from 'react';
import { Label, SplitText } from '@/components/typography';
import { cn } from '@/lib/utils';

/**
 * Route header. The product pages use the same type ramp and eyebrow system as
 * the landing story, so crossing from the cinematic layer into the application
 * does not feel like crossing into a different product.
 */
export function PageHeader({
  eyebrow,
  index,
  title,
  lede,
  aside,
  className,
}: {
  eyebrow: string;
  index?: string;
  title: string;
  lede?: string;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'edge mx-auto max-w-[110rem] pb-12 pt-[calc(var(--nav-h)+clamp(3rem,8vh,6rem))]',
        className,
      )}
    >
      <Label index={index}>{eyebrow}</Label>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
        <SplitText
          as="h1"
          type="lines"
          className="max-w-[18ch] font-display text-display-sm font-medium uppercase leading-[0.9] text-ivory"
        >
          {title}
        </SplitText>
        {aside}
      </div>

      {lede ? (
        <p className="mt-8 max-w-[62ch] text-pretty text-base leading-relaxed text-silver">
          {lede}
        </p>
      ) : null}
    </header>
  );
}
