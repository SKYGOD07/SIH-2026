'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLenis } from '@/lib/lenis/SmoothScrollProvider';
import { useIntro } from '@/components/motion/IntroProvider';
import { Mark } from '@/components/brand/Mark';

const LINKS = [
  { href: '/challenges', label: 'Challenges' },
  { href: '/startups', label: 'Startups' },
  { href: '/pilots', label: 'Pilots' },
  { href: '/intelligence', label: 'Intelligence' },
];

/**
 * Navigation — a centred floating glass capsule.
 *
 * Built to the same recipe as the zexvro reference: a full-width fixed header
 * that is `pointer-events-none`, centring a single `pointer-events-auto`
 * capsule with a 999px radius, a hairline border and a heavy backdrop blur with
 * saturation. The header itself never blocks the page; only the pill does.
 *
 * The capsule carries the same Mark component the preloader assembles, and it
 * is positioned so the preloader can measure it and fly the big mark into this
 * exact spot — which is what makes the opener feel connected to the site rather
 * than played before it.
 */
export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const lenis = useLenis();
  const reduceMotion = useReducedMotion();
  const { canAnimate } = useIntro();

  // On the landing page the capsule appears as the opener hands off to it.
  // Sub-pages have no opener, so it is there immediately.
  const isLanding = pathname === '/';
  const visible = !isLanding || canAnimate;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!lenis) return;
    if (open) lenis.stop();
    else lenis.start();
  }, [open, lenis]);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[clamp(0.75rem,2vh,1.25rem)] md:px-6">
        <motion.div
          className="pointer-events-auto max-w-full"
          initial={isLanding ? { opacity: 0, y: -14, scale: 0.94 } : false}
          animate={
            visible
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0, y: -14, scale: 0.94 }
          }
          // Lands a beat after the preloader mark arrives, so the capsule reads
          // as receiving the mark rather than racing it.
          transition={{ duration: 0.7, delay: isLanding ? 0.45 : 0, ease: [0.16, 1, 0.3, 1] }}
        >
          <nav
            aria-label="Primary"
            data-nav-capsule
            className={cn(
              'relative flex items-center gap-3 rounded-full pl-3 pr-2 transition-colors duration-500 sm:gap-5 sm:pl-4 sm:pr-2.5',
              'h-[3.125rem]',
            )}
            style={{
              // Matches the reference recipe: hairline border, heavy blur with
              // saturation so whatever passes underneath tints the glass.
              border: '0.8px solid rgba(23,22,26,0.14)',
              backdropFilter: 'blur(22px) saturate(1.55)',
              WebkitBackdropFilter: 'blur(22px) saturate(1.55)',
              backgroundColor: scrolled ? 'rgba(246,243,236,0.62)' : 'rgba(246,243,236,0.34)',
              boxShadow: '0 1px 0 0 rgba(255,255,255,0.5) inset, 0 8px 30px -12px rgba(23,22,26,0.18)',
            }}
          >
            {/* Gloss sweep, clipped to the capsule. Purely a highlight. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
            >
              <span
                className="absolute inset-y-0 -left-1/3 w-1/3 opacity-40"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent)',
                  animation: 'markGloss 7s ease-in-out infinite',
                }}
              />
            </span>

            {/* --- brand --- */}
            <Link
              href="/"
              data-cursor="home"
              className="relative flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-70"
            >
              {/* Wrapped so the preloader can measure this exact box and fly
                  the large mark into it. */}
              <span data-nav-mark className="block w-[1.35rem]">
                <Mark radius="22%" />
              </span>
              <span className="font-display text-[0.8125rem] font-bold uppercase tracking-[0.2em] text-ink">
                MahaInnovate
              </span>
            </Link>

            {/* --- links --- */}
            <span aria-hidden="true" className="hidden h-4 w-px bg-ink/15 lg:block" />

            <ul className="relative hidden items-center gap-5 lg:flex">
              {LINKS.map((link) => {
                const active = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      data-cursor="open"
                      className={cn(
                        'group relative block py-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] transition-colors',
                        active ? 'text-ink' : 'text-stone hover:text-ink',
                      )}
                    >
                      {link.label}
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute -bottom-0.5 left-0 h-px w-full origin-left bg-saffron transition-transform duration-500 ease-editorial',
                          active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* --- cta --- */}
            <Link
              href="/dashboard"
              data-cursor="enter"
              className="relative hidden shrink-0 items-center gap-2 rounded-full bg-ink px-4 py-2 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-bone-light transition-colors hover:bg-saffron sm:inline-flex"
            >
              Enter
              <span aria-hidden="true">→</span>
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              className="relative flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-[5px] lg:hidden"
            >
              <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
              <motion.span
                className="block h-px w-4 bg-ink"
                animate={{ rotate: open ? 45 : 0, y: open ? 3 : 0 }}
                transition={{ duration: 0.3 }}
              />
              <motion.span
                className="block h-px w-4 bg-ink"
                animate={{ rotate: open ? -45 : 0, y: open ? -3 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </button>
          </nav>
        </motion.div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            key="sheet"
            initial={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-4 top-[4.75rem] z-40 rounded-3xl border border-ink/12 bg-bone-light/95 p-2 backdrop-blur-xl lg:hidden"
          >
            <ul className="flex flex-col">
              {[...LINKS, { href: '/dashboard', label: 'Enter platform' }].map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: reduceMotion ? 0 : -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={link.href}
                    className="block rounded-2xl px-4 py-3 font-display text-xl uppercase text-ink transition-colors hover:bg-ink/5"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
