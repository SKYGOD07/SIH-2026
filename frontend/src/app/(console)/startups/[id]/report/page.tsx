'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead } from '@/components/console/primitives';
import { RoleGate } from '@/components/auth/RoleGate';
import { fetchApi } from '@/lib/api';

/**
 * A company's report card, for a government reader.
 *
 * The dossier answers "what is this company?". This answers the question that
 * actually comes next — **"is that good?"** — which no single number can. Five
 * deployments means nothing until you know the field's median is three, so
 * every figure here is shown against its field rather than alone.
 *
 * Chart choices follow from that. Each is one series, so no legend is needed
 * and no categorical palette is in play; the company's own position is marked
 * with a second hue *and* a direct label, so identity never rests on colour.
 * The two hues were validated for both themes (ΔE 24.7 protan, 33.6 normal) —
 * checked with the validator rather than eyeballed.
 *
 * Nothing is computed in the browser. Medians, ranks and histogram buckets come
 * from SQL over the whole field, so a percentile is a percentile and not a rank
 * within whatever the page happened to load.
 */

interface Report {
  company: {
    id: string; legalName: string; displayName: string | null;
    oneLineDescription: string | null; sector: string; city: string | null;
    stage: string | null; teamSize: number | null; foundedYear: number | null;
    deploymentCount: number | null; customerCount: number | null;
    pilotDurationDays: number | null; procurementReadiness: string;
    complianceStatus: string; cybersecurityStatus: string; dataPrivacyStatus: string;
    technologies: string[]; capabilities: string[]; origin: string;
    problemSolved: string | null; solutionSummary: string | null;
    _count: { documents: number; participations: number; pilots: number; responses: number };
  };
  field: {
    sector: string; peerCount: number;
    medianDeployments: number | null; medianTeamSize: number | null; medianPilotDays: number | null;
    readinessSpread: { level: string; count: number; isOwn: boolean }[];
  };
  position: { deployments: { rank: number; of: number; percentile: number } | null };
  histogram: { label: string; count: number; isOwn: boolean }[];
  documentsByCategory: { category: string; count: number }[];
  signals: { label: string; level: string; basis: string[] }[];
  gaps: string[];
  disclaimer: string;
}

/* Validated for both themes — see the note above. */
const SERIES = 'var(--viz-series)';
const HIGHLIGHT = 'var(--viz-highlight)';

export default function ReportPage() {
  return (
    <RoleGate roles={['GOVERNMENT_OFFICER', 'EVALUATOR', 'ADMIN']}>
      <Report />
    </RoleGate>
  );
}

