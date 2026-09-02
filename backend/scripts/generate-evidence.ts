/**
 * Evidence for the synthetic demonstration population.
 *
 *   npm run demo:generate-evidence
 *
 * `generate-companies.ts` builds company records. This builds the *related
 * rows* those companies are judged by — programme participation, funding
 * disclosure and the document dossier — because four of the discovery filters
 * read nothing else:
 *
 *   Government experience   startup_program_participations, pilots
 *   Evidence completeness   startup_documents
 *   Funding stage           funding_rounds
 *   Funding band            funding_rounds
 *
 * Without these tables populated, those four controls are decoration: every
 * company answers the same way, so moving the control never changes a result.
 * That is worse than omitting the filter, because it looks like it works.
 *
 * WHAT THIS IS NOT.
 *
 * No row here describes a real programme, a real work order or a real
 * investment. The programmes are named as simulations, the departments are
 * named as simulations, and every row is `origin = DEMO`. The interface must
 * never present any of it as government funding history, a procurement record
 * or an award. `investors` is left empty rather than filled with the names of
 * real firms, and no document carries extracted text — nothing was ingested, so
 * there is nothing to quote, and the retrieval layer will never quote from one.
 *
 * WHAT IT DOES NOT TOUCH.
 *
 * The team-owned companies listed in `team.ts` get no invented participation,
 * no invented funding and no invented document. Their dossiers are the real imported packs, and attaching
 * a fabricated government work order to a real team's company is the one thing
 * this project must never do. They keep whatever their packs gave them, which
 * for three of them is currently nothing; that is an honest reading, not a bug.
 *
 * Deterministic and idempotent. The seed is the company's own id, so the same
 * company always receives the same evidence, and every phase skips work that is
 * already present rather than duplicating it. Nothing is ever deleted.
 */
import { DataOrigin, DocumentKind, PrismaClient } from '@prisma/client';
import { TEAM_DISPLAY_NAMES } from './team';

const prisma = new PrismaClient();

/** Marks every document this script owns, so re-runs recognise their own work. */
const DOSSIER_URI = 'demo://dossier';
const DOSSIER_PUBLISHER = 'Sarthi demonstration workspace';

/** Imported rather than restated: three scripts used to keep their own copy. */
const TEAM_COMPANIES = TEAM_DISPLAY_NAMES;

/* ------------------------------------------------------------------ */
/* Deterministic randomness, seeded from the company                   */
/* ------------------------------------------------------------------ */

function seedFrom(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];

function weighted<T>(r: () => number, pairs: [T, number][]): T {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [v, w] of pairs) {
    if ((x -= w) <= 0) return v;
  }
  return pairs[pairs.length - 1][0];
}

const between = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

/* ------------------------------------------------------------------ */
/* Programmes                                                          */
/* ------------------------------------------------------------------ */

/**
 * Four simulated programmes.
 *
 * Deliberately *not* named after Maharashtra Startup Week, SISFS or any other
 * real scheme. A DEMO participation row citing a real programme asserts that a
 * fictional company won something a real body actually awards, and no origin
 * label undoes that reading once it is on a screen. The names below cannot be
 * mistaken for a real award, which is the whole point.
 */
const PROGRAMS = [
  {
    code: 'DEMO-SIP',
    name: 'Simulated State Innovation Programme',
    operator: 'Sarthi demonstration workspace',
    purpose:
      'A simulated state-level innovation programme used to demonstrate how prior government engagement is recorded and read. It does not exist and awards nothing.',
  },
  {
    code: 'DEMO-MPP',
    name: 'Simulated Municipal Pilot Programme',
    operator: 'Sarthi demonstration workspace',
    purpose:
      'A simulated municipal pilot programme, used to demonstrate work-order history against a city body. It does not exist and awards nothing.',
  },
  {
    code: 'DEMO-SSS',
    name: 'Simulated Seed Support Scheme',
    operator: 'Sarthi demonstration workspace',
    purpose:
      'A simulated early-stage support scheme, used to demonstrate programme participation without delivery. It does not exist and awards nothing.',
  },
  {
    code: 'DEMO-DPP',
    name: 'Simulated Departmental Procurement Pilot',
    operator: 'Sarthi demonstration workspace',
    purpose:
      'A simulated departmental procurement pilot, used to demonstrate delivery across more than one department. It does not exist and awards nothing.',
  },
];

