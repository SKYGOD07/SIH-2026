'use client';

import { useState } from 'react';
import { Icon } from '@/components/console/Icon';
import { AIDisclosure } from '@/components/console/AIDisclosure';
import { fetchApi, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * The analysis control on a company page.
 *
 * It renders an envelope from the assistance layer rather than a bare summary,
 * which changes one thing that matters: when the model is unavailable the
 * button still produces an answer — the platform's own reading of the same
 * records — and the disclosure says which of the two the reader is looking at.
 *
 * So there is no error state for "AI is down". There is an error state for the
 * backend being unreachable and for not being signed in, because those are
 * conditions the reader has to act on.
 */

interface AiOutput {
  summary: string;
  strengths: string[];
  limitations: string[];
  evidenceUsed: string[];
  missingEvidence: string[];
  questions: string[];
  recommendationExplanation: string;
}

interface AiEnvelope {
  taskLabel: string;
  output: AiOutput;
  assisted: boolean;
  provider: string;
  model: string | null;
  fallbackReason?: string;
  warnings: string[];
}

function List({
  title,
  tone,
  icon,
  items,
}: {
  title: string;
  tone: 'validated' | 'risk' | 'chalk';
  icon: 'check' | 'alert' | 'search';
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <span
        className={cn(
          'font-mono text-[0.625rem] font-bold uppercase tracking-[0.12em]',
          tone === 'validated' && 'text-validated',
          tone === 'risk' && 'text-risk',
          tone === 'chalk' && 'text-chalk/50',
        )}
      >
        {title}
      </span>
      <ul className="mt-1.5 space-y-1">
        {items.map((s, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[0.75rem] leading-relaxed text-chalk/70">
            <Icon
              name={icon}
              className={cn(
                'mt-0.5 h-3 w-3 shrink-0',
                tone === 'validated' && 'text-validated',
                tone === 'risk' && 'text-risk',
                tone === 'chalk' && 'text-chalk/30',
              )}
            />
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AIAnalyzeButton({ startupId, challengeId }: { startupId: string; challengeId?: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      setResult(
        await fetchApi<AiEnvelope>('/api/ai/analyze-startup', {
          method: 'POST',
          body: JSON.stringify({ startupId, challengeId }),
        }),
      );
    } catch (e) {
      setError(
        e instanceof ApiError && e.isUnauthenticated
          ? 'Sign in to run an analysis.'
          : 'Analysis could not be requested — the backend is unreachable.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 border-t border-chalk/[0.08] pt-4">
      {!result && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon name="intelligence" className="h-4 w-4 text-signal" />
            <span className="font-mono text-[0.71875rem] uppercase tracking-[0.1em] text-chalk/60">
              Analyse this dossier
            </span>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className={cn(
              'inline-flex items-center gap-2 rounded-[8px] bg-signal px-3.5 py-1.5',
              'font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-void',
              'transition-all duration-150 hover:bg-signal/90 active:scale-[0.98]',
              loading && 'cursor-not-allowed opacity-60',
            )}
          >
            {loading ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5 animate-spin">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                </svg>
                Analysing…
              </>
            ) : (
              <>
                <Icon name="intelligence" className="h-3.5 w-3.5" />
                Analyse
              </>
            )}
          </button>
        </div>
      )}

      {error && <p className="mt-2 font-mono text-[0.75rem] text-risk">{error}</p>}

      {result && (
        <div className="space-y-3 rounded-[10px] border border-signal/30 bg-void/60 p-4">
          <div className="border-b border-chalk/[0.08] pb-3">
            <AIDisclosure
              assisted={result.assisted}
              model={result.model}
              fallbackReason={result.fallbackReason}
              warnings={result.warnings}
            />
          </div>

          <p className="text-[0.8125rem] leading-relaxed text-chalk/90">{result.output.summary}</p>

          <div className="grid gap-3 pt-1 sm:grid-cols-2">
            <List title="Strengths" tone="validated" icon="check" items={result.output.strengths} />
            <List title="Limitations" tone="risk" icon="alert" items={result.output.limitations} />
          </div>

          {/*
           * What is absent, and what to ask. These are the two lists an officer
           * actually acts on, so they are given the same weight as the summary
           * rather than tucked underneath it.
           */}
          <div className="grid gap-3 border-t border-chalk/[0.06] pt-3 sm:grid-cols-2">
            <List title="Not on file" tone="chalk" icon="alert" items={result.output.missingEvidence} />
            <List title="Questions to put" tone="chalk" icon="search" items={result.output.questions} />
          </div>

          {result.output.recommendationExplanation && (
            <p className="border-t border-chalk/[0.06] pt-3 text-[0.75rem] leading-relaxed text-chalk/55">
              {result.output.recommendationExplanation}
            </p>
          )}

          {result.output.evidenceUsed.length > 0 && (
            <div className="border-t border-chalk/[0.06] pt-3 font-mono text-[0.6875rem] text-chalk/40">
              <span>Records cited: </span>
              {result.output.evidenceUsed.join(', ')}
            </div>
          )}

          <button
            onClick={() => setResult(null)}
            className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-chalk/35 transition-colors hover:text-chalk/70"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
