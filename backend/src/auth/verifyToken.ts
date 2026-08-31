import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { env } from '../config/env';

/**
 * Supabase access-token verification.
 *
 * This project signs access tokens with an asymmetric ES256 key and publishes
 * the public half at the JWKS endpoint, so verification happens locally against
 * a cached key set: no shared secret to leak, and no network round trip per
 * request once the key set is fetched. `createRemoteJWKSet` handles the caching
 * and the re-fetch on key rotation.
 *
 * The alternative — calling `supabase.auth.getUser(token)` on every request —
 * would add a network hop to every authenticated call. It is worth reaching for
 * only if immediate revocation ever matters more than latency; a cached JWKS
 * verification keeps honouring a token until it expires.
 */
const jwks = createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`));

/** The subset of the token we act on. Nothing here is taken from the client. */
export interface AuthenticatedIdentity {
  /** Supabase Auth user UUID. The identity source of truth. */
  userId: string;
  email: string | null;
  /**
   * Whether Supabase considers the address confirmed. Read from the verified
   * token, never from a request body.
   */
  emailVerified: boolean;
}

export class TokenError extends Error {}

/**
 * Verify a raw bearer token and reduce it to an identity.
 *
 * Throws `TokenError` for anything that fails — expired, wrong issuer, bad
 * signature, missing subject. The message is deliberately generic at the call
 * site: telling a caller *why* their token failed helps an attacker more than
 * it helps a user.
 */
export async function verifyAccessToken(token: string): Promise<AuthenticatedIdentity> {
  let payload: JWTPayload;

  try {
    ({ payload } = await jwtVerify(token, jwks, {
      issuer: `${env.SUPABASE_URL}/auth/v1`,
    }));
  } catch {
    throw new TokenError('Invalid or expired access token');
  }

  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new TokenError('Token carries no subject');
  }

  // GoTrue puts the confirmation flag in user_metadata. Treated as false unless
  // explicitly true, so a token shape we do not recognise fails closed.
  const meta = (payload.user_metadata ?? {}) as Record<string, unknown>;
  const emailVerified =
    meta.email_verified === true || typeof (payload as { email_confirmed_at?: unknown }).email_confirmed_at === 'string';

  return {
    userId: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : null,
    emailVerified,
  };
}
