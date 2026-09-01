'use client';

import { useTheme } from '@/lib/theme/ThemeProvider';

/**
 * The theme switch.
 *
 * Fixed in the corner rather than placed in the navigation, for two reasons:
 * the landing page pins its scroll and hides its nav during the deck, so a
 * control in the nav would disappear for most of the page; and the console has
 * its own header that already carries a great deal. A corner control is present
 * on both surfaces in the same place, which is the point of the request.
 *
 * The click coordinate is passed to the toggle so the reveal opens from the
 * button itself. A circle expanding from the thing that was pressed reads as
 * that thing causing the change; the same circle from the centre of the screen
 * reads as an unrelated transition.
 *
 * `z-[150]` sits above the console shell and the landing chrome but below the
 * preloader, which must never be crossed by anything.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const nextLabel = theme === 'dark' ? 'bright' : 'dark';

  return (
    <button
      type="button"
      onClick={(e) => {
        // The centre of the button, not the pointer: a keyboard activation
        // reports (0, 0), which would open the circle from the page corner.
        const r = e.currentTarget.getBoundingClientRect();
        toggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      aria-label={`Switch to ${nextLabel} theme`}
      title={`Switch to ${nextLabel} theme`}
      className={`fixed bottom-5 right-5 z-[150] flex h-11 w-11 items-center justify-center rounded-full border border-chalk/20 bg-void/70 text-chalk backdrop-blur-md transition-colors hover:border-signal/70 hover:text-signal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${className}`}
    >
      {/*
        Sun and moon in one SVG, swapped on the theme. The icon shows the state
        being moved *to*, not the state currently in force — a moon on a dark
        page is a statement of the obvious, where a sun is an offer.
      */}
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {theme === 'dark' ? (
          <>
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.4v2.2M12 19.4v2.2M4.2 12H2M22 12h-2.2M5.9 5.9 4.4 4.4M19.6 19.6l-1.5-1.5M18.1 5.9l1.5-1.5M4.4 19.6l1.5-1.5" />
          </>
        ) : (
          <path d="M20.5 14.3A8.6 8.6 0 1 1 9.7 3.5a6.9 6.9 0 0 0 10.8 10.8Z" />
        )}
      </svg>
    </button>
  );
}
