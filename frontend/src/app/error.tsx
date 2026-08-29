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
    // Automatically recover from stale Webpack ChunkLoad errors after dev builds
    if (
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('failed')
    ) {
      const lastReload = sessionStorage.getItem('chunk_reload_time');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 5000) {
        sessionStorage.setItem('chunk_reload_time', now.toString());
        window.location.reload();
      }
    }
  }, [error]);

  const handleRetry = () => {
    if (
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Loading chunk')
    ) {
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-chalk/12 shadow-xl text-chalk">
        <span className="inline-block font-mono text-xs uppercase tracking-widest text-signal bg-signal/15 px-3 py-1 rounded-full mb-4">
          Error Encountered
        </span>
        <h2 className="font-display text-2xl uppercase font-semibold mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-chalk/60 leading-relaxed mb-6">
          {error?.message || 'An unexpected application error occurred while rendering the page.'}
        </p>
        <button
          onClick={handleRetry}
          className="px-5 py-2.5 rounded-full bg-chalk text-void font-mono text-xs uppercase tracking-wider hover:bg-signal transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
