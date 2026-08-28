'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The page's primary content pattern, taken from the silviasguotti.design
 * reference.
 *
 * One row is: a circled index, a quiet label, one expressive headline, and a
 * single line of description — separated from the next row by a hairline and a
 * lot of air. Rows step progressively to the right, which is what turns a list
 * into a composition and stops a long sequence reading as a table.
 *
 * The discipline is the point. Anything that will not fit into label / headline
 * / one line does not belong in a row, and that constraint is what keeps these
 * sections from silting up into the dense grids they replaced.
 */

export interface NumberedRowProps {
  /** Displayed inside the circle. Usually "1", "2", "01"… */
  index: string;
  /** Quiet line above the headline. */
  label: string;
  /** The headline. Wrap a word in <Accent> to set it in the display serif. */
  headline: ReactNode;
  /** One line. If it needs two, it is not a row. */
  description?: string;
  /** 0-based position, used for the progressive indent. */
  step?: number;
  /** Right-hand slot for a figure or status. */
  aside?: ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

export function NumberedRow({
  index,
  label,
  headline,
  description,
  step = 0,
  aside,
  onClick,
  active = false,
  className,
}: NumberedRowProps) {
  const interactive = Boolean(onClick);

  const content = (
    <>
      {/* The circled index. Outlined, never filled — a filled disc reads as a
          status badge rather than as an enumeration. */}
      <span
        aria-hidden="true"
        className={cn(
          'mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-[0.6875rem] transition-colors duration-500',
          active ? 'border-saffron text-saffron' : 'border-ink/25 text-ink/55',
        )}
      >
        {index}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-mono text-meta uppercase text-stone">{label}</span>

        <span
          className={cn(
            'mt-2 block font-display text-display-sm font-normal transition-colors duration-500',
            active ? 'text-ink' : 'text-ink/85',
          )}
        >
          {headline}
        </span>

        {description ? (
          <span className="mt-3 block max-w-[52ch] text-sm leading-relaxed text-ink-muted">
            {description}
          </span>
        ) : null}
      </span>

      {aside ? <span className="shrink-0 pt-1 text-right">{aside}</span> : null}
    </>
  );

  return (
    <li
      className={cn('border-b border-ink/12', className)}
      // Progressive indent, capped so it never runs off a narrow viewport.
      style={{ paddingLeft: `min(${step * 3}vw, 9rem)` }}
    >
      {interactive ? (
        <button
          type="button"
          onClick={onClick}
          data-cursor="open"
          aria-current={active ? 'step' : undefined}
          className="group flex w-full items-start gap-6 py-8 text-left sm:gap-8"
        >
          {content}
        </button>
      ) : (
        <div className="flex items-start gap-6 py-8 sm:gap-8">{content}</div>
      )}
    </li>
  );
}

/**
 * A word set in the display serif inside a grotesk headline.
 *
 * The mix is the reference's signature — "Right concept, *right* client" — and
 * it is what makes a headline read as composed rather than merely large. One or
 * two words per headline; more and the effect inverts into noise.
 */
export function Accent({ children }: { children: ReactNode }) {
  return <span className="font-accent font-normal italic">{children}</span>;
}
