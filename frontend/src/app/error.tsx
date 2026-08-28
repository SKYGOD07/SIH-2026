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
    <div className="min-h-screen bg-void flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white/70 backdrop-blur-md border border-chalk/12 shadow-xl">
        <span className="inline-block font-mono text-xs uppercase tracking-widest text-signal bg-signal/15 px-3 py-1 rounded-full mb-4">
          Error Encountered
        </span>
        <h2 className="font-display text-2xl uppercase text-chalk font-semibold mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-chalk/55 leading-relaxed mb-6">
          {error?.message || 'An unexpected application error occurred while rendering the page.'}
        </p>
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-full bg-chalk text-void font-mono text-xs uppercase tracking-wider hover:bg-signal transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
