import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bone flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white/70 backdrop-blur-md border border-ink/10 shadow-xl">
        <span className="inline-block font-mono text-xs uppercase tracking-widest text-saffron bg-saffron/10 px-3 py-1 rounded-full mb-4">
          404 Not Found
        </span>
        <h2 className="font-display text-2xl uppercase text-ink font-semibold mb-2">
          Page Not Found
        </h2>
        <p className="text-sm text-ink-muted leading-relaxed mb-6">
          The page or route you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-full bg-ink text-bone-light font-mono text-xs uppercase tracking-wider hover:bg-saffron transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
