'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { Icon } from '@/components/console/Icon';
import { fetchApi, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthProvider';
import { cn } from '@/lib/utils';

/**
 * AI assistance, as a government officer needs to see it.
 *
 * The panel this replaces showed a base URL, an environment variable name and a
 * pair of shell snippets. All of that is true and none of it is an officer's
 * concern — they need to know whether the assistant is working, what it is
 * allowed to do, and when it was last used. The implementation detail is still
 * available, but only to an administrator, and only behind a disclosure.
 *
 * The API key is not here in either case. It is not in the response the backend
 * sends, so there is nothing to accidentally render.
 */

interface AIStatus {
  enabled: boolean;
  ready: boolean;
  reason: string | null;
  provider: string;
  mode: 'local' | 'cloud';
  model: string | null;
  embedModel: string | null;
  lastRequestAt: string | null;
  disclosure: string;
  tasks: { task: string; label: string }[];
  configuration?: {
    baseUrl: string;
    hosted: boolean;
    apiKeyConfigured: boolean;
    timeoutMs: number;
    perUserCredentialStorage: { ready: boolean; reason?: string };
    environment: string;
  };
}

interface AIPolicy {
  disclosure: string;
  deterministic: string[];
  assisted: string[];
  guarantees: string[];
}

interface TestResult {
  connected: boolean;
  mode: string;
  models: string[];
  configuredModelPresent: boolean;
  configuredEmbedModelPresent: boolean;
}

/* -------------------------------------------------------------- fragments */

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-chalk/[0.06] py-2.5 last:border-b-0">
      <span className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-chalk/40">{label}</span>
      <span className="text-right text-[0.8125rem] text-chalk/80">{value}</span>
    </div>
  );
}

const NotSet = () => <span className="italic text-chalk/30">not set</span>;

