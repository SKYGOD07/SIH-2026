import type { ReactNode } from 'react';
import Link from 'next/link';
import { Icon, type IconName } from './Icon';
import { cn } from '@/lib/utils';

/**
 * The console's building blocks.
 *
 * These are the pieces the reference dashboard is assembled from — icon tile,
 * stat card, section head, status pill, progress bar, the dark/accent feature
 * pair — rebuilt on our palette. Keeping them in one file is deliberate: they
 * only work because they share a single set of decisions about radius, hairline
 * weight and tint alpha, and those decisions drift the moment the pieces live
 * in eight files that get edited separately.
 *
 * Everything here renders on the server. Nothing in this file holds state.
 */

/* ------------------------------------------------------------------ card */

export function Card({
  children,
  className,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div className={cn('card p-[1.125rem]', interactive && 'card-interactive', className)}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------- icon tile */

export type Tone = 'signal' | 'validated' | 'risk' | 'chalk';

const TINT: Record<Tone, string> = {
  signal: 'tint-signal',
  validated: 'tint-validated',
  risk: 'tint-risk',
  chalk: 'tint-chalk',
};

/** The pastel square behind an icon. Carries the tone, never the meaning. */
export function Tile({ icon, tone = 'chalk' }: { icon: IconName; tone?: Tone }) {
  return (
    <span
      className={cn(
        'grid h-[2.375rem] w-[2.375rem] shrink-0 place-items-center rounded-[10px]',
        TINT[tone],
      )}
    >
      <Icon name={icon} />
    </span>
  );
}

/* ------------------------------------------------------------------ pill */

/**
 * Status pill.
 *
 * The reference gives each status a pastel ground and a darkened version of the
 * same hue for its text. Inverted for a dark ground: a low-alpha wash and the
 * hue at full strength, which keeps the same read — colour identifies the
 * state, weight makes it legible at 10px.
 */
export function Pill({
  children,
  tone = 'chalk',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[0.625rem] font-bold uppercase tracking-[0.08em]',
        TINT[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------ section head */

export function SectionHead({
  title,
  action,
  href,
  meta,
}: {
  title: string;
  /** Text of the trailing link. Omit for a heading with nothing to go to. */
  action?: string;
  href?: string;
  /** Quiet right-hand note, used where there is no action. */
  meta?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-display text-[0.9375rem] font-extrabold uppercase tracking-[-0.02em] text-chalk">
        {title}
      </h2>

      {action && href ? (
        <Link
          href={href}
          data-cursor="open"
          className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-chalk/45 transition-colors hover:text-chalk"
        >
          {action}
          <Icon name="upRight" className="h-3 w-3" strokeWidth={2.2} />
        </Link>
      ) : meta ? (
        <span className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-chalk/40">
          {meta}
        </span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------- stat card */

export interface StatProps {
  icon: IconName;
  tone?: Tone;
  value: string;
  label: string;
  /** Optional movement note. `direction` only colours it; it never invents one. */
  trend?: string;
  direction?: 'up' | 'down';
  href?: string;
}

/**
 * The headline figure card.
 *
 * A stat card that links somewhere is a button and says so on hover; one that
 * does not is inert. The reference makes this distinction with a `.static`
 * class, and it matters more than it looks — a card that lifts under the
 * pointer and then does nothing is the single most irritating thing a
 * dashboard can do.
 */
export function StatCard({
  icon,
  tone = 'chalk',
  value,
  label,
  trend,
  direction = 'up',
  href,
}: StatProps) {
  const body = (
    <>
      <Tile icon={icon} tone={tone} />
      <span className="mt-3 block font-display text-[1.5rem] font-extrabold leading-none tracking-[-0.03em] tabular-nums text-chalk">
        {value}
      </span>
      <span className="mt-1.5 block text-xs text-chalk/45">{label}</span>
      {trend ? (
        <span
          className={cn(
            'mt-2.5 inline-flex items-center gap-1 font-mono text-[0.625rem] uppercase tracking-[0.08em]',
            direction === 'up' ? 'text-validated' : 'text-risk',
          )}
        >
          <Icon
            name={direction === 'up' ? 'upRight' : 'downLeft'}
            className="h-2.5 w-2.5"
            strokeWidth={2.4}
          />
          {trend}
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} data-cursor="open" className="card card-interactive block p-[1.125rem]">
        {body}
      </Link>
    );
  }

  return <div className="card p-[1.125rem]">{body}</div>;
}

/* ------------------------------------------------------------------- bar */

/** Progress bar. Width, not scaleX — this renders on the server. */
export function Bar({
  value,
  tone = 'signal',
  className,
}: {
  /** 0 to 1. */
  value: number;
  tone?: Tone;
  className?: string;
}) {
  const fill: Record<Tone, string> = {
    signal: 'bg-signal',
    validated: 'bg-validated',
    risk: 'bg-risk',
    chalk: 'bg-chalk/50',
  };

  return (
    <span className={cn('block h-1 w-full overflow-hidden rounded-full bg-chalk/10', className)}>
      <span
        className={cn('block h-full rounded-full', fill[tone])}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </span>
  );
}

/* --------------------------------------------------------- feature cards */

/**
 * The dark/accent pair.
 *
 * The reference sets two feature cards side by side, one in the deep primary
 * and one in the accent, and it is the single strongest move on its dashboard:
 * two blocks of flat colour in a page of white cards. Ours inverts the same
 * idea — a bordered near-black card next to a full yellow one, in a page of
 * near-black cards.
 *
 * Reserved for things a person has to *do*. Used for a third card it stops
 * being emphasis and becomes wallpaper.
 */
export function FeatureCard({
  variant,
  eyebrow,
  title,
  description,
  meta,
  action,
  href,
}: {
  variant: 'dark' | 'accent';
  eyebrow: string;
  title: string;
  description: string;
  meta?: string;
  action: string;
  href: string;
}) {
  const accent = variant === 'accent';

  return (
    <Link
      href={href}
      data-cursor="enter"
      className={cn(
        'group relative flex min-h-[13.5rem] flex-col rounded-[16px] p-[1.375rem] transition-transform duration-200 hover:-translate-y-0.5',
        accent ? 'bg-signal text-void' : 'card border-chalk/12 bg-void-soft text-chalk',
      )}
    >
      <span
        className={cn(
          'font-mono text-[0.625rem] uppercase tracking-[0.16em]',
          accent ? 'text-void/60' : 'text-signal',
        )}
      >
        {eyebrow}
      </span>

      <h3
        className={cn(
          'mt-3 font-display text-[1.0625rem] font-extrabold uppercase tracking-[-0.02em]',
          accent ? 'text-void' : 'text-chalk',
        )}
      >
        {title}
      </h3>

      <p
        className={cn(
          'mt-2.5 max-w-[34ch] text-[0.8125rem] leading-relaxed',
          accent ? 'text-void/70' : 'text-chalk/55',
        )}
      >
        {description}
      </p>

      <span className="flex-1" />

      <span className="flex items-end justify-between gap-3">
        <span
          className={cn(
            'font-mono text-[0.6875rem] uppercase tracking-[0.1em]',
            accent ? 'text-void/70' : 'text-chalk/45',
          )}
        >
          {meta}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em]',
            accent ? 'text-void' : 'text-chalk',
          )}
        >
          {action}
          <Icon
            name="upRight"
            className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            strokeWidth={2.2}
          />
        </span>
      </span>
    </Link>
  );
}
