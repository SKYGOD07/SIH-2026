'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { radiusToCorner } from '@/lib/console/maximize';

/**
 * The colour theme.
 *
 * Dark is the product's primary look and the default; bright is a preference a
 * reader opts into. The choice is kept in `localStorage` rather than
 * `sessionStorage` — unlike the auth session, which is deliberately per-tab, a
 * display preference that has to be re-set in every new tab is not a preference,
 * it is an annoyance. Nothing here is identity, so none of the isolation
 * reasoning that governs the auth client applies.
 *
 * The switch itself is a circular reveal from the point of the click, matching
 * `.console-maximize`. One gesture, used for both the console opening and the
 * theme changing, rather than two different ideas of what an expansion looks
 * like in the same product.
 */

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'sarthi.theme';

/**
 * Applied before first paint, inlined in the document head.
 *
 * Without this the page always renders dark and then corrects itself, so a
 * reader who chose bright sees a black flash on every navigation and reload.
 * It is written as a string because it has to run before React exists.
 *
 * It fails silently: a browser blocking storage should get the default theme,
 * not an exception in the head that stops the rest of the document.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch(e){}})();`;

interface ThemeContextValue {
  theme: Theme;
  /** Toggle, revealing from a point — usually the button that was clicked. */
  toggle: (origin?: { x: number; y: number }) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStored(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Seeded from the DOM, which the pre-paint script has already set, so the
  // first React render agrees with what is on screen.
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    setTheme(readStored());
  }, []);

  const apply = useCallback((next: Theme) => {
    const root = document.documentElement;
    if (next === 'dark') delete root.dataset.theme;
    else root.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage blocked — the theme still applies for this page's lifetime */
    }
    setTheme(next);
  }, []);

  const toggle = useCallback(
    (origin?: { x: number; y: number }) => {
      const next: Theme = theme === 'dark' ? 'light' : 'dark';

      const reduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // `startViewTransition` is the only way to animate between two states of
      // the whole document. Where it is missing — Firefox, Safari before 18 —
      // the theme still changes, just without the reveal. A polyfill that
      // screenshots the page would cost more than the gesture is worth.
      const startViewTransition = (
        document as Document & {
          startViewTransition?: (cb: () => void) => { ready: Promise<void> };
        }
      ).startViewTransition?.bind(document);

      if (!startViewTransition || reduced) {
        apply(next);
        return;
      }

      const from = origin ?? { x: window.innerWidth - 48, y: 48 };
      const radius = radiusToCorner(from, window.innerWidth, window.innerHeight);

      const transition = startViewTransition(() => apply(next));

      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${from.x}px ${from.y}px)`,
                `circle(${radius}px at ${from.x}px ${from.y}px)`,
              ],
            },
            {
              duration: 620,
              easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
              // Only the incoming snapshot is clipped. Animating the outgoing
              // one as well would shrink the old page out from under the
              // circle and show the ground through the gap.
              pseudoElement: '::view-transition-new(root)',
            },
          );
        })
        .catch(() => {
          /* the transition was superseded by a faster second click */
        });
    },
    [theme, apply],
  );

  const value = useMemo<ThemeContextValue>(() => ({ theme, toggle }), [theme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
