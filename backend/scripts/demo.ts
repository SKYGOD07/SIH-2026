/**
 * Demonstration workspace initialisation & ZIP pack importer.
 *
 * Commands:
 *   npm run demo:seed          create or update the demo workspace and import ZIP packs
 *   npm run demo:import-packs  import CIVORA & HIX ZIP packs into structured dossiers
 *   npm run demo:reset         delete demo scenario records without touching real data
 *
 * Rules:
 *   1. Creates NO authentication accounts (real users sign up & claim companies).
 *   2. Every imported record is origin = DEMO (never VERIFIED).
 *   3. All 5 startups belong to SimulationScenario.
 */
import {
  AssuranceStatus,
  DataOrigin,
  DocumentKind,
  PrismaClient,
  ReadinessLevel,
  UserRole,
} from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { scoreMatch } from '../src/workflow/matching';

const prisma = new PrismaClient();

const SCENARIO_NAME = 'SIH 2026 — Innovation Procurement Demo';

interface ExtractedDoc {
  company: 'CIVORA' | 'HIX';
  zipFile: string;
  originalFilename: string;
  fileHash: string;
  extension: string;
  sizeBytes: number;
  category: string;
  title: string;
  extractedText: string;
}

function ensureParsedDocs(): ExtractedDoc[] {
  const jsonPath = path.resolve(process.cwd(), 'scripts/extracted_docs.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('Running parse_packs.py to discover and extract ZIP packs from /data...');
    const pyScript = path.resolve(process.cwd(), 'scripts/parse_packs.py');
    execSync(`python "${pyScript}"`, { stdio: 'inherit' });
  }
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  return JSON.parse(raw) as ExtractedDoc[];
}

function mapKind(category: string): DocumentKind {
  switch (category) {
    case 'CORPORATE_LEGAL':
      return DocumentKind.ELIGIBILITY;
    case 'GOVERNMENT_FUNDING':
      return DocumentKind.PROCUREMENT;
    case 'FINANCIAL':
      return DocumentKind.ELIGIBILITY;
    case 'COMPLIANCE':
      return DocumentKind.CYBERSECURITY;
    case 'TECHNOLOGY':
      return DocumentKind.OTHER;
    case 'PILOT':
      return DocumentKind.PILOT_REPORT;
    case 'AI_GOVERNANCE':
      return DocumentKind.CYBERSECURITY;
    case 'OWNERSHIP':
      return DocumentKind.IP_DATA;
    case 'KYC':
      return DocumentKind.ELIGIBILITY;
    case 'CHECKLIST':
      return DocumentKind.ELIGIBILITY;
    default:
      return DocumentKind.OTHER;
  }
}

/**
 * The 5 Simulated Startups
 */
