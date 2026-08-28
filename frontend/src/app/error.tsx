'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bone flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white/70 backdrop-blur-md border border-ink/10 shadow-xl">
        <span className="inline-block font-mono text-xs uppercase tracking-widest text-saffron bg-saffron/10 px-3 py-1 rounded-full mb-4">
          Error Encountered
        </span>
        <h2 className="font-display text-2xl uppercase text-ink font-semibold mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-ink-muted leading-relaxed mb-6">
          {error?.message || 'An unexpected application error occurred while rendering the page.'}
        </p>
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-full bg-ink text-bone-light font-mono text-xs uppercase tracking-wider hover:bg-saffron transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
