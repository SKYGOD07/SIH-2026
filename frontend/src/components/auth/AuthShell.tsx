import Link from 'next/link';

/**
 * The frame every authentication screen sits in.
 *
 * One component rather than a layout file, because these screens differ in
 * width and in whether they carry a back link — and a layout that takes six
 * props to express that is worse than a component that takes six props.
 */
export function AuthShell({
  eyebrow,
  title,
  lede,
  children,
  footer,
  back,
  wide = false,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  back?: { href: string; label: string };
  wide?: boolean;
}) {
  return (
    <main
      id="main"
      className="flex min-h-svh w-full items-center justify-center bg-void px-5 py-16"
    >
      <div className={wide ? 'w-full max-w-[46rem]' : 'w-full max-w-[26rem]'}>
        {back && (
          <Link
            href={back.href}
            className="mb-8 inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-chalk/40 transition-colors hover:text-signal"
          >
            <span aria-hidden>←</span> {back.label}
          </Link>
        )}

        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-signal">
          {eyebrow}
        </p>

        <h1 className="mt-3 font-display text-[1.75rem] font-bold leading-[1.1] tracking-[-0.02em] text-chalk">
          {title}
        </h1>

        {lede && <p className="mt-3 text-[0.875rem] leading-relaxed text-chalk/55">{lede}</p>}

        <div className="mt-9">{children}</div>

        {footer && <div className="mt-8 border-t border-chalk/10 pt-6">{footer}</div>}
      </div>
    </main>
  );
}

/** A labelled input. Labels are real `<label>` elements, not placeholders. */
export function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = props.id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="mb-5">
      <label
        htmlFor={id}
        className="mb-2 block font-mono text-[0.625rem] uppercase tracking-[0.16em] text-chalk/45"
      >
        {label}
      </label>
      <input
        {...props}
        id={id}
        className="w-full rounded-[8px] border border-chalk/15 bg-chalk/[0.03] px-3.5 py-2.5 text-[0.9375rem] text-chalk outline-none transition-colors placeholder:text-chalk/25 focus:border-signal/60 disabled:opacity-50"
      />
      {hint && <p className="mt-1.5 text-[0.75rem] leading-relaxed text-chalk/40">{hint}</p>}
    </div>
  );
}

export function SubmitButton({
  children,
  busy,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  return (
    <button
      {...props}
      disabled={busy || props.disabled}
      className="w-full rounded-[8px] bg-signal px-4 py-2.5 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-void transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {busy ? 'Working…' : children}
    </button>
  );
}

/**
 * An error or notice.
 *
 * `role="alert"` so a screen reader announces a failed sign-in rather than
 * leaving the user waiting for something that already happened.
 */
export function Notice({ kind, children }: { kind: 'error' | 'info'; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      role={kind === 'error' ? 'alert' : undefined}
      className={
        kind === 'error'
          ? 'mb-5 rounded-[8px] border border-red-400/30 bg-red-400/[0.07] px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-red-300'
          : 'mb-5 rounded-[8px] border border-signal/25 bg-signal/[0.06] px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-signal'
      }
    >
      {children}
    </p>
  );
}
