import { PrismaClient, DataOrigin } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Phase 3 test data...');

  const scenario = await prisma.simulationScenario.findFirst();
  const scenarioId = scenario?.id;

  // Startup 1: Strong evidence-backed government projects and high financial health.
  const startup1 = await prisma.startup.create({
    data: {
      legalName: 'AquaStream Technologies Pvt Ltd',
      displayName: 'AquaStream',
      sector: 'water-distribution',
      industry: 'CivicTech',
      oneLineDescription: 'Smart water leak detection using IoT and AI.',
      description: 'AquaStream provides robust IoT sensors and AI-driven analytics to detect water leaks in municipal pipelines.',
      foundedYear: 2018,
      teamSize: 120,
      
      // Phase 3 fields: Financial Health
      revenueTrend: 'Growing (+40% YoY)',
      cashPosition: 'Strong ($5M reserves)',
      burnBand: 'Low (Profitable)',
      runwayBand: '> 36 months',
      profitabilityStatus: 'Profitable',
      debtIndicators: 'No long-term debt',
      fundingDependence: 'Low (Self-sustaining)',
      
      // Phase 3 fields: Ownership
      founderOwnership: '60%',
      institutionalOwnership: '30%',
      otherOwnership: '10%',
      fundingHistory: 'Series A completed in 2021',
      publicMarketStatus: 'Privately Held',

      // Phase 3 fields: Delivery Capability
      teamCapacity: 'High (50+ field engineers)',
      implementationTeam: 'Dedicated enterprise deployment team',
      deploymentCapacity: 'Capable of concurrent city-wide deployments',
      supportModel: '24/7 SLA-backed support',
      integrationRequirements: 'REST APIs, SCADA integration',

      // Phase 3 fields: IP
      ipOwnershipStatus: 'Sole Owner',
      patentCount: 3,
      softwareOwnershipEvidence: 'Copyright registered',
      licensingConstraints: 'Proprietary SaaS',
      thirdPartyDependency: 'AWS Cloud',

      // Phase 3 fields: Regulatory
      securityPosture: 'ISO 27001 Certified',
      dataPrivacyPosture: 'DPDP Act Compliant',
      regulatoryDependencies: 'None',

      // Phase 3 fields: Customer Evidence
      deploymentSectors: ['water-distribution', 'smart-city'],
      deploymentGeographies: ['Maharashtra', 'Gujarat', 'Karnataka'],
      repeatDeployments: 5,
      projectOutcomesSummary: 'Saved 20M liters of water across 3 cities.',
      
      technologies: ['IoT', 'AI', 'Cloud Computing', 'SCADA'],
      capabilities: ['Hardware Manufacturing', 'Data Analytics', 'Field Deployment'],
      problemSolved: 'Municipal water loss due to undetected pipe leaks.',
      solutionSummary: 'A network of acoustic sensors deployed on pipes, analyzed in real-time to pinpoint leaks.',
      origin: DataOrigin.DEMO,
      scenarioId,
    },
  });

  // Funding Round for Startup 1
  await prisma.fundingRound.create({
    data: {
      startupId: startup1.id,
      roundType: 'Series A',
      amount: 4000000,
      currency: 'USD',
      instrument: 'Equity',
      announcedOn: new Date('2021-06-15'),
      investors: ['CivicVentures', 'WaterFund'],
      origin: DataOrigin.DEMO,
    }
  });

  // Strong, verified government project for Startup 1
  await prisma.startupProject.create({
    data: {
      startupId: startup1.id,
      projectName: 'Pune Smart Water Grid',
      clientType: 'GOVERNMENT',
      sector: 'water-distribution',
      location: 'Pune, Maharashtra',
      projectDescription: 'City-wide deployment of 5000 leak detection sensors.',
      startDate: new Date('2022-01-10'),
      endDate: new Date('2023-12-31'),
      status: 'COMPLETED',
      budgetBand: '$1M - $5M',
      deploymentCount: 1,
      outcomeSummary: 'Reduced non-revenue water by 15%.',
      evidenceStatus: 'VERIFIED',
      origin: DataOrigin.DEMO,
      scenarioId,
    }
  });

  // Startup 2: Startup-reported demo projects and different scaling capabilities.
  const startup2 = await prisma.startup.create({
    data: {
      legalName: 'EcoFlow Solutions LLP',
      displayName: 'EcoFlow',
      sector: 'water-distribution',
      industry: 'IoT',
      oneLineDescription: 'Drone-based water infrastructure inspection.',
      description: 'EcoFlow uses autonomous drones to visually inspect above-ground water infrastructure.',
      foundedYear: 2023,
      teamSize: 8,
      
      // Phase 3 fields: Financial Health
      revenueTrend: 'Pre-revenue',
      cashPosition: 'Weak ($50k runway)',
      burnBand: 'High relative to reserves',
      runwayBand: '3 - 6 months',
      profitabilityStatus: 'Loss-making',
      debtIndicators: 'Convertible notes outstanding',
      fundingDependence: 'High (Actively fundraising)',
      
      // Phase 3 fields: Ownership
      founderOwnership: '90%',
      institutionalOwnership: '0%',
      otherOwnership: '10%',
      fundingHistory: 'Seed round pending',
      publicMarketStatus: 'Privately Held',

      // Phase 3 fields: Delivery Capability
      teamCapacity: 'Low (2 drone operators)',
      implementationTeam: 'Founders lead all deployments',
      deploymentCapacity: 'One pilot at a time',
      supportModel: 'Best-effort email support',
      integrationRequirements: 'CSV exports',

      // Phase 3 fields: IP
      ipOwnershipStatus: 'Third-party hardware, own software',
      patentCount: 0,
      softwareOwnershipEvidence: 'Self-declared',
      licensingConstraints: 'Uses open-source extensively',
      thirdPartyDependency: 'DJI Drones, OpenDroneMap',

      // Phase 3 fields: Regulatory
      securityPosture: 'Self-assessed basic security',
      dataPrivacyPosture: 'No formal policy yet',
      regulatoryDependencies: 'DGCA drone flying permits',

      // Phase 3 fields: Customer Evidence
      deploymentSectors: ['water-distribution'],
      deploymentGeographies: ['Local testing'],
      repeatDeployments: 0,
      projectOutcomesSummary: 'Successfully mapped a 2km pipeline in a sandbox environment.',
      
      technologies: ['Drones', 'Computer Vision'],
      capabilities: ['Aerial Inspection', 'Image Processing'],
      problemSolved: 'Slow manual inspection of water assets.',
      solutionSummary: 'Drone flights that capture images and highlight visible damage.',
      origin: DataOrigin.DEMO,
      scenarioId,
    },
  });

  // Funding Round for Startup 2
  await prisma.fundingRound.create({
    data: {
      startupId: startup2.id,
      roundType: 'Pre-Seed',
      amount: 50000,
      currency: 'USD',
      instrument: 'Convertible Note',
      announcedOn: new Date('2023-08-01'),
      investors: ['Angel Investor'],
      origin: DataOrigin.DEMO,
    }
  });

  // Unverified/demo government project for Startup 2
  await prisma.startupProject.create({
    data: {
      startupId: startup2.id,
      projectName: 'Local Ward Drone Test',
      clientType: 'GOVERNMENT',
      sector: 'water-distribution',
      location: 'Ward Sandbox',
      projectDescription: 'Demonstration of drone capabilities over a local reservoir.',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-15'),
      status: 'COMPLETED',
      budgetBand: '< $10k',
      deploymentCount: 1,
      outcomeSummary: 'Proved flight stability and image capture.',
      evidenceStatus: 'SELF_DECLARED',
      origin: DataOrigin.DEMO,
      scenarioId,
    }
  });

  console.log('Created AquaStream (Strong/Verified) and EcoFlow (Weak/Demo)');
  console.log('Run the matching engine script (`npm run demo:responses`) to evaluate these across the new dimensions.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
