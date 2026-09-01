'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead } from '@/components/console/primitives';
import { RoleGate } from '@/components/auth/RoleGate';
import { fetchApi } from '@/lib/api';

/**
 * Two to five companies, side by side.
 *
 * The axes here are **company-level**, computed from each company's own record
 * against its field. They are not challenge-specific match scores — suitability
 * belongs to a (challenge, startup) pair and is scored by the matching engine
 * on the challenge review page. Presenting these as a match would be the same
 * category error as a permanent "startup quality" rating, so the page says
 * which it is, twice.
 *
 * A radar carries the shape of a company at a glance: where it is strong and
 * where it is hollow. But a radar is bad at exact values and three of the five
 * hues fall below 3:1 against the light surface, which under the method
 * obligates relief — so the numeric table below is not an extra, it is the
 * accessible reading of the same data and is always present.
 */

const AXES = [
  'Deployment record',
  'Team capacity',
  'Evidence on file',
  'Government exposure',
  'Pilot readiness',
] as const;

/**
 * Short forms for the radar rim.
 *
 * The full names overflowed the viewBox and rendered clipped ("…RNMENT
 * EXPOSURE"). Widening the box would shrink the polygon instead; the table
 * below carries the unabbreviated names, so the rim can be terse.
 */
const AXIS_SHORT: Record<string, string> = {
  'Deployment record': 'Deployments',
  'Team capacity': 'Team',
  'Evidence on file': 'Evidence',
  'Government exposure': 'Govt',
  'Pilot readiness': 'Pilot',
};

interface Row {
  id: string;
  legalName: string;
  displayName: string | null;
  oneLineDescription: string | null;
  sector: string;
  city: string | null;
  documentCount: number;
  dossier: 'FULL' | 'PARTIAL' | 'METADATA_ONLY';
  axes: Record<string, number>;
  composite: number;
  problemSolved: string | null;
  solutionSummary: string | null;
}

interface CompareResult {
  startups: Row[];
  axes: string[];
  top2: { id: string; name: string; composite: number; strengths: string[]; limitations: string[] }[];
  disclaimer: string;
}

export default function ComparePage() {
  return (
    <RoleGate roles={['GOVERNMENT_OFFICER', 'ADMIN']}>
      <Suspense fallback={<ConsoleHeader title="Comparison" subtitle="Loading…" source="demonstration" />}>
        <Compare />
      </Suspense>
    </RoleGate>
  );
}

