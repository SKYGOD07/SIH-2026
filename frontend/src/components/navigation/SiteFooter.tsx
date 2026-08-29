import Link from 'next/link';
import { DEMO_NOTICE } from '@/data/challenges';

/**
 * Site footer.
 *
 * A full-bleed band in the accent carrying four links, a line of small print
 * and nothing else. The previous version was a three-column sitemap with the
 * ten-stage pathway repeated in it, which is a lot of furniture at the end of a
 * page whose whole argument is that it does not clutter.
 *
 * The reference this is built to runs about a dozen leaf elements in a 240px
 * band on flat colour. This is the same shape, and the discipline is the point:
 * a footer is where a reader goes when they have decided the page is over, so
 * it should hold the smallest number of doors that are actually useful.
 *
 * The demonstration notice stays. It is the one thing on this site that must
 * appear on every route regardless of where a reader entered, because a fixture
 * mistaken for a departmental record is the only genuinely damaging failure
 * this project has.
 */

const LINKS = [
  { href: '/dashboard', label: 'Console' },
  { href: '/templates', label: 'Templates' },
  { href: '/pilots', label: 'Pilots' },
  { href: '/corpus', label: 'Evidence' },
];

export function SiteFooter() {
  return (
    <footer className="relative w-full bg-flare text-chalk">
      <div className="edge mx-auto flex max-w-[110rem] flex-col gap-8 py-[clamp(2.5rem,6vh,3.5rem)]">
        <div className="flex flex-wrap items-baseline justify-between gap-x-10 gap-y-6">
          <Link
            href="/"
            data-cursor="home"
            className="font-display text-[clamp(1.5rem,3.4vw,2.25rem)] font-black uppercase leading-none tracking-[-0.04em] transition-opacity hover:opacity-80"
          >
            MahaInnovate
          </Link>

          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-7 gap-y-2">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    data-cursor="open"
                    className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-chalk/75 transition-colors hover:text-chalk"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="max-w-[80ch] border-t border-chalk/25 pt-5 text-[0.6875rem] leading-relaxed text-chalk/70">
          {DEMO_NOTICE} Nothing shown here constitutes a procurement notice, an eligibility
          determination or a government commitment.
        </p>
      </div>
    </footer>
  );
}
