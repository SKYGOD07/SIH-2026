import { getSupabaseClient } from '@/lib/supabase/client';

/**
 * The API client.
 *
 * Two things happen centrally here so no call site has to remember them: the
 * access token is attached as a bearer, and a 401 is surfaced as a typed error
 * the auth layer can react to rather than as a generic failure.
 *
 * Authentication travels in the `Authorization` header, never in a cookie. The
 * request is deliberately not credentialed — the backend's CORS policy has
 * `credentials: false` to match, which keeps the wildcard-origin-with-cookies
 * mistake structurally impossible.
 */

const rawBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_BASE_URL = rawBaseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthenticated(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }
}

/**
 * The current access token, or null.
 *
 * Read from the Supabase client rather than from storage directly, so token
 * refresh is handled for us — `getSession` returns a refreshed token when the
 * old one has expired.
 */
async function currentAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const { data } = await getSupabaseClient().auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export interface FetchOptions extends RequestInit {
  /** Skip the bearer token. For endpoints that are genuinely public. */
  anonymous?: boolean;
}

export async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { anonymous, headers, ...rest } = options;
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((headers as Record<string, string>) ?? {}),
  };

  if (!anonymous) {
    const token = await currentAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...rest, headers: finalHeaders });

  let json: { success?: boolean; data?: T; error?: string; details?: unknown } = {};
  try {
    json = await response.json();
  } catch {
    // A non-JSON body (a proxy error page, a truncated response) must not
    // surface as "undefined is not an object".
    if (!response.ok) throw new ApiError(`Request failed (${response.status})`, response.status);
  }

  if (!response.ok) {
    throw new ApiError(json.error || `Request failed (${response.status})`, response.status, json.details);
  }

  return json.data as T;
}