const RICH_COMPANIES = [
  {
    key: 'CIVORA',
    legalName: 'CIVORA Technologies Private Limited',
    displayName: 'CIVORA',
    oneLineDescription: 'AI & IoT-enabled CleanCity OS for municipal solid waste and urban infrastructure.',
    sector: 'municipal-waste-management',
    industry: 'GovTech / Urban Ops / AI',
    stage: 'Growth / Seed',
    state: 'Maharashtra',
    city: 'Mumbai',
    website: 'https://civora-demo.sarthi.gov.in',
    foundedYear: 2023,
    teamSize: 22,
    founderSummary: 'Founded by urban systems engineers and AI researchers with municipal field experience.',
    problemSolved: 'Municipal bodies face route inefficiencies, unverified waste collection, and high non-revenue costs.',
    solutionSummary: 'CleanCity OS combines RouteAI route optimization, Track IoT monitoring, and Vision computer vision analytics.',
    productSummary: 'Full-stack urban waste management platform with real-time ward dashboards and citizen engagement.',
    targetUsers: 'Municipal corporations, smart city operators, waste management concessionaires.',
    deploymentModel: 'SaaS + IoT Edge Gateways',
    geographicCoverage: 'Maharashtra & Tier-1/2 Municipalities',
    technologies: ['ai', 'iot', 'gis', 'computer-vision', 'analytics'],
    capabilities: ['route-optimization', 'vehicle-tracking', 'segregation-analytics', 'citizen-reporting'],
    revenueBand: '₹50L - ₹2 Cr',
    customerCount: 3,
    deploymentCount: 5,
    commercializationStage: 'Commercialized / Active Pilots',
    governmentExperienceSummary: 'Participated in Maharashtra Municipal pilot trial (100 wards, 150 vehicles, 1L households).',
    complianceStatus: AssuranceStatus.SELF_DECLARED,
    cybersecurityStatus: AssuranceStatus.SELF_DECLARED,
    dataPrivacyStatus: AssuranceStatus.SELF_DECLARED,
    procurementReadiness: ReadinessLevel.HIGH,
    requiredCertifications: ['ISO 27001 (Self-Declared)', 'CERT-In Compliant Architecture'],
    pilotDurationDays: 90,
    pilotTeamSummary: '1 Deployment Lead, 2 IoT Engineers, 1 GIS Analyst.',
    infrastructureRequirements: 'Access to vehicle GPS feeds, municipal ward GIS maps, cloud API connectivity.',
    implementationDependencies: 'Integration with municipal vehicle tracking and ward supervisor app.',
    deploymentRequirements: 'Edge gateway provisioning for pilot fleet; cloud environment setup.',
    estimatedPilotBudget: 2500000.0,
    scalingRequirements: 'City-wide rollout across all municipal zones with multi-tenant dashboard.',
  },
  {
    key: 'HIX',
    legalName: 'HIX Health & FinTech Solutions Private Limited',
    displayName: 'HIX',
    oneLineDescription: 'Healthcare Infrastructure Exchange & AgriVault Digital Warehouse-Receipt Financing.',
    sector: 'agri-fintech-health',
    industry: 'FinTech / HealthTech / Infrastructure',
    stage: 'Early Stage / Seed',
    state: 'Maharashtra',
    city: 'Pune',
    website: 'https://hix-demo.sarthi.gov.in',
    foundedYear: 2024,
    teamSize: 16,
    founderSummary: 'Ex-banking fintech leaders and healthcare supply chain specialists.',
    problemSolved: 'Lack of verified warehouse receipt financing for agri-produce and inventory tracking for healthcare hubs.',
    solutionSummary: 'HIX AgriVault digital receipt financing platform with real-time collateral monitoring.',
    productSummary: 'Digital warehouse receipt issuance, lender integration, regulatory reporting, and compliance audit trail.',
    targetUsers: 'State agricultural marketing boards, banks, healthcare supply hubs.',
    deploymentModel: 'Cloud API + Warehouse Sensor Integration',
    geographicCoverage: 'Maharashtra & Central India',
    technologies: ['fintech', 'blockchain', 'iot', 'cloud'],
    capabilities: ['warehouse-receipt-financing', 'collateral-tracking', 'credit-risk-analytics'],
    revenueBand: '₹20L - ₹50L',
    customerCount: 2,
    deploymentCount: 3,
    commercializationStage: 'Pilot Ready / Seed',
    governmentExperienceSummary: 'Submitted Maharashtra Government DPR for AgriVault warehouse receipt financing.',
    complianceStatus: AssuranceStatus.SELF_DECLARED,
    cybersecurityStatus: AssuranceStatus.SELF_DECLARED,
    dataPrivacyStatus: AssuranceStatus.SELF_DECLARED,
    procurementReadiness: ReadinessLevel.HIGH,
    requiredCertifications: ['KYC/AML Framework', 'Data Protection Policy'],
    pilotDurationDays: 120,
    pilotTeamSummary: '2 FinTech Engineers, 1 Field Operations Manager.',
    infrastructureRequirements: 'Integration with state warehouse repository APIs and bank LOS.',
    implementationDependencies: 'NABARD / WDRA repository interface access.',
    deploymentRequirements: 'Deployment at select district warehouses.',
    estimatedPilotBudget: 5000000.0,
    scalingRequirements: 'State-wide warehouse repository integration.',
  },
];