/**
 * Which simulated department a field would be sponsored by.
 *
 * Every name carries "Simulated" for the same reason the programmes do. Falling
 * back to a general department keeps a field that is not listed from silently
 * producing an empty sponsor, which would break the multi-department reading.
 */
const DEPARTMENT_BY_SECTOR: Record<string, string> = {
  'water-distribution': 'Simulated Water Supply & Sanitation Department',
  wastewater: 'Simulated Water Supply & Sanitation Department',
  'municipal-waste-management': 'Simulated Urban Development Department',
  'urban-mobility': 'Simulated Transport Department',
  'road-infrastructure': 'Simulated Public Works Department',
  'energy-efficiency': 'Simulated Energy Department',
  'renewable-energy': 'Simulated Energy Department',
  agritech: 'Simulated Agriculture Department',
  'rural-development': 'Simulated Rural Development Department',
  'healthcare-delivery': 'Simulated Public Health Department',
  'public-health': 'Simulated Public Health Department',
  'education-technology': 'Simulated School Education Department',
  'skill-development': 'Simulated Skill Development Department',
  'e-governance': 'Simulated Information Technology Department',
  'citizen-services': 'Simulated Information Technology Department',
  'public-safety': 'Simulated Home Department',
  'disaster-management': 'Simulated Disaster Management Authority',
  'climate-environment': 'Simulated Environment Department',
  'smart-buildings': 'Simulated Public Works Department',
  'financial-inclusion': 'Simulated Finance Department',
  'supply-chain': 'Simulated Food & Civil Supplies Department',
  'urban-planning': 'Simulated Urban Development Department',
  cybersecurity: 'Simulated Information Technology Department',
  'ai-data-infrastructure': 'Simulated Information Technology Department',
};

const SECONDARY_DEPARTMENTS = [
  'Simulated Planning Department',
  'Simulated Urban Development Department',
  'Simulated Rural Development Department',
  'Simulated Finance Department',
];

const departmentFor = (sector: string) =>
  DEPARTMENT_BY_SECTOR[sector] ?? 'Simulated General Administration Department';

/* ------------------------------------------------------------------ */
/* The dossier                                                         */
/* ------------------------------------------------------------------ */

/**
 * The six categories a department asks for before a pilot.
 *
 * The same six the `startup_derived_metrics` view counts. Ordered by how early
 * a company would realistically produce them, so a partial dossier is a prefix
 * of this list rather than an arbitrary subset — a company with a technology
 * note and no incorporation certificate is not a shape that occurs.
 */
const DOSSIER_CATEGORIES: { category: string; kind: DocumentKind; title: string }[] = [
  { category: 'CORPORATE_LEGAL', kind: DocumentKind.ELIGIBILITY, title: 'Certificate of incorporation' },
  { category: 'KYC', kind: DocumentKind.ELIGIBILITY, title: 'Authorised signatory and KYC pack' },
  { category: 'FINANCIAL', kind: DocumentKind.ELIGIBILITY, title: 'Audited financial statement' },
  { category: 'COMPLIANCE', kind: DocumentKind.ELIGIBILITY, title: 'Statutory compliance declaration' },
  { category: 'TECHNOLOGY', kind: DocumentKind.IP_DATA, title: 'Solution architecture and data-handling note' },
  { category: 'PILOT', kind: DocumentKind.PILOT_REPORT, title: 'Prior deployment summary' },
];

/* ------------------------------------------------------------------ */
/* Funding                                                             */
/* ------------------------------------------------------------------ */

/**
 * Round ladders by stage, and the band each round is drawn from.
 *
 * A company discloses rounds consistent with how far along it says it is, so
 * that funding stage and startup stage agree. Two columns that contradict each
 * other are read as a data-quality failure long before anyone reads them as a
 * filter.
 */
const ROUND_BANDS: Record<string, [number, number]> = {
  Grant: [500_000, 2_000_000],
  'Pre-seed': [1_500_000, 5_000_000],
  Seed: [5_000_000, 30_000_000],
  'Series A': [40_000_000, 150_000_000],
  'Series B': [150_000_000, 500_000_000],
};

const LADDER: Record<string, string[][]> = {
  IDEA: [[], [], ['Grant']],
  MVP: [[], ['Grant'], ['Pre-seed'], ['Grant', 'Pre-seed']],
  EARLY_REVENUE: [[], ['Pre-seed'], ['Seed'], ['Pre-seed', 'Seed']],
  GROWTH: [['Seed'], ['Seed', 'Series A'], ['Pre-seed', 'Seed'], ['Seed', 'Series A']],
  SCALE: [['Seed', 'Series A'], ['Series A'], ['Seed', 'Series A', 'Series B']],
};

