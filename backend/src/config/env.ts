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

  /**
   * Ollama.
   *
   * Two deployments of the same API. Local (`http://localhost:11434`) needs no
   * credential; cloud (`https://ollama.com`) authenticates with a bearer token.
   * The distinction is derived from the URL rather than configured separately,
   * because two settings that must agree are two settings that will disagree.
   *
   * The key lives only in this process. It is never returned by an endpoint,
   * never logged, and must never be given a NEXT_PUBLIC_ prefix — the browser
   * calls this API, and this API calls Ollama.
   */
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3.1',
  /** Must match the vector(768) column; changing it means re-embedding. */
  OLLAMA_EMBED_MODEL: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
  OLLAMA_API_KEY: process.env.OLLAMA_API_KEY || '',

  /** 32 bytes, base64. Absent means per-user credentials cannot be stored. */
  AI_CREDENTIAL_ENCRYPTION_KEY: process.env.AI_CREDENTIAL_ENCRYPTION_KEY || '',
};

/** True when Ollama is pointed at anything other than a loopback address. */
export const isOllamaCloud = (): boolean =>
  !/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(env.OLLAMA_BASE_URL);

/**
 * Whether an AI call can be attempted at all.
 *
 * Cloud without a key is misconfiguration, not a runtime failure to discover on
 * the first request — a caller gets a clear reason instead of a 401 from a
 * third party. Nothing here reads the key's value.
 */
export function ollamaReadiness(): { ready: boolean; mode: 'local' | 'cloud'; reason?: string } {
  const mode = isOllamaCloud() ? 'cloud' : 'local';
  if (mode === 'cloud' && !env.OLLAMA_API_KEY) {
    return { ready: false, mode, reason: 'OLLAMA_BASE_URL is a cloud host but OLLAMA_API_KEY is not set' };
  }
  return { ready: true, mode };
}

/** Per-user credential storage needs a key of exactly 32 bytes. */
export function aiEncryptionReadiness(): { ready: boolean; reason?: string } {
  if (!env.AI_CREDENTIAL_ENCRYPTION_KEY) {
    return { ready: false, reason: 'AI_CREDENTIAL_ENCRYPTION_KEY is not set' };
  }
  try {
    const bytes = Buffer.from(env.AI_CREDENTIAL_ENCRYPTION_KEY, 'base64');
    if (bytes.length !== 32) {
      return { ready: false, reason: `AI_CREDENTIAL_ENCRYPTION_KEY must decode to 32 bytes, got ${bytes.length}` };
    }
  } catch {
    return { ready: false, reason: 'AI_CREDENTIAL_ENCRYPTION_KEY is not valid base64' };
  }
  return { ready: true };
}

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
