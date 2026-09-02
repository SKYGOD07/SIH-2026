import { z } from 'zod';
import { env, isOllamaCloud, ollamaReadiness } from '../../config/env';

/**
 * AI Provider Interface.
 *
 * Abstract contract so the application code does not care whether it is
 * talking to a local Ollama instance (dev machine) or Ollama Cloud (deployed).
 */
export interface AIProvider {
  /** Generate raw text from prompt */
  generate(prompt: string, systemPrompt?: string): Promise<string>;
  
  /** Generate structured JSON response validated with a Zod schema */
  generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>,
    systemPrompt?: string,
  ): Promise<T | null>;

  /** Generate 768-dim embeddings matching vector(768) */
  embed(text: string): Promise<number[]>;

  /** Check readiness & connectivity */
  healthCheck(): Promise<{ ready: boolean; mode: 'local' | 'cloud'; reason?: string }>;

  /** List available models */
  listModels(): Promise<string[]>;
}

/**
 * Ollama Provider Implementation.
 *
 * Supports BOTH Local (http://localhost:11434) and Cloud (https://ollama.com)
 * modes seamlessly based on environment configuration.
 *
 * The API key lives ONLY in the backend process environment and is attached as a
 * Bearer token when in Cloud mode.
 */
export class OllamaProvider implements AIProvider {
  private get baseUrl(): string {
    return env.OLLAMA_BASE_URL.replace(/\/$/, '');
  }

  private get model(): string {
    return env.OLLAMA_MODEL || 'llama3.1';
  }

  private get embedModel(): string {
    return env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
  }

  private get headers(): Record<string, string> {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (isOllamaCloud() && env.OLLAMA_API_KEY) {
      h['Authorization'] = `Bearer ${env.OLLAMA_API_KEY}`;
    }

    return h;
  }

  async healthCheck(): Promise<{ ready: boolean; mode: 'local' | 'cloud'; reason?: string }> {
    return ollamaReadiness();
  }

  async listModels(): Promise<string[]> {
    const readiness = await this.healthCheck();
    if (!readiness.ready) return [];

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: this.headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) return [];

      const data = (await res.json().catch(() => ({ models: [] }))) as {
        models?: Array<{ name?: string }>;
      };
      return (data.models ?? []).map((m) => m.name ?? '').filter(Boolean);
    } catch {
      return [];
    }
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    const readiness = await this.healthCheck();
    if (!readiness.ready) {
      throw new Error(`AI provider not ready: ${readiness.reason}`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.OLLAMA_TIMEOUT_MS);

    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          model: this.model,
          prompt,
          system: systemPrompt,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Ollama API error ${res.status}: ${body.slice(0, 200)}`);
      }

      const data = (await res.json()) as { response?: string };
      return data.response ?? '';
    } catch (err: unknown) {
      clearTimeout(timeout);
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Ollama generation failed: ${msg}`);
    }
  }

  async generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>,
    systemPrompt?: string,
  ): Promise<T | null> {
    const readiness = await this.healthCheck();
    if (!readiness.ready) return null;

    const fullPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with a valid JSON object matching the required schema. Do not include markdown codeblocks or conversational text.`;

    try {
      const rawText = await this.generate(fullPrompt, systemPrompt);
      if (!rawText) return null;

      // Extract JSON if wrapped in markdown block
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : rawText;

      const parsed = JSON.parse(cleanJson);
      const validated = schema.safeParse(parsed);

      if (!validated.success) {
        console.warn('Ollama response failed Zod schema validation:', validated.error.format());
        return null;
      }

      return validated.data;
    } catch (err) {
      // One line, not a stack. Falling back is an expected path — the caller
      // has a deterministic answer ready — and a stack trace for a routine
      // condition is how people learn to stop reading the logs.
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[ai] falling back to deterministic output: ${msg}`);
      return null;
    }
  }

  async embed(text: string): Promise<number[]> {
    const readiness = await this.healthCheck();
    if (!readiness.ready) return [];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.OLLAMA_TIMEOUT_MS);

    try {
      const res = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          model: this.embedModel,
          prompt: text,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) return [];

      const data = (await res.json()) as { embedding?: number[] };
      return data.embedding ?? [];
    } catch {
      clearTimeout(timeout);
      return [];
    }
  }
}

/** Singleton instance exported for application use */
export const defaultAIProvider = new OllamaProvider();
