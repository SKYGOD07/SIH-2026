/**
 * Demonstration workspace initialisation.
 *
 *   npm run demo:seed     create or update the workspace
 *   npm run demo:reset    delete it and everything it produced
 *
 * Idempotent: every write is keyed on a stable natural key, so running it twice
 * updates rather than duplicates. That matters more than it sounds — a seed you
 * are afraid to re-run is a seed nobody re-runs, and the demonstration drifts.
 *
 * Three rules this script will not break:
 *
 *   1. **It creates no authentication accounts.** Real teammates sign up
 *      themselves and *claim* a company; a seeded auth user would be a fake
 *      person with a password nobody knows.
 *
 *   2. **Every record it writes is `DEMO`.** Nothing here is VERIFIED, nothing
 *      cites an invented source, and no company is described as real.
 *
 *   3. **It records no outcomes.** No `achievedValue`, no closed pilot, no
 *      scale decision. Those are produced by running the workflow, which is the
 *      thing being demonstrated — pre-baking them would demonstrate nothing.
 */
import { AssuranceStatus, DataOrigin, PrismaClient, ReadinessLevel, UserRole } from '@prisma/client';
import { scoreMatch } from '../src/workflow/matching';

const prisma = new PrismaClient();

const SCENARIO = 'SIH 2026 — Smart Water Innovation';

/**
 * Five companies, deliberately unalike.
 *
 * If they were interchangeable the ranking would be noise and the comparison
 * screen would prove nothing. Each is strong on a different axis and visibly
 * weak on another, so the ordering the engine produces is explicable from the
 * inputs — which is the whole point of a deterministic matcher.
 */
const COMPANIES = [
  {
    key: 'A',
    legalName: 'Simulated Startup A — Water Analytics',
    oneLineDescription: 'Analytics platform for municipal water loss (simulated company).',
    sector: 'water-distribution',
    technologies: ['ai', 'analytics', 'cloud'],
    capabilities: ['demand-forecasting', 'anomaly-detection', 'reporting'],
    problemSolved: 'Utilities hold meter data but cannot tell where losses occur.',
    solutionSummary: 'Analytics over existing district meter data to localise probable loss zones.',
    pilotDurationDays: 90,
    pilotTeamSummary: 'Two data engineers and an analyst.',
    infrastructureRequirements: 'Read access to district meter exports. No field hardware.',
    deploymentRequirements: 'Cloud hosting; no on-site installation.',
    teamSize: 11,
    complianceStatus: AssuranceStatus.SELF_DECLARED,
    cybersecurityStatus: AssuranceStatus.NOT_PROVIDED,
    strength: 'strong software and analytics; no government delivery history',
  },
  {
    key: 'B',
    legalName: 'Simulated Startup B — IoT Leakage Detection',
    oneLineDescription: 'Acoustic IoT leak detection for distribution networks (simulated company).',
    sector: 'water-distribution',
    technologies: ['iot', 'acoustic-sensing', 'edge-computing'],
    capabilities: ['leak-detection', 'real-time-monitoring', 'field-deployment'],
    problemSolved: 'Leaks in buried mains go undetected until they surface.',
    solutionSummary:
      'Acoustic sensors on the network stream to a gateway and localise leaks continuously.',
    pilotDurationDays: 90,
    pilotTeamSummary: 'Field engineering crew of four plus a deployment lead.',
    infrastructureRequirements: 'Access to chambers and hydrants; municipal gateway connectivity.',
    deploymentRequirements: 'Physical node installation across the pilot wards.',
    teamSize: 18,
    complianceStatus: AssuranceStatus.SELF_DECLARED,
    cybersecurityStatus: AssuranceStatus.SELF_DECLARED,
    strength: 'strongest technical and deployment fit for network leakage',
  },
  {
    key: 'C',
    legalName: 'Simulated Startup C — Wastewater Treatment',
    oneLineDescription: 'Effluent treatment and monitoring (simulated company).',
    sector: 'wastewater',
    technologies: ['chemical-treatment', 'sensors'],
    capabilities: ['lab-analysis', 'effluent-monitoring', 'field-operations'],
    problemSolved: 'Treatment plants exceed discharge limits without early warning.',
    solutionSummary: 'Inline monitoring and dosing control at treatment works.',
    pilotDurationDays: 120,
    pilotTeamSummary: 'Process engineers and a sampling team.',
    teamSize: 24,
    complianceStatus: AssuranceStatus.SELF_DECLARED,
    strength: 'strong field operations, different technology domain',
  },
  {
    key: 'D',
    legalName: 'Simulated Startup D — Municipal Operations',
    oneLineDescription: 'Works management and integration for municipal bodies (simulated company).',
    sector: 'municipal-operations',
    technologies: ['workflow', 'integration', 'cloud'],
    capabilities: ['systems-integration', 'crew-scheduling', 'reporting'],
    problemSolved: 'Detected faults are not converted into completed repair work.',
    solutionSummary: 'Integrates detection into municipal work orders and tracks closure.',
    pilotDurationDays: 60,
    pilotTeamSummary: 'Integration consultant and two engineers.',
    infrastructureRequirements: 'API access to the existing works-management system.',
    teamSize: 30,
    complianceStatus: AssuranceStatus.SELF_DECLARED,
    dataPrivacyStatus: AssuranceStatus.SELF_DECLARED,
    strength: 'strong integration and workflow, weaker domain specialisation',
  },
  {
    key: 'E',
    legalName: 'Simulated Startup E — Infrastructure Monitoring',
    oneLineDescription: 'Condition monitoring for water infrastructure (simulated company).',
    sector: 'water-distribution',
    technologies: ['iot', 'sensors'],
    capabilities: ['real-time-monitoring', 'condition-assessment'],
    problemSolved: 'Asset condition is unknown until failure.',
    solutionSummary: 'Pressure and flow monitoring across the network with condition scoring.',
    pilotDurationDays: 90,
    teamSize: 7,
    strength: 'relevant monitoring capability, least deployment maturity',
  },
] as const;

