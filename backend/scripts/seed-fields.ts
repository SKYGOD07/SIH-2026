/**
 * Widen the demonstration company pool across Maharashtra's innovation fields.
 *
 *   npm run demo:fields
 *
 * Two jobs. First it removes the five placeholder companies ("Simulated Startup
 * A".."E") that an earlier seed created — they duplicate the five named
 * companies imported from the document packs and would make any ranking read as
 * ten candidates when there are five.
 *
 * Then it adds companies across the fields Maharashtra's startup programmes
 * actually run in, so that filtering and matching have something to separate.
 *
 * ON THE FIELD LIST — read this before citing it anywhere.
 *
 * The sectors below are the platform's own working taxonomy for the
 * demonstration. They are NOT derived from published MSInS or Startup India
 * funding statistics: this project holds no such dataset, and inventing one
 * would be exactly the failure `docs/DATA-SOURCES.md` exists to prevent. The
 * interface must present these as a demonstration taxonomy, never as "the
 * fields Maharashtra funded most".
 *
 * Every company written here is `origin = DEMO`, carries no statutory
 * identifier of any kind, and states no government contract.
 */
import { AssuranceStatus, DataOrigin, PrismaClient, ReadinessLevel } from '@prisma/client';

const prisma = new PrismaClient();

/** The demonstration taxonomy. Domain vocabulary, not a funding statistic. */
export const FIELDS = [
  'water-distribution',
  'wastewater',
  'municipal-waste-management',
  'urban-mobility',
  'renewable-energy',
  'agritech',
  'healthcare-delivery',
  'public-safety',
  'e-governance',
  'education-technology',
] as const;

interface Spec {
  legalName: string;
  displayName: string;
  sector: (typeof FIELDS)[number];
  oneLine: string;
  problem: string;
  solution: string;
  tech: string[];
  caps: string[];
  city: string;
  teamSize: number;
  pilotDays: number;
  budget: number;
  readiness: ReadinessLevel;
  compliance: AssuranceStatus;
  cyber: AssuranceStatus;
  deployments: number;
}

