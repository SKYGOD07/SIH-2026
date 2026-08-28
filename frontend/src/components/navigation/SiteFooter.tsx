'use client';

import Link from 'next/link';
import { Label } from '@/components/typography';
import { LIFECYCLE } from '@/data/lifecycle';
import { DEMO_NOTICE } from '@/data/challenges';

const ROUTES = [
  { href: '/challenges', label: 'Challenges' },
  { href: '/startups', label: 'Startups' },
  { href: '/pilots', label: 'Pilots' },
  { href: '/intelligence', label: 'Intelligence' },
  { href: '/dashboard', label: 'Dashboard' },
];

/**
 * Site footer. Carries the demonstration-data notice on every route, so the
 * disclaimer is never something a reader has to have seen on the landing page.
 */
export function SiteFooter() {
  return (
    <footer className="relative border-t border-ink/12 ground-bone py-[clamp(3.5rem,8vh,6rem)]">
      <div className="edge mx-auto max-w-[110rem]">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.9fr_0.9fr]">
          <div>
            <p className="font-display text-2xl font-bold uppercase tracking-[0.1em] text-ink">
              MahaInnovate
            </p>
            <p className="mt-4 max-w-[36ch] text-sm leading-relaxed text-stone">
              Innovation procurement intelligence platform — from departmental problem to validated
              scale-up, on one record.
            </p>
            <p className="mt-6 flex flex-wrap gap-x-6 gap-y-1 font-mono text-meta uppercase">
              <span className="text-saffron">AI assists.</span>
              <span className="text-saffron">Evidence supports.</span>
              <span className="text-saffron">Humans decide.</span>
            </p>
          </div>

          <nav aria-label="Platform">
            <Label>Platform</Label>
            <ul className="mt-5 space-y-2.5">
              {ROUTES.map((r) => (
                <li key={r.href}>
                  <Link
                    href={r.href}
                    className="font-mono text-meta uppercase text-stone transition-colors hover:text-ink"
                  >
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <Label>The pathway</Label>
            <ol className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2">
              {LIFECYCLE.map((s) => (
                <li key={s.id} className="font-mono text-meta uppercase text-stone">
                  <span className="text-ink/40">{s.index}</span> {s.label}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <p className="mt-14 max-w-[80ch] border-t border-ink/12 pt-6 text-xs leading-relaxed text-stone">
          {DEMO_NOTICE} Nothing shown here constitutes a procurement notice, an eligibility
          determination or a government commitment.
        </p>
      </div>
    </footer>
  );
}
