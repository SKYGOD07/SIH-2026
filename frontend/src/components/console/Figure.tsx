import { isPending, type Sourced } from '@/lib/provenance';
import { cn } from '@/lib/utils';

/**
 * A figure, and where it came from.
 *
 * This component has no prop that accepts a bare number. The only way to put a
 * quantity on screen is to hand it a `Sourced`, which cannot be constructed
 * without saying whether the value is verified, a labelled scenario, or absent.
 * That is the whole point: the rule stops being something to remember and
 * becomes something the compiler asks about.
 *
 * A pending figure renders an em-dash, not a zero. Zero is a measurement — it
 * says we looked and found none — and it is not what "we have not ingested this
 * yet" means.
 */
export function Figure({
  label,
  data,
  size = 'md',
  className,
}: {
  label: string;
  data: Sourced<string | number>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const type = {
    sm: 'text-[1.25rem]',
    md: 'text-[2rem]',
    lg: 'text-[clamp(2.5rem,5vw,3.5rem)]',
  }[size];

  return (
    <div className={cn('min-w-0', className)}>
      <span
        className={cn(
          'block font-display font-black leading-none tracking-[-0.04em] tabular-nums',
          type,
          isPending(data) ? 'text-chalk/25' : 'text-chalk',
        )}
      >
        {isPending(data) ? '—' : data.value}
      </span>

      <span className="mt-2 block text-[0.8125rem] leading-snug text-chalk/55">{label}</span>

      <ProvenanceLine data={data} />
    </div>
  );
}

/**
 * The line under a figure that says where it came from.
 *
 * Exported separately because prose sometimes carries a sourced claim without a
 * number attached — a policy parameter quoted inside a sentence still needs its
 * citation, and it should look identical to the one under a figure.
 */
export function ProvenanceLine({ data }: { data: Sourced<string | number> }) {
  if (data.state === 'pending') {
    return (
      <span className="mt-2.5 block font-mono text-[0.5625rem] uppercase leading-relaxed tracking-[0.14em] text-chalk/30">
        <span className="text-signal">Awaiting data</span>
        <span className="mt-0.5 block normal-case tracking-normal">
          {data.awaiting} · from {data.from}
        </span>
      </span>
    );
  }

  if (data.state === 'demo') {
    return (
      <span className="mt-2.5 block font-mono text-[0.5625rem] uppercase leading-relaxed tracking-[0.14em] text-chalk/30">
        <span className="text-signal">Demo scenario</span>
        <span className="mt-0.5 block normal-case tracking-normal">{data.scenario}</span>
      </span>
    );
  }

  return (
    <span className="mt-2.5 block font-mono text-[0.5625rem] uppercase leading-relaxed tracking-[0.14em] text-chalk/30">
      <span className="text-validated">Verified</span>
      <span className="mt-0.5 block normal-case tracking-normal">
        {data.url ? (
          <a
            href={data.url}
            target="_blank"
            rel="noreferrer noopener"
            data-cursor="open"
            className="underline decoration-chalk/20 underline-offset-2 transition-colors hover:text-chalk/60"
          >
            {data.source}
          </a>
        ) : (
          data.source
        )}{' '}
        · read {data.retrieved}
      </span>
    </span>
  );
}

/**
 * An empty route.
 *
 * Every page that has nothing real to show yet uses this rather than inventing
 * something to fill the space. It states what the page will hold and what has to
 * happen before it does, so an empty screen reads as a known position rather
 * than as a broken one.
 */
export function AwaitingData({
  title,
  holds,
  blockedBy,
  next,
}: {
  title: string;
  /** What this page will contain. */
  holds: string;
  /** Why it is empty right now. */
  blockedBy: string;
  /** What unblocks it. */
  next: string;
}) {
  return (
    <div className="card p-[clamp(1.5rem,4vh,2.5rem)]">
      <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal">
        Awaiting data
      </span>

      <h2 className="mt-3 font-display text-[1.25rem] font-extrabold uppercase tracking-[-0.03em] text-chalk">
        {title}
      </h2>

      <dl className="mt-6 grid max-w-[64rem] gap-x-10 gap-y-5 sm:grid-cols-3">
        {[
          { k: 'What this will hold', v: holds },
          { k: 'Why it is empty', v: blockedBy },
          { k: 'What fills it', v: next },
        ].map((row) => (
          <div key={row.k}>
            <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/30">
              {row.k}
            </dt>
            <dd className="mt-2 text-[0.8125rem] leading-relaxed text-chalk/60">{row.v}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-6 border-t border-chalk/[0.08] pt-4 text-[0.78125rem] leading-relaxed text-chalk/40">
        This page is deliberately empty rather than populated with illustrative
        records. A figure here would be indistinguishable from a departmental one.
      </p>
    </div>
  );
}
