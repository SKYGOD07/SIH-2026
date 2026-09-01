'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';

/**
 * What the platform can reach for.
 *
 * The decision queue answers "what needs me today". This answers the other
 * question an officer arrives with — *what is actually in here?* — and it is
 * the difference between a console that looks empty and one that shows 515
 * companies across 25 fields.
 *
 * Three readings, chosen because each changes what an officer would do next:
 * where the companies are, how ready they say they are, and how much of that is
 * evidenced. A fourth chart would be decoration.
 *
 * Every figure is a `count` from SQL. Each chart is one series, so no legend is
 * needed and no categorical palette is in play; the single hue is the validated
 * series colour used elsewhere in the product.
 */

interface Overview {
  total: number;
  fieldCount: number;
  fields: { field: string; label: string; count: number }[];
  readiness: { level: string; count: number }[];
  evidence: { withDocuments: number; metadataOnly: number };
  note: string;
}

export function PortfolioOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi<Overview>('/api/ai/discover/overview')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load the overview.'));
  }, []);

  if (error) {
    return (
      <div className="card p-5">
        <p className="text-[0.8125rem] text-risk">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="card p-5">
        <p className="text-[0.8125rem] text-chalk/45">Counting…</p>
      </div>
    );
  }

  const maxField = Math.max(1, ...data.fields.map((f) => f.count));
  const maxReady = Math.max(1, ...data.readiness.map((r) => r.count));
  const evidencePct = Math.round((data.evidence.withDocuments / Math.max(1, data.total)) * 100);

  return (
    <div className="viz-root flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Companies" value={data.total} />
        <Tile label="Innovation fields" value={data.fieldCount} />
        <Tile label="With documents" value={data.evidence.withDocuments} context={`${evidencePct}% of the platform`} />
        <Tile label="Profile only" value={data.evidence.metadataOnly} context="no dossier filed" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Where the companies are"
          note={`${data.fieldCount} fields. The six largest, with the remainder grouped.`}
          action={{ href: '/startups', label: 'Browse all' }}
        >
          <Bars rows={data.fields.map((f) => ({ label: f.label, value: f.count }))} max={maxField} unit="companies" />
        </Panel>

        <Panel
          title="Stated procurement readiness"
          note="Company-stated, not verified. 'Not assessed' means the company has said nothing."
        >
          <Bars
            rows={data.readiness.map((r) => ({
              label: r.level.replace(/_/g, ' ').toLowerCase(),
              value: r.count,
            }))}
            max={maxReady}
            unit="companies"
          />
        </Panel>
      </div>

      <p className="text-[0.6875rem] leading-relaxed text-chalk/40">{data.note}</p>

      <style jsx global>{`
        .viz-root {
          --viz-series: #2a78d6;
        }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme='light']) .viz-root {
            --viz-series: #3987e5;
          }
        }
        :root[data-theme='dark'] .viz-root {
          --viz-series: #3987e5;
        }
      `}</style>
    </div>
  );
}

function Tile({ label, value, context }: { label: string; value: number; context?: string }) {
  return (
    <div className="card p-4">
      <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/40">{label}</span>
      <p className="mt-1.5 font-display text-[1.625rem] font-black leading-none text-chalk">{value}</p>
      {context && <p className="mt-1.5 text-[0.6875rem] text-chalk/45">{context}</p>}
    </div>
  );
}

function Panel({
  title,
  note,
  action,
  children,
}: {
  title: string;
  note?: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-[0.9375rem] font-bold text-chalk">{title}</p>
          {note && <p className="mt-1 text-[0.6875rem] leading-relaxed text-chalk/45">{note}</p>}
        </div>
        {action && (
          <Link
            href={action.href}
            className="shrink-0 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-signal hover:underline"
          >
            {action.label} ↗
          </Link>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/** Horizontal bars: the labels are words, and rotated axis text is unreadable. */
function Bars({
  rows,
  max,
  unit,
}: {
  rows: { label: string; value: number }[];
  max: number;
  unit: string;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[9rem_1fr_2.25rem] items-center gap-2.5">
          <span className="truncate text-[0.6875rem] text-chalk/55" title={r.label}>
            {r.label}
          </span>
          <span className="block h-2 rounded-full bg-chalk/[0.07]">
            <span
              className="block h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.max((r.value / max) * 100, r.value > 0 ? 2 : 0)}%`,
                background: 'var(--viz-series)',
              }}
              title={`${r.value} ${unit}`}
            />
          </span>
          <span className="text-right font-mono text-[0.6875rem] text-chalk/60">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}