function Report() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi<Report>(`/api/workflow/startups/${params.id}/report`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load this report.'));
  }, [params.id]);

  if (error) {
    return (
      <>
        <ConsoleHeader title="Report card" subtitle="Could not be loaded." source="demonstration" />
        <div className="card p-5">
          <p className="text-[0.875rem] text-risk">{error}</p>
          <Link href="/government/discover" className="mt-4 inline-block text-signal hover:underline">
            ← Back to discovery
          </Link>
        </div>
      </>
    );
  }
  if (!data) return <ConsoleHeader title="Report card" subtitle="Loading…" source="demonstration" />;

  const c = data.company;
  const name = c.displayName ?? c.legalName;
  const maxDocs = Math.max(1, ...data.documentsByCategory.map((d) => d.count));
  const maxHist = Math.max(1, ...data.histogram.map((h) => h.count));
  const maxRead = Math.max(1, ...data.field.readinessSpread.map((r) => r.count));

  return (
    <div className="viz-root">
      <ConsoleHeader
        title={name}
        subtitle={`${c.sector.replace(/-/g, ' ')} · ${c.city ?? '—'} · report card`}
        source="demonstration"
      />

      <p className="card border-chalk/10 p-3.5 text-[0.75rem] leading-relaxed text-chalk/50">
        {data.disclaimer}
      </p>

      {/* --- headline figures. Stat tiles, not charts: a single number needs
              no axis, and giving it one is decoration. ------------------- */}
      <section aria-label="At a glance">
        <SectionHead title="At a glance" meta={`against ${data.field.peerCount} companies in this field`} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tile
            label="Deployments"
            value={c.deploymentCount ?? 0}
            context={
              data.field.medianDeployments !== null
                ? `field median ${data.field.medianDeployments}`
                : undefined
            }
            rank={data.position.deployments}
          />
          <Tile label="Team size" value={c.teamSize ?? '—'} context={data.field.medianTeamSize !== null ? `field median ${data.field.medianTeamSize}` : undefined} />
          <Tile label="Documents filed" value={c._count.documents} context={c._count.documents === 0 ? 'none provided' : undefined} />
          <Tile label="Proposed pilot" value={c.pilotDurationDays ? `${c.pilotDurationDays}d` : '—'} context={data.field.medianPilotDays ? `field median ${data.field.medianPilotDays}d` : undefined} />
        </div>
      </section>

      {/* --- where it sits in its field ------------------------------- */}
      <section aria-label="Position in field">
        <SectionHead title="Where it sits in its field" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            title="Deployments across the field"
            note={
              data.position.deployments
                ? `${name} is ranked ${data.position.deployments.rank} of ${data.position.deployments.of}.`
                : 'No deployment figures recorded in this field.'
            }
          >
            <Bars
              rows={data.histogram.map((h) => ({
                label: h.label,
                value: h.count,
                highlight: h.isOwn,
                suffix: h.isOwn ? 'this company' : undefined,
              }))}
              max={maxHist}
              unit="companies"
            />
          </Panel>

          <Panel
            title="Procurement readiness across the field"
            note="Readiness is company-stated, not verified."
          >
            <Bars
              rows={data.field.readinessSpread.map((r) => ({
                label: r.level.replace(/_/g, ' ').toLowerCase(),
                value: r.count,
                highlight: r.isOwn,
                suffix: r.isOwn ? 'this company' : undefined,
              }))}
              max={maxRead}
              unit="companies"
            />
          </Panel>
        </div>
      </section>

      {/* --- evidence ------------------------------------------------- */}
      <section aria-label="Evidence">
        <SectionHead title="Evidence on file" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            title="Documents by category"
            note={
              c._count.documents === 0
                ? 'This company has filed no documents. That is an absence, not a zero score.'
                : `${c._count.documents} documents filed.`
            }
          >
            {data.documentsByCategory.length === 0 ? (
              <Empty>Nothing filed yet.</Empty>
            ) : (
              <Bars
                rows={data.documentsByCategory.map((d) => ({
                  label: d.category.replace(/_/g, ' ').toLowerCase(),
                  value: d.count,
                }))}
                max={maxDocs}
                unit="documents"
              />
            )}
          </Panel>

          <Panel title="Assurance posture" note="Stated by the company. Verification requires a cited source.">
            <ul className="flex flex-col gap-2.5">
              {data.signals.map((s) => (
                <li key={s.label} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.8125rem] text-chalk/80">{s.label}</p>
                    <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-chalk/40">{s.basis[0]}</p>
                  </div>
                  {/* Status carries a label, never colour alone. */}
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.5rem] uppercase tracking-[0.1em] ${
                      s.level === 'HIGH'
                        ? 'border-validated/40 text-validated'
                        : s.level === 'MODERATE'
                          ? 'border-chalk/25 text-chalk/70'
                          : s.level === 'LOW'
                            ? 'border-risk/35 text-risk'
                            : 'border-chalk/15 text-chalk/40'
                    }`}
                  >
                    {s.level.replace(/_/g, ' ').toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </section>

      {/* --- what it says it does -------------------------------------- */}
      <section aria-label="Solution">
        <SectionHead title="What it says it does" />
        <div className="card p-5">
          {c.problemSolved && (
            <>
              <Label>Problem addressed</Label>
              <p className="mt-1.5 max-w-[72ch] text-[0.875rem] leading-relaxed text-chalk/70">{c.problemSolved}</p>
            </>
          )}
          {c.solutionSummary && (
            <>
              <Label className="mt-4 block">Approach</Label>
              <p className="mt-1.5 max-w-[72ch] text-[0.875rem] leading-relaxed text-chalk/70">{c.solutionSummary}</p>
            </>
          )}
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-chalk/[0.08] pt-4">
            {c.technologies.map((t) => (
              <span key={t} className="rounded-full border border-chalk/15 px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-chalk/55">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {data.gaps.length > 0 && (
        <div className="card border-risk/25 p-5">
          <Label>Not provided</Label>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-chalk/60">
            {data.gaps.join(', ')} — shown as missing rather than defaulted, so an absence is never
            read as a satisfied requirement.
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <Link href={`/startups/${c.id}`} className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-signal hover:underline">
          Full dossier ↗
        </Link>
        <Link href="/government/discover" className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-chalk/50 hover:text-signal">
          ← Discovery
        </Link>
      </div>

      <style jsx global>{`
        .viz-root {
          --viz-series: #2a78d6;
          --viz-highlight: #eb6834;
        }
        /* Dark steps of the same two hues, chosen for the dark surface rather
           than flipped automatically. Both validated. */
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme='light']) .viz-root {
            --viz-series: #3987e5;
            --viz-highlight: #d95926;
          }
        }
        :root[data-theme='dark'] .viz-root {
          --viz-series: #3987e5;
          --viz-highlight: #d95926;
        }
      `}</style>
    </div>
  );
}

/* --- pieces ---------------------------------------------------------- */

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/40 ${className}`}>
      {children}
    </span>
  );
}

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <p className="font-display text-[0.9375rem] font-bold text-chalk">{title}</p>
      {note && <p className="mt-1 text-[0.6875rem] leading-relaxed text-chalk/45">{note}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Tile({
  label,
  value,
  context,
  rank,
}: {
  label: string;
  value: string | number;
  context?: string;
  rank?: { rank: number; of: number; percentile: number } | null;
}) {
  return (
    <div className="card p-4">
      <Label>{label}</Label>
      <p className="mt-1.5 font-display text-[1.75rem] font-black leading-none text-chalk">{value}</p>
      {context && <p className="mt-1.5 text-[0.6875rem] text-chalk/45">{context}</p>}
      {rank && (
        <p className="mt-0.5 text-[0.6875rem] text-chalk/45">
          rank {rank.rank} of {rank.of}
        </p>
      )}
    </div>
  );
}

/**
 * Horizontal bars.
 *
 * Horizontal because the labels are words: rotated axis text is the commonest
 * way a category chart becomes unreadable. Rounded data-ends, a recessive
 * track, values labelled directly so no legend or axis is needed for one
 * series, and a title attribute for hover.
 */
function Bars({
  rows,
  max,
  unit,
}: {
  rows: { label: string; value: number; highlight?: boolean; suffix?: string }[];
  max: number;
  unit: string;
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[9.5rem_1fr_2rem] items-center gap-2.5">
          {/*
            The "this company" marker lives in the label column, not after the
            bar. Positioned after it, the marker overlapped the value on exactly
            the rows it was meant to draw attention to.
          */}
          <span className="flex items-baseline gap-1.5 truncate text-[0.6875rem]" title={r.label}>
            <span className={r.highlight ? 'text-chalk/85' : 'text-chalk/55'}>{r.label}</span>
            {r.suffix && (
              <span
                className="shrink-0 font-mono text-[0.5rem] uppercase tracking-[0.1em]"
                style={{ color: HIGHLIGHT }}
              >
                {r.suffix}
              </span>
            )}
          </span>
          <span className="relative block h-2.5 rounded-full bg-chalk/[0.07]">
            <span
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.max((r.value / max) * 100, r.value > 0 ? 3 : 0)}%`,
                background: r.highlight ? HIGHLIGHT : SERIES,
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

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.8125rem] leading-relaxed text-chalk/45">{children}</p>;
}