const LIGHT_COMPANIES = [
  {
    legalName: 'AquaSense Systems Private Limited',
    displayName: 'AquaSense',
    oneLineDescription: 'Acoustic IoT sensors & cloud analytics for municipal non-revenue water reduction.',
    sector: 'water-distribution',
    industry: 'CleanTech / IoT',
    stage: 'Early Stage',
    state: 'Karnataka',
    city: 'Bengaluru',
    website: 'https://aquasense-demo.sarthi.gov.in',
    foundedYear: 2023,
    teamSize: 14,
    founderSummary: 'Acoustic sensing engineers from IISc.',
    problemSolved: 'Unidentified pipe leaks in municipal distribution networks.',
    solutionSummary: 'Continuous acoustic monitoring nodes localizing underground pipe bursts.',
    technologies: ['iot', 'acoustic-sensing', 'analytics'],
    capabilities: ['leak-detection', 'pressure-monitoring'],
    pilotDurationDays: 90,
    pilotTeamSummary: '2 Field Engineers, 1 Data Scientist.',
    infrastructureRequirements: 'Chamber mounting points and LoRaWAN gateway access.',
    deploymentRequirements: 'Installation of 50 acoustic nodes.',
    estimatedPilotBudget: 1800000.0,
    complianceStatus: AssuranceStatus.SELF_DECLARED,
    cybersecurityStatus: AssuranceStatus.NOT_PROVIDED,
    dataPrivacyStatus: AssuranceStatus.NOT_PROVIDED,
    procurementReadiness: ReadinessLevel.MODERATE,
  },
  {
    legalName: 'TransitPulse Analytics Private Limited',
    displayName: 'TransitPulse',
    oneLineDescription: 'Urban mobility analytics & public transit passenger flow optimization.',
    sector: 'urban-mobility',
    industry: 'Mobility / Analytics',
    stage: 'Seed',
    state: 'Maharashtra',
    city: 'Nagpur',
    website: 'https://transitpulse-demo.sarthi.gov.in',
    foundedYear: 2024,
    teamSize: 10,
    founderSummary: 'Transportation planners and AI analysts.',
    problemSolved: 'Inefficient bus scheduling and unmonitored bus stop congestion.',
    solutionSummary: 'AI camera & mobile signal analytics for dynamic bus dispatch.',
    technologies: ['ai', 'analytics', 'computer-vision'],
    capabilities: ['passenger-counting', 'route-planning'],
    pilotDurationDays: 60,
    pilotTeamSummary: '1 Traffic Analyst, 2 Software Developers.',
    infrastructureRequirements: 'CCTV feed access at key transit hubs.',
    deploymentRequirements: 'API integration with city transit server.',
    estimatedPilotBudget: 1200000.0,
    complianceStatus: AssuranceStatus.SELF_DECLARED,
    cybersecurityStatus: AssuranceStatus.NOT_PROVIDED,
    dataPrivacyStatus: AssuranceStatus.SELF_DECLARED,
    procurementReadiness: ReadinessLevel.MODERATE,
  },
  {
    legalName: 'SolarFlux Dynamics Private Limited',
    displayName: 'SolarFlux',
    oneLineDescription: 'AI-driven rooftop solar forecasting & municipal microgrid optimization.',
    sector: 'renewable-energy',
    industry: 'EnergyTech / Smart Grid',
    stage: 'Early Stage',
    state: 'Gujarat',
    city: 'Ahmedabad',
    website: 'https://solarflux-demo.sarthi.gov.in',
    foundedYear: 2023,
    teamSize: 12,
    founderSummary: 'Power systems engineers.',
    problemSolved: 'Grid instability due to uncoordinated rooftop solar generation.',
    solutionSummary: 'Solar generation forecasting model integrated with SCADA.',
    technologies: ['ai', 'smart-grid', 'analytics'],
    capabilities: ['solar-forecasting', 'load-balancing'],
    pilotDurationDays: 90,
    pilotTeamSummary: '2 Energy Engineers.',
    infrastructureRequirements: 'DISCOM SCADA telemetry feeds.',
    deploymentRequirements: 'Cloud engine deployment with discom API.',
    estimatedPilotBudget: 1500000.0,
    complianceStatus: AssuranceStatus.SELF_DECLARED,
    cybersecurityStatus: AssuranceStatus.SELF_DECLARED,
    dataPrivacyStatus: AssuranceStatus.NOT_PROVIDED,
    procurementReadiness: ReadinessLevel.MODERATE,
  },
];

