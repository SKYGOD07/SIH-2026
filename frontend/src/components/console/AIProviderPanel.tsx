'use client';

import { useState, useEffect, useTransition } from 'react';
import { Icon } from '@/components/console/Icon';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ types */

interface AIStatus {
  mode: 'local' | 'cloud';
  ready: boolean;
  reason: string | null;
  baseUrl: string;
  model: string | null;
  embedModel: string | null;
  apiKeyConfigured: boolean;
}

interface TestResult {
  connected: boolean;
  mode: 'local' | 'cloud';
  baseUrl: string;
  models: string[];
}

/* ------------------------------------------------------------------ helpers */

let API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000').replace(/\/$/, '');
if (!API_BASE.endsWith('/api')) API_BASE = `${API_BASE}/api`;

async function fetchStatus(): Promise<AIStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/ai/status`, { cache: 'no-store' });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data ?? null;
  } catch {
    return null;
  }
}

async function postTest(): Promise<{ success: boolean; data?: TestResult; error?: string }> {
  const res = await fetch(`${API_BASE}/ai/test`, { method: 'POST' });
  const body = await res.json().catch(() => ({}));
  return body;
}

/* ------------------------------------------------------------------ sub-components */

function Badge({ mode }: { mode: 'local' | 'cloud' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
        'font-mono text-[0.625rem] font-bold uppercase tracking-[0.08em]',
        mode === 'local' ? 'tint-chalk' : 'tint-signal',
      )}
    >
      {mode === 'local' ? 'Local' : 'Cloud'}
    </span>
  );
}

function ReadinessDot({ ready }: { ready: boolean }) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        ready ? 'bg-validated' : 'bg-risk',
      )}
      aria-hidden
    />
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-chalk/[0.06] py-2.5 last:border-b-0">
      <span className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-chalk/40">
        {label}
      </span>
      <span className="text-right text-[0.8125rem] text-chalk/80">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ main component */

/**
 * AI Provider card for the Settings page.
 *
 * Shows the current Ollama configuration (mode, base URL, models) that the
 * backend loaded from its environment. Lets the user trigger a live
 * test-connection call without ever touching the API key — the key lives only
 * in the backend .env and is never sent to or from the browser.
 *
 * The "how to set the key" copy is intentionally actionable: it tells the
 * developer exactly which file, which variable name, and which format.
 */
export function AIProviderPanel() {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchStatus().then((s) => {
      setStatus(s);
      setLoading(false);
    });
  }, []);

  function handleTest() {
    setTestResult(null);
    setTestError(null);
    startTransition(async () => {
      const result = await postTest();
      if (result.success && result.data) {
        setTestResult(result.data);
      } else {
        setTestError(result.error ?? 'Unknown error');
      }
    });
  }

  function handleRefresh() {
    setLoading(true);
    setTestResult(null);
    setTestError(null);
    fetchStatus().then((s) => {
      setStatus(s);
      setLoading(false);
    });
  }

  /* ---------- loading skeleton */
  if (loading) {
    return (
      <div className="card p-[1.125rem] animate-pulse">
        <div className="mb-3 flex items-center gap-3">
          <span className="grid h-[2.375rem] w-[2.375rem] shrink-0 place-items-center rounded-[10px] tint-signal" />
          <div className="h-4 w-32 rounded bg-chalk/10" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-chalk/[0.06]" />
          <div className="h-3 w-4/5 rounded bg-chalk/[0.06]" />
          <div className="h-3 w-3/5 rounded bg-chalk/[0.06]" />
        </div>
      </div>
    );
  }

  /* ---------- backend unreachable */
  if (!status) {
    return (
      <div className="card p-[1.125rem]">
        <div className="flex items-start gap-3.5">
          <span className="grid h-[2.375rem] w-[2.375rem] shrink-0 place-items-center rounded-[10px] tint-risk">
            <Icon name="alert" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.8125rem] font-semibold text-chalk">AI Provider</p>
            <p className="mt-1.5 text-[0.78125rem] leading-relaxed text-chalk/50">
              Backend is unreachable — start the backend and reload to see Ollama status.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- main card */
  return (
    <div className="card p-[1.125rem]">
      {/* header */}
      <div className="mb-4 flex items-start gap-3.5">
        <span className="grid h-[2.375rem] w-[2.375rem] shrink-0 place-items-center rounded-[10px] tint-signal">
          <Icon name="intelligence" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.8125rem] font-semibold text-chalk">AI Provider</span>
            <Badge mode={status.mode} />
            <ReadinessDot ready={status.ready} />
          </div>
          <p className="mt-1 text-[0.75rem] leading-relaxed text-chalk/50">
            Ollama · backend-only · key never leaves the server
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          aria-label="Refresh AI status"
          className="ml-auto shrink-0 rounded-[8px] p-1.5 text-chalk/40 transition-colors hover:bg-chalk/[0.06] hover:text-chalk disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
            strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" />
          </svg>
        </button>
      </div>

      {/* config rows */}
      <div className="rounded-[10px] border border-chalk/[0.06] bg-void/40 px-3">
        <Row label="Base URL" value={<code className="font-mono text-[0.75rem]">{status.baseUrl}</code>} />
        <Row label="Mode" value={status.mode === 'local' ? 'Local (no key needed)' : 'Cloud (key required)'} />
        <Row label="Chat model" value={status.model ?? <span className="text-chalk/30 italic">not set</span>} />
        <Row label="Embed model" value={status.embedModel ?? <span className="text-chalk/30 italic">not set</span>} />
        <Row
          label="API key"
          value={
            status.mode === 'local' ? (
              <span className="text-chalk/40 italic">not required</span>
            ) : status.apiKeyConfigured ? (
              <span className="flex items-center gap-1.5 text-validated">
                <Icon name="check" className="h-3.5 w-3.5" />
                Configured
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-risk">
                <Icon name="alert" className="h-3.5 w-3.5" />
                Not set
              </span>
            )
          }
        />
        <Row
          label="Status"
          value={
            status.ready ? (
              <span className="text-validated">Ready</span>
            ) : (
              <span className="text-risk">{status.reason ?? 'Not ready'}</span>
            )
          }
        />
      </div>

      {/* readiness problem explanation */}
      {!status.ready && status.reason && (
        <p className="mt-3 text-[0.78125rem] leading-relaxed text-risk/80">{status.reason}</p>
      )}

      {/* test connection */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          id="ai-test-connection"
          onClick={handleTest}
          disabled={isPending || !status.ready}
          className={cn(
            'inline-flex items-center gap-2 rounded-[10px] px-3.5 py-2',
            'font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em]',
            'transition-all duration-150',
            status.ready
              ? 'bg-signal text-void hover:bg-signal/90 active:scale-[0.98]'
              : 'bg-chalk/[0.06] text-chalk/30 cursor-not-allowed',
            isPending && 'opacity-60',
          )}
        >
          {isPending ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
                strokeLinecap="round" strokeLinejoin="round"
                className="h-3.5 w-3.5 animate-spin">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Testing…
            </>
          ) : (
            <>
              <Icon name="intelligence" className="h-3.5 w-3.5" />
              Test connection
            </>
          )}
        </button>

        {!status.ready && (
          <span className="text-[0.75rem] text-chalk/40">
            Configure Ollama in <code className="font-mono">backend/.env</code> first
          </span>
        )}
      </div>

      {/* test result */}
      {testResult && (
        <div className="mt-3 rounded-[10px] border border-validated/20 bg-validated/[0.06] px-3.5 py-3">
          <div className="flex items-center gap-2">
            <Icon name="check" className="h-3.5 w-3.5 text-validated" />
            <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-validated">
              Connected
            </span>
          </div>
          {testResult.models.length > 0 && (
            <div className="mt-2">
              <p className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-chalk/40">
                Available models
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {testResult.models.map((m) => (
                  <li
                    key={m}
                    className="rounded-full bg-chalk/[0.06] px-2.5 py-0.5 font-mono text-[0.625rem] text-chalk/70"
                  >
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {testError && (
        <div className="mt-3 rounded-[10px] border border-risk/20 bg-risk/[0.06] px-3.5 py-3">
          <div className="flex items-center gap-2">
            <Icon name="alert" className="h-3.5 w-3.5 text-risk" />
            <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-risk">
              Connection failed
            </span>
          </div>
          <p className="mt-1.5 text-[0.78125rem] leading-relaxed text-risk/80">{testError}</p>
        </div>
      )}

      {/* setup instructions */}
      <details className="mt-4 group">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-chalk/40 hover:text-chalk/70 transition-colors">
          <Icon name="chevronRight" className="h-3 w-3 transition-transform group-open:rotate-90" />
          How to configure Ollama
        </summary>
        <div className="mt-3 space-y-2.5 text-[0.78125rem] leading-relaxed text-chalk/55">
          <p className="font-semibold text-chalk/80">For local development (no key needed):</p>
          <pre className="overflow-x-auto rounded-[8px] border border-chalk/[0.08] bg-void/60 px-3.5 py-3 font-mono text-[0.6875rem] text-chalk/70">{`# backend/.env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_API_KEY=`}</pre>

          <p className="font-semibold text-chalk/80 pt-1">For cloud / deployed backend:</p>
          <pre className="overflow-x-auto rounded-[8px] border border-chalk/[0.08] bg-void/60 px-3.5 py-3 font-mono text-[0.6875rem] text-chalk/70">{`# backend/.env
OLLAMA_BASE_URL=https://ollama.com
OLLAMA_MODEL=llama3.1
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_API_KEY=<your-ollama-cloud-key>`}</pre>

          <p className="text-chalk/40">
            The key is read only by the backend process. It is{' '}
            <span className="text-risk font-semibold">never</span> prefixed{' '}
            <code className="font-mono text-[0.75rem]">NEXT_PUBLIC_</code>, never returned
            by an API response, and never logged.
          </p>

          <p className="text-chalk/40">
            After editing <code className="font-mono text-[0.75rem]">backend/.env</code>, restart
            the backend (<code className="font-mono text-[0.75rem]">npm run dev</code> in the
            backend directory) and click{' '}
            <span className="text-chalk/70 font-semibold">Test connection</span>.
          </p>
        </div>
      </details>
    </div>
  );
}
