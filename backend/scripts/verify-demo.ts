/**
 * Does the demonstration dataset actually hold up?
 *
 *   npm run demo:verify
 *
 * Written because "the generator ran without an error" and "the dataset is
 * usable" are different claims, and only the second one matters. A generator
 * can insert five hundred rows and still leave a filter that cannot change a
 * result, a field holding four fifths of the population, or a team-owned company
 * quietly duplicated.
 *
 * Every check below is a query. Nothing is asserted from what a script printed
 * on the way past.
 *
 * Two classes of finding:
 *
 *   FAIL   the dataset is wrong, or a filter is decoration. Exits non-zero.
 *   WARN   worth knowing, not blocking.
 *
 * The filter checks are the point of the file. A filter is only real if the
 * column behind it exists, holds more than one value, and *splits* the
 * population — a control where 99% of rows answer the same way looks like it
 * works and never changes a result, which is worse than not shipping it.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEAM_COMPANIES = ['CIVORA', 'HIX', 'Crop Saver', 'WaterManager', 'EnviroPlus'];
const MIN_COMPANIES = 500;
const MIN_FIELDS = 20;
const MAX_FIELDS = 25;

type Result = { ok: boolean; warn?: boolean; label: string; detail: string };
const results: Result[] = [];

const pass = (label: string, detail: string) => results.push({ ok: true, label, detail });
const fail = (label: string, detail: string) => results.push({ ok: false, label, detail });
const warn = (label: string, detail: string) => results.push({ ok: false, warn: true, label, detail });

const pct = (n: number, of: number) => (of === 0 ? '0%' : `${((n / of) * 100).toFixed(1)}%`);

/**
 * Is a filter worth putting on screen?
 *
 * `coverage` — the share of companies that have a value at all. A filter over a
 * mostly-null column silently deletes the rows it cannot read.
 * `largest`  — the share held by the single most common value. Past ~90% the
 * control cannot meaningfully narrow anything.
 */
function judgeFilter(
  label: string,
  buckets: [string, number][],
  total: number,
  opts: { minDistinct?: number; maxShare?: number; minCoverage?: number } = {},
) {
  const { minDistinct = 2, maxShare = 0.9, minCoverage = 0.9 } = opts;
  const named = buckets.filter(([k]) => k !== '(none)');
  const covered = named.reduce((n, [, v]) => n + v, 0);
  const largest = named.length ? Math.max(...named.map(([, v]) => v)) : 0;
  const top = named.sort((a, b) => b[1] - a[1])[0];

  const shape = `${named.length} values · largest "${top?.[0] ?? '—'}" ${pct(largest, total)} · coverage ${pct(covered, total)}`;

  if (named.length < minDistinct) return fail(label, `only ${named.length} distinct value(s) — the control cannot narrow anything. ${shape}`);
  if (covered / total < minCoverage) return fail(label, `only ${pct(covered, total)} of companies have a value — the filter would drop the rest. ${shape}`);
  if (largest / total > maxShare) return fail(label, `"${top[0]}" holds ${pct(largest, total)} of the population — the filter is decoration. ${shape}`);
  return pass(label, shape);
}

function tally<T>(rows: T[], key: (r: T) => string | null | undefined): [string, number][] {
  const m = new Map<string, number>();
  rows.forEach((r) => {
    const k = key(r);
    const label = k === null || k === undefined || k === '' ? '(none)' : String(k);
    m.set(label, (m.get(label) ?? 0) + 1);
  });
  return [...m].sort((a, b) => b[1] - a[1]);
}

/* ------------------------------------------------------------------ */