const COMPANIES: Spec[] = [
  {
    legalName: 'Nirmal Flow Technologies Private Limited', displayName: 'Nirmal Flow',
    sector: 'water-distribution',
    oneLine: 'Pressure-managed district metering for non-revenue water.',
    problem: 'Distribution networks lose treated water through unmanaged pressure and undetected bursts.',
    solution: 'District metered areas with automated pressure control and burst alerting.',
    tech: ['iot', 'scada', 'analytics'], caps: ['pressure-management', 'burst-detection', 'field-deployment'],
    city: 'Nashik', teamSize: 14, pilotDays: 90, budget: 1800000,
    readiness: ReadinessLevel.MODERATE, compliance: AssuranceStatus.SELF_DECLARED,
    cyber: AssuranceStatus.NOT_PROVIDED, deployments: 2,
  },
  {
    legalName: 'Sanchay Wastewater Systems Private Limited', displayName: 'Sanchay',
    sector: 'wastewater',
    oneLine: 'Decentralised effluent treatment with continuous compliance monitoring.',
    problem: 'Small treatment works exceed discharge norms without early warning.',
    solution: 'Inline sensing and dosing control with an auditable compliance record.',
    tech: ['sensors', 'chemical-treatment', 'cloud'], caps: ['effluent-monitoring', 'lab-analysis'],
    city: 'Aurangabad', teamSize: 21, pilotDays: 120, budget: 3200000,
    readiness: ReadinessLevel.MODERATE, compliance: AssuranceStatus.SELF_DECLARED,
    cyber: AssuranceStatus.SELF_DECLARED, deployments: 3,
  },
  {
    legalName: 'GatiMarg Mobility Analytics Private Limited', displayName: 'GatiMarg',
    sector: 'urban-mobility',
    oneLine: 'Bus fleet scheduling and on-time performance analytics for transport undertakings.',
    problem: 'Municipal transport runs to timetables that do not reflect observed demand.',
    solution: 'Demand-responsive scheduling from ticketing and GPS telemetry.',
    tech: ['analytics', 'gis', 'ai'], caps: ['fleet-scheduling', 'demand-forecasting', 'reporting'],
    city: 'Pune', teamSize: 17, pilotDays: 90, budget: 2400000,
    readiness: ReadinessLevel.HIGH, compliance: AssuranceStatus.SELF_DECLARED,
    cyber: AssuranceStatus.SELF_DECLARED, deployments: 4,
  },
  {
    legalName: 'Suryodaya Grid Solutions Private Limited', displayName: 'Suryodaya',
    sector: 'renewable-energy',
    oneLine: 'Rooftop solar performance monitoring for public buildings.',
    problem: 'Installed public-building solar underperforms with no attribution of the shortfall.',
    solution: 'Per-string monitoring with generation forecasting and fault attribution.',
    tech: ['iot', 'analytics', 'cloud'], caps: ['generation-forecasting', 'fault-detection'],
    city: 'Nagpur', teamSize: 12, pilotDays: 60, budget: 1200000,
    readiness: ReadinessLevel.MODERATE, compliance: AssuranceStatus.NOT_PROVIDED,
    cyber: AssuranceStatus.NOT_PROVIDED, deployments: 1,
  },
  {
    legalName: 'Krishi Setu Agritech Private Limited', displayName: 'Krishi Setu',
    sector: 'agritech',
    oneLine: 'Soil and irrigation advisory for smallholder cultivation.',
    problem: 'Irrigation scheduling is uninformed by soil moisture, wasting water and yield.',
    solution: 'Soil probes with vernacular advisory delivered to cultivators.',
    tech: ['iot', 'ai', 'mobile'], caps: ['soil-monitoring', 'advisory-delivery', 'field-deployment'],
    city: 'Amravati', teamSize: 25, pilotDays: 150, budget: 2800000,
    readiness: ReadinessLevel.MODERATE, compliance: AssuranceStatus.SELF_DECLARED,
    cyber: AssuranceStatus.NOT_PROVIDED, deployments: 6,
  },
  {
    legalName: 'Arogya Reach Health Systems Private Limited', displayName: 'Arogya Reach',
    sector: 'healthcare-delivery',
    oneLine: 'Referral tracking between primary health centres and district hospitals.',
    problem: 'Patients referred upward are lost between facilities with no closure of the loop.',
    solution: 'Referral records that follow the patient and close on outcome.',
    tech: ['cloud', 'mobile', 'analytics'], caps: ['referral-tracking', 'facility-integration'],
    city: 'Nanded', teamSize: 19, pilotDays: 120, budget: 2100000,
    readiness: ReadinessLevel.MODERATE, compliance: AssuranceStatus.SELF_DECLARED,
    cyber: AssuranceStatus.SELF_DECLARED, deployments: 2,
  },
  {
    legalName: 'Suraksha Grid Public Safety Private Limited', displayName: 'Suraksha Grid',
    sector: 'public-safety',
    oneLine: 'Incident response coordination for municipal emergency services.',
    problem: 'Emergency calls are dispatched without a common operating picture.',
    solution: 'Shared incident map with unit tracking and response-time measurement.',
    tech: ['gis', 'cloud', 'analytics'], caps: ['incident-coordination', 'response-analytics'],
    city: 'Thane', teamSize: 16, pilotDays: 90, budget: 1900000,
    readiness: ReadinessLevel.LOW, compliance: AssuranceStatus.NOT_PROVIDED,
    cyber: AssuranceStatus.NOT_PROVIDED, deployments: 1,
  },
  {
    legalName: 'Seva Setu Digital Governance Private Limited', displayName: 'Seva Setu',
    sector: 'e-governance',
    oneLine: 'Grievance redressal tracking with service-level measurement.',
    problem: 'Citizen grievances are logged but their resolution time is not measured.',
    solution: 'Grievance workflow with departmental SLAs and public dashboards.',
    tech: ['cloud', 'workflow', 'analytics'], caps: ['workflow-automation', 'sla-reporting', 'systems-integration'],
    city: 'Mumbai', teamSize: 28, pilotDays: 60, budget: 1500000,
    readiness: ReadinessLevel.HIGH, compliance: AssuranceStatus.SELF_DECLARED,
    cyber: AssuranceStatus.SELF_DECLARED, deployments: 5,
  },
  {
    legalName: 'Vidya Bridge Learning Private Limited', displayName: 'Vidya Bridge',
    sector: 'education-technology',
    oneLine: 'Foundational literacy assessment for municipal schools.',
    problem: 'Learning gaps are identified too late to remediate within the year.',
    solution: 'Termly oral assessment with per-child remediation grouping.',
    tech: ['mobile', 'analytics'], caps: ['assessment-delivery', 'reporting'],
    city: 'Solapur', teamSize: 9, pilotDays: 120, budget: 900000,
    readiness: ReadinessLevel.LOW, compliance: AssuranceStatus.NOT_PROVIDED,
    cyber: AssuranceStatus.NOT_PROVIDED, deployments: 1,
  },
  {
    legalName: 'Chakra Circular Waste Private Limited', displayName: 'Chakra',
    sector: 'municipal-waste-management',
    oneLine: 'Source-segregation compliance measurement for ward-level collection.',
    problem: 'Segregation at source is mandated but not measured, so compliance is unknown.',
    solution: 'Collection-point imaging with segregation scoring per ward.',
    tech: ['computer-vision', 'iot', 'analytics'], caps: ['segregation-analytics', 'route-optimization'],
    city: 'Pimpri-Chinchwad', teamSize: 15, pilotDays: 90, budget: 2000000,
    readiness: ReadinessLevel.MODERATE, compliance: AssuranceStatus.SELF_DECLARED,
    cyber: AssuranceStatus.NOT_PROVIDED, deployments: 3,
  },
];

