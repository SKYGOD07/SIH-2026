'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead } from '@/components/console/primitives';
import { RoleGate } from '@/components/auth/RoleGate';
import { fetchApi } from '@/lib/api';

/**
 * One challenge, as the department reviews it.
 *
 * This is the page the decision queue points at, and until now it did not
 * exist — every "Review" button on the dashboard reached a 404, which made the
 * queue look like a list of dead links rather than the entry to the pathway.
 *
 * It answers, in order: what did we ask for, who answered, and how do they
 * compare. Selection lives at the bottom because it is the last thing an
 * officer should do, not the first thing they see.
 *
 * Every score shown is read from `StartupMatch`, computed server-side by the
 * deterministic engine. Nothing is recomputed here: a second implementation of
 * scoring in the browser is a second answer to the same question, and the two
 * would eventually disagree in front of somebody.
 */

interface Startup {
  id: string;
  legalName: string;
  displayName: string | null;
  oneLineDescription: string | null;
  sector: string;
  city: string | null;
}

interface MatchRow {
  id: string;
  startupId: string;
  startup: Startup;
  overallScore: number;
  problemFitScore: number;
  technicalFitScore: number;
  deploymentReadinessScore: number;
  governmentExperienceScore: number;
  evidenceStrengthScore: number;
  pilotReadinessScore: number;
  rationale: string;
  status: string;
  breakdown?: { strengths?: string[]; limitations?: string[]; disclaimer?: string };
  evaluations?: { id: string; recommendation: string }[];
}

interface ResponseRow {
  id: string;
  startupId: string;
  startup: Startup;
  solutionSummary: string;
  expectedResult: string;
  status: string;
}

interface ChallengeDetail {
  id: string;
  title: string;
  department: string;
  problemStatement: string;
  domain: string;
  technologies: string[];
  targetMetric: string;
  targetValue: number | null;
  pilotDurationDays: number | null;
  status: string;
  origin: string;
  demoScenario: string | null;
  responses: ResponseRow[];
  matches: MatchRow[];
  pilots: { id: string; status: string; startupId: string }[];
}

const AXES: { key: keyof MatchRow; label: string }[] = [
  { key: 'problemFitScore', label: 'Problem fit' },
  { key: 'technicalFitScore', label: 'Technical fit' },
  { key: 'deploymentReadinessScore', label: 'Deployment' },
  { key: 'governmentExperienceScore', label: 'Govt experience' },
  { key: 'evidenceStrengthScore', label: 'Evidence' },
  { key: 'pilotReadinessScore', label: 'Pilot readiness' },
];

type Sort = 'overall' | 'problemFitScore' | 'pilotReadinessScore' | 'evidenceStrengthScore' | 'governmentExperienceScore';

export default function ChallengeReviewPage() {
  return (
    <RoleGate roles={['GOVERNMENT_OFFICER', 'ADMIN']}>
      <ChallengeReview />
    </RoleGate>
  );
}