/* ------------------------------------------------------------------ */

async function main() {
  /* --- phase 1: the simulated programmes -------------------------------- */

  for (const p of PROGRAMS) {
    await prisma.governmentProgram.upsert({
      where: { code: p.code },
      update: { name: p.name, operator: p.operator, purpose: p.purpose },
      create: { ...p, origin: DataOrigin.DEMO },
    });
  }
  const programs = await prisma.governmentProgram.findMany({ where: { code: { in: PROGRAMS.map((p) => p.code) } } });
  const programByCode = Object.fromEntries(programs.map((p) => [p.code, p]));
  console.log(`programmes            : ${programs.length} simulated`);

  /* --- the population this script may write to -------------------------- */

  const companies = await prisma.startup.findMany({
    where: { origin: DataOrigin.DEMO, displayName: { notIn: TEAM_COMPANIES } },
    select: {
      id: true, legalName: true, displayName: true, sector: true, stage: true,
      deploymentCount: true, procurementReadiness: true,
      _count: { select: { participations: true, fundingRounds: true, documents: true, pilots: true } },
    },
    orderBy: { legalName: 'asc' },
  });
  console.log(`companies in scope    : ${companies.length}  (${TEAM_COMPANIES.length} team-owned companies excluded)`);

  /* --- phase 2: programme participation --------------------------------- */

  /*
   * Level is drawn against the company's own record rather than uniformly: a
   * company with fifteen deployments and HIGH stated readiness having no
   * government history at all is possible but not typical, and a population
   * where the two are independent makes every combination of filters return the
   * same proportion — which is exactly what makes a filter set feel fake.
   */
  type Level = 'NONE' | 'PROGRAM' | 'WORK_ORDER' | 'MULTI_DEPARTMENT';

  const participationRows: {
    startupId: string; programId: string; edition: string;
    outcome: string; workOrderValue: number | null; sponsoringDepartment: string;
    origin: DataOrigin;
  }[] = [];

  const levelOf = new Map<string, Level>();

  for (const c of companies) {
    const r = rng(seedFrom(c.id) ^ 0x9e3779b9);
    const strong =
      (c.deploymentCount ?? 0) >= 7 || c.procurementReadiness === 'HIGH' || c.stage === 'SCALE';
    const weak = (c.deploymentCount ?? 0) === 0 || c.stage === 'IDEA';

    const level = weighted<Level>(
      r,
      strong
        ? [['NONE', 22], ['PROGRAM', 26], ['WORK_ORDER', 33], ['MULTI_DEPARTMENT', 19]]
        : weak
          ? [['NONE', 78], ['PROGRAM', 17], ['WORK_ORDER', 5], ['MULTI_DEPARTMENT', 0]]
          : [['NONE', 55], ['PROGRAM', 26], ['WORK_ORDER', 15], ['MULTI_DEPARTMENT', 4]],
    );
    levelOf.set(c.id, level);

    // Already has participation rows: leave them entirely alone.
    if (level === 'NONE' || c._count.participations > 0) continue;

    const home = departmentFor(c.sector);
    const edition = String(between(r, 2021, 2025));

    if (level === 'PROGRAM') {
      participationRows.push({
        startupId: c.id,
        programId: programByCode[pick(r, ['DEMO-SIP', 'DEMO-SSS'])].id,
        edition,
        outcome: 'Selected into the simulated programme cohort. No work order was issued.',
        // Null, not zero. No work order exists, and a zero would read as one
        // worth nothing rather than as one that never happened.
        workOrderValue: null,
        sponsoringDepartment: home,
        origin: DataOrigin.DEMO,
      });
    }

    if (level === 'WORK_ORDER' || level === 'MULTI_DEPARTMENT') {
      participationRows.push({
        startupId: c.id,
        programId: programByCode[pick(r, ['DEMO-SIP', 'DEMO-MPP'])].id,
        edition,
        outcome: 'Delivered against a simulated work order issued by the sponsoring department.',
        workOrderValue: between(r, 8, 90) * 100_000,
        sponsoringDepartment: home,
        origin: DataOrigin.DEMO,
      });
    }

    if (level === 'MULTI_DEPARTMENT') {
      const second = SECONDARY_DEPARTMENTS.filter((d) => d !== home);
      participationRows.push({
        startupId: c.id,
        programId: programByCode['DEMO-DPP'].id,
        edition: String(between(r, 2022, 2025)),
        outcome: 'Delivered against a simulated requirement raised by a second department.',
        workOrderValue: between(r, 6, 60) * 100_000,
        sponsoringDepartment: pick(r, second),
        origin: DataOrigin.DEMO,
      });
    }
  }

  let participationsCreated = 0;
  for (let i = 0; i < participationRows.length; i += 100) {
    // `skipDuplicates` leans on @@unique([startupId, programId, edition]): a
    // company legitimately participating twice in one edition is not a shape
    // the schema allows, so a second run cannot double-count history.
    const res = await prisma.startupProgramParticipation.createMany({
      data: participationRows.slice(i, i + 100),
      skipDuplicates: true,
    });
    participationsCreated += res.count;
  }
  console.log(`participations        : ${participationsCreated} created`);

  /* --- phase 3: the prose, written from the rows ------------------------ */

  /*
   * `governmentExperienceSummary` is regenerated here rather than in the company
   * generator, because it is a *description of records* and the records are
   * written above. A sentence rolled independently drifts from the participation
   * table within one run, and the dossier then claims delivery history that the
   * government-experience filter cannot find.
   */
  const withHistory = await prisma.startup.findMany({
    where: { origin: DataOrigin.DEMO, displayName: { notIn: TEAM_COMPANIES } },
    select: {
      id: true,
      participations: { select: { workOrderValue: true, sponsoringDepartment: true } },
      pilots: { select: { department: true } },
    },
  });

  let proseWritten = 0;
  for (let i = 0; i < withHistory.length; i += 50) {
    const slice = withHistory.slice(i, i + 50);
    const res = await prisma.$transaction(
      slice.map((c) => {
        const departments = new Set<string>();
        c.participations.forEach((p) => p.sponsoringDepartment && departments.add(p.sponsoringDepartment));
        c.pilots.forEach((p) => departments.add(p.department));
        const workOrders = c.participations.filter((p) => p.workOrderValue !== null).length + c.pilots.length;

        const summary =
          departments.size >= 2
            ? `Delivered against simulated requirements from ${departments.size} departments, across ${c.participations.length} recorded programme participation(s).`
            : workOrders > 0
              ? `Delivered against ${workOrders} simulated work order(s) for ${[...departments][0]}.`
              : c.participations.length > 0
                ? `Selected into ${c.participations.length} simulated programme cohort(s). No work order is recorded.`
                : 'No government programme participation or pilot is recorded for this company.';

        return prisma.startup.update({ where: { id: c.id }, data: { governmentExperienceSummary: summary } });
      }),
    );
    proseWritten += res.length;
  }
  console.log(`experience prose      : ${proseWritten} rewritten from records`);

  /* --- phase 4: funding disclosure -------------------------------------- */

  const fundingRows: {
    startupId: string; roundType: string; amount: number; announcedOn: Date; investors: string[]; origin: DataOrigin;
  }[] = [];

  for (const c of companies) {
    // A company that has already disclosed anything keeps what it disclosed.
    if (c._count.fundingRounds > 0) continue;

    const r = rng(seedFrom(c.id) ^ 0x85ebca6b);
    const ladder = LADDER[c.stage ?? 'MVP'] ?? LADDER.MVP;
    const rounds = pick(r, ladder);

    rounds.forEach((roundType, k) => {
      const [lo, hi] = ROUND_BANDS[roundType];
      fundingRows.push({
        startupId: c.id,
        roundType,
        amount: Math.round(between(r, lo, hi) / 100_000) * 100_000,
        announcedOn: new Date(Date.UTC(2019 + between(r, 0, 4) + k, between(r, 0, 11), 1)),
        // Left empty on purpose. Naming an investor would put a real firm's
        // name on a fabricated transaction, and no origin label repairs that.
        investors: [],
        origin: DataOrigin.DEMO,
      });
    });
  }

  let fundingCreated = 0;
  for (let i = 0; i < fundingRows.length; i += 100) {
    const res = await prisma.fundingRound.createMany({ data: fundingRows.slice(i, i + 100) });
    fundingCreated += res.count;
  }
  console.log(`funding rounds        : ${fundingCreated} created`);

  /* --- phase 5: the document dossier ------------------------------------ */

  /*
   * Documents with no extracted text.
   *
   * These record that a company has *filed* something in a category, which is
   * what a completeness reading measures and what an officer chasing a gap needs
   * to know. They deliberately carry no `extractedText`, no `fileHash` and no
   * real file: nothing was ingested, so the retrieval layer has nothing to
   * quote, and a RAG answer can never cite a passage that was invented here.
   */
  const existingDossier = await prisma.document.findMany({
    where: { originalPath: { startsWith: `${DOSSIER_URI}/` } },
    select: { originalPath: true },
  });
  const alreadyFiled = new Set(existingDossier.map((d) => d.originalPath));

  type Filing = { startupId: string; category: string; kind: DocumentKind; title: string; path: string; company: string };
  const filings: Filing[] = [];

  for (const c of companies) {
    const r = rng(seedFrom(c.id) ^ 0xc2b2ae35);
    const strong = (c.deploymentCount ?? 0) >= 7 || c.procurementReadiness === 'HIGH';
    const weak = (c.deploymentCount ?? 0) === 0 || c.stage === 'IDEA';

    // How far down the six-category list this company has got.
    const depth = weighted<number>(
      r,
      strong
        ? [[0, 3], [1, 6], [2, 12], [3, 18], [4, 22], [5, 21], [6, 18]]
        : weak
          ? [[0, 34], [1, 25], [2, 19], [3, 12], [4, 6], [5, 3], [6, 1]]
          : [[0, 14], [1, 18], [2, 21], [3, 19], [4, 14], [5, 9], [6, 5]],
    );

    for (let k = 0; k < depth; k += 1) {
      const spec = DOSSIER_CATEGORIES[k];
      const path = `${DOSSIER_URI}/${c.id}/${spec.category}`;
      if (alreadyFiled.has(path)) continue;
      filings.push({
        startupId: c.id,
        category: spec.category,
        kind: spec.kind,
        title: spec.title,
        path,
        company: c.displayName ?? c.legalName,
      });
    }
  }

  let documentsCreated = 0;
  for (let i = 0; i < filings.length; i += 50) {
    const slice = filings.slice(i, i + 50);
    await prisma.$transaction(
      slice.map((f) =>
        prisma.document.create({
          data: {
            kind: f.kind,
            title: `${f.title} — ${f.company} (simulated placeholder)`,
            publisher: DOSSIER_PUBLISHER,
            retrievedAt: new Date(Date.UTC(2026, 8, 1)),
            origin: DataOrigin.DEMO,
            originalPath: f.path,
            // No text, no hash. There is no file behind this record and the
            // interface must be able to tell that from the row itself.
            extractedText: null,
            fileHash: null,
            startupDocuments: {
              create: { startupId: f.startupId, category: f.category, label: f.title },
            },
          },
        }),
      ),
    );
    documentsCreated += slice.length;
    process.stdout.write(`\r  filed ${documentsCreated}/${filings.length}`);
  }
  if (filings.length) process.stdout.write('\n');
  console.log(`dossier documents     : ${documentsCreated} created`);

  /* --- what the view now reads ------------------------------------------ */

  const spread = await prisma.$queryRawUnsafe<
    { government_experience: string; funding_stage: string; funding_band: string; n: bigint }[]
  >(`
    SELECT government_experience, funding_stage, funding_band, COUNT(*) AS n
    FROM startup_derived_metrics
    GROUP BY 1, 2, 3
  `);
  const roll = (key: 'government_experience' | 'funding_stage' | 'funding_band') => {
    const m = new Map<string, number>();
    spread.forEach((s) => m.set(s[key], (m.get(s[key]) ?? 0) + Number(s.n)));
    return [...m].sort((a, b) => b[1] - a[1]);
  };

  console.log('\ngovernment experience :', roll('government_experience').map(([k, v]) => `${k}=${v}`).join('  '));
  console.log('funding stage         :', roll('funding_stage').map(([k, v]) => `${k}=${v}`).join('  '));
  console.log('funding band          :', roll('funding_band').map(([k, v]) => `${k}=${v}`).join('  '));

  console.log('\nEvery row created here is a simulation. No programme, work order, investment or');
  console.log('document above corresponds to anything real, and none may be presented as one.');
  console.log('Next: `npm run demo:verify`.');
}

main()
  .catch((e) => {
    console.error('\nFAILED', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
