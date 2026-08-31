/**
 * Where the console should appear to grow from.
 *
 * The console maximises out of the point the reader clicked, which means the
 * animation on arrival needs a coordinate recorded before the navigation that
 * caused it. The two live on opposite sides of a route change, so the origin is
 * handed over through `sessionStorage` rather than through React — there is no
 * provider that spans a Next.js route transition, and inventing one to carry two
 * numbers would be a lot of machinery for a hand-off that lasts 300ms.
 *
 * The stored origin is deliberately short-lived. A coordinate left behind by a
 * click three minutes ago is worse than no coordinate at all: the console would
 * open from a spot with no relationship to anything the reader just did. Past
 * `MAX_AGE` it is discarded and the animation falls back to the top of the
 * viewport, which is where the navigation that produced it usually lives.
 */

const KEY = 'sarthi:maximize-origin';

/** Long enough for a route change, short enough that a stale one cannot apply. */
const MAX_AGE = 2000;

export interface Origin {
  x: number;
  y: number;
}

/**
 * Every route inside the console shell.
 *
 * Used to decide whether a click is *entering* the console. Moving between two
 * console routes must not replay the animation — the shell does not remount, and
 * a maximise on every sidebar click would be intolerable by the third one.
 */
export const CONSOLE_ROUTES = [
  '/dashboard',
  '/ledger',
  '/pilots',
  '/challenges',
  '/startups',
  '/templates',
  '/corpus',
  '/intelligence',
  '/settings',
] as const;

/** The landing route, and the only thing outside the console we animate to. */
export function isLandingHref(href: string): boolean {
  if (!href.startsWith('/')) return false;
  return (href.split(/[?#]/)[0].replace(/\/+$/, '') || '/') === '/';
}

/**
 * Whether a click crosses the console boundary in either direction.
 *
 * Only crossings are animated. Moving between two console routes leaves the
 * shell mounted and has nothing to reveal, and moving around inside the landing
 * page is not a navigation at all.
 */
export function isCrossing(fromPath: string, toHref: string): boolean {
  const inConsole = isConsoleHref(fromPath);
  return inConsole ? isLandingHref(toHref) : isConsoleHref(toHref);
}

export function isConsoleHref(href: string): boolean {
  // Same-origin, path-only. An absolute URL to another host is not our route.
  if (!href.startsWith('/')) return false;
  const path = href.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return CONSOLE_ROUTES.includes(path as (typeof CONSOLE_ROUTES)[number]);
}

export function rememberOrigin(origin: Origin): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...origin, t: Date.now() }));
  } catch {
    // Private mode, or storage disabled. The reveal falls back to its default
    // origin, which is a slightly worse animation and nothing else.
  }
}

/** Reads the origin and clears it, so it can never apply to a second arrival. */
export function takeOrigin(): Origin | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Origin & { t: number };
    if (typeof parsed?.x !== 'number' || typeof parsed?.y !== 'number') return null;
    if (Date.now() - parsed.t > MAX_AGE) return null;

    return { x: parsed.x, y: parsed.y };
  } catch {
    return null;
  }
}

/**
 * The radius that reaches the furthest corner of the viewport from `origin`.
 *
 * A flat percentage only works from a corner. From an arbitrary point it either
 * overshoots by a long way — which wastes most of the duration on a circle that
 * has already covered the screen — or stops short and leaves an unfilled wedge,
 * which appears at some window shapes and not others.
 */
export function radiusToCorner(origin: Origin, width: number, height: number): number {
  return Math.ceil(
    Math.max(
      Math.hypot(origin.x, origin.y),
      Math.hypot(width - origin.x, origin.y),
      Math.hypot(origin.x, height - origin.y),
      Math.hypot(width - origin.x, height - origin.y),
    ),
  );
}
