import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * The one Supabase browser client.
 *
 * This module is the sole owner of authentication storage. No component reads
 * or writes `sessionStorage` for auth — if a second place ever did, the two
 * would disagree about who is signed in, and the symptom would be one account's
 * data appearing under another's.
 *
 * Storage is `sessionStorage`, not `localStorage` and not cookies. That is a
 * deliberate architectural choice, not a security measure:
 *
 *   - the frontend and the API are deployed separately and authenticate with
 *     `Authorization: Bearer`, so there is no cookie to share and no CSRF
 *     surface to defend;
 *   - `sessionStorage` is per-tab, so signing in as a startup in one tab and a
 *     government officer in another does not clobber either session — which is
 *     exactly what testing this product requires;
 *   - it ends with the tab, so a shared machine does not keep a session alive
 *     after the window closes.
 *
 * None of that is a trust boundary. Anything in the browser is caller-supplied.
 * Authorisation happens in the backend against the verified token, every time.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

/** Prefix for everything this client stores, so logout can clear exactly it. */
export const AUTH_STORAGE_PREFIX = 'sarthi.auth';

/**
 * A `Storage` shim over `sessionStorage`.
 *
 * Every access is guarded. `sessionStorage` throws rather than returning null
 * in a handful of real cases — Safari private mode, browsers set to block site
 * data, and server-side rendering where `window` does not exist at all. A throw
 * here would take down the whole auth provider, so each operation fails soft
 * and the user is simply treated as signed out.
 */
const sessionStorageAdapter = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      /* storage unavailable — the session simply will not survive a reload */
    }
  },
  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      /* nothing to do */
    }
  },
};

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: sessionStorageAdapter,
        storageKey: AUTH_STORAGE_PREFIX,
        persistSession: true,
        autoRefreshToken: true,
        // The invitation and recovery links land with tokens in the URL hash;
        // the client needs to consume them to establish the session.
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  }
  return client;
}

/**
 * Remove every auth key this client owns.
 *
 * `signOut()` normally does this itself. This runs afterwards as a belt-and-
 * braces step for the case that matters most here: switching accounts in one
 * browser while testing. A stale key surviving a sign-out is how the next user
 * inherits the previous one's identity.
 */
export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const doomed: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith(AUTH_STORAGE_PREFIX)) doomed.push(key);
    }
    doomed.forEach((k) => window.sessionStorage.removeItem(k));
  } catch {
    /* storage unavailable — nothing was stored either */
  }
}

/** True when the client has been configured. Used to render a clear error. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
