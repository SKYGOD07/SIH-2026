'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { clearAuthStorage, getSupabaseClient } from '@/lib/supabase/client';
import { ApiError, fetchApi } from '@/lib/api';

/**
 * The single source of authentication state.
 *
 * Everything the application knows about "who is signed in" comes from here.
 * The rule that shapes the whole file: **state is replaced, never merged.**
 *
 * The failure this guards against is specific and easy to hit while testing —
 * sign in as Startup A, sign out, sign in as Startup B, and see A's name or
 * department still on screen because a stale value was left in place while the
 * new profile loaded. Every transition therefore clears first and fills second,
 * and each load is tagged so a slow response for a previous user cannot land
 * after a faster one for the current user.
 */

export type UserRole = 'STARTUP' | 'GOVERNMENT_OFFICER' | 'EVALUATOR' | 'ADMIN';

export interface SarthiProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  departmentName: string | null;
  designation: string | null;
  startupId: string | null;
}

export interface SessionPayload {
  user: { id: string; email: string | null; emailVerified: boolean };
  profile: SarthiProfile;
  onboarding: { emailVerified: boolean; profileComplete: boolean };
}

interface AuthState {
  /** True until the first resolution of the stored session. */
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: SarthiProfile | null;
  onboarding: SessionPayload['onboarding'] | null;
  /** Set when the backend could not be reached or refused the token. */
  error: string | null;
}

const EMPTY: AuthState = {
  loading: true,
  session: null,
  user: null,
  profile: null,
  onboarding: null,
  error: null,
};

interface AuthContextValue extends AuthState {
  /** Re-read the profile from the backend, e.g. after onboarding. */
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(EMPTY);

  /**
   * Identifies the load currently in flight.
   *
   * Incremented on every auth transition. A response whose tag no longer
   * matches belongs to a previous user and is discarded — without this, a slow
   * profile fetch for the signed-out user can overwrite the signed-in one.
   */
  const loadTag = useRef(0);

  const loadProfile = useCallback(async (session: Session | null) => {
    const tag = (loadTag.current += 1);

    if (!session) {
      setState({ ...EMPTY, loading: false });
      return;
    }

    // Clear the previous user's identity *before* awaiting, so no interval
    // exists where a new session is paired with an old profile.
    setState({
      loading: true,
      session,
      user: session.user,
      profile: null,
      onboarding: null,
      error: null,
    });

    try {
      const payload = await fetchApi<SessionPayload>('/api/auth/session');
      if (tag !== loadTag.current) return;
      setState({
        loading: false,
        session,
        user: session.user,
        profile: payload.profile,
        onboarding: payload.onboarding,
        error: null,
      });
    } catch (err) {
      if (tag !== loadTag.current) return;
      const message =
        err instanceof ApiError
          ? err.isUnauthenticated
            ? 'Session is no longer valid. Please sign in again.'
            : err.message
          : 'Could not reach the Sarthi API.';
      setState({
        loading: false,
        session,
        user: session.user,
        profile: null,
        onboarding: null,
        error: message,
      });
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) void loadProfile(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === 'SIGNED_OUT') {
        loadTag.current += 1; // invalidate anything in flight
        setState({ ...EMPTY, loading: false });
        return;
      }

      // TOKEN_REFRESHED carries the same user; re-fetching the profile on every
      // refresh would put a network call on a timer for no new information.
      if (event === 'TOKEN_REFRESHED') {
        setState((s) => (s.user ? { ...s, session } : s));
        return;
      }

      void loadProfile(session);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refresh = useCallback(async () => {
    const { data } = await getSupabaseClient().auth.getSession();
    await loadProfile(data.session);
  }, [loadProfile]);

  /**
   * Sign out, and leave nothing behind.
   *
   * The order matters: invalidate in-flight loads, tell Supabase, clear the
   * storage keys it owns, then blank the state. Doing the state reset last
   * means no render can observe a signed-out session paired with a live
   * profile.
   */
  const signOut = useCallback(async () => {
    loadTag.current += 1;
    try {
      await getSupabaseClient().auth.signOut();
    } finally {
      clearAuthStorage();
      setState({ ...EMPTY, loading: false });
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, refresh, signOut }),
    [state, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