function ChallengeReview() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ChallengeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sort, setSort] = useState<Sort>('overall');
  const [view, setView] = useState<'list' | 'comparison'>('list');

  const load = useCallback(async () => {
    try {
      setData(await fetchApi<ChallengeDetail>(`/api/workflow/challenges/${params.id}/review`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this challenge.');
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function generateMatches() {
    setBusy(true);
    setError(null);
    try {
      await fetchApi(`/api/workflow/challenges/${params.id}/matches`, { method: 'POST' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Matching failed.');
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <>
        <ConsoleHeader title="Challenge" subtitle="Could not be loaded." source="demonstration" />
        <div className="card p-5">
          <p className="text-[0.875rem] text-risk">{error}</p>
          <Link href="/government" className="mt-4 inline-block text-signal hover:underline">
            ← Back to the decision queue
          </Link>
        </div>
      </>
    );
  }

  if (!data) {
    return <ConsoleHeader title="Challenge" subtitle="Loading…" source="demonstration" />;
  }

  const matches = [...(data.matches ?? [])].sort((a, b) =>
    sort === 'overall'
      ? b.overallScore - a.overallScore
      : (b[sort] as number) - (a[sort] as number),
  );
  const selected = matches.find((m) => m.status === 'SELECTED');

  return (
    <>
      <ConsoleHeader
        title={data.title}
        subtitle={`${data.department} · ${data.status.replace(/_/g, ' ').toLowerCase()}`}
        source="demonstration"
      />

      {/* --- what was asked for ----------------------------------------- */}
      <section aria-label="The problem">
        <SectionHead title="The problem" />
        <div className="card p-5">
          <p className="mt-2.5 max-w-[70ch] text-[0.9375rem] leading-relaxed text-chalk/75">
            {data.problemStatement}
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-chalk/[0.08] pt-4 sm:grid-cols-4">
            <Fact label="Field" value={data.domain} />
            <Fact
              label="Target"
              value={data.targetValue !== null ? `${data.targetValue} · ${data.targetMetric}` : data.targetMetric}
            />
            <Fact label="Pilot length" value={data.pilotDurationDays ? `${data.pilotDurationDays} days` : '—'} />
            <Fact label="Responses" value={String(data.responses?.length ?? 0)} />
          </dl>
        </div>
      </section>

      {/* --- who answered ------------------------------------------------ */}
      <section aria-label="Responses">
        <SectionHead title="Responses" meta={`${data.responses?.length ?? 0} received`} />
        {(data.responses?.length ?? 0) === 0 ? (
          <Empty>
            No startup has answered yet. Responses appear here as they are submitted, and matching
            can be run once at least one exists.
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {data.responses.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-[1rem] font-bold text-chalk">
                    {r.startup.displayName ?? r.startup.legalName}
                  </p>
                  <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/40">
                    {r.status.toLowerCase()}
                  </span>
                </div>
                <p className="mt-2 max-w-[70ch] text-[0.8125rem] leading-relaxed text-chalk/60">
                  {r.solutionSummary}
                </p>
                <p className="mt-2 text-[0.75rem] leading-relaxed text-chalk/45">
                  Expected result: {r.expectedResult}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- how they compare -------------------------------------------- */}
      <section aria-label="Matches">
        <SectionHead
          title="AI-assisted recommendation"
          meta={matches.length ? `${matches.length} scored` : undefined}
        />

        {matches.length === 0 ? (
          <Empty>
            No recommendation has been generated for this challenge yet.
            {(data.responses?.length ?? 0) > 0 && (
              <button
                type="button"
                onClick={generateMatches}
                disabled={busy}
                className="mt-4 block rounded-[8px] bg-signal px-4 py-2.5 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-void transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {busy ? 'Scoring…' : 'Generate recommendation'}
              </button>
            )}
          </Empty>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <label className="flex items-center gap-2 text-[0.75rem] text-chalk/60">
                Sort by
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="rounded-[6px] border border-chalk/15 bg-chalk/[0.03] px-2 py-1 text-chalk outline-none focus:border-signal/60"
                >
                  <option value="overall">Overall match</option>
                  <option value="problemFitScore">Problem fit</option>
                  <option value="pilotReadinessScore">Pilot readiness</option>
                  <option value="evidenceStrengthScore">Evidence strength</option>
                  <option value="governmentExperienceScore">Government experience</option>
                </select>
              </label>

              <div className="flex gap-1">
                {(['list', 'comparison'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    className={`rounded-full border px-3 py-1 font-mono text-[0.5625rem] uppercase tracking-[0.12em] transition-colors ${
                      view === v
                        ? 'border-signal bg-signal/15 text-signal'
                        : 'border-chalk/15 text-chalk/50 hover:border-chalk/30'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={generateMatches}
                disabled={busy}
                className="ml-auto font-mono text-[0.625rem] uppercase tracking-[0.12em] text-chalk/45 hover:text-signal disabled:opacity-40"
              >
                {busy ? 'Scoring…' : 'Re-run scoring'}
              </button>
            </div>

            {view === 'list' ? (
              <div className="flex flex-col gap-3">
                {matches.map((m, i) => (
                  <MatchCard key={m.id} match={m} rank={i + 1} />
                ))}
              </div>
            ) : (
              <ComparisonTable matches={matches} />
            )}

            <p className="mt-4 max-w-[74ch] text-[0.75rem] leading-relaxed text-chalk/40">
              An AI-assisted recommendation computed from declared capabilities and recorded
              history. It is not a government decision and not an assessment of any company.
              Selection is made by a person.
            </p>
          </>
        )}
      </section>

      {selected && (
        <div className="card border-signal/30 p-5">
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal">
            Selected for pilot
          </span>
          <p className="mt-2 font-display text-[1.0625rem] font-bold text-chalk">
            {selected.startup.displayName ?? selected.startup.legalName}
          </p>
          <p className="mt-1.5 text-[0.8125rem] text-chalk/55">
            Selected by a government user. {data.pilots?.length ? 'A pilot exists for this challenge.' : 'No pilot has been created yet.'}
          </p>
        </div>
      )}

      <Link href="/government" className="mt-2 self-start font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-chalk/50 hover:text-signal">
        ← Decision queue
      </Link>
    </>
  );
}

function MatchCard({ match, rank }: { match: MatchRow; rank: number }) {
  const bd = match.breakdown ?? {};
  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-chalk/35">
              {String(rank).padStart(2, '0')}
            </span>
            <p className="font-display text-[1.0625rem] font-bold leading-tight text-chalk">
              {match.startup.displayName ?? match.startup.legalName}
            </p>
            {match.status !== 'SUGGESTED' && (
              <span className="rounded-full border border-chalk/20 px-2 py-0.5 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-chalk/50">
                {match.status.toLowerCase()}
              </span>
            )}
          </div>
          {match.startup.oneLineDescription && (
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-chalk/55">
              {match.startup.oneLineDescription}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-[1.75rem] font-black leading-none text-chalk">
            {(match.overallScore * 100).toFixed(0)}
          </div>
          <div className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-chalk/35">overall</div>
        </div>
      </div>

      {/* Per-axis bars. A number an officer cannot take apart is a number they
          cannot justify, so every axis is shown, not just the total. */}
      <div className="mt-4 grid gap-2.5 border-t border-chalk/[0.08] pt-4 sm:grid-cols-2">
        {AXES.map((a) => {
          const v = (match[a.key] as number) ?? 0;
          return (
            <div key={a.key} className="flex items-center gap-2.5">
              <span className="w-[7.5rem] shrink-0 font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-chalk/40">
                {a.label}
              </span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-chalk/10">
                <div className="h-full bg-signal" style={{ width: `${v * 100}%` }} />
              </div>
              <span className="w-7 shrink-0 text-right font-mono text-[0.625rem] text-chalk/55">
                {(v * 100).toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>

      {(bd.strengths?.length || bd.limitations?.length) && (
        <div className="mt-4 grid gap-3 border-t border-chalk/[0.08] pt-4 sm:grid-cols-2">
          <div>
            <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/40">
              Why this startup
            </p>
            <ul className="mt-1.5 space-y-1">
              {(bd.strengths ?? ['No axis scored strongly.']).slice(0, 3).map((s) => (
                <li key={s} className="text-[0.75rem] leading-relaxed text-chalk/60">• {s}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-risk/70">
              Limitations
            </p>
            <ul className="mt-1.5 space-y-1">
              {(bd.limitations ?? ['None recorded.']).slice(0, 3).map((s) => (
                <li key={s} className="text-[0.75rem] leading-relaxed text-chalk/60">• {s}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-chalk/[0.08] pt-3.5">
        <span className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-chalk/35">
          {match.evaluations?.length ? `${match.evaluations.length} evaluation(s)` : 'Not yet evaluated'}
        </span>
        <Link
          href={`/startups/${match.startupId}`}
          className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-signal hover:underline"
        >
          Open dossier ↗
        </Link>
      </div>
    </article>
  );
}

function ComparisonTable({ matches }: { matches: MatchRow[] }) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[46rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-chalk/[0.08]">
            <th className="px-4 py-3 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/40">
              Company
            </th>
            {AXES.map((a) => (
              <th
                key={a.key}
                className="px-3 py-3 text-right font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-chalk/40"
              >
                {a.label}
              </th>
            ))}
            <th className="px-4 py-3 text-right font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-signal">
              Overall
            </th>
          </tr>
        </thead>
        <tbody>
          {matches.map((m) => (
            <tr key={m.id} className="border-b border-chalk/[0.05] last:border-0">
              <td className="px-4 py-3 text-[0.8125rem] text-chalk">
                {m.startup.displayName ?? m.startup.legalName}
              </td>
              {AXES.map((a) => {
                const v = ((m[a.key] as number) ?? 0) * 100;
                return (
                  <td key={a.key} className="px-3 py-3 text-right font-mono text-[0.75rem] text-chalk/65">
                    {v.toFixed(0)}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-right font-display text-[0.9375rem] font-bold text-chalk">
                {(m.overallScore * 100).toFixed(0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-chalk/35">{label}</dt>
      <dd className="mt-1 text-[0.8125rem] text-chalk/75">{value}</dd>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <p className="max-w-[62ch] text-[0.8125rem] leading-relaxed text-chalk/55">{children}</p>
    </div>
  );
}
