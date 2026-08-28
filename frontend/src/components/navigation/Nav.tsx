'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLenis } from '@/lib/lenis/SmoothScrollProvider';
import { useIntro } from '@/components/motion/IntroProvider';
import { ScrollTrigger } from '@/lib/gsap';
import { Mark } from '@/components/brand/Mark';

const LINKS = [
  { href: '/challenges', label: 'Challenges' },
  { href: '/startups', label: 'Startups' },
  { href: '/pilots', label: 'Pilots' },
  { href: '/intelligence', label: 'Intelligence' },
];

/**
 * Navigation — a centred floating glass capsule that opens after the hero.
 *
 * Built to the same recipe as the zexvro reference: a full-width fixed header
 * that is pointer-events-none, centring a single pointer-events-auto capsule
 * with a 999px radius, a hairline border and a heavy backdrop blur with
 * saturation. The header never blocks the page; only the capsule does.
 *
 * Two states:
 *   CLOSED  over the hero — the mark alone. A bar of links laid across a
 *           full-screen statement competes with it, so there is not one.
 *   OPEN    once the hero is scrolled past — wordmark, links and CTA slide out
 *           and the capsule grows to fit via a layout animation.
 *
 * The capsule carries the same Mark the preloader assembles and exposes
 * `data-nav-mark`, so the opener can measure it and fly the large mark into
 * this exact position.
 */
export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const lenis = useLenis();
  const reduceMotion = useReducedMotion();
  const { canAnimate } = useIntro();
  const [pastHero, setPastHero] = useState(false);

  const isLanding = pathname === '/';
  // Appears as the opener hands off. Sub-pages have no opener.
  const visible = !isLanding || canAnimate;
  // Opens only once the hero has been scrolled past; closes again on the way up.
  const expanded = !isLanding || pastHero;

  /**
   * Watch the section *after* the hero rather than the hero's own timeline.
   *
   * The hero is pinned, so its trigger's callbacks also fire during
   * ScrollTrigger.refresh() and its progress does not map cleanly to "the
   * reader has moved on". The arrival of the next section does, and it is a
   * single unambiguous boundary in both directions.
   */
  useEffect(() => {
    if (!isLanding) return;
    const next = document.querySelector('#problem');
    if (!next) return;

    const st = ScrollTrigger.create({
      trigger: next,
      start: 'top 88%',
      onEnter: () => setPastHero(true),
      onLeaveBack: () => setPastHero(false),
    });
    return () => st.kill();
  }, [isLanding]);

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

  // A closed capsule has no menu to keep open.
  useEffect(() => {
    if (!expanded) setOpen(false);
  }, [expanded]);

  /** Width-collapsing reveal used by everything that hides over the hero. */
  const reveal = {
    initial: { opacity: 0, width: 0 },
    animate: { opacity: 1, width: 'auto' },
    exit: { opacity: 0, width: 0 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  };

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[clamp(0.75rem,2vh,1.25rem)] md:px-6">
        <motion.div
          className="pointer-events-auto max-w-full"
          initial={isLanding ? { opacity: 0, y: -14, scale: 0.94 } : false}
          animate={visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -14, scale: 0.94 }}
          // Lands a beat after the preloader mark arrives, so the capsule reads
          // as receiving the mark rather than racing it.
          transition={{ duration: 0.7, delay: isLanding ? 0.45 : 0, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.nav
            aria-label="Primary"
            layout
            transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative flex h-[3.125rem] items-center overflow-hidden rounded-full transition-colors duration-500',
              expanded ? 'gap-3 pl-3 pr-2 sm:gap-4 sm:pl-4 sm:pr-2.5' : 'px-4 sm:px-5',
            )}
            style={{
              // The reference recipe: hairline border, heavy blur with
              // saturation so whatever passes underneath tints the glass.
              border: '0.8px solid rgba(23,22,26,0.14)',
              backdropFilter: 'blur(22px) saturate(1.55)',
              WebkitBackdropFilter: 'blur(22px) saturate(1.55)',
              backgroundColor: scrolled ? 'rgba(246,243,236,0.62)' : 'rgba(246,243,236,0.34)',
              boxShadow:
                '0 1px 0 0 rgba(255,255,255,0.5) inset, 0 8px 30px -12px rgba(23,22,26,0.18)',
            }}
          >
            {/* Gloss sweep, clipped to the capsule. */}
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

            {/* --- the mark: present in both states with written name --- */}
            <Link
              href="/"
              data-cursor="home"
              aria-label="MahaInnovate home"
              className="relative flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              {/* Wrapped so the preloader can measure this exact box. */}
              <span data-nav-mark className="block w-[1.35rem] shrink-0">
                <Mark radius="22%" />
              </span>

              <span className="whitespace-nowrap font-display text-[0.8125rem] font-bold uppercase tracking-[0.2em] text-ink">
                MahaInnovate
              </span>
            </Link>

            {/* --- links and CTA: only once the hero is past --- */}
            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div
                  key="expanded"
                  {...reveal}
                  className="relative flex items-center gap-3 overflow-hidden sm:gap-4"
                >
                  <span aria-hidden="true" className="hidden h-4 w-px shrink-0 bg-ink/15 lg:block" />

                  <ul className="hidden items-center gap-5 lg:flex">
                    {LINKS.map((link) => {
                      const active = pathname === link.href;
                      return (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            data-cursor="open"
                            className={cn(
                              'group relative block whitespace-nowrap py-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] transition-colors',
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

                  <Link
                    href="/dashboard"
                    data-cursor="enter"
                    className="hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-ink px-4 py-2 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-bone-light transition-colors hover:bg-saffron sm:inline-flex"
                  >
                    Enter
                    <span aria-hidden="true">→</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-controls="mobile-nav"
                    className="flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-[5px] lg:hidden"
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
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.nav>
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
