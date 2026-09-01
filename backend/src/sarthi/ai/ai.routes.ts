import { Router, Request, Response } from 'express';
import { env, ollamaReadiness } from '../../config/env';

/**
 * AI-provider routes.
 *
 * Two read-only endpoints that let the frontend display the current Ollama
 * configuration and test the connection. Neither endpoint returns the API key
 * or any other secret — it only returns metadata about the current state.
 *
 * POST /ai/test intentionally does not accept a key from the request body.
 * The key is never accepted from or returned to the caller; it lives solely
 * in the backend environment.
 */
const router = Router();

/* ------------------------------------------------------------------ GET /ai/status */

/**
 * Return the current AI provider configuration without any secret material.
 *
 * mode:    "local"  — talking to http://localhost:11434, no key needed
 *          "cloud"  — talking to a remote Ollama host, key required
 * ready:   true if the provider can be called (key present when required)
 * reason:  human-readable explanation when ready is false
 */
router.get('/status', (_req: Request, res: Response) => {
  const readiness = ollamaReadiness();

  res.json({
    success: true,
    data: {
      mode: readiness.mode,
      ready: readiness.ready,
      reason: readiness.reason ?? null,
      baseUrl: env.OLLAMA_BASE_URL,
      model: env.OLLAMA_MODEL || null,
      embedModel: env.OLLAMA_EMBED_MODEL || null,
      // Never return the key itself — only whether one is configured.
      apiKeyConfigured: Boolean(env.OLLAMA_API_KEY),
    },
  });
});

/* ------------------------------------------------------------------ POST /ai/test */

/**
 * Attempt a live connection to the configured Ollama endpoint.
 *
 * Uses the list-models endpoint which is cheap, requires no prompt, and
 * is the canonical way to check that the API is reachable and authenticated.
 *
 * On success, returns the list of available model names so the UI can let
 * the user confirm the right model is installed.
 *
 * The API key is NEVER accepted from the request; the backend uses only what
 * is in process.env.
 */
router.post('/test', async (_req: Request, res: Response) => {
  const readiness = ollamaReadiness();

  if (!readiness.ready) {
    return res.status(400).json({
      success: false,
      error: readiness.reason ?? 'Ollama is not configured',
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (env.OLLAMA_API_KEY) {
      headers['Authorization'] = `Bearer ${env.OLLAMA_API_KEY}`;
    }

    // Ollama local: GET /api/tags  |  Ollama Cloud: GET /api/tags
    const tagsUrl = readiness.mode === 'local'
      ? `${env.OLLAMA_BASE_URL}/api/tags`
      : `${env.OLLAMA_BASE_URL}/api/tags`;

    const response = await fetch(tagsUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return res.status(502).json({
        success: false,
        error: `Ollama returned ${response.status}${body ? `: ${body.slice(0, 200)}` : ''}`,
      });
    }

    const data = await response.json().catch(() => ({ models: [] })) as { models?: { name?: string }[] };
    const models: string[] = (data?.models ?? []).map((m) => m.name ?? '').filter(Boolean);

    return res.json({
      success: true,
      data: {
        connected: true,
        mode: readiness.mode,
        baseUrl: env.OLLAMA_BASE_URL,
        models,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = message.includes('abort') || message.includes('timeout');

    return res.status(502).json({
      success: false,
      error: isTimeout
        ? 'Connection timed out — is Ollama running?'
        : `Connection failed: ${message}`,
    });
  }
});

export default router;
