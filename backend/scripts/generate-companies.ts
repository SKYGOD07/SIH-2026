/**
 * Synthetic demonstration dataset.
 *
 *   npm run demo:generate-companies
 *
 * Builds ~500 distinct company records across the innovation fields a
 * public-sector platform plausibly encounters, so that discovery, filtering,
 * ranking and comparison have enough population to behave like the real thing.
 * Fifteen companies cannot show whether a filter is useful.
 *
 * WHAT THIS DATASET IS NOT — read before writing any copy that describes it.
 *
 * It is a **synthetic demonstration dataset inspired by common public-sector
 * innovation domains**. It is not Maharashtra's funding history, not a record
 * of any programme, and no company in it exists. The interface must never
 * describe it as "historical Maharashtra government funding distribution" or
 * call any figure in it government funding. Every row is `origin = DEMO`, and
 * a database CHECK prevents any of it being marked VERIFIED.
 *
 * Deterministic: a seeded PRNG, not `Math.random()`. The same run produces the
 * same 500 companies, so a screenshot taken today still matches the database
 * next week, and a bug found in one company can be found again.
 *
 * Idempotent: keyed on legal name. Re-running updates rather than duplicating,
 * and it never touches the five team-owned companies or their document packs.
 */
import { AssuranceStatus, DataOrigin, PrismaClient, ReadinessLevel } from '@prisma/client';

const prisma = new PrismaClient();

const SCENARIO = 'SIH 2026 — Innovation Procurement Demo';
const TARGET = 500;

/* ------------------------------------------------------------------ */
/* Deterministic randomness                                            */
/* ------------------------------------------------------------------ */

/** mulberry32 — small, fast, and identical across runs for a given seed. */
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
const pickN = <T>(r: () => number, xs: readonly T[], n: number): T[] => {
  const out = new Set<T>();
  let guard = 0;
  while (out.size < Math.min(n, xs.length) && guard++ < 60) out.add(pick(r, xs));
  return [...out];
};
/** Weighted choice, so distributions are shaped rather than uniform. */
function weighted<T>(r: () => number, pairs: [T, number][]): T {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [v, w] of pairs) {
    if ((x -= w) <= 0) return v;
  }
  return pairs[pairs.length - 1][0];
}

/* ------------------------------------------------------------------ */
/* The field vocabulary                                                */
/* ------------------------------------------------------------------ */

interface Field {
  sector: string;
  industry: string;
  words: string[];
  tech: string[];
  caps: string[];
  problem: string;
  solution: string;
  users: string;
  /** Rough share of the dataset, so fields are unevenly populated as in life. */
  weight: number;
}

