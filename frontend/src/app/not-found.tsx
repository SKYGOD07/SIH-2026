import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white/70 backdrop-blur-md border border-chalk/12 shadow-xl">
        <span className="inline-block font-mono text-xs uppercase tracking-widest text-signal bg-signal/15 px-3 py-1 rounded-full mb-4">
          404 Not Found
        </span>
        <h2 className="font-display text-2xl uppercase text-chalk font-semibold mb-2">
          Page Not Found
        </h2>
        <p className="text-sm text-chalk/55 leading-relaxed mb-6">
          The page or route you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-full bg-chalk text-void font-mono text-xs uppercase tracking-wider hover:bg-signal transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
