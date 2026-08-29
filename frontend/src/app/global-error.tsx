'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Loading chunk')
    ) {
      window.location.reload();
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-void flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-chalk/12 shadow-xl text-chalk">
          <h2 className="font-display text-2xl uppercase font-semibold mb-2">
            Application Error
          </h2>
          <p className="text-sm text-chalk/60 leading-relaxed mb-6">
            {error?.message || 'A critical error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-full bg-chalk text-void font-mono text-xs uppercase tracking-wider hover:bg-signal transition-colors"
          >
            Refresh Application
          </button>
        </div>
      </body>
    </html>
  );
}