const FIELDS: Field[] = [
  { sector: 'water-distribution', industry: 'Water & Utilities', weight: 6,
    words: ['Jal', 'Aqua', 'Nirmal', 'Dhara', 'Tarang'],
    tech: ['iot', 'acoustic-sensing', 'scada', 'analytics', 'gis'],
    caps: ['leak-detection', 'pressure-management', 'district-metering', 'field-deployment'],
    problem: 'Treated water is lost between the plant and the consumer without attribution.',
    solution: 'Network instrumentation with loss localisation and repair prioritisation.',
    users: 'Municipal water departments and utilities' },
  { sector: 'wastewater', industry: 'Sanitation', weight: 4,
    words: ['Shuddh', 'Nirmal', 'Pravaha', 'Swacch'],
    tech: ['sensors', 'chemical-treatment', 'cloud', 'analytics'],
    caps: ['effluent-monitoring', 'lab-analysis', 'compliance-reporting'],
    problem: 'Treatment works breach discharge norms without early warning.',
    solution: 'Inline monitoring with dosing control and an auditable compliance record.',
    users: 'Sewerage boards and treatment operators' },
  { sector: 'municipal-waste-management', industry: 'Urban Operations', weight: 6,
    words: ['Chakra', 'Swacch', 'Punarva', 'Sanchay'],
    tech: ['computer-vision', 'iot', 'gis', 'analytics', 'ai'],
    caps: ['route-optimization', 'segregation-analytics', 'vehicle-tracking', 'citizen-reporting'],
    problem: 'Collection rounds are unverified and segregation compliance is unmeasured.',
    solution: 'Route telemetry and collection-point imaging scored by ward.',
    users: 'Municipal corporations and concessionaires' },
  { sector: 'urban-mobility', industry: 'Transport', weight: 5,
    words: ['Gati', 'Marg', 'Chalan', 'Pathik'],
    tech: ['analytics', 'gis', 'ai', 'mobile'],
    caps: ['fleet-scheduling', 'demand-forecasting', 'ticketing-integration'],
    problem: 'Public transport runs to timetables that do not reflect observed demand.',
    solution: 'Demand-responsive scheduling from ticketing and vehicle telemetry.',
    users: 'Transport undertakings and city authorities' },
  { sector: 'road-infrastructure', industry: 'Infrastructure', weight: 4,
    words: ['Setu', 'Marg', 'Adhaar', 'Sthir'],
    tech: ['computer-vision', 'iot', 'gis'],
    caps: ['condition-assessment', 'defect-detection', 'asset-registry'],
    problem: 'Road condition is recorded by inspection rounds that lag deterioration.',
    solution: 'Vehicle-mounted survey with automated defect classification.',
    users: 'Public works departments' },
  { sector: 'energy-efficiency', industry: 'Energy', weight: 4,
    words: ['Urja', 'Deep', 'Prakash', 'Tejas'],
    tech: ['iot', 'analytics', 'cloud'],
    caps: ['consumption-monitoring', 'fault-detection', 'load-management'],
    problem: 'Street lighting and public buildings consume more than their sanctioned load.',
    solution: 'Circuit-level metering with anomaly attribution.',
    users: 'Municipal electrical departments' },
  { sector: 'renewable-energy', industry: 'Energy', weight: 5,
    words: ['Surya', 'Tejas', 'Kiran', 'Pavan'],
    tech: ['iot', 'analytics', 'forecasting', 'cloud'],
    caps: ['generation-forecasting', 'performance-monitoring', 'fault-detection'],
    problem: 'Installed public-building generation underperforms with no attribution.',
    solution: 'Per-string monitoring with forecast-versus-actual reconciliation.',
    users: 'Energy departments and public building operators' },
  { sector: 'agritech', industry: 'Agriculture', weight: 6,
    words: ['Krishi', 'Bhoomi', 'Ankur', 'Beej', 'Kisan'],
    tech: ['iot', 'ai', 'remote-sensing', 'mobile'],
    caps: ['soil-monitoring', 'advisory-delivery', 'yield-estimation', 'field-deployment'],
    problem: 'Irrigation and input decisions are made without field-level measurement.',
    solution: 'Soil and canopy sensing with vernacular advisory to cultivators.',
    users: 'Agriculture departments and farmer producer organisations' },
  { sector: 'rural-development', industry: 'Rural', weight: 3,
    words: ['Gram', 'Vikas', 'Sankalp', 'Udaan'],
    tech: ['mobile', 'analytics', 'cloud'],
    caps: ['scheme-tracking', 'beneficiary-verification', 'reporting'],
    problem: 'Scheme delivery at village level is reported but not verified.',
    solution: 'Field verification with geo-tagged evidence and exception reporting.',
    users: 'Rural development departments and panchayats' },
  { sector: 'healthcare-delivery', industry: 'Health', weight: 5,
    words: ['Arogya', 'Swasth', 'Jeevan', 'Sanjivani'],
    tech: ['cloud', 'mobile', 'analytics', 'ai'],
    caps: ['referral-tracking', 'facility-integration', 'teleconsultation'],
    problem: 'Patients referred upward are lost between facilities with no closure.',
    solution: 'Referral records that follow the patient and close on outcome.',
    users: 'District health societies and public hospitals' },
  { sector: 'public-health', industry: 'Health', weight: 3,
    words: ['Suraksha', 'Nirog', 'Rakshak'],
    tech: ['analytics', 'gis', 'ai'],
    caps: ['outbreak-detection', 'surveillance-reporting'],
    problem: 'Disease surveillance signals are recognised only after clusters form.',
    solution: 'Syndromic surveillance across facilities with spatial clustering.',
    users: 'Public health departments' },
  { sector: 'education-technology', industry: 'Education', weight: 4,
    words: ['Vidya', 'Shiksha', 'Gyan', 'Setu'],
    tech: ['mobile', 'analytics', 'ai'],
    caps: ['assessment-delivery', 'remediation-grouping', 'reporting'],
    problem: 'Learning gaps surface too late in the year to remediate.',
    solution: 'Termly assessment with per-child remediation grouping.',
    users: 'Education departments and municipal schools' },
  { sector: 'skill-development', industry: 'Skills', weight: 3,
    words: ['Kaushal', 'Nipun', 'Udyam'],
    tech: ['mobile', 'analytics', 'cloud'],
    caps: ['training-tracking', 'placement-verification', 'assessment-delivery'],
    problem: 'Training completion is recorded but placement outcomes are not verified.',
    solution: 'Outcome tracking linking training records to verified placement.',
    users: 'Skill development missions' },
  { sector: 'e-governance', industry: 'Governance', weight: 5,
    words: ['Seva', 'Setu', 'Sugam', 'Saral'],
    tech: ['cloud', 'workflow', 'analytics', 'integration'],
    caps: ['workflow-automation', 'sla-reporting', 'systems-integration'],
    problem: 'Citizen applications are logged but their resolution time is unmeasured.',
    solution: 'Workflow with departmental service levels and public dashboards.',
    users: 'Administrative departments' },
  { sector: 'citizen-services', industry: 'Governance', weight: 4,
    words: ['Nagrik', 'Samvad', 'Sampark'],
    tech: ['mobile', 'cloud', 'ai'],
    caps: ['grievance-intake', 'multilingual-support', 'reporting'],
    problem: 'Grievances arrive through channels that do not reconcile with each other.',
    solution: 'Unified intake with deduplication and routing to the owning department.',
    users: 'Municipal and district administrations' },
  { sector: 'public-safety', industry: 'Safety', weight: 4,
    words: ['Suraksha', 'Rakshak', 'Kavach'],
    tech: ['gis', 'computer-vision', 'cloud', 'analytics'],
    caps: ['incident-coordination', 'response-analytics', 'surveillance-integration'],
    problem: 'Emergency response is dispatched without a common operating picture.',
    solution: 'Shared incident map with unit tracking and response-time measurement.',
    users: 'Emergency services and city control rooms' },
  { sector: 'disaster-management', industry: 'Resilience', weight: 3,
    words: ['Aapda', 'Sankat', 'Prahari'],
    tech: ['remote-sensing', 'gis', 'forecasting', 'iot'],
    caps: ['early-warning', 'flood-modelling', 'resource-mapping'],
    problem: 'Warnings reach affected populations too late to act on.',
    solution: 'Hazard modelling with targeted alerting to affected wards.',
    users: 'Disaster management authorities' },
  { sector: 'climate-environment', industry: 'Environment', weight: 4,
    words: ['Paryavaran', 'Vayu', 'Haritha', 'Prakriti'],
    tech: ['sensors', 'analytics', 'remote-sensing'],
    caps: ['air-quality-monitoring', 'emissions-accounting', 'compliance-reporting'],
    problem: 'Ambient quality is measured at too few points to attribute causes.',
    solution: 'Distributed sensing with source apportionment.',
    users: 'Pollution control boards and municipal bodies' },
  { sector: 'smart-buildings', industry: 'Built Environment', weight: 3,
    words: ['Bhavan', 'Nirman', 'Sthapatya'],
    tech: ['iot', 'analytics', 'cloud'],
    caps: ['occupancy-analytics', 'energy-management', 'maintenance-scheduling'],
    problem: 'Public buildings are maintained on calendars rather than condition.',
    solution: 'Condition-based maintenance from building telemetry.',
    users: 'Public works and estate departments' },
  { sector: 'financial-inclusion', industry: 'Financial Services', weight: 4,
    words: ['Dhan', 'Nidhi', 'Sampatti', 'Kosh'],
    tech: ['fintech', 'cloud', 'analytics', 'blockchain'],
    caps: ['credit-scoring', 'disbursement-tracking', 'beneficiary-verification'],
    problem: 'Benefit transfers cannot be reconciled to intended beneficiaries.',
    solution: 'Disbursement tracking with exception reporting and reconciliation.',
    users: 'Finance departments and implementing agencies' },
  { sector: 'supply-chain', industry: 'Logistics', weight: 3,
    words: ['Aapurti', 'Sanchar', 'Vahan'],
    tech: ['iot', 'analytics', 'cloud'],
    caps: ['cold-chain-monitoring', 'inventory-visibility', 'route-optimization'],
    problem: 'Public distribution stock is visible only after it has moved.',
    solution: 'Consignment tracking with condition monitoring in transit.',
    users: 'Civil supplies and health logistics departments' },
  { sector: 'urban-planning', industry: 'Planning', weight: 3,
    words: ['Nagar', 'Rachana', 'Vinyas'],
    tech: ['gis', 'remote-sensing', 'analytics', 'ai'],
    caps: ['land-use-mapping', 'change-detection', 'scenario-modelling'],
    problem: 'Unauthorised construction is detected long after completion.',
    solution: 'Periodic imagery change detection against sanctioned plans.',
    users: 'Planning authorities and development boards' },
  { sector: 'cybersecurity', industry: 'Cybersecurity', weight: 3,
    words: ['Kavach', 'Suraksha', 'Chakravyuh'],
    tech: ['security', 'cloud', 'analytics', 'ai'],
    caps: ['vulnerability-assessment', 'incident-response', 'audit-readiness'],
    problem: 'Departmental systems are assessed for security only after an incident.',
    solution: 'Continuous assessment with prioritised remediation tracking.',
    users: 'IT departments and state data centres' },
  { sector: 'ai-data-infrastructure', industry: 'Data & AI', weight: 4,
    words: ['Buddhi', 'Vidhi', 'Tantra', 'Drishti'],
    tech: ['ai', 'analytics', 'cloud', 'data-engineering'],
    caps: ['data-integration', 'model-governance', 'dashboarding'],
    problem: 'Departmental data sits in systems that cannot answer a cross-cutting question.',
    solution: 'Governed data platform with lineage and access control.',
    users: 'State data and analytics units' },
];