async function seed() {
  console.log('Starting Sarthi Demo Ingestion & Seed...');

  // 1. Get or find admin/govt user for createdBy
  const owner =
    (await prisma.userProfile.findFirst({ where: { role: UserRole.GOVERNMENT_OFFICER } })) ??
    (await prisma.userProfile.findFirst({ where: { role: UserRole.ADMIN } }));

  if (!owner) {
    console.error('No GOVERNMENT_OFFICER or ADMIN profile exists yet in user_profiles.');
    process.exitCode = 1;
    return;
  }

  // 2. Create/upsert SimulationScenario
  const existingScenario = await prisma.simulationScenario.findFirst({
    where: { name: SCENARIO_NAME },
  });

  const scenario = await prisma.simulationScenario.upsert({
    where: { id: existingScenario?.id ?? '00000000-0000-0000-0000-000000000001' },
    create: {
      name: SCENARIO_NAME,
      description:
        'SIH 2026 Innovation Procurement Demo — 5 simulated startups with real ZIP documents and evidence validation.',
      status: 'ACTIVE',
      createdByUserId: owner.id,
      disclaimer: 'Simulated for demonstration. Not a government decision or procurement record.',
    },
    update: { status: 'ACTIVE' },
  });

  console.log(`Scenario ready: ${scenario.name} (${scenario.id})`);

  // 3. Load parsed ZIP documents
  const docs = ensureParsedDocs();
  console.log(`Loaded ${docs.length} extracted document records from ZIP packs.`);

  // Map to hold startup IDs
  const startupMap: Record<string, string> = {};

  // 4. Ingest Rich Startups (CIVORA & HIX) + Documents
  for (const compData of RICH_COMPANIES) {
    const existing = await prisma.startup.findFirst({ where: { legalName: compData.legalName } });

    const startupData = {
      legalName: compData.legalName,
      displayName: compData.displayName,
      oneLineDescription: compData.oneLineDescription,
      description: compData.solutionSummary,
      sector: compData.sector,
      industry: compData.industry,
      stage: compData.stage,
      state: compData.state,
      city: compData.city,
      website: compData.website,
      foundedYear: compData.foundedYear,
      teamSize: compData.teamSize,
      founderSummary: compData.founderSummary,
      problemSolved: compData.problemSolved,
      solutionSummary: compData.solutionSummary,
      productSummary: compData.productSummary,
      targetUsers: compData.targetUsers,
      deploymentModel: compData.deploymentModel,
      geographicCoverage: compData.geographicCoverage,
      technologies: compData.technologies,
      capabilities: compData.capabilities,
      revenueBand: compData.revenueBand,
      customerCount: compData.customerCount,
      deploymentCount: compData.deploymentCount,
      commercializationStage: compData.commercializationStage,
      governmentExperienceSummary: compData.governmentExperienceSummary,
      complianceStatus: compData.complianceStatus,
      cybersecurityStatus: compData.cybersecurityStatus,
      dataPrivacyStatus: compData.dataPrivacyStatus,
      procurementReadiness: compData.procurementReadiness,
      requiredCertifications: compData.requiredCertifications,
      pilotDurationDays: compData.pilotDurationDays,
      pilotTeamSummary: compData.pilotTeamSummary,
      infrastructureRequirements: compData.infrastructureRequirements,
      implementationDependencies: compData.implementationDependencies,
      deploymentRequirements: compData.deploymentRequirements,
      estimatedPilotBudget: compData.estimatedPilotBudget,
      scalingRequirements: compData.scalingRequirements,
      origin: DataOrigin.DEMO,
      scenarioId: scenario.id,
    };

    const startup = existing
      ? await prisma.startup.update({ where: { id: existing.id }, data: startupData })
      : await prisma.startup.create({ data: startupData });

    startupMap[compData.key] = startup.id;
    console.log(`Ingested Startup: ${startup.displayName} (${startup.id})`);

    // Ingest Documents for this startup
    const compDocs = docs.filter((d) => d.company === compData.key);
    console.log(`Importing ${compDocs.length} documents for ${compData.displayName}...`);

    for (const docItem of compDocs) {
      // Find or create Document by fileHash
      let doc = await prisma.document.findFirst({
        where: { fileHash: docItem.fileHash },
      });

      if (!doc) {
        doc = await prisma.document.create({
          data: {
            kind: mapKind(docItem.category),
            title: docItem.title,
            publisher: 'Sarthi Demo Simulation',
            url: null,
            retrievedAt: new Date(),
            origin: DataOrigin.DEMO,
            fileHash: docItem.fileHash,
            originalPath: docItem.originalFilename,
            extractedText: docItem.extractedText,
          },
        });
      }

      // Create StartupDocument relationship
      await prisma.startupDocument.upsert({
        where: {
          startupId_documentId: {
            startupId: startup.id,
            documentId: doc.id,
          },
        },
        create: {
          startupId: startup.id,
          documentId: doc.id,
          category: docItem.category,
          label: docItem.title,
        },
        update: {
          category: docItem.category,
          label: docItem.title,
        },
      });
    }

    // Add Demo Funding Round if applicable
    const existingFunding = await prisma.fundingRound.findFirst({
      where: { startupId: startup.id },
    });

    if (!existingFunding) {
      await prisma.fundingRound.create({
        data: {
          startupId: startup.id,
          roundType: compData.key === 'CIVORA' ? 'Pre-Series A (Demonstration)' : 'Seed Grant (Demonstration)',
          amount: compData.key === 'CIVORA' ? 15000000.0 : 5000000.0,
          announcedOn: new Date('2025-06-15'),
          investors: ['Sarthi Demo Innovation Fund'],
          origin: DataOrigin.DEMO,
        },
      });
    }
  }

  // 5. Ingest Light Startups (3 synthetic)
  for (const lc of LIGHT_COMPANIES) {
    const existing = await prisma.startup.findFirst({ where: { legalName: lc.legalName } });

    const startupData = {
      legalName: lc.legalName,
      displayName: lc.displayName,
      oneLineDescription: lc.oneLineDescription,
      description: lc.solutionSummary,
      sector: lc.sector,
      industry: lc.industry,
      stage: lc.stage,
      state: lc.state,
      city: lc.city,
      website: lc.website,
      foundedYear: lc.foundedYear,
      teamSize: lc.teamSize,
      founderSummary: lc.founderSummary,
      problemSolved: lc.problemSolved,
      solutionSummary: lc.solutionSummary,
      technologies: lc.technologies,
      capabilities: lc.capabilities,
      pilotDurationDays: lc.pilotDurationDays,
      pilotTeamSummary: lc.pilotTeamSummary,
      infrastructureRequirements: lc.infrastructureRequirements,
      deploymentRequirements: lc.deploymentRequirements,
      estimatedPilotBudget: lc.estimatedPilotBudget,
      complianceStatus: lc.complianceStatus,
      cybersecurityStatus: lc.cybersecurityStatus,
      dataPrivacyStatus: lc.dataPrivacyStatus,
      procurementReadiness: lc.procurementReadiness,
      origin: DataOrigin.DEMO,
      scenarioId: scenario.id,
    };

    const startup = existing
      ? await prisma.startup.update({ where: { id: existing.id }, data: startupData })
      : await prisma.startup.create({ data: startupData });

    console.log(`Ingested Light Startup: ${startup.displayName} (${startup.id})`);
  }

  // 6. Setup Demo Challenge & Matches
  const challengeTitle = 'Municipal Waste & Urban Operations Optimization';
  const existingCh = await prisma.challenge.findFirst({
    where: { title: challengeTitle, scenarioId: scenario.id },
  });

  const challengeData = {
    ownerUserId: owner.id,
    department: 'Municipal Urban Administration & Environmental Department',
    title: challengeTitle,
    problemStatement:
      'Cities face route inefficiencies, high fuel costs, unmonitored waste collection, and asset tracking gaps. Implement AI/IoT pilot to optimize route efficiency by 20%.',
    domain: 'municipal-waste-management',
    technologies: ['ai', 'iot', 'gis', 'analytics'],
    targetMetric: 'Route Efficiency Gain',
    targetValue: 20.0,
    pilotDurationDays: 90,
    status: 'PUBLISHED' as const,
    origin: DataOrigin.DEMO,
    demoScenario: SCENARIO_NAME,
    scenarioId: scenario.id,
  };

  const challenge = existingCh
    ? await prisma.challenge.update({ where: { id: existingCh.id }, data: challengeData })
    : await prisma.challenge.create({ data: challengeData });

  console.log(`Demo Challenge created: ${challenge.title} (${challenge.id})`);

  // Generate Responses & Matches for all 5 startups
  const allStartups = await prisma.startup.findMany({
    where: { scenarioId: scenario.id },
  });

  for (const s of allStartups) {
    const respData = {
      challengeId: challenge.id,
      startupId: s.id,
      solutionSummary: s.solutionSummary ?? 'Proposed AI/IoT municipal optimization solution.',
      capabilities: s.capabilities,
      technologies: s.technologies,
      deploymentApproach: 'Phased ward-by-ward deployment with IoT gateway setup.',
      expectedResult: '20% route optimization & verified collection audit trail.',
      pilotApproach: '30-day baseline capture followed by 60-day optimized route operations.',
      evidenceReferences: ['Technical Spec', 'Municipal Pilot Plan', 'Data Protection Policy'],
      status: 'SUBMITTED' as const,
      submittedByUserId: owner.id,
      submittedAt: new Date(),
      origin: DataOrigin.DEMO,
    };

    const response = await prisma.challengeResponse.upsert({
      where: { challengeId_startupId: { challengeId: challenge.id, startupId: s.id } },
      create: respData,
      update: { status: 'SUBMITTED' },
    });

    const matchResult = scoreMatch({
      challenge,
      startup: s,
      response,
      governmentEngagements: s.governmentExperienceSummary ? 1 : 0,
    });

    await prisma.startupMatch.upsert({
      where: { challengeId_startupId: { challengeId: challenge.id, startupId: s.id } },
      create: {
        challengeId: challenge.id,
        startupId: s.id,
        problemFitScore: matchResult.problemFitScore,
        technicalFitScore: matchResult.technicalFitScore,
        deploymentReadinessScore: matchResult.deploymentReadinessScore,
        governmentExperienceScore: matchResult.governmentExperienceScore,
        evidenceStrengthScore: matchResult.evidenceStrengthScore,
        pilotReadinessScore: matchResult.pilotReadinessScore,
        overallScore: matchResult.overallScore,
        breakdown: matchResult.breakdown as never,
        rationale: matchResult.rationale,
        status: 'SUGGESTED',
      },
      update: {
        problemFitScore: matchResult.problemFitScore,
        technicalFitScore: matchResult.technicalFitScore,
        deploymentReadinessScore: matchResult.deploymentReadinessScore,
        governmentExperienceScore: matchResult.governmentExperienceScore,
        evidenceStrengthScore: matchResult.evidenceStrengthScore,
        pilotReadinessScore: matchResult.pilotReadinessScore,
        overallScore: matchResult.overallScore,
        breakdown: matchResult.breakdown as never,
        rationale: matchResult.rationale,
      },
    });
  }

  console.log('\n==========================================');
  console.log('SARTHI DEMO INGESTION COMPLETE');
  console.log(`Scenario: ${scenario.name}`);
  console.log(`Startups Imported: ${allStartups.length} (all origin = DEMO)`);
  console.log(`Total Document Relationships: ${await prisma.startupDocument.count()}`);
  console.log('==========================================\n');
}

async function reset() {
  const scenario = await prisma.simulationScenario.findFirst({ where: { name: SCENARIO_NAME } });
  if (!scenario) return console.log('Nothing to reset — no such scenario.');

  await prisma.userProfile.updateMany({
    where: { startup: { scenarioId: scenario.id } },
    data: { startupId: null },
  });

  await prisma.simulationScenario.delete({ where: { id: scenario.id } });
  console.log('Demo Scenario reset complete — all scenario records removed cleanly.');
}

const action = process.argv[2];
(action === 'reset' ? reset() : seed())
  .catch((e) => {
    console.error('Execution failed:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
