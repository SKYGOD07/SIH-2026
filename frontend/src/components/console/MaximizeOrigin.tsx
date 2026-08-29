'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isConsoleHref, rememberOrigin } from '@/lib/console/maximize';

/**
 * Records where a console-bound click happened.
 *
 * One capture-phase listener on the document rather than a handler on each link.
 * There are console links in the navigation capsule, in the full-screen menu, on
 * the last slide of the deck, in the footer, in the sidebar and inside page
 * copy — wiring each one individually would mean the animation silently stops
 * working the next time somebody adds a link, which is the sort of bug nobody
 * files.
 *
 * Capture phase matters: Next's router intercepts anchor clicks during bubbling,
 * so a bubbling listener races the navigation. Capture runs first, always.
 *
 * Clicks that originate inside the console are ignored. The console shell does
 * not remount when moving between its own routes, so there is nothing to animate
 * — and a maximise on every sidebar click would be unbearable by the third one.
 */
export function MaximizeOrigin() {
  const pathname = usePathname();

  useEffect(() => {
    // Already inside the console: every link from here is a within-shell move.
    if (isConsoleHref(pathname)) return;

    const onClick = (event: MouseEvent) => {
      // Modified clicks open a new tab; nothing maximises in this one.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.button !== 0) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (!isConsoleHref(anchor.getAttribute('href') ?? '')) return;

      /*
       * Keyboard activation reports a pointer at (0, 0), which would open the
       * console from the very corner of the screen for no reason. The link's own
       * centre is the honest origin in that case — it is where the reader's
       * attention actually was.
       */
      const keyboard = event.clientX === 0 && event.clientY === 0;
      if (keyboard) {
        const rect = anchor.getBoundingClientRect();
        rememberOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        return;
      }

      rememberOrigin({ x: event.clientX, y: event.clientY });
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [pathname]);

  return null;
}