const RESPONSES: Record<string, { deploymentApproach: string; expectedResult: string; pilotApproach: string; evidenceReferences: string[] }> = {
  A: {
    deploymentApproach: 'Ingest existing district meter exports nightly; no field installation required.',
    expectedResult: 'Identify probable loss zones so crews are sent to the right place.',
    pilotApproach: 'Thirty-day baseline from historical exports, then weekly zone reports.',
    evidenceReferences: ['Model validation note'],
  },
  B: {
    deploymentApproach:
      'Install acoustic nodes across the pilot wards and stream continuously to the municipal gateway.',
    expectedResult: 'Locate leaks earlier and reduce measured water loss over the pilot period.',
    pilotApproach:
      'Thirty-day baseline capture, staged deployment ward by ward, weekly reconciliation against district meters.',
    evidenceReferences: ['Deployment log', 'Node uptime record', 'Calibration report'],
  },
  C: {
    deploymentApproach: 'Install inline monitoring at the treatment works.',
    expectedResult: 'Reduce discharge exceedances.',
    pilotApproach: 'Weekly sampling against laboratory reference.',
    evidenceReferences: ['Sampling protocol'],
  },
  D: {
    deploymentApproach: 'Integrate with the existing works-management system through its API.',
    expectedResult: 'Shorten the time from fault detection to completed repair.',
    pilotApproach: 'Baseline current repair turnaround, then measure after integration.',
    evidenceReferences: ['Integration specification', 'Turnaround baseline'],
  },
  E: {
    deploymentApproach: 'Fit pressure and flow sensors at network nodes.',
    expectedResult: 'Surface abnormal pressure patterns.',
    pilotApproach: 'Continuous monitoring with monthly review.',
    evidenceReferences: [],
  },
};

