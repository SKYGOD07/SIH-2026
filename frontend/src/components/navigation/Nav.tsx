'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { useLenis } from '@/lib/lenis/SmoothScrollProvider';
import { useIntro } from '@/components/motion/IntroProvider';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { Mark } from '@/components/brand/Mark';

/**
 * Navigation — a floating capsule, and a full-screen menu behind it.
 *
 * The capsule is unchanged in recipe: a full-width fixed header that is
 * pointer-events-none, centring a single pointer-events-auto pill with a 999px
 * radius, a hairline border and a heavy backdrop blur with saturation. The
 * header never blocks the page; only the pill does. It still carries the Mark
 * the preloader assembles and still exposes `data-nav-mark`, so the opener can
 * measure it and fly the large mark into this exact position.
 *
 * What changed is where navigation lives. The pill used to grow a row of four
 * inline links once the hero was past. Those are gone: a four-item bar and a
 * full-screen menu holding the same four items is the same navigation built
 * twice, and the one that can carry a description and a preview is the one
 * worth keeping. The pill now holds the mark, the wordmark, the primary action
 * and the button that opens everything else.
 *
 * The menu opens as a circle growing out of the button. Its geometry is
 * measured, not assumed — see `openMenu` — because the button is at the end of
 * a centred pill rather than in the top-right corner the usual recipe expects.
 */

interface NavLink {
  href: string;
  label: string;
  /** One line, shown beside the link. */
  detail: string;
  /** The preview this link brings up behind the menu. */
  background: string;
}

