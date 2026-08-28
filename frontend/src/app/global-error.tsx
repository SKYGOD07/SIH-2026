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
      <body className="min-h-screen bg-bone flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white/80 backdrop-blur-md border border-ink/10 shadow-xl">
          <h2 className="font-display text-2xl uppercase text-ink font-semibold mb-2">
            Application Error
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed mb-6">
            {error?.message || 'A critical error occurred.'}
          </p>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-full bg-ink text-bone-light font-mono text-xs uppercase tracking-wider hover:bg-saffron transition-colors"
          >
            Refresh Application
          </button>
        </div>
      </body>
    </html>
  );
}
