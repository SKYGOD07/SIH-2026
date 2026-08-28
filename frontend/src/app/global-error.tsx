'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-void flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white/80 backdrop-blur-md border border-chalk/12 shadow-xl">
          <h2 className="font-display text-2xl uppercase text-chalk font-semibold mb-2">
            Application Error
          </h2>
          <p className="text-sm text-chalk/55 leading-relaxed mb-6">
            {error?.message || 'A critical error occurred.'}
          </p>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-full bg-chalk text-void font-mono text-xs uppercase tracking-wider hover:bg-signal transition-colors"
          >
            Refresh Application
          </button>
        </div>
      </body>
    </html>
  );
}