function Compare() {
  const search = useSearchParams();
  const ids = useMemo(() => (search.get('ids') ?? '').split(',').filter(Boolean), [search]);
  const [data, setData] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (ids.length < 2) {
      setError('Select between two and five companies to compare.');
      return;
    }
    fetchApi<CompareResult>('/api/ai/discover/compare', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Comparison failed.'));
  }, [ids]);

  if (error) {
    return (
      <>
        <ConsoleHeader title="Comparison" subtitle="Could not be shown." source="demonstration" />
        <div className="card p-5">
          <p className="text-[0.875rem] text-risk">{error}</p>
          <Link href="/government/discover" className="mt-4 inline-block text-signal hover:underline">
            ← Back to discovery
          </Link>
        </div>
      </>
    );
  }
  if (!data) return <ConsoleHeader title="Comparison" subtitle="Loading…" source="demonstration" />;

  const visible = data.startups.filter((s) => !hidden.has(s.id));
  const nameOf = (s: Row) => s.displayName ?? s.legalName;

  return (
    <div className="viz-root">
      <ConsoleHeader
        title="Comparison"
        subtitle={`${data.startups.length} companies, side by side`}
        source="demonstration"
      />

      <p className="card border-chalk/10 p-3.5 text-[0.75rem] leading-relaxed text-chalk/50">
        {data.disclaimer}
      </p>

      {/* Legend is always present for two or more series, and doubles as the
          show/hide control — identity never rests on colour alone. */}
      <div className="flex flex-wrap gap-2">
        {data.startups.map((s, i) => {
          const off = hidden.has(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() =>
                setHidden((h) => {
                  const next = new Set(h);
                  if (next.has(s.id)) next.delete(s.id);
                  else if (visible.length > 1) next.add(s.id);
                  return next;
                })
              }
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.75rem] transition-opacity ${
                off ? 'border-chalk/15 text-chalk/35' : 'border-chalk/25 text-chalk/80'
              }`}
              aria-pressed={!off}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: `var(--s${i + 1})`, opacity: off ? 0.3 : 1 }}
              />
              {nameOf(s)}
            </button>
          );
        })}
      </div>

      <section aria-label="Comparison chart">
        <SectionHead title="Company profile shape" />
        <div className="card flex justify-center p-6">
          <RadarChart rows={visible} allRows={data.startups} nameOf={nameOf} />
        </div>
      </section>

      {/* Not an extra: the accessible reading of the same data, required
          because three hues fall under 3:1 on the light surface. */}
      <section aria-label="Comparison table">
        <SectionHead title="The same figures, exactly" />
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[44rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-chalk/[0.08]">
                <th className="px-4 py-3 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/40">
                  Company
                </th>
                {AXES.map((a) => (
                  <th key={a} className="px-3 py-3 text-right font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-chalk/40">
                    {a}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/55">
                  Mean
                </th>
              </tr>
            </thead>
            <tbody>
              {data.startups.map((s, i) => (
                <tr key={s.id} className={`border-b border-chalk/[0.05] last:border-0 ${hidden.has(s.id) ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-3 text-[0.8125rem] text-chalk">
                    <span className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ background: `var(--s${i + 1})` }} />
                    {nameOf(s)}
                  </td>
                  {AXES.map((a) => (
                    <td key={a} className="px-3 py-3 text-right font-mono text-[0.75rem] text-chalk/65">
                      {Math.round((s.axes[a] ?? 0) * 100)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-display text-[0.9375rem] font-bold text-chalk">
                    {Math.round(s.composite * 100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- the two strongest ------------------------------------------ */}
      <section aria-label="Top candidates">
        <SectionHead title="Top 2 for government review" />
        <div className="grid gap-4 lg:grid-cols-2">
          {data.top2.map((t) => {
            const row = data.startups.find((s) => s.id === t.id)!;
            return (
              <article key={t.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-[1.0625rem] font-bold leading-tight text-chalk">{t.name}</p>
                    <p className="mt-1 text-[0.75rem] text-chalk/45">
                      {row.sector.replace(/-/g, ' ')} · {row.city ?? '—'}
                    </p>
                  </div>
                  <DossierBadge state={row.dossier} count={row.documentCount} />
                </div>

                {row.solutionSummary && (
                  <p className="mt-3 text-[0.8125rem] leading-relaxed text-chalk/60">{row.solutionSummary}</p>
                )}

                <div className="mt-4 grid gap-3 border-t border-chalk/[0.08] pt-3.5 sm:grid-cols-2">
                  <div>
                    <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/40">Strongest on</p>
                    <ul className="mt-1.5 space-y-1">
                      {(t.strengths.length ? t.strengths : ['No axis scored strongly.']).map((s) => (
                        <li key={s} className="text-[0.75rem] text-chalk/65">• {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-risk/70">Limitations</p>
                    <ul className="mt-1.5 space-y-1">
                      {(t.limitations.length ? t.limitations : ['None on these axes.']).map((s) => (
                        <li key={s} className="text-[0.75rem] text-chalk/65">• {s}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link
                  href={`/startups/${t.id}/report`}
                  className="mt-4 inline-block font-mono text-[0.625rem] uppercase tracking-[0.12em] text-signal hover:underline"
                >
                  View company dossier ↗
                </Link>
              </article>
            );
          })}
        </div>
        <p className="mt-3 max-w-[74ch] text-[0.75rem] leading-relaxed text-chalk/40">
          The two strongest on these company-level axes. Not a shortlist, not an approval, and not a
          government selection — a person makes that against a specific challenge.
        </p>
      </section>

      <Link href="/government/discover" className="self-start font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-chalk/50 hover:text-signal">
        ← Back to discovery
      </Link>

      <style jsx global>{`
        .viz-root {
          --s1: #2a78d6; --s2: #eb6834; --s3: #1baf7a; --s4: #eda100; --s5: #e87ba4;
        }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme='light']) .viz-root {
            --s1: #3987e5; --s2: #d95926; --s3: #199e70; --s4: #c98500; --s5: #d55181;
          }
        }
        :root[data-theme='dark'] .viz-root {
          --s1: #3987e5; --s2: #d95926; --s3: #199e70; --s4: #c98500; --s5: #d55181;
        }
      `}</style>
    </div>
  );
}

function DossierBadge({ state, count }: { state: Row['dossier']; count: number }) {
  const text =
    state === 'FULL' ? `Full dossier · ${count}` : state === 'PARTIAL' ? `${count} documents` : 'Profile only';
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.5rem] uppercase tracking-[0.1em] ${
        state === 'FULL'
          ? 'border-validated/40 text-validated'
          : state === 'PARTIAL'
            ? 'border-chalk/25 text-chalk/65'
            : 'border-chalk/15 text-chalk/40'
      }`}
      title={state === 'METADATA_ONLY' ? 'No uploaded document dossier in this simulation' : undefined}
    >
      {text}
    </span>
  );
}

/**
 * The radar.
 *
 * Five axes, one polygon per company. Thin strokes and a light fill so
 * overlapping shapes stay readable; axis labels are always drawn, so the chart
 * is legible without the legend.
 */
function RadarChart({
  rows,
  allRows,
  nameOf,
}: {
  rows: Row[];
  allRows: Row[];
  nameOf: (r: Row) => string;
}) {
  const size = 380;
  const c = size / 2;
  const r = c - 74;
  const n = AXES.length;
  const pt = (axis: number, value: number) => {
    const a = (Math.PI * 2 * axis) / n - Math.PI / 2;
    return [c + Math.cos(a) * r * value, c + Math.sin(a) * r * value] as const;
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
      aria-label={`Radar comparing ${rows.map(nameOf).join(', ')} on ${AXES.join(', ')}`}>
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon
          key={ring}
          points={AXES.map((_, i) => pt(i, ring).join(',')).join(' ')}
          fill="none"
          stroke="rgb(var(--c-chalk) / 0.10)"
        />
      ))}
      {AXES.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="rgb(var(--c-chalk) / 0.08)" />;
      })}

      {rows.map((s) => {
        const idx = allRows.findIndex((a) => a.id === s.id);
        const colour = `var(--s${idx + 1})`;
        const points = AXES.map((a, i) => pt(i, Math.max(0.02, s.axes[a] ?? 0)).join(',')).join(' ');
        return (
          <g key={s.id}>
            <polygon points={points} fill={colour} fillOpacity="0.12" stroke={colour} strokeWidth="2" />
            {AXES.map((a, i) => {
              const [x, y] = pt(i, Math.max(0.02, s.axes[a] ?? 0));
              return (
                <circle key={a} cx={x} cy={y} r="4" fill={colour} stroke="rgb(var(--c-void))" strokeWidth="1.5">
                  <title>{`${nameOf(s)} — ${a}: ${Math.round((s.axes[a] ?? 0) * 100)}`}</title>
                </circle>
              );
            })}
          </g>
        );
      })}

      {AXES.map((a, i) => {
        const [x, y] = pt(i, 1.13);
        return (
          <text
            key={a}
            x={x}
            y={y}
            textAnchor={x > c + 8 ? 'start' : x < c - 8 ? 'end' : 'middle'}
            dominantBaseline="middle"
            className="fill-chalk/50"
            style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}
          >
            {AXIS_SHORT[a] ?? a}
          </text>
        );
      })}
    </svg>
  );
}
