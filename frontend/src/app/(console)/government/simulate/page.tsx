'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead } from '@/components/console/primitives';
import { RoleGate } from '@/components/auth/RoleGate';
import { CohortGrid } from '@/components/simulation/CohortGrid';
import { TrajectoryPlot, type Curve } from '@/components/simulation/TrajectoryPlot';
import { fetchApi } from '@/lib/api';

/**
 * Pilot simulation.
 *
 * Runs a synthetic pilot for every eligible company, thousands of times each,
 * across eighty-one parameter settings — and shows it happening. The run takes
 * three to five minutes, which is why nothing here is a modal: an officer can
 * leave, come back, and find it where they left it, because the state lives on
 * the run row rather than in this component.
 *
 * Every figure on this page is a count with its denominator. "1,842 of 3,400
 * runs" is a statement about the model that a reader can check; the percentage
 * it implies would read as a probability about a company, which nothing here
 * supports.
 */

interface RunState {
  id: string;
  status: string;
  phase: string;
  cohortSize: number;
  eligibleCount: number;
  companiesDone: number;
  passesDone: number;
  runsDone: number;
  perturbationPasses: number;
  runsPerCompany: number;
  simulatedDays: string;
  modelVersion: string;
  seed: number;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  disclaimer: string;
  challenge?: { title: string; targetMetric: string; targetValue: number | null };
  leaders: {
    id: string;
    rankPosition: number | null;
    runsMetTarget: number;
    runsTotal: number;
    medianAchieved: number | null;
    startup: { displayName: string | null; legalName: string };
  }[];
}

interface ResultRow {
  id: string;
  rankPosition: number | null;
  runsMetTarget: number;
  runsPartial: number;
  runsMissed: number;
  runsTotal: number;
  medianAchieved: number | null;
  p10: number | null;
  p90: number | null;
  medianCoverage: number | null;
  medianMobilisationDays: number | null;
  dominantCause: string | null;
  precondition: string | null;
  rankStability: number | null;
  trajectory: number[] | null;
  startup: { id: string; displayName: string | null; legalName: string; sector: string; city: string | null };
}

const PHASES = ['SCREENING', 'PARAMETERISING', 'TRAJECTORIES', 'SENSITIVITY', 'ATTRIBUTING'];

export default function SimulatePage() {
  return (
    <RoleGate roles={['GOVERNMENT_OFFICER', 'ADMIN']}>
      <Simulate />
    </RoleGate>
  );
}

