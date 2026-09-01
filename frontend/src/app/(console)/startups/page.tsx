'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead } from '@/components/console/primitives';
import { RoleGate } from '@/components/auth/RoleGate';
import { fetchApi } from '@/lib/api';

/**
 * The company registry.
 *
 * This page previously read `/workflow/company/claimable/{scenario}` — an
 * endpoint written for a *startup user claiming a company*. It returns only
 * unclaimed companies inside one scenario, which meant a government officer
 * browsing the registry saw a handful of records and had no route to the rest.
 * Every company has a working dossier; almost none of them were reachable.
 *
 * It now reads the same discovery endpoint the rest of the government surface
 * uses: server-side filtering, server-side sorting, server-side paging, and a
 * total that comes from a count query rather than the length of the page.
 */

interface Company {
  id: string;
  legalName: string;
  displayName: string | null;
  oneLineDescription: string | null;
  sector: string;
  city: string | null;
  deploymentCount: number | null;
  procurementReadiness: string;
  documentCount: number;
  dossier: 'FULL' | 'PARTIAL' | 'METADATA_ONLY';
  origin: string;
}

interface FieldRow {
  field: string;
  label: string;
  companyCount: number;
}

const PAGE = 24;

export default function StartupsPage() {
  return (
    <RoleGate roles={['GOVERNMENT_OFFICER', 'EVALUATOR', 'ADMIN']}>
      <Registry />
    </RoleGate>
  );
}

function Registry() {
  const [fields, setFields] = useState<FieldRow[]>([]);
  const [field, setField] = useState<string>('');
  const [sort, setSort] = useState<'deployments' | 'readiness' | 'name'>('deployments');
  const [rows, setRows] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi<{ browsable: FieldRow[] }>('/api/ai/discover/fields')
      .then((r) => setFields(r.browsable))
      .catch(() => setFields([]));
  }, []);

  const load = useCallback(
    async (offset: number, replace: boolean) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetchApi<{ startups: Company[]; total: number; hasMore: boolean }>(
          '/api/ai/discover/startups',
          {
            method: 'POST',
            body: JSON.stringify({
              field: field || undefined,
              sort,
              limit: PAGE,
              offset,
            }),
          },
        );
        setRows((prev) => (replace ? res.startups : [...prev, ...res.startups]));
        setTotal(res.total);
        setHasMore(res.hasMore);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load companies.');
      } finally {
        setBusy(false);
      }
    },
    [field, sort],
  );

  useEffect(() => {
    void load(0, true);
  }, [load]);

  return (
    <>
      <ConsoleHeader
        title="Companies"
        subtitle="Every company on the platform. Open one for its report card."
        source="demonstration"
      />

      {error && <p className="card border-risk/30 p-4 text-[0.8125rem] text-risk">{error}</p>}

      <section aria-label="Registry">
        {/* The total is the server's count for the current filter, not the
            number of rows that happen to be loaded. */}
        <SectionHead
          title={field ? fields.find((f) => f.field === field)?.label ?? field : 'All fields'}
          meta={total ? `${total} companies · showing ${rows.length}` : undefined}
        />

        <div className="card mb-4 flex flex-wrap items-center gap-x-5 gap-y-3 p-4">
          <label className="flex items-center gap-2 text-[0.75rem] text-chalk/65">
            Field
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="rounded-[6px] border border-chalk/15 bg-chalk/[0.03] px-2 py-1 text-chalk outline-none focus:border-signal/60"
            >
              <option value="">All ({fields.reduce((s, f) => s + f.companyCount, 0)})</option>
              {fields.map((f) => (
                <option key={f.field} value={f.field}>
                  {f.label} ({f.companyCount})
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-[0.75rem] text-chalk/65">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="rounded-[6px] border border-chalk/15 bg-chalk/[0.03] px-2 py-1 text-chalk outline-none focus:border-signal/60"
            >
              <option value="deployments">Deployments</option>
              <option value="readiness">Stated readiness</option>
              <option value="name">Name</option>
            </select>
          </label>

          <Link
            href="/government/discover"
            className="ml-auto font-mono text-[0.625rem] uppercase tracking-[0.12em] text-signal hover:underline"
          >
            Search by problem ↗
          </Link>
        </div>

        {rows.length === 0 && !busy ? (
          <div className="card p-5">
            <p className="text-[0.8125rem] text-chalk/55">No company matches this filter.</p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {rows.map((c) => (
              <Link
                key={c.id}
                href={`/startups/${c.id}/report`}
                className="card flex flex-col p-4 transition-colors hover:border-signal/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-[0.9375rem] font-bold text-chalk">
                      {c.displayName ?? c.legalName}
                    </p>
                    <p className="mt-0.5 text-[0.6875rem] text-chalk/45">
                      {c.sector.replace(/-/g, ' ')}
                      {c.city ? ` · ${c.city}` : ''}
                    </p>
                  </div>
                  <DossierBadge state={c.dossier} count={c.documentCount} />
                </div>

                {c.oneLineDescription && (
                  <p className="mt-2 line-clamp-2 text-[0.75rem] leading-relaxed text-chalk/55">
                    {c.oneLineDescription}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-4 border-t border-chalk/[0.08] pt-2.5 font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-chalk/40">
                  <span>{c.deploymentCount ?? 0} deployments</span>
                  <span>readiness {c.procurementReadiness.replace(/_/g, ' ').toLowerCase()}</span>
                  <span className="ml-auto text-signal">Report ↗</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => load(rows.length, false)}
              disabled={busy}
              className="rounded-[8px] border border-chalk/20 px-5 py-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-chalk transition-colors hover:border-signal/60 hover:text-signal disabled:opacity-40"
            >
              {busy ? 'Loading…' : `Load more · ${total - rows.length} remaining`}
            </button>
          </div>
        )}
      </section>
    </>
  );
}

function DossierBadge({
  state,
  count,
}: {
  state: 'FULL' | 'PARTIAL' | 'METADATA_ONLY';
  count: number;
}) {
  const label =
    state === 'FULL' ? `Full dossier · ${count}` : state === 'PARTIAL' ? `${count} documents` : 'Profile only';
  return (
    <span
      title={state === 'METADATA_ONLY' ? 'No uploaded document dossier in this simulation' : undefined}
      className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.5rem] uppercase tracking-[0.1em] ${
        state === 'FULL'
          ? 'border-validated/40 text-validated'
          : state === 'PARTIAL'
            ? 'border-chalk/25 text-chalk/60'
            : 'border-chalk/15 text-chalk/40'
      }`}
    >
      {label}
    </span>
  );
}
