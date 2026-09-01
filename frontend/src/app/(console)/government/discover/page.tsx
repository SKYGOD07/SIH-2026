'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead } from '@/components/console/primitives';
import { RoleGate } from '@/components/auth/RoleGate';
import { Radar, type RadarField } from '@/components/discovery/Radar';
import { fetchApi } from '@/lib/api';

/**
 * Startup discovery, entered from the problem rather than from a directory.
 *
 * The officer arrives with a departmental problem in their own words, or with
 * nothing but the sense that something needs solving. Both paths end in the
 * same place: a field, and the companies working in it.
 *
 * What the AI does here is narrow and stated on screen — it reads prose and
 * proposes a *field*. It does not choose companies, and it does not rank them.
 * Retrieval is an ordinary database query, so the same filters always return
 * the same companies, which is the only version of this an officer could
 * defend afterwards.
 *
 * The whole flow works with the model switched off. When it is unreachable the
 * fields come from term matching instead, and the interface says so rather than
 * pretending the answer came from somewhere cleverer.
 */

type Stage = 'ask' | 'scanning' | 'fields' | 'results';

interface FieldSuggestion {
  field: string;
  label: string;
  confidence: number;
  reason: string;
  companyCount: number;
}

interface Company {
  id: string;
  legalName: string;
  displayName: string | null;
  oneLineDescription: string | null;
  sector: string;
  city: string | null;
  teamSize: number | null;
  technologies: string[];
  capabilities: string[];
  deploymentCount: number | null;
  procurementReadiness: string;
  cybersecurityStatus: string;
  complianceStatus: string;
  pilotDurationDays: number | null;
  origin: string;
  _count: { documents: number; participations: number; pilots: number };
}

interface Filters {
  technologies: string[];
  cities: string[];
  readinessLevels: string[];
}

export default function DiscoverPage() {
  return (
    <RoleGate roles={['GOVERNMENT_OFFICER', 'ADMIN']}>
      <Discover />
    </RoleGate>
  );
}