const SUFFIX = ['Technologies', 'Systems', 'Solutions', 'Labs', 'Networks', 'Innovations', 'Analytics', 'Ventures'];
const CITIES: [string, number][] = [
  ['Pune', 22], ['Mumbai', 20], ['Nagpur', 10], ['Nashik', 9], ['Thane', 8],
  ['Aurangabad', 6], ['Solapur', 5], ['Kolhapur', 5], ['Amravati', 4],
  ['Pimpri-Chinchwad', 5], ['Nanded', 3], ['Sangli', 3],
];
const STAGES: [string, number][] = [
  ['IDEA', 8], ['MVP', 22], ['EARLY_REVENUE', 30], ['GROWTH', 27], ['SCALE', 13],
];
const REVENUE: [string, number][] = [
  ['Pre-revenue', 20], ['Under ₹25L', 22], ['₹25L – ₹1 Cr', 26],
  ['₹1 Cr – ₹5 Cr', 21], ['Over ₹5 Cr', 11],
];
const DEPLOY_MODEL = ['SaaS', 'SaaS + IoT edge', 'On-premise', 'Hybrid cloud', 'Managed service'];

/* ------------------------------------------------------------------ */

function buildCompany(i: number, field: Field, used: Set<string>) {
  const r = rng(0x5a17 + i * 2654435761);

  // Names are composed deterministically and de-duplicated by suffix rotation.
  let name = '';
  for (let attempt = 0; attempt < SUFFIX.length + 4; attempt += 1) {
    const word = field.words[(i + attempt) % field.words.length];
    const suffix = SUFFIX[(i + attempt * 3) % SUFFIX.length];
    const candidate = `${word} ${suffix}`;
    if (!used.has(candidate)) {
      name = candidate;
      break;
    }
  }
  if (!name) name = `${field.words[i % field.words.length]} ${SUFFIX[i % SUFFIX.length]} ${i}`;
  used.add(name);

  const stage = weighted(r, STAGES);
  const teamSize = weighted<number>(r, [[4, 10], [7, 16], [12, 22], [18, 18], [31, 16], [65, 12], [120, 6]]);
  const deployments = weighted<number>(r, [[0, 22], [1, 20], [3, 20], [7, 16], [15, 12], [30, 7], [80, 3]]);
  const readiness = weighted<ReadinessLevel>(r, [
    [ReadinessLevel.NOT_ASSESSED, 18], [ReadinessLevel.LOW, 26],
    [ReadinessLevel.MODERATE, 36], [ReadinessLevel.HIGH, 20],
  ]);
  const assurance = () =>
    weighted<AssuranceStatus>(r, [
      [AssuranceStatus.NOT_PROVIDED, 45], [AssuranceStatus.SELF_DECLARED, 45],
      // PARTIALLY_VERIFIED is rare and VERIFIED never appears: verification
      // requires a cited source, which synthetic data does not have.
      [AssuranceStatus.PARTIALLY_VERIFIED, 10],
    ]);

  const city = weighted(r, CITIES);
  const govtExperience = weighted(r, [
    ['No government engagement is recorded.', 40],
    ['Has responded to departmental requirements previously.', 30],
    ['Has delivered against a municipal work order.', 20],
    ['Has delivered across more than one department.', 10],
  ] as [string, number][]);

  return {
    legalName: `${name} Private Limited`,
    displayName: name,
    oneLineDescription: `${field.solution.replace(/\.$/, '')} for ${field.users.toLowerCase()}.`,
    description: `${field.problem} ${field.solution} Operating from ${city}, ${
      stage === 'IDEA' ? 'at concept stage' : `at ${stage.replace(/_/g, ' ').toLowerCase()} stage`
    }.`,
    sector: field.sector,
    industry: field.industry,
    stage,
    state: 'Maharashtra',
    city,
    foundedYear: 2016 + Math.floor(r() * 9),
    teamSize,
    problemSolved: field.problem,
    solutionSummary: field.solution,
    productSummary: `${field.solution} Delivered as ${pick(r, DEPLOY_MODEL).toLowerCase()}.`,
    targetUsers: field.users,
    deploymentModel: pick(r, DEPLOY_MODEL),
    geographicCoverage: pick(r, ['Maharashtra', 'Western India', 'Pan-India', `${city} region`]),
    technologies: pickN(r, field.tech, 2 + Math.floor(r() * 3)),
    capabilities: pickN(r, field.caps, 2 + Math.floor(r() * 2)),
    revenueBand: weighted(r, REVENUE),
    customerCount: Math.max(0, Math.round(deployments * (0.4 + r() * 0.8))),
    deploymentCount: deployments,
    commercializationStage: stage === 'IDEA' || stage === 'MVP' ? 'Pre-commercial' : 'Commercialised',
    governmentExperienceSummary: govtExperience,
    complianceStatus: assurance(),
    cybersecurityStatus: assurance(),
    dataPrivacyStatus: assurance(),
    procurementReadiness: readiness,
    requiredCertifications: [],
    pilotDurationDays: pick(r, [45, 60, 90, 90, 120, 150, 180]),
    pilotTeamSummary: `${1 + Math.floor(r() * 4)} engineers and ${
      r() > 0.5 ? 'a deployment lead' : 'a field coordinator'
    }.`,
    infrastructureRequirements:
      r() > 0.35 ? 'Departmental data access and site connectivity.' : null,
    implementationDependencies:
      r() > 0.5 ? 'Integration with an existing departmental system.' : null,
    deploymentRequirements: r() > 0.4 ? 'Site survey and staged rollout across the pilot area.' : null,
    // Bands rather than suspiciously precise figures.
    estimatedPilotBudget: [500000, 900000, 1500000, 2500000, 4000000, 6000000][
      Math.floor(r() * 6)
    ],
    scalingRequirements: r() > 0.45 ? 'District-wide rollout with multi-tenant separation.' : null,
    origin: DataOrigin.DEMO,
  };
}