async function main() {
  /* --- population -------------------------------------------------- */

  const startups = await prisma.startup.findMany({
    select: {
      id: true, legalName: true, displayName: true, sector: true, industry: true,
      stage: true, state: true, city: true, teamSize: true, deploymentCount: true,
      technologies: true, capabilities: true, procurementReadiness: true,
      cybersecurityStatus: true, complianceStatus: true, dataPrivacyStatus: true,
      pilotDurationDays: true, estimatedPilotBudget: true, origin: true, scenarioId: true,
    },
  });
  const total = startups.length;

  total >= MIN_COMPANIES
    ? pass('population', `${total} companies (target ${MIN_COMPANIES}+)`)
    : fail('population', `${total} companies — below the ${MIN_COMPANIES} needed for discovery to behave like the real thing`);

  /* --- provenance -------------------------------------------------- */

  const byOrigin = tally(startups, (s) => s.origin);
  const verified = startups.filter((s) => s.origin === 'VERIFIED').length;
  verified === 0
    ? pass('no VERIFIED rows', 'no synthetic company claims an externally sourced fact')
    : fail('no VERIFIED rows', `${verified} companies are marked VERIFIED — verification requires a cited EvidenceSource`);

  const nonDemo = startups.filter((s) => s.origin !== 'DEMO').length;
  nonDemo === 0
    ? pass('origin = DEMO', `all ${total} companies carry DEMO provenance`)
    : warn('origin = DEMO', `${nonDemo} companies are not DEMO (${byOrigin.map(([k, v]) => `${k}=${v}`).join(', ')})`);

  const scenarios = await prisma.simulationScenario.findMany({ select: { id: true, name: true } });
  const orphaned = startups.filter((s) => !s.scenarioId).length;
  orphaned === 0
    ? pass('scenario attachment', `every company belongs to one of ${scenarios.length} simulation workspaces`)
    : fail(
        'scenario attachment',
        `${orphaned} companies have no scenarioId — they cannot be removed at the workspace boundary and would survive a scenario delete`,
      );

  /* --- identity ---------------------------------------------------- */

  const dupLegal = tally(startups, (s) => s.legalName).filter(([, n]) => n > 1);
  const dupDisplay = tally(startups, (s) => s.displayName).filter(([k, n]) => n > 1 && k !== '(none)');

  dupLegal.length === 0
    ? pass('no duplicate legal names', `${total} distinct registered names`)
    : fail('no duplicate legal names', `${dupLegal.length} repeated: ${dupLegal.slice(0, 5).map(([k, n]) => `${k} x${n}`).join(', ')}`);

  dupDisplay.length === 0
    ? pass('no duplicate display names', 'every company is distinguishable on screen')
    : fail('no duplicate display names', `${dupDisplay.length} repeated: ${dupDisplay.slice(0, 5).map(([k, n]) => `${k} x${n}`).join(', ')}`);

  /* --- fields ------------------------------------------------------ */

  const sectors = tally(startups, (s) => s.sector);
  sectors.length >= MIN_FIELDS && sectors.length <= MAX_FIELDS
    ? pass('field coverage', `${sectors.length} innovation fields (target ${MIN_FIELDS}–${MAX_FIELDS})`)
    : sectors.length > MAX_FIELDS
      ? warn('field coverage', `${sectors.length} fields — above the ${MAX_FIELDS} the taxonomy plans for`)
      : fail('field coverage', `${sectors.length} fields — below ${MIN_FIELDS}`);

  const biggest = sectors[0];
  biggest[1] / total <= 0.25
    ? pass('field distribution', `largest field "${biggest[0]}" holds ${pct(biggest[1], total)}; smallest ${sectors[sectors.length - 1][1]}`)
    : fail('field distribution', `"${biggest[0]}" holds ${pct(biggest[1], total)} of the population — the dataset is lopsided`);

  /* --- the team-owned companies ------------------------------------ */

  for (const name of TEAM_COMPANIES) {
    const found = startups.filter((s) => s.displayName === name);
    if (found.length === 0) {
      fail(`team company: ${name}`, 'missing');
      continue;
    }
    if (found.length > 1) {
      fail(`team company: ${name}`, `duplicated ${found.length} times`);
      continue;
    }
    const counts = await prisma.startup.findUnique({
      where: { id: found[0].id },
      select: { _count: { select: { documents: true, responses: true, matches: true, pilots: true, fundingRounds: true, participations: true } } },
    });
    const c = counts!._count;
    pass(
      `team company: ${name}`,
      `intact · ${c.documents} documents, ${c.responses} responses, ${c.matches} matches, ${c.pilots} pilots, ${c.fundingRounds} rounds, ${c.participations} participations`,
    );
  }

  // Their document packs must not have been duplicated by a re-run.
  const teamIds = startups.filter((s) => TEAM_COMPANIES.includes(s.displayName ?? '')).map((s) => s.id);
  const teamDocs = await prisma.startupDocument.findMany({
    where: { startupId: { in: teamIds } },
    select: { startupId: true, documentId: true, document: { select: { title: true, originalPath: true } } },
  });
  const dupTeamDocs = tally(teamDocs, (d) => `${d.startupId}|${d.document.title}`).filter(([, n]) => n > 1);
  const syntheticOnTeam = teamDocs.filter((d) => d.document.originalPath?.startsWith('demo://dossier/')).length;

  dupTeamDocs.length === 0
    ? pass('team document packs', `${teamDocs.length} imported documents, none duplicated`)
    : fail('team document packs', `${dupTeamDocs.length} duplicated document title(s) across the team companies`);

  syntheticOnTeam === 0
    ? pass('team packs unpolluted', 'no generated placeholder document was attached to a team-owned company')
    : fail('team packs unpolluted', `${syntheticOnTeam} generated placeholder documents are attached to team-owned companies`);

  /* --- the fifteen filters ----------------------------------------- */

  const derived = await prisma.$queryRawUnsafe<
    {
      startup_id: string; evidence_completeness: number; government_experience: string;
      funding_stage: string; funding_band: string; document_count: bigint; participation_count: bigint;
    }[]
  >(`SELECT startup_id, evidence_completeness, government_experience, funding_stage, funding_band,
            document_count, participation_count
       FROM startup_derived_metrics`);

  derived.length === total
    ? pass('derived metrics view', `startup_derived_metrics covers all ${total} companies`)
    : fail('derived metrics view', `view returns ${derived.length} rows for ${total} companies`);

  const READINESS = ['NOT_ASSESSED', 'LOW', 'MODERATE', 'HIGH'];

  //  1 field / sector
  judgeFilter('filter 01 · field', sectors, total, { minDistinct: MIN_FIELDS, maxShare: 0.25 });
  //  2 industry
  judgeFilter('filter 02 · industry', tally(startups, (s) => s.industry), total, { minDistinct: 8, maxShare: 0.2 });
  //  3 state
  judgeFilter('filter 03 · state', tally(startups, (s) => s.state), total, { minDistinct: 4, maxShare: 0.8 });
  //  4 city
  judgeFilter('filter 04 · city', tally(startups, (s) => s.city), total, { minDistinct: 8, maxShare: 0.3 });
  //  5 stage
  judgeFilter('filter 05 · stage', tally(startups, (s) => s.stage), total, { minDistinct: 4, maxShare: 0.5 });
  //  6 technology
  const techTally = tally(startups.flatMap((s) => s.technologies.map((t) => ({ t }))), (x) => x.t);
  judgeFilter('filter 06 · technology', techTally, total, { minDistinct: 8, maxShare: 0.9 });
  //  7 pilot readiness
  judgeFilter('filter 07 · pilot readiness', tally(startups, (s) => s.procurementReadiness), total, { minDistinct: 3, maxShare: 0.6 });
  //  8 government experience
  judgeFilter('filter 08 · government experience', tally(derived, (d) => d.government_experience), total, { minDistinct: 3, maxShare: 0.8 });
  //  9 evidence completeness
  const evidenceBands = tally(derived, (d) =>
    d.evidence_completeness >= 80 ? '80-100' : d.evidence_completeness >= 60 ? '60-79' : d.evidence_completeness >= 40 ? '40-59' : d.evidence_completeness >= 20 ? '20-39' : '0-19',
  );
  judgeFilter('filter 09 · evidence completeness', evidenceBands, total, { minDistinct: 3, maxShare: 0.7 });
  // 10 deployments
  const deployBands = tally(startups, (s) => {
    const d = s.deploymentCount;
    return d === null ? null : d === 0 ? '0' : d <= 2 ? '1-2' : d <= 6 ? '3-6' : d <= 14 ? '7-14' : d <= 29 ? '15-29' : '30+';
  });
  judgeFilter('filter 10 · deployments', deployBands, total, { minDistinct: 4, maxShare: 0.5 });
  // 11 team size
  const teamBands = tally(startups, (s) => {
    const t = s.teamSize;
    return t === null ? null : t <= 5 ? '1-5' : t <= 15 ? '6-15' : t <= 40 ? '16-40' : t <= 100 ? '41-100' : '100+';
  });
  judgeFilter('filter 11 · team size', teamBands, total, { minDistinct: 3, maxShare: 0.6 });
  // 12 funding stage
  judgeFilter('filter 12 · funding stage', tally(derived, (d) => d.funding_stage), total, { minDistinct: 3, maxShare: 0.7 });
  // 13 funding band
  judgeFilter('filter 13 · funding band', tally(derived, (d) => d.funding_band), total, { minDistinct: 3, maxShare: 0.7 });
  // 14 pilot duration
  judgeFilter('filter 14 · pilot duration', tally(startups, (s) => (s.pilotDurationDays === null ? null : `${s.pilotDurationDays}d`)), total, { minDistinct: 4, maxShare: 0.5 });
  // 15 pilot budget
  const budgetBands = tally(startups, (s) => {
    if (s.estimatedPilotBudget === null) return null;
    const v = Number(s.estimatedPilotBudget);
    return v < 1_000_000 ? '<10L' : v < 2_500_000 ? '10-25L' : v < 5_000_000 ? '25-50L' : '50L+';
  });
  judgeFilter('filter 15 · pilot budget', budgetBands, total, { minDistinct: 3, maxShare: 0.6 });

  /* --- do the filters actually compose? ---------------------------- */

  /*
   * One realistic funnel, run as real queries. The point is not the numbers but
   * that each stage is strictly smaller and none of them collapses to zero: a
   * filter set that reaches nothing on a plausible search is a filter set no
   * officer will use twice.
   */
  const funnelField = sectors[0][0];
  const step1 = await prisma.startup.count();
  const step2 = await prisma.startup.count({ where: { sector: funnelField } });
  const step3 = await prisma.startup.count({
    where: { sector: funnelField, procurementReadiness: { in: ['MODERATE', 'HIGH'] } },
  });
  const step4 = await prisma.startup.count({
    where: {
      sector: funnelField,
      procurementReadiness: { in: ['MODERATE', 'HIGH'] },
      deploymentCount: { gte: 3 },
      state: 'Maharashtra',
    },
  });
  const readyIds = new Set(
    derived.filter((d) => d.evidence_completeness >= 50 && d.government_experience !== 'NONE').map((d) => d.startup_id),
  );
  const step5 = (
    await prisma.startup.findMany({
      where: {
        sector: funnelField,
        procurementReadiness: { in: ['MODERATE', 'HIGH'] },
        deploymentCount: { gte: 3 },
        state: 'Maharashtra',
      },
      select: { id: true },
    })
  ).filter((s) => readyIds.has(s.id)).length;

  const funnel = `${step1} → ${step2} (${funnelField}) → ${step3} (readiness) → ${step4} (deployments + state) → ${step5} (evidence + govt experience)`;
  step5 > 0 && step2 > step5
    ? pass('filters compose', funnel)
    : fail('filters compose', `a plausible five-filter search reaches ${step5} companies — ${funnel}`);

  /* --- related-row coverage ---------------------------------------- */

  const withDocs = derived.filter((d) => Number(d.document_count) > 0).length;
  const withParts = derived.filter((d) => Number(d.participation_count) > 0).length;
  const fundingRounds = await prisma.fundingRound.count();
  const programs = await prisma.governmentProgram.count();

  pass('related rows', `${withDocs} companies with documents · ${withParts} with programme participation · ${fundingRounds} funding rounds · ${programs} simulated programmes`);

  const noEvidenceAtAll = derived.filter(
    (d) => Number(d.document_count) === 0 && Number(d.participation_count) === 0,
  ).length;
  noEvidenceAtAll / total < 0.5
    ? pass('evidence coverage', `${pct(total - noEvidenceAtAll, total)} of companies hold at least one document or participation`)
    : warn('evidence coverage', `${pct(noEvidenceAtAll, total)} of companies hold no document and no participation — evidence filters will be blunt`);

  /* --- provenance of the generated evidence ------------------------ */

  const badDocs = await prisma.document.count({
    where: { originalPath: { startsWith: 'demo://dossier/' }, origin: { not: 'DEMO' } },
  });
  const quotable = await prisma.document.count({
    where: { originalPath: { startsWith: 'demo://dossier/' }, extractedText: { not: null } },
  });
  badDocs === 0 && quotable === 0
    ? pass('generated evidence provenance', 'every placeholder document is DEMO and carries no quotable text')
    : fail('generated evidence provenance', `${badDocs} non-DEMO placeholder(s), ${quotable} carrying extractable text that retrieval could quote`);

  const realProgramNames = await prisma.governmentProgram.findMany({
    where: { origin: 'DEMO', NOT: { name: { startsWith: 'Simulated' } } },
    select: { code: true, name: true },
  });
  realProgramNames.length === 0
    ? pass('programme naming', 'no DEMO participation cites a real-world programme name')
    : warn('programme naming', `DEMO programmes not marked as simulated: ${realProgramNames.map((p) => p.name).join(', ')}`);

  /* --- report ------------------------------------------------------ */

  const width = Math.max(...results.map((r) => r.label.length));
  console.log('\nSarthi demonstration dataset — verification\n');
  results.forEach((r) => {
    const mark = r.ok ? 'PASS' : r.warn ? 'WARN' : 'FAIL';
    console.log(`  ${mark}  ${r.label.padEnd(width)}  ${r.detail}`);
  });

  const failures = results.filter((r) => !r.ok && !r.warn).length;
  const warnings = results.filter((r) => r.warn).length;
  console.log(`\n  ${results.length - failures - warnings} passed · ${warnings} warnings · ${failures} failures\n`);
  console.log('  500+ synthetic startups in the Sarthi demonstration dataset.');
  console.log('  Demonstration taxonomy based on public-sector innovation domains.');
  console.log('  Not government funding history, and no company in it exists.\n');

  if (failures > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error('\nFAILED', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