function Discover() {
  const [stage, setStage] = useState<Stage>('ask');
  const [problem, setProblem] = useState('');
  const [suggestions, setSuggestions] = useState<FieldSuggestion[]>([]);
  const [browsable, setBrowsable] = useState<FieldSuggestion[]>([]);
  const [usedAI, setUsedAI] = useState(false);
  const [note, setNote] = useState('');
  const [field, setField] = useState<FieldSuggestion | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filters, setFilters] = useState<Filters | null>(null);
  const [error, setError] = useState<string | null>(null);

  // active filter state
  const [tech, setTech] = useState<string[]>([]);
  const [minDeployments, setMinDeployments] = useState(0);
  const [cyberOnly, setCyberOnly] = useState(false);
  const [minReadiness, setMinReadiness] = useState<string>('');

  useEffect(() => {
    fetchApi<{ browsable: FieldSuggestion[] }>('/api/ai/discover/fields')
      .then((r) => setBrowsable(r.browsable))
      .catch(() => setBrowsable([]));
  }, []);

  const runSearch = useCallback(
    async (f: FieldSuggestion) => {
      setField(f);
      setError(null);
      try {
        const [res, opts] = await Promise.all([
          fetchApi<{ startups: Company[] }>('/api/ai/discover/startups', {
            method: 'POST',
            body: JSON.stringify({
              field: f.field,
              technologies: tech.length ? tech : undefined,
              minDeployments: minDeployments || undefined,
              cybersecurityProvided: cyberOnly || undefined,
              minReadiness: minReadiness || undefined,
            }),
          }),
          fetchApi<Filters>(`/api/ai/discover/filters?field=${encodeURIComponent(f.field)}`),
        ]);
        setCompanies(res.startups);
        setFilters(opts);
        setStage('results');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Search failed.');
        setStage('fields');
      }
    },
    [tech, minDeployments, cyberOnly, minReadiness],
  );

  // Re-run when a filter changes, once results are on screen.
  useEffect(() => {
    if (stage === 'results' && field) void runSearch(field);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tech, minDeployments, cyberOnly, minReadiness]);

  async function classify() {
    setError(null);
    setStage('scanning');
    const started = Date.now();
    try {
      const r = await fetchApi<{ suggestions: FieldSuggestion[]; usedAI: boolean; note: string }>(
        '/api/ai/discover/fields',
        { method: 'POST', body: JSON.stringify({ problem }) },
      );
      // The scan is information, not theatre — but a 40ms answer that flashes
      // past tells the officer nothing about what happened. Hold the floor.
      const elapsed = Date.now() - started;
      if (elapsed < 1800) await new Promise((res) => setTimeout(res, 1800 - elapsed));
      setSuggestions(r.suggestions);
      setUsedAI(r.usedAI);
      setNote(r.note);
      setStage(r.suggestions.length ? 'fields' : 'ask');
      if (!r.suggestions.length) {
        setError('No field in the taxonomy matched that description. Try naming the service affected.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not classify that problem.');
      setStage('ask');
    }
  }

  const radarFields: RadarField[] = (suggestions.length ? suggestions : browsable).map((f) => ({
    field: f.field,
    label: f.label,
    companyCount: f.companyCount,
  }));

  return (
    <>
      <ConsoleHeader
        title="Find a solution"
        subtitle="Describe the problem. The platform proposes a field and shows the companies working in it."
        source="demonstration"
      />

      {error && <p className="card border-risk/30 p-4 text-[0.8125rem] text-risk">{error}</p>}

      {/* --- 1. state the problem ---------------------------------------- */}
      {(stage === 'ask' || stage === 'fields') && (
        <section aria-label="State the problem">
          <SectionHead title="What is the problem?" />
          <div className="card p-5">
            <label
              htmlFor="problem"
              className="mb-2 block font-mono text-[0.625rem] uppercase tracking-[0.16em] text-chalk/45"
            >
              In your own words
            </label>
            <textarea
              id="problem"
              rows={3}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="e.g. We are losing a large share of treated water somewhere between the plant and household taps, and we cannot tell where."
              className="w-full rounded-[8px] border border-chalk/15 bg-chalk/[0.03] px-3.5 py-2.5 text-[0.9375rem] leading-relaxed text-chalk outline-none transition-colors placeholder:text-chalk/25 focus:border-signal/60"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={classify}
                disabled={problem.trim().length < 10}
                className="rounded-[8px] bg-signal px-4 py-2.5 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-void transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Find the field
              </button>
              <span className="text-[0.75rem] text-chalk/35">or</span>
              <button
                type="button"
                onClick={() => {
                  setSuggestions(browsable);
                  setUsedAI(false);
                  setNote('Every field the platform currently holds companies for.');
                  setStage('fields');
                }}
                className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-chalk/60 underline-offset-4 hover:text-signal hover:underline"
              >
                Show me what is available
              </button>
            </div>
          </div>
        </section>
      )}

      {/* --- 2. the scan -------------------------------------------------- */}
      {stage === 'scanning' && (
        <section aria-label="Scanning" className="py-10">
          <Radar fields={browsable} caption="Reading the problem · matching against the field taxonomy" />
        </section>
      )}

      {/* --- 3. the fields ------------------------------------------------ */}
      {stage === 'fields' && suggestions.length > 0 && (
        <section aria-label="Suggested fields">
          <SectionHead title="Fields that match" />
          <p className="mb-3 max-w-[68ch] text-[0.8125rem] leading-relaxed text-chalk/50">
            {note}{' '}
            {usedAI ? (
              <span className="text-chalk/40">
                The model proposed the field only — it selects no companies and scores nothing.
              </span>
            ) : null}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {suggestions.map((f) => (
              <button
                key={f.field}
                type="button"
                onClick={() => runSearch(f)}
                disabled={f.companyCount === 0}
                className="liquid-glass rounded-[14px] p-5 text-left transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                style={{ ['--glass-tint' as string]: 0.35 }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal">
                    {(f.confidence * 100).toFixed(0)}% match
                  </span>
                  <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-chalk/40">
                    {f.companyCount} {f.companyCount === 1 ? 'company' : 'companies'}
                  </span>
                </div>
                <p className="mt-2 font-display text-[1.0625rem] font-bold leading-tight text-chalk">
                  {f.label}
                </p>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-chalk/55">{f.reason}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* --- 4. the companies --------------------------------------------- */}
      {stage === 'results' && field && (
        <>
          <section aria-label="Filters">
            <SectionHead title={field.label} meta={`${companies.length} shown`} />
            <div className="card mb-4 flex flex-wrap items-center gap-x-5 gap-y-3 p-4">
              <Toggle label="States a security posture" on={cyberOnly} onChange={setCyberOnly} />
              <Numeric
                label="Min. deployments"
                value={minDeployments}
                onChange={setMinDeployments}
                max={10}
              />
              <Select
                label="Min. readiness"
                value={minReadiness}
                onChange={setMinReadiness}
                options={filters?.readinessLevels ?? []}
              />
              <Chips
                label="Technology"
                options={filters?.technologies ?? []}
                selected={tech}
                onChange={setTech}
              />
              <button
                type="button"
                onClick={() => {
                  setTech([]);
                  setMinDeployments(0);
                  setCyberOnly(false);
                  setMinReadiness('');
                }}
                className="ml-auto font-mono text-[0.625rem] uppercase tracking-[0.12em] text-chalk/45 hover:text-signal"
              >
                Clear
              </button>
            </div>
          </section>

          <section aria-label="Companies">
            {companies.length === 0 ? (
              <div className="card p-6">
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal">
                  Nothing left
                </p>
                <p className="mt-2.5 max-w-[56ch] text-[0.8125rem] leading-relaxed text-chalk/60">
                  No company in this field meets every filter. That is a finding, not an error —
                  loosen a filter to see which one is doing the excluding.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {companies.map((c, i) => (
                  <article
                    key={c.id}
                    className="liquid-glass rounded-[16px] p-5"
                    style={{
                      ['--glass-tint' as string]: 0.34,
                      animation: `cardIn 520ms cubic-bezier(0.16,1,0.3,1) ${(i * 70).toString()}ms both`,
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {c.origin === 'DEMO' && (
                        <span className="font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-chalk/40">
                          Demo company
                        </span>
                      )}
                      {c.city && (
                        <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/35">
                          {c.city}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2 font-display text-[1.125rem] font-bold leading-tight text-chalk">
                      {c.displayName ?? c.legalName}
                    </h3>
                    {c.oneLineDescription && (
                      <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-chalk/60">
                        {c.oneLineDescription}
                      </p>
                    )}

                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {c.technologies.slice(0, 5).map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-chalk/15 px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-chalk/55"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Counted facts only. Nothing here is a suitability score. */}
                    <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-chalk/[0.08] pt-3.5">
                      <Stat label="Deployments" value={c.deploymentCount ?? 0} />
                      <Stat label="Documents" value={c._count.documents} />
                      <Stat
                        label="Pilot"
                        value={c.pilotDurationDays ? `${c.pilotDurationDays}d` : '—'}
                      />
                    </dl>

                    <div className="mt-3.5 flex items-center justify-between gap-3">
                      <span className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-chalk/40">
                        Readiness {c.procurementReadiness.replace(/_/g, ' ').toLowerCase()}
                      </span>
                      <Link
                        href={`/startups/${c.id}`}
                        className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-signal hover:underline"
                      >
                        View dossier ↗
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <p className="mt-4 max-w-[74ch] text-[0.75rem] leading-relaxed text-chalk/40">
              Ordered by recorded deployments, not by suitability. Suitability is specific to a
              challenge and is scored only once one exists — these are the companies working in the
              field, not a ranking of who should win.
            </p>
          </section>

          <button
            type="button"
            onClick={() => {
              setStage('ask');
              setCompanies([]);
              setField(null);
            }}
            className="mt-2 self-start font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-chalk/50 hover:text-signal"
          >
            ← Start again
          </button>
        </>
      )}

      <style jsx global>{`
        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes cardIn {
            from,
            to {
              opacity: 1;
              transform: none;
            }
          }
        }
      `}</style>
    </>
  );
}

/* --- small controls ------------------------------------------------- */

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-chalk/35">
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-[0.9375rem] font-bold text-chalk">{value}</dd>
    </div>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[0.75rem] text-chalk/65">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="accent-signal" />
      {label}
    </label>
  );
}

function Numeric({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max: number;
}) {
  return (
    <label className="flex items-center gap-2 text-[0.75rem] text-chalk/65">
      {label}
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-14 rounded-[6px] border border-chalk/15 bg-chalk/[0.03] px-2 py-1 text-chalk outline-none focus:border-signal/60"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex items-center gap-2 text-[0.75rem] text-chalk/65">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-[6px] border border-chalk/15 bg-chalk/[0.03] px-2 py-1 text-chalk outline-none focus:border-signal/60"
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o.replace(/_/g, ' ').toLowerCase()}
          </option>
        ))}
      </select>
    </label>
  );
}

function Chips({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[0.75rem] text-chalk/65">
      {label}
      {options.slice(0, 8).map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(on ? selected.filter((s) => s !== o) : [...selected, o])}
            className={`rounded-full border px-2.5 py-0.5 font-mono text-[0.5625rem] uppercase tracking-[0.1em] transition-colors ${
              on
                ? 'border-signal bg-signal/15 text-signal'
                : 'border-chalk/15 text-chalk/50 hover:border-chalk/30'
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