/* ------------------------------------------------------------------ */
/* The three missing team-owned companies                              */
/* ------------------------------------------------------------------ */

const TEAM_COMPANIES = [
  { legalName: 'Crop Saver Agritech Private Limited', displayName: 'Crop Saver',
    sector: 'agritech', industry: 'Agriculture', contactEmail: 'sr5937424@gmail.com',
    oneLine: 'Crop loss prevention through early pest and disease detection.',
    problem: 'Pest and disease damage is identified after visible crop loss has occurred.',
    solution: 'Field imaging with early detection and treatment advisory to cultivators.',
    tech: ['ai', 'computer-vision', 'mobile'], caps: ['pest-detection', 'advisory-delivery', 'field-deployment'],
    city: 'Nashik', teamSize: 13, pilotDays: 120, budget: 1800000 },
  { legalName: 'WaterManager Utilities Private Limited', displayName: 'WaterManager',
    sector: 'water-distribution', industry: 'Water & Utilities', contactEmail: 'sr5937424@gmail.com',
    oneLine: 'Distribution network management and consumption accountability.',
    problem: 'Utilities cannot reconcile water produced against water billed.',
    solution: 'District metering with consumption reconciliation and loss attribution.',
    tech: ['iot', 'scada', 'analytics'], caps: ['district-metering', 'leak-detection', 'billing-reconciliation'],
    city: 'Pune', teamSize: 20, pilotDays: 90, budget: 2600000 },
  { legalName: 'EnviroPlus Environmental Systems Private Limited', displayName: 'EnviroPlus',
    sector: 'climate-environment', industry: 'Environment', contactEmail: 'Suhanigoyal856@gmail.com',
    oneLine: 'Ambient air quality monitoring with source attribution.',
    problem: 'Air quality is measured at too few points to attribute pollution to sources.',
    solution: 'Distributed low-cost sensing calibrated against reference stations.',
    tech: ['sensors', 'analytics', 'cloud'], caps: ['air-quality-monitoring', 'emissions-accounting'],
    city: 'Mumbai', teamSize: 11, pilotDays: 90, budget: 1400000 },
];