const LINKS: NavLink[] = [
  {
    href: '/dashboard',
    label: 'Console',
    detail: 'What is waiting on a decision',
    background:
      'radial-gradient(120% 90% at 78% 12%, rgba(189,10,10,0.55) 0%, rgba(189,10,10,0.10) 42%, rgba(0,0,0,0) 72%)',
  },
  {
    href: '/pilots',
    label: 'Pilots',
    detail: 'Bounded deployments under contract',
    background:
      'radial-gradient(120% 90% at 22% 78%, rgba(255,196,0,0.34) 0%, rgba(255,196,0,0.07) 44%, rgba(0,0,0,0) 74%)',
  },
  {
    href: '/templates',
    label: 'Templates',
    detail: 'The seven standard forms',
    background:
      'radial-gradient(120% 90% at 82% 82%, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.04) 44%, rgba(0,0,0,0) 74%)',
  },
  {
    href: '/corpus',
    label: 'Evidence base',
    detail: 'What the corpus knows, by domain',
    background:
      'radial-gradient(120% 90% at 18% 20%, rgba(111,207,151,0.28) 0%, rgba(111,207,151,0.05) 44%, rgba(0,0,0,0) 74%)',
  },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  /** The last link hovered, kept so its preview can animate out rather than cut. */
  const [leaving, setLeaving] = useState<string | null>(null);

  const pathname = usePathname();
  const lenis = useLenis();
  const reduced = usePrefersReducedMotion();
  const { canAnimate, heroComplete } = useIntro();

  const headerRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const revealRef = useRef<gsap.core.Timeline | null>(null);

  const isLanding = pathname === '/';
  const visible = !isLanding || canAnimate;
  /*
   * The pill expands once the deck's opening slide is behind the reader, and
   * closes again on the way back. The deck reports that boundary itself through
   * the intro context: its slides are pinned and translated horizontally, so a
   * ScrollTrigger aimed at one of them from out here would be measuring an
   * element that never moves.
   */
  const expanded = !isLanding || heroComplete;

  /* ---------------------------------------------------------- entrance --- */

  /**
   * The header drops in once, on load.
   *
   * Held at -100 until `visible`, so it cannot start underneath the preloader
   * and be finished by the time the curtain lifts. `overwrite` matters here:
   * without it a fast route change can leave two entrance tweens fighting over
   * the same y and the header settles a few pixels high.
   */
  useGSAP(
    () => {
      const header = headerRef.current;
      if (!header) return;

      if (reduced) {
        gsap.set(header, { y: 0, autoAlpha: visible ? 1 : 0 });
        return;
      }

      gsap.to(header, {
        y: visible ? 0 : -100,
        autoAlpha: visible ? 1 : 0,
        duration: 0.8,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    },
    { dependencies: [visible, reduced] },
  );

  /* -------------------------------------------------------------- menu --- */

  /**
   * Build the open/close timeline.
   *
   * The circle is anchored to the button's measured centre and sized to reach
   * the furthest corner of the viewport from there. A fixed 150% works when the
   * origin is a corner; from an arbitrary point it either overshoots badly or —
   * worse — leaves an unfilled wedge in the far corner, which appears only on
   * some window shapes and so tends to survive review.
   */
  const buildReveal = useCallback(() => {
    const menu = menuRef.current;
    const button = buttonRef.current;
    if (!menu || !button) return null;

    const rect = button.getBoundingClientRect();
    const ox = rect.left + rect.width / 2;
    const oy = rect.top + rect.height / 2;

    const radius = Math.ceil(
      Math.max(
        Math.hypot(ox, oy),
        Math.hypot(window.innerWidth - ox, oy),
        Math.hypot(ox, window.innerHeight - oy),
        Math.hypot(window.innerWidth - ox, window.innerHeight - oy),
      ),
    );

    gsap.set(menu, { ['--nav-ox']: `${ox}px`, ['--nav-oy']: `${oy}px` });

    // Every item in the panel, not only the links — the closing notice belongs
    // to the same entrance, and leaving it out makes it appear to arrive late.
    const items = gsap.utils.toArray<HTMLElement>('.nav-item', menu);

    const tl = gsap.timeline({ paused: true });
    tl.fromTo(
      menu,
      { ['--nav-reveal']: '0px' },
      { ['--nav-reveal']: `${radius}px`, duration: 0.85, ease: 'power3.inOut' },
    ).fromTo(
      items,
      { y: 40, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' },
      // Overlapping, so the links are arriving while the circle is still
      // growing. Waiting for it to finish reads as two separate animations.
      '-=0.45',
    );

    return tl;
  }, []);

  useGSAP(
    () => {
      const menu = menuRef.current;
      if (!menu) return;

      if (reduced) {
        gsap.set(menu, { autoAlpha: open ? 1 : 0 });
        gsap.set('.nav-item', { y: 0, autoAlpha: 1 });
        return;
      }

      if (open) {
        // Rebuilt on each open: the button moves when the pill expands, and the
        // viewport may have been resized while the menu was shut.
        revealRef.current?.kill();
        const tl = buildReveal();
        revealRef.current = tl;
        gsap.set(menu, { autoAlpha: 1 });
        tl?.play(0);
      } else if (revealRef.current) {
        revealRef.current.reverse().then(() => {
          if (!menuRef.current) return;
          gsap.set(menuRef.current, { autoAlpha: 0 });
        });
      } else {
        gsap.set(menu, { autoAlpha: 0 });
      }
    },
    { dependencies: [open, reduced, buildReveal] },
  );

  /* Scroll is held while the menu is open, or the page moves underneath it. */
  useEffect(() => {
    if (!lenis) return;
    if (open) lenis.stop();
    else lenis.start();
  }, [open, lenis]);

  /* Escape closes, and focus goes back to the control that opened it. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  /* A route change closes the menu; the destination is already arriving. */
  useEffect(() => {
    setOpen(false);
    setHovered(null);
    setLeaving(null);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /**
   * Hover bookkeeping.
   *
   * The link being left keeps its leaving class while the next one enters, so
   * the two previews cross-fade rather than the outgoing one being cut. That is
   * why `enter` does not clear `leaving`: clearing it would drop the outgoing
   * preview back to the base rule mid-transition, and moving quickly down the
   * list would strobe.
   *
   * A stale `leaving` is harmless — that layer is already at zero opacity.
   */
  const enter = (href: string) => setHovered(href);
  const leave = (href: string) => {
    // Both writes are plain calls. Setting state from inside an updater would
    // run twice under StrictMode's double-invocation and is not what an updater
    // is for. Marking a link as leaving when it was not the hovered one is
    // harmless: that layer is already at zero and carries no enter class.
    setLeaving(href);
    setHovered((current) => (current === href ? null : current));
  };

  return (
    <>
      <header
        ref={headerRef}
        // `.nav-shell` holds the pre-entrance position. Deliberately not a
        // `style` prop — see the note on that class in globals.css.
        className="nav-shell pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-[clamp(0.75rem,2vh,1.25rem)] md:px-6"
      >
        <nav
          aria-label="Primary"
          className={cn(
            'pointer-events-auto relative flex h-[3.125rem] max-w-full items-center overflow-hidden rounded-full transition-[gap,padding,background-color] duration-500',
            expanded ? 'gap-3 pl-3 pr-2 sm:gap-4 sm:pl-4 sm:pr-2.5' : 'gap-2 px-3 sm:px-3.5',
          )}
          style={{
            // The reference recipe: hairline border, heavy blur with
            // saturation so whatever passes underneath tints the glass.
            border: '0.8px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(22px) saturate(1.55)',
            WebkitBackdropFilter: 'blur(22px) saturate(1.55)',
            backgroundColor: open
              ? 'rgba(0,0,0,0.4)'
              : scrolled
                ? 'rgba(0,0,0,0.62)'
                : 'rgba(0,0,0,0.28)',
            boxShadow: '0 1px 0 0 rgba(255,255,255,0.14) inset, 0 8px 30px -12px rgba(0,0,0,0.6)',
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
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                animation: 'markGloss 7s ease-in-out infinite',
              }}
            />
          </span>

          {/* --- the mark: present in both states --- */}
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

            <span
              className={cn(
                'whitespace-nowrap font-display text-[0.8125rem] font-bold uppercase tracking-[0.2em] text-chalk transition-all duration-500',
                expanded ? 'max-w-[12rem] opacity-100' : 'max-w-0 overflow-hidden opacity-0',
              )}
            >
              MahaInnovate
            </span>
          </Link>

          {/* --- the primary action --- */}
          <Link
            href="/dashboard"
            data-cursor="enter"
            className={cn(
              'hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-chalk px-4 py-2 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-void transition-all duration-500 hover:bg-flare hover:text-chalk sm:inline-flex',
              expanded ? 'max-w-[10rem] opacity-100' : 'max-w-0 overflow-hidden px-0 opacity-0',
            )}
          >
            Enter
            <span aria-hidden="true">→</span>
          </Link>

          {/* --- the hamburger, which morphs to a close --- */}
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-menu"
            data-cursor="open"
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-chalk/10"
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>

            {/*
              Three lines that become a cross. The outer two translate to the
              centre and rotate; the middle scales to nothing. Both halves of the
              morph are on `transform` alone, so it composites.
            */}
            <span aria-hidden="true" className="relative block h-[0.875rem] w-[1.125rem]">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={cn(
                    'absolute left-0 block h-[1.5px] w-full origin-center rounded-full bg-chalk transition-transform duration-[450ms] ease-editorial',
                    i === 0 && 'top-0',
                    i === 1 && 'top-1/2 -translate-y-1/2',
                    i === 2 && 'bottom-0',
                  )}
                  style={{
                    transform: open
                      ? i === 0
                        ? 'translateY(calc(0.4375rem - 0.75px)) rotate(45deg)'
                        : i === 1
                          ? 'translateY(-50%) scaleX(0)'
                          : 'translateY(calc(-0.4375rem + 0.75px)) rotate(-45deg)'
                      : undefined,
                  }}
                />
              ))}
            </span>
          </button>
        </nav>
      </header>

      {/* ------------------------------------------------------------ menu */}
      <div
        ref={menuRef}
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        /*
         * Inert until opened, so its links are never tabbable behind the page.
         *
         * Spread rather than written as a prop: this React does not know `inert`
         * as a boolean, so `inert={true}` is dropped silently. The HTML spec
         * wants the attribute present or absent, which is what the empty string
         * and `undefined` give — and `visibility: hidden` is the second line of
         * defence if a browser does not support it at all.
         */
        {...({ inert: open ? undefined : '' } as Record<string, string | undefined>)}
        className="nav-menu fixed inset-0 z-50 bg-void"
      >
        {/* The per-link previews, stacked behind everything. */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          {LINKS.map((link) => (
            <span
              key={link.href}
              className={cn(
                'nav-bg',
                hovered === link.href && 'is-bg-enter',
                hovered !== link.href && leaving === link.href && 'is-bg-leave',
              )}
              style={{ backgroundImage: link.background }}
            />
          ))}
        </div>

        <div className="edge relative flex h-full w-full flex-col justify-center pb-[clamp(3rem,8vh,5rem)] pt-[calc(var(--nav-h)+2rem)]">
          <span className="font-mono text-meta uppercase tracking-[0.16em] text-chalk/35">
            Menu
          </span>

          <ul ref={listRef} className="nav-list mt-[clamp(1.5rem,4vh,2.5rem)] max-w-[64rem]">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href} className="nav-item">
                  <Link
                    href={link.href}
                    data-cursor="open"
                    aria-current={active ? 'page' : undefined}
                    onMouseEnter={() => enter(link.href)}
                    onMouseLeave={() => leave(link.href)}
                    onFocus={() => enter(link.href)}
                    onBlur={() => leave(link.href)}
                    className="group flex flex-wrap items-baseline gap-x-8 gap-y-1 border-b border-chalk/[0.08] py-[clamp(0.75rem,2.2vh,1.5rem)]"
                  >
                    <span
                      className={cn(
                        'font-display text-display-md font-black uppercase leading-none transition-colors duration-500',
                        active ? 'text-flare-bright' : 'text-chalk',
                      )}
                    >
                      {link.label}
                    </span>
                    <span className="font-mono text-meta uppercase tracking-[0.14em] text-chalk/40 transition-colors duration-500 group-hover:text-chalk/70">
                      {link.detail}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="nav-item mt-[clamp(1.75rem,5vh,3rem)] max-w-[42ch] text-sm leading-relaxed text-chalk/40">
            {/* Outside `.nav-list`, so the hover dim never reaches it. */}
            Demonstration data throughout. Nothing here is a procurement notice, an eligibility
            determination or a government commitment.
          </p>
        </div>
      </div>
    </>
  );
}
