import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Origins permitted to call this API.
 *
 * An explicit allowlist rather than a wildcard. The frontend is deployed
 * separately (Vercel) from this service, so the production origin has to be
 * named — `CLIENT_URLS` takes a comma-separated list so preview deployments can
 * be added without a code change.
 */
const clientUrls = (process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',

  CLIENT_URLS: clientUrls,

  /** e.g. https://<project-ref>.supabase.co */
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  /** Publishable key. Safe to expose; kept here only for completeness. */
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY || '',
  /**
   * Elevated key. Bypasses RLS and can create users, so it exists only in this
   * process and is required solely for admin invitations. Never sent to a
   * client, never logged, never prefixed NEXT_PUBLIC_.
   */
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || '',
};

/**
 * Fail loudly at boot rather than at the first request.
 *
 * A missing Supabase URL means no token can be verified, which would otherwise
 * surface as every authenticated request returning 401 for a reason the logs do
 * not explain.
 */
export function assertAuthConfig(): void {
  if (!env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL is not set — token verification cannot work without it');
  }
}

/** Admin invitations are optional; the rest of the API works without them. */
export const canInviteUsers = (): boolean => Boolean(env.SUPABASE_URL && env.SUPABASE_SECRET_KEY);
