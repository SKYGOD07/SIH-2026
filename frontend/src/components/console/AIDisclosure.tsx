import { Icon } from '@/components/console/Icon';
import { cn } from '@/lib/utils';

/**
 * The label that must appear wherever model output appears.
 *
 * A component rather than a copied paragraph, for the ordinary reason: a
 * sentence pasted into six screens is a sentence that will be five versions of
 * itself within a month, and the one screen that gets missed will be the one
 * showing a summary somebody quotes in a procurement file.
 *
 * It reads the two facts off the envelope the backend returns, so it cannot
 * claim assistance that did not happen — a deterministic fallback renders as a
 * platform reading, not as AI, without the calling page having to remember the
 * difference.
 */
export function AIDisclosure({
  assisted,
  model,
  fallbackReason,
  warnings = [],
  className,
}: {
  assisted: boolean;
  model?: string | null;
  fallbackReason?: string;
  warnings?: string[];
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
            'font-mono text-[0.625rem] font-bold uppercase tracking-[0.08em]',
            assisted ? 'tint-signal' : 'tint-chalk',
          )}
        >
          <Icon name={assisted ? 'intelligence' : 'ledger'} className="h-3 w-3" />
          {assisted ? 'AI-assisted analysis' : 'Platform reading'}
        </span>

        {assisted && model && (
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-chalk/35">{model}</span>
        )}
      </div>

      <p className="max-w-[68ch] text-[0.75rem] leading-relaxed text-chalk/45">
        {assisted
          ? 'Generated from stored records only. AI assists analysis; Government retains decision authority.'
          : 'Composed directly from stored records, without a model. Government retains decision authority.'}
      </p>

      {!assisted && fallbackReason && (
        <p className="max-w-[68ch] text-[0.75rem] leading-relaxed text-chalk/35">{fallbackReason}</p>
      )}

      {/*
       * Grounding failures are shown, not swallowed. A model that cited a
       * document nobody filed is a thing the reader is entitled to know about
       * the paragraph they just read.
       */}
      {warnings.length > 0 && (
        <ul className="max-w-[68ch] space-y-1 rounded-[8px] border border-risk/20 bg-risk/[0.05] px-3 py-2">
          {warnings.map((w) => (
            <li key={w} className="flex gap-2 text-[0.75rem] leading-relaxed text-risk/80">
              <Icon name="alert" className="mt-[0.15rem] h-3 w-3 shrink-0" />
              {w}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