function Simulate() {
  const search = useSearchParams();
  const challengeId = search.get('challenge');

  const [challenges, setChallenges] = useState<{ id: string; title: string; targetValue: number | null }[]>([]);
  const [selected, setSelected] = useState<string>(challengeId ?? '');
  const [run, setRun] = useState<RunState | null>(null);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [excluded, setExcluded] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const startedAt = useRef<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetchApi<{ id: string; title: string; targetValue: number | null }[]>(
      '/api/workflow/challenges/mine',
    )
      .then((cs) => {
        setChallenges(cs);
        if (!challengeId && cs.length > 0) setSelected(cs[0].id);
      })
      .catch(() => undefined);
  }, [challengeId]);

  const running = run?.status === 'RUNNING' || run?.status === 'QUEUED';

  /* Poll while a run is live. One second is fast enough that the grid moves,
     and slow enough that the polling does not compete with the work. */
  useEffect(() => {
    if (!run || !running) return;
    const t = setInterval(async () => {
      try {
        const fresh = await fetchApi<RunState>(`/api/simulation/runs/${run.id}`);
        setRun(fresh);
        setNow(Date.now());
        if (fresh.status === 'COMPLETE') void loadResults(fresh.id);
      } catch {
        /* A dropped poll is not a failed run. The next tick recovers. */
      }
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.id, running]);

  const loadResults = useCallback(async (runId: string) => {
    const r = await fetchApi<{ results: ResultRow[]; excludedCount: number }>(
      `/api/simulation/runs/${runId}/results?limit=60`,
    );
    setResults(r.results);
    setExcluded(r.excludedCount);
  }, []);

  const start = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    setResults(null);
    try {
      const created = await fetchApi<{ id: string }>('/api/simulation/runs', {
        method: 'POST',
        body: JSON.stringify({ challengeId: selected }),
      });
      startedAt.current = Date.now();
      setRun(await fetchApi<RunState>(`/api/simulation/runs/${created.id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The simulation could not be started.');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!run) return;
    try {
      await fetchApi(`/api/simulation/runs/${run.id}/cancel`, { method: 'POST' });
      setRun(await fetchApi<RunState>(`/api/simulation/runs/${run.id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel.');
    }
  };

  const totalPasses = run ? 1 + run.perturbationPasses : 1;
  // passesDone already counts the base pass, so the in-pass fraction belongs to
  // the pass currently running — adding it to a completed count would exceed 1.
  const progress = run
    ? Math.min(
        1,
        (Math.max(0, run.passesDone - 1) +
          (run.eligibleCount ? run.companiesDone / run.eligibleCount : 0)) /
          totalPasses,
      )
    : 0;

  const elapsed = run?.startedAt
    ? ((run.finishedAt ? new Date(run.finishedAt).getTime() : now) -
        new Date(run.startedAt).getTime()) /
      1000
    : 0;
  const eta = progress > 0.02 && running ? (elapsed / progress) * (1 - progress) : null;

  const curves: Curve[] = (results ?? [])
    .filter((r) => Array.isArray(r.trajectory) && r.trajectory.length > 0)
    .slice(0, 8)
    .map((r) => ({
      id: r.id,
      name: r.startup.displayName ?? r.startup.legalName,
      points: r.trajectory as number[],
      metTarget: r.runsMetTarget > r.runsTotal / 2,
    }));

  const target = run?.challenge?.targetValue != null ? 100 - run.challenge.targetValue : 80;

  return (
    <>
      <ConsoleHeader
        title="Pilot simulation"
        subtitle="Run a synthetic pilot across the whole cohort, and see who would deliver."
        source="demonstration"
      />

      {error && <p className="card border-risk/30 p-4 text-[0.8125rem] text-risk">{error}</p>}

      {!run && (
        <section aria-label="Start">
          <SectionHead title="Set it running" />
          <div className="card p-5">
            <p className="max-w-[70ch] text-[0.875rem] leading-relaxed text-chalk/65">
              Every eligible company is put through a full simulated pilot several thousand times,
              then the whole cohort is re-ranked under eighty different parameter settings to test
              whether the ranking survives being wrong. It takes three to five minutes, and you can
              leave the page while it runs.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                aria-label="Challenge"
                className="min-w-[18rem] rounded-[8px] border border-chalk/15 bg-transparent px-3 py-2 text-[0.8125rem] text-chalk focus:border-signal/50 focus:outline-none"
              >
                {challenges.length === 0 && <option value="">No challenges yet</option>}
                {challenges.map((c) => (
                  <option key={c.id} value={c.id} disabled={c.targetValue === null}>
                    {c.title}
                    {c.targetValue === null ? ' — no target set' : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={start}
                disabled={!selected || busy}
                className="rounded-[8px] bg-signal px-4 py-2.5 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-void transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {busy ? 'Starting…' : 'Run simulation'}
              </button>
            </div>
          </div>
        </section>
      )}

      {run && (
        <>
          <section aria-label="Progress">
            <SectionHead
              title={running ? 'Running' : run.status.toLowerCase()}
              meta={run.challenge?.title}
            />

            <div className="card p-5">
              {/* The phase rail: what the machine is doing, in order. */}
              <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                {PHASES.map((p) => {
                  const current = run.phase.startsWith(p);
                  const passed = PHASES.indexOf(p) < PHASES.findIndex((x) => run.phase.startsWith(x));
                  return (
                    <span
                      key={p}
                      className={`font-mono text-[0.5625rem] uppercase tracking-[0.12em] ${
                        current ? 'text-signal' : passed || !running ? 'text-chalk/45' : 'text-chalk/20'
                      }`}
                    >
                      {p.toLowerCase()}
                    </span>
                  );
                })}
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-chalk/10">
                <div
                  className="h-full rounded-full bg-signal transition-[width] duration-700 ease-linear"
                  style={{ width: `${(progress * 100).toFixed(1)}%` }}
                />
              </div>

              {/* The setting currently under test — the reason this takes minutes. */}
              {running && run.phase.includes('·') && (
                <p className="mt-2.5 font-mono text-[0.625rem] text-chalk/50">
                  testing {run.phase.split('·')[1]?.trim()}
                </p>
              )}

              <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-chalk/[0.08] pt-4 sm:grid-cols-3 lg:grid-cols-6">
                <Stat label="Progress" value={`${(progress * 100).toFixed(0)}%`} />
                <Stat label="Settings" value={`${run.passesDone}/${totalPasses}`} />
                <Stat label="Cohort" value={`${run.eligibleCount}/${run.cohortSize}`} context="eligible" />
                <Stat label="Runs" value={run.runsDone.toLocaleString()} context="simulated pilots" />
                <Stat
                  label="Simulated"
                  value={`${(Number(run.simulatedDays) / 1e6).toFixed(1)}M`}
                  context="pilot-days"
                />
                <Stat
                  label="Elapsed"
                  value={`${Math.floor(elapsed / 60)}m ${String(Math.floor(elapsed % 60)).padStart(2, '0')}s`}
                  context={eta ? `~${Math.ceil(eta / 60)}m left` : undefined}
                />
              </dl>

              {run.error && (
                <p className="mt-4 border-l-2 border-risk/40 pl-3 text-[0.8125rem] text-risk">
                  {run.error}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {running ? (
                  <button
                    type="button"
                    onClick={cancel}
                    className="rounded-[8px] border border-chalk/20 px-3.5 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-chalk/70 transition-colors hover:border-risk/40"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setRun(null);
                      setResults(null);
                    }}
                    className="rounded-[8px] border border-chalk/20 px-3.5 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-chalk transition-colors hover:border-signal/50"
                  >
                    Run another
                  </button>
                )}
                <span className="font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-chalk/35">
                  {run.modelVersion} · seed {run.seed} · {run.runsPerCompany.toLocaleString()} runs per company
                </span>
              </div>
            </div>
          </section>

          <div className="grid gap-3 lg:grid-cols-2">
            <CohortGrid
              cohortSize={run.cohortSize}
              eligibleCount={run.eligibleCount}
              companiesDone={run.companiesDone}
              running={!!running}
            />
            <TrajectoryPlot
              curves={curves}
              baseline={100}
              target={target}
              durationDays={curves[0]?.points.length ?? 90}
            />
          </div>

          {/* The live leaderboard exists during the run; the full table replaces
              it once every setting has been tested. */}
          {running && run.leaders.length > 0 && (
            <section aria-label="Leading">
              <SectionHead title="Leading so far" meta="base pass" />
              <div className="card p-0">
                <ul>
                  {run.leaders.map((l, i) => (
                    <li
                      key={l.id}
                      className={`flex items-center gap-4 px-5 py-3 ${i > 0 ? 'border-t border-chalk/[0.06]' : ''}`}
                    >
                      <span className="w-6 font-mono text-[0.6875rem] text-chalk/35">
                        {l.rankPosition}
                      </span>
                      <span className="flex-1 text-[0.875rem] text-chalk/85">
                        {l.startup.displayName ?? l.startup.legalName}
                      </span>
                      <span className="font-mono text-[0.75rem] text-signal">
                        {l.runsMetTarget}/{l.runsTotal}
                      </span>
                      <span className="w-16 text-right font-mono text-[0.75rem] text-chalk/60">
                        {l.medianAchieved?.toFixed(1)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {results && results.length > 0 && (
            <section aria-label="Results">
              <SectionHead
                title="Ranked"
                meta={`${results.length} shown · ${excluded} screened out`}
              />
              <div className="card overflow-x-auto p-0">
                <table className="w-full min-w-[54rem] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-chalk/[0.08]">
                      {['#', 'Company', 'Met target', 'Median', 'p10–p90', 'Rank held', 'Limiting factor'].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-4 py-2.5 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-chalk/40"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.id} className="border-b border-chalk/[0.05] last:border-0">
                        <td className="px-4 py-3 font-mono text-[0.6875rem] text-chalk/35">
                          {r.rankPosition}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/startups/${r.startup.id}`}
                            className="text-[0.8125rem] text-chalk hover:text-signal"
                          >
                            {r.startup.displayName ?? r.startup.legalName}
                          </Link>
                          <span className="ml-2 text-[0.6875rem] text-chalk/35">
                            {r.startup.city ?? r.startup.sector}
                          </span>
                        </td>
                        {/* Count first, denominator always attached. */}
                        <td className="px-4 py-3 font-mono text-[0.75rem] text-signal">
                          {r.runsMetTarget.toLocaleString()}
                          <span className="text-chalk/35">/{r.runsTotal.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[0.75rem] text-chalk/75">
                          {r.medianAchieved?.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 font-mono text-[0.6875rem] text-chalk/45">
                          {r.p10?.toFixed(1)}–{r.p90?.toFixed(1)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-mono text-[0.6875rem] ${
                              (r.rankStability ?? 0) >= 0.8
                                ? 'text-validated'
                                : (r.rankStability ?? 0) >= 0.5
                                  ? 'text-chalk/60'
                                  : 'text-risk'
                            }`}
                          >
                            {Math.round((r.rankStability ?? 0) * (totalPasses - 1))}/{totalPasses - 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-chalk/55">
                            {r.dominantCause?.replace(/_/g, ' ').toLowerCase() ?? '—'}
                          </span>
                          {r.precondition && (
                            <p className="mt-1 max-w-[42ch] text-[0.6875rem] leading-relaxed text-chalk/40">
                              {r.precondition}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-3 max-w-[80ch] text-[0.75rem] leading-relaxed text-chalk/40">
                <strong className="text-chalk/60">Rank held</strong> counts how many of the{' '}
                {totalPasses - 1} alternative parameter settings left this company within two places
                of its position here. A company that holds its rank across nearly all of them is
                ranked on something robust; one that moves is ranked on an assumption.
              </p>
              <p className="mt-2 max-w-[80ch] text-[0.75rem] leading-relaxed text-chalk/40">
                {run.disclaimer}
              </p>
            </section>
          )}
        </>
      )}
    </>
  );
}

function Stat({ label, value, context }: { label: string; value: string; context?: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-chalk/35">{label}</dt>
      <dd className="mt-1 font-display text-[1.0625rem] font-bold leading-none text-chalk">{value}</dd>
      {context && <p className="mt-1 truncate text-[0.625rem] text-chalk/40">{context}</p>}
    </div>
  );
}
