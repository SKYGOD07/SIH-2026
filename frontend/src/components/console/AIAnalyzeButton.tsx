'use client';

import { useState } from 'react';
import { Icon } from '@/components/console/Icon';
import { Pill } from '@/components/console/primitives';
import { cn } from '@/lib/utils';

interface AIResult {
  summary: string;
  strengths: string[];
  limitations: string[];
  evidenceUsed: string[];
  isFallback?: boolean;
  provider?: string;
  model?: string;
}

let API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000').replace(/\/$/, '');
if (!API_BASE.endsWith('/api')) API_BASE = `${API_BASE}/api`;

export function AIAnalyzeButton({
  startupId,
  challengeId,
}: {
  startupId: string;
  challengeId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/ai/analyze-startup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startupId, challengeId }),
      });

      const body = await res.json();
      if (body?.success && body?.data) {
        setAiResult(body.data);
      } else {
        setError(body?.error || 'AI analysis temporarily unavailable');
      }
    } catch {
      setError('AI analysis temporarily unavailable (Backend unreachable)');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-chalk/[0.08]">
      {!aiResult && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="intelligence" className="h-4 w-4 text-signal" />
            <span className="font-mono text-[0.71875rem] uppercase tracking-[0.1em] text-chalk/60">
              Enhance with Ollama AI
            </span>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className={cn(
              'inline-flex items-center gap-2 rounded-[8px] bg-signal px-3.5 py-1.5',
              'font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-void',
              'transition-all duration-150 hover:bg-signal/90 active:scale-[0.98]',
              loading && 'opacity-60 cursor-not-allowed',
            )}
          >
            {loading ? (
              <>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-3.5 w-3.5 animate-spin"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <Icon name="intelligence" className="h-3.5 w-3.5" />
                AI Analyze
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-[0.75rem] font-mono text-risk">{error}</p>
      )}

      {aiResult && (
        <div className="rounded-[10px] border border-signal/30 bg-void/60 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-chalk/[0.08] pb-2">
            <div className="flex items-center gap-2">
              <Pill tone="signal">AI-ASSISTED ANALYSIS</Pill>
              <span className="font-mono text-[0.625rem] text-chalk/40 uppercase tracking-wider">
                Advisory Only · Human Decides
              </span>
            </div>
            {aiResult.isFallback ? (
              <span className="font-mono text-[0.5625rem] text-risk uppercase">Fallback</span>
            ) : (
              <span className="font-mono text-[0.5625rem] text-validated uppercase font-bold">
                {aiResult.provider || 'OLLAMA'}
              </span>
            )}
          </div>

          <p className="text-[0.8125rem] leading-relaxed text-chalk/90">
            {aiResult.summary}
          </p>

          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            <div>
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-validated font-bold">
                AI Identified Strengths
              </span>
              <ul className="mt-1.5 space-y-1">
                {aiResult.strengths.map((s, i) => (
                  <li key={i} className="text-[0.75rem] text-chalk/70 flex items-start gap-1.5">
                    <Icon name="check" className="h-3 w-3 text-validated shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-risk font-bold">
                AI Identified Limitations
              </span>
              <ul className="mt-1.5 space-y-1">
                {aiResult.limitations.map((l, i) => (
                  <li key={i} className="text-[0.75rem] text-chalk/70 flex items-start gap-1.5">
                    <Icon name="alert" className="h-3 w-3 text-risk shrink-0 mt-0.5" />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {aiResult.evidenceUsed && aiResult.evidenceUsed.length > 0 && (
            <div className="pt-2 border-t border-chalk/[0.06] text-[0.6875rem] font-mono text-chalk/40">
              <span>Citing Evidence: </span>
              {aiResult.evidenceUsed.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