/* ------------------------------------------------------------------ */

async function main() {
  const scenario =
    (await prisma.simulationScenario.findFirst({ where: { name: SCENARIO } })) ??
    (await prisma.simulationScenario.findFirst({ orderBy: { createdAt: 'asc' } }));
  if (!scenario) {
    console.error('No SimulationScenario. Run `npm run demo:seed` first.');
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.startup.findMany({ select: { legalName: true, displayName: true } });
  const usedNames = new Set(existing.map((e) => e.displayName ?? e.legalName));
  const existingLegal = new Set(existing.map((e) => e.legalName));

  // --- the three missing team companies -----------------------------------
  let teamCreated = 0;
  for (const t of TEAM_COMPANIES) {
    if (existingLegal.has(t.legalName)) continue;
    await prisma.startup.create({
      data: {
        legalName: t.legalName, displayName: t.displayName, oneLineDescription: t.oneLine,
        sector: t.sector, industry: t.industry, state: 'Maharashtra', city: t.city,
        teamSize: t.teamSize, problemSolved: t.problem, solutionSummary: t.solution,
        technologies: t.tech, capabilities: t.caps,
        pilotDurationDays: t.pilotDays, estimatedPilotBudget: t.budget,
        procurementReadiness: ReadinessLevel.MODERATE,
        complianceStatus: AssuranceStatus.SELF_DECLARED,
        cybersecurityStatus: AssuranceStatus.NOT_PROVIDED,
        dataPrivacyStatus: AssuranceStatus.NOT_PROVIDED,
        requiredCertifications: [], deploymentCount: 1,
        // Contact information from the supplied packs. NOT an authentication
        // identity — sign-in remains Supabase Auth, and claiming is separate.
        website: null,
        origin: DataOrigin.DEMO, scenarioId: scenario.id,
      },
    });
    usedNames.add(t.displayName);
    existingLegal.add(t.legalName);
    teamCreated += 1;
  }

  // --- the synthetic population -------------------------------------------
  const totalWeight = FIELDS.reduce((s, f) => s + f.weight, 0);
  const rows: ReturnType<typeof buildCompany>[] = [];
  let index = 0;

  for (const field of FIELDS) {
    const want = Math.round((field.weight / totalWeight) * TARGET);
    for (let k = 0; k < want; k += 1) {
      const c = buildCompany(index++, field, usedNames);
      if (!existingLegal.has(c.legalName)) rows.push(c);
    }
  }

  // createMany is the difference between seconds and minutes at this size.
  const BATCH = 100;
  let created = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH).map((c) => ({ ...c, scenarioId: scenario.id }));
    const res = await prisma.startup.createMany({ data: slice, skipDuplicates: true });
    created += res.count;
    process.stdout.write(`\r  inserted ${created}/${rows.length}`);
  }
  process.stdout.write('\n');

  const total = await prisma.startup.count();
  const bySector = await prisma.startup.groupBy({ by: ['sector'], _count: true });
  const verified = await prisma.startup.count({ where: { origin: 'VERIFIED' } });

  console.log(`\nteam companies created : ${teamCreated}`);
  console.log(`synthetic created      : ${created}`);
  console.log(`total companies        : ${total}`);
  console.log(`fields                 : ${bySector.length}`);
  console.log(`marked VERIFIED        : ${verified}  (must be 0)`);
  console.log('\nlargest fields:');
  bySector
    .sort((a, b) => b._count - a._count)
    .slice(0, 8)
    .forEach((s) => console.log(`  ${String(s._count).padStart(3)}  ${s.sector}`));
  console.log('\nSynthetic demonstration dataset inspired by common public-sector innovation');
  console.log('domains. Not Maharashtra funding history, and no company in it exists.');
}

main()
  .catch((e) => {
    console.error('\nFAILED', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