async function reset() {
  const scenario = await prisma.simulationScenario.findFirst({ where: { name: SCENARIO } });
  if (!scenario) return console.log('nothing to reset — no such scenario');

  // Detach any owners first, or the cascade cannot remove claimed companies.
  await prisma.userProfile.updateMany({
    where: { startup: { scenarioId: scenario.id } },
    data: { startupId: null },
  });
  await prisma.simulationScenario.delete({ where: { id: scenario.id } });
  console.log('scenario deleted, with every record it produced');
}

async function seed() {
  /*
   * The workspace needs a real owner. This script does not create one: a seeded
   * government account would be a fabricated officer, which this project does
   * not do under any circumstances.
   */
  const owner =
    (await prisma.userProfile.findFirst({ where: { role: UserRole.GOVERNMENT_OFFICER } })) ??
    (await prisma.userProfile.findFirst({ where: { role: UserRole.ADMIN } }));

  if (!owner) {
    console.error(
      'No GOVERNMENT_OFFICER or ADMIN profile exists yet.\n' +
        'Sign up and confirm a government account first — this script will not create one.',
    );
    process.exitCode = 1;
    return;
  }

  const scenario = await prisma.simulationScenario.upsert({
    where: { id: (await prisma.simulationScenario.findFirst({ where: { name: SCENARIO } }))?.id ?? '00000000-0000-0000-0000-000000000000' },
    create: {
      name: SCENARIO,
      description:
        'Controlled demonstration of the full procurement lifecycle. Companies and challenge are simulated; the workflow, users and records are real.',
      status: 'ACTIVE',
      createdByUserId: owner.id,
    },
    update: { status: 'ACTIVE' },
  });

  // --- the five companies, keyed by legal name so re-runs update -----------
  const startups = [];
  for (const c of COMPANIES) {
    const existing = await prisma.startup.findFirst({ where: { legalName: c.legalName } });
    const data = {
      legalName: c.legalName,
      oneLineDescription: c.oneLineDescription,
      sector: c.sector,
      technologies: [...c.technologies],
      capabilities: [...c.capabilities],
      problemSolved: c.problemSolved,
      solutionSummary: c.solutionSummary,
      pilotDurationDays: c.pilotDurationDays,
      pilotTeamSummary: 'pilotTeamSummary' in c ? c.pilotTeamSummary : null,
      infrastructureRequirements:
        'infrastructureRequirements' in c ? c.infrastructureRequirements : null,
      deploymentRequirements: 'deploymentRequirements' in c ? c.deploymentRequirements : null,
      teamSize: c.teamSize,
      complianceStatus: 'complianceStatus' in c ? c.complianceStatus : AssuranceStatus.NOT_PROVIDED,
      cybersecurityStatus:
        'cybersecurityStatus' in c ? c.cybersecurityStatus : AssuranceStatus.NOT_PROVIDED,
      dataPrivacyStatus:
        'dataPrivacyStatus' in c ? c.dataPrivacyStatus : AssuranceStatus.NOT_PROVIDED,
      procurementReadiness: ReadinessLevel.NOT_ASSESSED,
      requiredCertifications: [],
      origin: DataOrigin.DEMO,
      scenarioId: scenario.id,
    };
    const row = existing
      ? await prisma.startup.update({ where: { id: existing.id }, data })
      : await prisma.startup.create({ data });
    startups.push({ ...c, id: row.id, row });
  }

  // --- the challenge -------------------------------------------------------
  const title = 'Smart Water Loss Reduction';
  const existingCh = await prisma.challenge.findFirst({ where: { title, scenarioId: scenario.id } });
  const challengeData = {
    ownerUserId: owner.id,
    department: 'Simulated Municipal Water Department',
    title,
    problemStatement:
      'Municipal water distribution suffers unidentified leakage and non-revenue water. Reduce measurable water loss during a controlled pilot.',
    domain: 'water-distribution',
    technologies: ['iot', 'acoustic-sensing'],
    targetMetric: 'water loss',
    targetValue: 20,
    pilotDurationDays: 90,
    status: 'PUBLISHED' as const,
    origin: DataOrigin.DEMO,
    demoScenario: SCENARIO,
    scenarioId: scenario.id,
  };
  const challenge = existingCh
    ? await prisma.challenge.update({ where: { id: existingCh.id }, data: challengeData })
    : await prisma.challenge.create({ data: challengeData });

  // --- responses -----------------------------------------------------------
  //
  // Attributed to the seeding user, because no startup has claimed a company
  // yet and `submittedByUserId` must point at a real account. Once a teammate
  // claims a company they can edit and resubmit their own response, which
  // replaces this one.
  for (const s of startups) {
    const r = RESPONSES[s.key];
    await prisma.challengeResponse.upsert({
      where: { challengeId_startupId: { challengeId: challenge.id, startupId: s.id } },
      create: {
        challengeId: challenge.id,
        startupId: s.id,
        solutionSummary: s.solutionSummary,
        capabilities: [...s.capabilities],
        technologies: [...s.technologies],
        deploymentApproach: r.deploymentApproach,
        expectedResult: r.expectedResult,
        pilotApproach: r.pilotApproach,
        evidenceReferences: r.evidenceReferences,
        status: 'SUBMITTED',
        submittedByUserId: owner.id,
        submittedAt: new Date(),
        origin: DataOrigin.DEMO,
      },
      update: { status: 'SUBMITTED' },
    });
  }

  // --- deterministic matches ----------------------------------------------
  for (const s of startups) {
    const response = await prisma.challengeResponse.findUniqueOrThrow({
      where: { challengeId_startupId: { challengeId: challenge.id, startupId: s.id } },
    });
    const engagements = await prisma.startupProgramParticipation.count({
      where: { startupId: s.id },
    });
    const result = scoreMatch({
      challenge,
      startup: s.row,
      response,
      governmentEngagements: engagements,
    });
    await prisma.startupMatch.upsert({
      where: { challengeId_startupId: { challengeId: challenge.id, startupId: s.id } },
      create: {
        challengeId: challenge.id,
        startupId: s.id,
        problemFitScore: result.problemFitScore,
        technicalFitScore: result.technicalFitScore,
        deploymentReadinessScore: result.deploymentReadinessScore,
        governmentExperienceScore: result.governmentExperienceScore,
        evidenceStrengthScore: result.evidenceStrengthScore,
        pilotReadinessScore: result.pilotReadinessScore,
        overallScore: result.overallScore,
        breakdown: result.breakdown as never,
        rationale: result.rationale,
        status: 'SUGGESTED',
      },
      update: {
        problemFitScore: result.problemFitScore,
        technicalFitScore: result.technicalFitScore,
        deploymentReadinessScore: result.deploymentReadinessScore,
        governmentExperienceScore: result.governmentExperienceScore,
        evidenceStrengthScore: result.evidenceStrengthScore,
        pilotReadinessScore: result.pilotReadinessScore,
        overallScore: result.overallScore,
        breakdown: result.breakdown as never,
        rationale: result.rationale,
      },
    });
  }

  await prisma.challenge.update({ where: { id: challenge.id }, data: { status: 'MATCHING' } });

  const ranked = await prisma.startupMatch.findMany({
    where: { challengeId: challenge.id },
    include: { startup: { select: { legalName: true } } },
    orderBy: { overallScore: 'desc' },
  });

  console.log(`\nscenario   ${scenario.name}`);
  console.log(`challenge  ${challenge.title}  [${challenge.status}]`);
  console.log(`companies  ${startups.length} (all DEMO, all unclaimed until a teammate claims one)`);
  console.log('\nranking (deterministic, no model involved):');
  ranked.forEach((m, i) =>
    console.log(`  ${i + 1}. ${(m.overallScore * 100).toFixed(0).padStart(3)}  ${m.startup.legalName}`),
  );
  console.log('\nNo pilot, no measurement and no outcome were created.');
  console.log('Those are produced by running the workflow, which is the thing being demonstrated.');
}

const mode = process.argv[2];
(mode === 'reset' ? reset() : seed())
  .catch((e) => {
    console.error('FAILED', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
