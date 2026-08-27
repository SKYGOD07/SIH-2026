'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLenis } from '@/lib/lenis/SmoothScrollProvider';

const LINKS = [
  { href: '/challenges', label: 'Challenges' },
  { href: '/startups', label: 'Startups' },
  { href: '/pilots', label: 'Pilots' },
  { href: '/intelligence', label: 'Intelligence' },
];

/**
 * Fixed navigation. Transparent over the hero, gaining a backdrop as the page
 * scrolls. Framer Motion owns the state transition; GSAP is not involved —
 * this is interface, not choreography.
 */
export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const lenis = useLenis();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The mobile sheet must not scroll the page behind it.
  useEffect(() => {
    if (!lenis) return;
    if (open) lenis.stop();
    else lenis.start();
  }, [open, lenis]);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <motion.header
        initial={false}
        animate={{
          backgroundColor: scrolled ? 'rgba(7,8,10,0.78)' : 'rgba(7,8,10,0)',
          borderBottomColor: scrolled ? 'rgba(246,243,236,0.1)' : 'rgba(246,243,236,0)',
          backdropFilter: scrolled ? 'blur(16px)' : 'blur(0px)',
        }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-50 border-b"
        style={{ height: 'var(--nav-h)' }}
      >
        {/*
          Always-on scrim. Even before the solid background fades in, this keeps
          the wordmark and links legible over whatever is behind them and gives
          the type below the nav a clear edge to stop against.
        */}
        <div
          aria-hidden="true"
          className="nav-scrim pointer-events-none absolute inset-x-0 top-0 -z-10 h-[calc(var(--nav-h)*1.7)]"
        />
        <nav
          aria-label="Primary"
          className="edge mx-auto flex h-full max-w-[110rem] items-center justify-between gap-6"
        >
          <Link
            href="/"
            data-cursor="home"
            className="font-display text-[0.95rem] font-bold uppercase tracking-[0.14em] text-ivory transition-opacity hover:opacity-70"
          >
            MahaInnovate
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    data-cursor="open"
                    className={cn(
                      'group relative block py-1 font-mono text-meta uppercase transition-colors',
                      active ? 'text-ivory' : 'text-silver hover:text-ivory',
                    )}
                  >
                    {link.label}
                    <motion.span
                      aria-hidden="true"
                      className="absolute -bottom-0.5 left-0 h-px w-full origin-left bg-saffron"
                      initial={false}
                      animate={{ scaleX: active ? 1 : 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    />
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-ivory/40 transition-transform duration-500 ease-editorial group-hover:scale-x-100"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              data-cursor="enter"
              className="group hidden items-center gap-2.5 border border-ivory/25 px-4 py-2 font-mono text-meta uppercase text-ivory transition-colors hover:border-saffron hover:text-saffron sm:inline-flex"
            >
              Enter platform
              <span aria-hidden="true" className="transition-transform duration-500 ease-editorial group-hover:translate-x-1">
                →
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] md:hidden"
            >
              <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
              <motion.span
                className="block h-px w-5 bg-ivory"
                animate={{ rotate: open ? 45 : 0, y: open ? 3 : 0 }}
                transition={{ duration: 0.3 }}
              />
              <motion.span
                className="block h-px w-5 bg-ivory"
                animate={{ rotate: open ? -45 : 0, y: open ? -3 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            key="sheet"
            initial={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 top-[var(--nav-h)] z-40 border-b border-ivory/10 bg-ink-950/97 backdrop-blur-xl md:hidden"
          >
            <ul className="edge flex flex-col py-6">
              {[...LINKS, { href: '/dashboard', label: 'Enter platform' }].map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: reduceMotion ? 0 : -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={link.href}
                    className="block border-b border-ivory/10 py-4 font-display text-2xl uppercase text-ivory"
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