/** A timestamp a person can read, without pulling in a date library. */
function when(iso: string | null): string {
  if (!iso) return 'Never';
  const then = new Date(iso).getTime();
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ------------------------------------------------------------------- main */

export function AIAssistancePanel() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'ADMIN';
  const canTest = profile?.role === 'GOVERNMENT_OFFICER' || profile?.role === 'EVALUATOR' || isAdmin;

  const [status, setStatus] = useState<AIStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [policy, setPolicy] = useState<AIPolicy | null>(null);
  const [showPolicy, setShowPolicy] = useState(false);

  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    setTestResult(null);
    setTestError(null);
    try {
      setStatus(await fetchApi<AIStatus>('/api/ai/status'));
      setLoadError(null);
    } catch (e) {
      setStatus(null);
      setLoadError(
        e instanceof ApiError && e.isUnauthenticated
          ? 'Sign in to see AI status.'
          : 'Backend unreachable — AI status cannot be read.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function handleTest() {
    setTestResult(null);
    setTestError(null);
    startTransition(async () => {
      try {
        setTestResult(await fetchApi<TestResult>('/api/ai/test', { method: 'POST' }));
      } catch (e) {
        setTestError(e instanceof Error ? e.message : 'Connection failed');
      }
    });
  }

  async function handlePolicy() {
    setShowPolicy((v) => !v);
    if (!policy) {
      try {
        setPolicy(await fetchApi<AIPolicy>('/api/ai/policy'));
      } catch {
        /* The panel is still useful without it. */
      }
    }
  }

  /* ---------- loading */
  if (loading) {
    return (
      <div className="card animate-pulse p-[1.125rem]">
        <div className="mb-3 flex items-center gap-3">
          <span className="grid h-[2.375rem] w-[2.375rem] shrink-0 place-items-center rounded-[10px] tint-signal" />
          <div className="h-4 w-40 rounded bg-chalk/10" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-chalk/[0.06]" />
          <div className="h-3 w-3/5 rounded bg-chalk/[0.06]" />
        </div>
      </div>
    );
  }

  /* ---------- unreachable */
  if (!status) {
    return (
      <div className="card p-[1.125rem]">
        <div className="flex items-start gap-3.5">
          <span className="grid h-[2.375rem] w-[2.375rem] shrink-0 place-items-center rounded-[10px] tint-risk">
            <Icon name="alert" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.8125rem] font-semibold text-chalk">AI assistance</p>
            <p className="mt-1.5 text-[0.78125rem] leading-relaxed text-chalk/50">{loadError}</p>
            <p className="mt-1.5 text-[0.75rem] leading-relaxed text-chalk/35">
              Every analysis surface continues to work without it, composed directly from stored records.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const state = !status.enabled ? 'off' : status.ready ? 'ready' : 'unavailable';

  return (
    <div className="card p-[1.125rem]">
      {/* header */}
      <div className="mb-4 flex items-start gap-3.5">
        <span
          className={cn(
            'grid h-[2.375rem] w-[2.375rem] shrink-0 place-items-center rounded-[10px]',
            state === 'ready' ? 'tint-signal' : 'tint-chalk',
          )}
        >
          <Icon name="intelligence" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.8125rem] font-semibold text-chalk">AI assistance</span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
                'font-mono text-[0.625rem] font-bold uppercase tracking-[0.08em]',
                state === 'ready' ? 'tint-validated' : 'tint-chalk',
              )}
            >
              <span
                className={cn(
                  'inline-block h-1.5 w-1.5 rounded-full',
                  state === 'ready' ? 'bg-validated' : 'bg-risk',
                )}
                aria-hidden
              />
              {state === 'ready' ? 'Ready' : state === 'off' ? 'Switched off' : 'Not configured'}
            </span>
          </div>
          <p className="mt-1 text-[0.75rem] leading-relaxed text-chalk/50">
            Explains and summarises. It does not decide.
          </p>
        </div>

        <button
          onClick={() => void load()}
          aria-label="Refresh AI status"
          className="ml-auto shrink-0 rounded-[8px] p-1.5 text-chalk/40 transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
        >
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
            strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"
          >
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" />
          </svg>
        </button>
      </div>

      {/* what an officer needs */}
      <div className="rounded-[10px] border border-chalk/[0.06] bg-void/40 px-3">
        <Row label="Provider" value={status.provider} />
        <Row
          label="Status"
          value={
            state === 'ready' ? (
              <span className="text-validated">Ready</span>
            ) : (
              <span className="text-risk">{status.reason ?? 'Not available'}</span>
            )
          }
        />
        <Row label="Model" value={status.model ?? <NotSet />} />
        <Row label="Embedding" value={status.embedModel ?? <NotSet />} />
        <Row label="Last AI request" value={when(status.lastRequestAt)} />
      </div>

      {/*
       * When it is not ready, say what that costs — which is prose, not
       * function. An officer reading "Not configured" should not conclude the
       * workflow is broken, because it is not.
       */}
      {state !== 'ready' && (
        <p className="mt-3 max-w-[68ch] text-[0.78125rem] leading-relaxed text-chalk/50">
          Analysis surfaces continue to work. Each one falls back to a summary composed directly from
          stored records — the same facts, without the narrative.
        </p>
      )}

      {/* actions */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {canTest && (
          <button
            onClick={handleTest}
            disabled={isPending || state !== 'ready'}
            className={cn(
              'inline-flex items-center gap-2 rounded-[10px] px-3.5 py-2',
              'font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] transition-all duration-150',
              state === 'ready'
                ? 'bg-signal text-void hover:bg-signal/90 active:scale-[0.98]'
                : 'cursor-not-allowed bg-chalk/[0.06] text-chalk/30',
              isPending && 'opacity-60',
            )}
          >
            <Icon name="intelligence" className="h-3.5 w-3.5" />
            {isPending ? 'Testing…' : 'Test AI'}
          </button>
        )}

        <button
          onClick={() => void handlePolicy()}
          className="inline-flex items-center gap-2 rounded-[10px] border border-chalk/[0.12] px-3.5 py-2 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-chalk/70 transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
        >
          <Icon name="shield" className="h-3.5 w-3.5" />
          {showPolicy ? 'Hide AI policy' : 'View AI policy'}
        </button>
      </div>

      {/* test outcome */}
      {testResult && (
        <div className="mt-3 rounded-[10px] border border-validated/20 bg-validated/[0.06] px-3.5 py-3">
          <div className="flex items-center gap-2">
            <Icon name="check" className="h-3.5 w-3.5 text-validated" />
            <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-validated">
              Connected
            </span>
          </div>
          <ul className="mt-2 space-y-1 text-[0.78125rem] text-chalk/60">
            <li>{testResult.configuredModelPresent ? '✓' : '✗'} Configured chat model is installed</li>
            <li>{testResult.configuredEmbedModelPresent ? '✓' : '✗'} Configured embedding model is installed</li>
            <li>{testResult.models.length} model(s) available on the host</li>
          </ul>
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

      {/* policy */}
      {showPolicy && policy && (
        <div className="mt-4 space-y-3.5 rounded-[10px] border border-chalk/[0.08] bg-void/40 p-3.5">
          <p className="text-[0.78125rem] leading-relaxed text-chalk/70">{policy.disclosure}</p>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <p className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-chalk/40">
                Decided by the platform
              </p>
              <ul className="mt-1.5 space-y-1">
                {policy.deterministic.map((d) => (
                  <li key={d} className="text-[0.75rem] leading-relaxed text-chalk/60">
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-chalk/40">
                Assisted by the model
              </p>
              <ul className="mt-1.5 space-y-1">
                {policy.assisted.map((d) => (
                  <li key={d} className="text-[0.75rem] leading-relaxed text-chalk/60">
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <p className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-chalk/40">Guarantees</p>
            <ul className="mt-1.5 space-y-1.5">
              {policy.guarantees.map((g) => (
                <li key={g} className="flex gap-2 text-[0.75rem] leading-relaxed text-chalk/60">
                  <Icon name="lock" className="mt-[0.15rem] h-3 w-3 shrink-0 text-chalk/30" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/*
       * Configuration, for administrators only. The backend omits this block
       * entirely for everyone else, so this is not a UI-level hide.
       */}
      {isAdmin && status.configuration && (
        <details className="group mt-4">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-chalk/40 transition-colors hover:text-chalk/70">
            <Icon name="chevronRight" className="h-3 w-3 transition-transform group-open:rotate-90" />
            Configuration · administrator
          </summary>

          <div className="mt-3 rounded-[10px] border border-chalk/[0.06] bg-void/40 px-3">
            <Row
              label="Host"
              value={<code className="font-mono text-[0.75rem]">{status.configuration.baseUrl}</code>}
            />
            <Row label="Deployment" value={status.configuration.hosted ? 'Hosted' : 'Local'} />
            <Row
              label="Credential"
              value={
                status.configuration.hosted ? (
                  status.configuration.apiKeyConfigured ? (
                    <span className="text-validated">Configured</span>
                  ) : (
                    <span className="text-risk">Not set</span>
                  )
                ) : (
                  <span className="italic text-chalk/40">not required</span>
                )
              }
            />
            <Row label="Timeout" value={`${status.configuration.timeoutMs} ms`} />
            <Row label="Environment" value={status.configuration.environment} />
            <Row
              label="Per-user credentials"
              value={
                status.configuration.perUserCredentialStorage.ready ? (
                  <span className="text-validated">Key present</span>
                ) : (
                  <span className="text-chalk/40">{status.configuration.perUserCredentialStorage.reason}</span>
                )
              }
            />
          </div>

          <p className="mt-2.5 max-w-[68ch] text-[0.75rem] leading-relaxed text-chalk/40">
            Set in the backend environment and read only by the backend process. The credential is never
            returned by an API response and must never carry a{' '}
            <code className="font-mono text-[0.6875rem] text-chalk/60">NEXT_PUBLIC_</code> prefix — the
            browser calls this API, and this API calls the model.
          </p>
        </details>
      )}
    </div>
  );
}