async function main() {
  const scenario = await prisma.simulationScenario.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!scenario) {
    console.error('No SimulationScenario exists. Run `npm run demo:seed` first.');
    process.exitCode = 1;
    return;
  }

  // --- remove the placeholder duplicates ----------------------------------
  const placeholders = await prisma.startup.findMany({
    where: { legalName: { startsWith: 'Simulated Startup ' } },
    select: { id: true, legalName: true },
  });
  if (placeholders.length) {
    const ids = placeholders.map((p) => p.id);
    // Detach owners first; a claimed company cannot be deleted out from under one.
    await prisma.userProfile.updateMany({ where: { startupId: { in: ids } }, data: { startupId: null } });
    await prisma.startup.deleteMany({ where: { id: { in: ids } } });
    console.log(`removed ${placeholders.length} placeholder companies`);
  }

  // --- widen the pool ------------------------------------------------------
  let created = 0;
  let updated = 0;
  for (const c of COMPANIES) {
    const existing = await prisma.startup.findFirst({ where: { legalName: c.legalName } });
    const data = {
      legalName: c.legalName,
      displayName: c.displayName,
      oneLineDescription: c.oneLine,
      sector: c.sector,
      state: 'Maharashtra',
      city: c.city,
      teamSize: c.teamSize,
      problemSolved: c.problem,
      solutionSummary: c.solution,
      technologies: c.tech,
      capabilities: c.caps,
      deploymentCount: c.deployments,
      pilotDurationDays: c.pilotDays,
      estimatedPilotBudget: c.budget,
      procurementReadiness: c.readiness,
      complianceStatus: c.compliance,
      cybersecurityStatus: c.cyber,
      dataPrivacyStatus: AssuranceStatus.NOT_PROVIDED,
      requiredCertifications: [],
      origin: DataOrigin.DEMO,
      scenarioId: scenario.id,
    };
    if (existing) {
      await prisma.startup.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.startup.create({ data });
      created += 1;
    }
  }

  const bySector = await prisma.startup.groupBy({ by: ['sector'], _count: true });
  console.log(`\ncreated ${created}, updated ${updated}`);
  console.log('\ncompanies by field:');
  bySector
    .sort((a, b) => b._count - a._count)
    .forEach((r) => console.log(`  ${String(r._count).padStart(2)}  ${r.sector}`));
  console.log(`\ntotal: ${await prisma.startup.count()} companies, all DEMO`);
}

main()
  .catch((e) => {
    console.error('FAILED', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
