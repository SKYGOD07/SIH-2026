/**
 * The seven team-owned companies: full profiles and a procurement dossier.
 *
 *   python scripts/parse-team-files.py     # once, to manifest the real files
 *   npm run demo:seed-team
 *
 * Three jobs.
 *
 * **Promote.** Two accounts had no company and no source material — both `data/`
 * folders are empty. Rather than invent two more fictions for a dataset that
 * already holds five hundred, two existing synthetic companies are moved across:
 * they keep their id, funding history and programme participation, and gain a
 * full profile and a dossier. Nothing is created and nothing is deleted.
 *
 * **Profile.** Every team company gets every field a government reader looks at
 * filled in. Three of them were near-empty records — a name, a sector and one
 * line — which read on screen as a company that had disclosed nothing.
 *
 * **Dossier.** Real files first: `data/<email>/` holds five actual documents
 * that were never ingested, and those are registered as themselves with their
 * real path and SHA-256. Mock documents fill only the categories no real file
 * covers, so a genuine document is never shadowed by a placeholder.
 *
 * WHAT THE MOCK DOCUMENTS ARE
 *
 * The catalogue is taken from the team's own due-diligence workbook
 * (`WaterManager_Government_Funding_Due_Diligence.xlsx`), which is the closest
 * thing this project has to a specification of what a department asks a startup
 * for. Each mock document records the requirement, why it is asked for, and what
 * the real document must contain.
 *
 * **No mock document carries a statutory identifier.** No CIN, PAN, GSTIN, Udyam
 * or DPIIT number is generated, not even a marked-dummy one — a well-formed fake
 * survives being copied out of the interface into a form, and the project's
 * standing rules forbid creating them. The record says which document is needed
 * and what it must show; supplying the number is the company's job.
 *
 * Every mock document's text opens with a disclaimer line, so a retrieval answer
 * that quotes one carries the caveat inside the quotation rather than beside it.
 * `verify-demo.ts` fails if that line ever goes missing.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AssuranceStatus, DataOrigin, DocumentKind, Prisma, PrismaClient, ReadinessLevel } from '@prisma/client';
import { TEAM_COMPANIES } from './team';

const prisma = new PrismaClient();

/** Marks documents this script owns. Distinct from the synthetic `demo://dossier/`. */
const TEAM_URI = 'demo://team-dossier';
const MOCK_PUBLISHER = 'Sarthi demonstration workspace';

/** The first line of every mock document. Asserted by `verify-demo.ts`. */
const MOCK_DISCLAIMER =
  'SIMULATED PLACEHOLDER — this is not a filed document. It records a procurement requirement for a demonstration company and contains no statutory identifier, no financial particulars and no signature.';

/* ------------------------------------------------------------------ */
/* The dossier catalogue                                               */
/* ------------------------------------------------------------------ */

interface DocSpec {
  slug: string;
  category: string;
  kind: DocumentKind;
  title: string;
  /** Why a department asks for it — from the team's due-diligence workbook. */
  why: string;
  /** What the real document has to show when it replaces this placeholder. */
  contains: string;
}

const CATALOGUE: DocSpec[] = [
  // --- corporate ---------------------------------------------------------
  { slug: 'incorporation', category: 'CORPORATE_LEGAL', kind: DocumentKind.ELIGIBILITY,
    title: 'Certificate of incorporation',
    why: 'Confirms the legal existence of the applicant entity.',
    contains: 'Registrar-issued incorporation certificate showing the corporate identity number, date of incorporation and registered office.' },
  { slug: 'moa-aoa', category: 'CORPORATE_LEGAL', kind: DocumentKind.ELIGIBILITY,
    title: 'Memorandum and articles of association',
    why: 'Confirms the objects of the company, its governance and who may bind it.',
    contains: 'The MoA and AoA as filed, showing that the stated business activity falls within the objects clause.' },
  { slug: 'board-resolution', category: 'CORPORATE_LEGAL', kind: DocumentKind.ELIGIBILITY,
    title: 'Board resolution authorising the submission',
    why: 'Shows the person signing the bid is authorised to commit the company.',
    contains: 'A certified board resolution naming the authorised signatory and the scope of their authority.' },

  // --- identity and registrations ---------------------------------------
  { slug: 'pan', category: 'KYC', kind: DocumentKind.ELIGIBILITY,
    title: 'Permanent account number record',
    why: 'Tax and entity identification.',
    contains: 'The company PAN as issued. Not reproduced here.' },
  { slug: 'gst', category: 'KYC', kind: DocumentKind.ELIGIBILITY,
    title: 'GST registration record',
    why: 'Tax compliance and invoicing.',
    contains: 'The GST registration certificate for the state of operation, where registration applies.' },
  { slug: 'udyam', category: 'KYC', kind: DocumentKind.ELIGIBILITY,
    title: 'Udyam / MSME registration record',
    why: 'MSME classification, where the scheme extends benefits on that basis.',
    contains: 'The Udyam registration certificate showing the enterprise classification.' },
  { slug: 'dpiit', category: 'KYC', kind: DocumentKind.ELIGIBILITY,
    title: 'DPIIT startup recognition record',
    why: 'May establish startup eligibility and procurement relaxations.',
    contains: 'The DPIIT recognition certificate and its validity period.' },
  { slug: 'signatory', category: 'KYC', kind: DocumentKind.ELIGIBILITY,
    title: 'Authorised signatory letter and identity proof',
    why: 'Vendor verification.',
    contains: 'A signatory authorisation letter with government-issued identity proof.' },

  // --- ownership ---------------------------------------------------------
  { slug: 'shareholding', category: 'OWNERSHIP', kind: DocumentKind.ELIGIBILITY,
    title: 'Shareholding pattern and beneficial ownership',
    why: 'Procurement integrity and conflict screening.',
    contains: 'The current cap table and declared beneficial owners above the applicable threshold.' },

  // --- finance -----------------------------------------------------------
  { slug: 'financials', category: 'FINANCIAL', kind: DocumentKind.ELIGIBILITY,
    title: 'Audited financial statements',
    why: 'Financial due diligence.',
    contains: 'Audited or CA-certified statements for the last two completed financial years.' },
  { slug: 'turnover', category: 'FINANCIAL', kind: DocumentKind.ELIGIBILITY,
    title: 'Chartered accountant turnover certificate',
    why: 'Tests the turnover threshold most tenders set.',
    contains: 'A CA-signed certificate stating annual turnover for the qualifying years.' },
  { slug: 'bank', category: 'FINANCIAL', kind: DocumentKind.ELIGIBILITY,
    title: 'Bank account details and cancelled cheque',
    why: 'Disbursement and vendor verification.',
    contains: 'Account particulars and a cancelled cheque. Account numbers are not reproduced here.' },
  { slug: 'bank-statements', category: 'FINANCIAL', kind: DocumentKind.ELIGIBILITY,
    title: 'Bank statements for the qualifying period',
    why: 'Financial capacity.',
    contains: 'Statements covering the period the scheme specifies, typically the last twelve months.' },
  { slug: 'budget-plan', category: 'FINANCIAL', kind: DocumentKind.PROCUREMENT,
    title: 'Budget and utilisation plan',
    why: 'Shows how public money would be spent.',
    contains: 'A milestone-linked budget by head, with the company contribution shown separately.' },

  // --- compliance --------------------------------------------------------
  { slug: 'non-blacklisting', category: 'COMPLIANCE', kind: DocumentKind.ELIGIBILITY,
    title: 'Non-blacklisting and debarment declaration',
    why: 'Standard procurement due diligence.',
    contains: 'A declaration on letterhead that the company is not debarred by any government body.' },
  { slug: 'conflict', category: 'COMPLIANCE', kind: DocumentKind.ELIGIBILITY,
    title: 'Conflict-of-interest declaration',
    why: 'Protects procurement integrity.',
    contains: 'A declaration of any relationship with the procuring department or its officers.' },
  { slug: 'labour', category: 'COMPLIANCE', kind: DocumentKind.ELIGIBILITY,
    title: 'PF, ESI and labour registration record',
    why: 'Employment compliance, where the workforce size makes it applicable.',
    contains: 'Registration certificates, or a reasoned statement that the thresholds are not met.' },
  { slug: 'sector-compliance', category: 'COMPLIANCE', kind: DocumentKind.ELIGIBILITY,
    title: 'Sectoral compliance plan',
    why: 'Shows the deployment would be lawful in its own domain.',
    contains: 'The regulatory approvals the deployment depends on, and who holds each.' },

  // --- technology --------------------------------------------------------
  { slug: 'architecture', category: 'TECHNOLOGY', kind: DocumentKind.IP_DATA,
    title: 'Technical architecture and integration approach',
    why: 'Technology assessment.',
    contains: 'Component architecture, integration points with departmental systems, and hosting.' },
  { slug: 'security', category: 'TECHNOLOGY', kind: DocumentKind.CYBERSECURITY,
    title: 'Security assessment and controls summary',
    why: 'Cyber-risk assessment before a system touches departmental data.',
    contains: 'The most recent vulnerability assessment, the controls in place, and open findings.' },
  { slug: 'ip', category: 'TECHNOLOGY', kind: DocumentKind.IP_DATA,
    title: 'Intellectual property ownership declaration',
    why: 'Confirms the right to license the software, hardware and models offered.',
    contains: 'Ownership of each component, and the licence terms of anything third-party.' },
  { slug: 'data-protection', category: 'TECHNOLOGY', kind: DocumentKind.IP_DATA,
    title: 'Data processing and protection terms',
    why: 'Required wherever personal or sensitive operational data is processed.',
    contains: 'What data is processed, on what basis, where it is held, and for how long.' },

  // --- AI governance -----------------------------------------------------
  { slug: 'ai-governance', category: 'AI_GOVERNANCE', kind: DocumentKind.OTHER,
    title: 'Model governance and human-oversight note',
    why: 'Establishes that an automated output is advisory and who reviews it.',
    contains: 'Which decisions are model-assisted, what a human reviews, and how errors are corrected.' },

  // --- pilot -------------------------------------------------------------
  { slug: 'pilot-proposal', category: 'PILOT', kind: DocumentKind.PILOT_REPORT,
    title: 'Pilot proposal and methodology',
    why: 'Allows an outcome-based evaluation rather than a product comparison.',
    contains: 'Scope, phases, the baseline to be captured, and what would count as success.' },
  { slug: 'kpi-plan', category: 'PILOT', kind: DocumentKind.PILOT_REPORT,
    title: 'KPI and acceptance plan',
    why: 'Makes the pilot measurable and the payment defensible.',
    contains: 'Each KPI with its baseline, target, measurement method and evidence source.' },
  { slug: 'past-performance', category: 'PILOT', kind: DocumentKind.PILOT_REPORT,
    title: 'Past performance and deployment evidence',
    why: 'Evidence of capability.',
    contains: 'Prior deployments with client, scope and outcome. Only genuine evidence belongs here.' },

  // --- procurement -------------------------------------------------------
  { slug: 'project-proposal', category: 'GOVERNMENT_FUNDING', kind: DocumentKind.PROCUREMENT,
    title: 'Detailed project proposal',
    why: 'States the problem, the solution, the milestones and the outcomes.',
    contains: 'The full proposal as it would be submitted to the scheme.' },
  { slug: 'bid-pack', category: 'GOVERNMENT_FUNDING', kind: DocumentKind.PROCUREMENT,
    title: 'Technical and financial bid pack',
    why: 'Formal procurement evaluation.',
    contains: 'The technical bid and the sealed financial bid in the format the tender specifies.' },

  // --- checklist ---------------------------------------------------------
  { slug: 'checklist', category: 'CHECKLIST', kind: DocumentKind.OTHER,
    title: 'Government due-diligence checklist',
    why: 'Tracks which of the above is ready and which is outstanding.',
    contains: 'Every requirement above with an owner and a status.' },
];

/* ------------------------------------------------------------------ */
/* The profiles                                                        */
/* ------------------------------------------------------------------ */

type Profile = Omit<Prisma.StartupUpdateInput, 'origin' | 'source' | 'scenario' | 'owner'>;

const PROFILES: Record<string, Profile> = {
  CIVORA: {
    displayName: 'CIVORA',
    oneLineDescription: 'AI and IoT CleanCity OS for municipal solid waste and urban operations.',
    description:
      'Municipal collection rounds are reported as completed without evidence that they happened, and segregation compliance is unmeasured at the point it is decided. CleanCity OS combines route optimisation, vehicle telemetry and collection-point imaging so a ward officer can see which rounds ran, which points were missed and how segregation is trending.',
    sector: 'municipal-waste-management', industry: 'Urban Operations', stage: 'GROWTH',
    state: 'Maharashtra', city: 'Mumbai', website: 'https://civora.example',
    dpiitStatus: 'Recognition claimed by the company. Not verified — simulated record.',
    foundedYear: 2021, teamSize: 22,
    founderSummary:
      'Founded by an urban-operations engineer and a computer-vision researcher who had previously delivered ward-level collection analytics for a municipal concessionaire.',
    keyTeamMembers: [
      { role: 'Founder & CEO', experience: 'Municipal operations and concession management.' },
      { role: 'Chief Technology Officer', experience: 'Computer vision and edge deployment at scale.' },
      { role: 'Head of Deployment', experience: 'Field rollout across ward-level vehicle fleets.' },
    ] as Prisma.InputJsonValue,
    problemSolved: 'Collection rounds are unverified and segregation compliance is unmeasured.',
    solutionSummary: 'Route telemetry and collection-point imaging, scored by ward.',
    productSummary:
      'CleanCity OS: RouteAI for round planning, Track for vehicle telemetry, and Vision for collection-point image scoring. Delivered as SaaS with an IoT edge component on vehicles.',
    targetUsers: 'Municipal corporations, ward officers and collection concessionaires',
    deploymentModel: 'SaaS + IoT edge', geographicCoverage: 'Maharashtra',
    technologies: ['ai', 'iot', 'gis', 'computer-vision', 'analytics'],
    capabilities: ['route-optimization', 'vehicle-tracking', 'segregation-analytics', 'citizen-reporting'],
    revenueBand: '₹50L – ₹2 Cr', customerCount: 4, deploymentCount: 5,
    commercializationStage: 'Commercialised',
    complianceStatus: AssuranceStatus.SELF_DECLARED,
    cybersecurityStatus: AssuranceStatus.SELF_DECLARED,
    dataPrivacyStatus: AssuranceStatus.SELF_DECLARED,
    procurementReadiness: ReadinessLevel.HIGH,
    requiredCertifications: ['Data processing agreement', 'Security assessment report'],
    pilotDurationDays: 90,
    pilotTeamSummary: 'Four engineers, a deployment lead and a field coordinator for the pilot ward.',
    infrastructureRequirements: 'Vehicle mounting access, site connectivity and departmental data access.',
    implementationDependencies: 'Integration with the existing vehicle-tracking and complaint systems.',
    deploymentRequirements: 'Ward survey, vehicle instrumentation and staged rollout across collection points.',
    estimatedPilotBudget: 2_800_000,
    scalingRequirements: 'City-wide rollout with per-ward tenancy separation and municipal SSO.',
  },

  HIX: {
    displayName: 'HIX',
    oneLineDescription: 'Warehouse-receipt financing with real-time collateral monitoring.',
    description:
      'Cultivators holding produce in a warehouse cannot borrow against it because the collateral cannot be verified continuously, and lenders will not price a risk they cannot see. AgriVault issues digital warehouse receipts and monitors stored collateral, so a receipt becomes something a lender can lend against.',
    sector: 'agri-fintech-health', industry: 'Financial Services', stage: 'EARLY_REVENUE',
    state: 'Maharashtra', city: 'Pune', website: 'https://hix.example',
    dpiitStatus: 'Recognition claimed by the company. Not verified — simulated record.',
    foundedYear: 2022, teamSize: 16,
    founderSummary:
      'Founded by a rural-lending product lead and an IoT engineer, following work on collateral monitoring for a cooperative warehouse network.',
    keyTeamMembers: [
      { role: 'Founder & CEO', experience: 'Rural credit products and lender partnerships.' },
      { role: 'Head of Engineering', experience: 'IoT collateral monitoring and settlement systems.' },
      { role: 'Head of Risk', experience: 'Credit risk analytics for agricultural lending.' },
    ] as Prisma.InputJsonValue,
    problemSolved: 'Stored agricultural produce cannot be used as collateral because it cannot be verified.',
    solutionSummary: 'Digital warehouse receipts with continuous collateral monitoring and lender settlement.',
    productSummary:
      'AgriVault: digital receipt issuance, sensor-based collateral monitoring, and a credit-risk view lenders can underwrite against. Delivered as a hosted platform with warehouse-side hardware.',
    targetUsers: 'Warehouse operators, agricultural lenders and farmer producer organisations',
    deploymentModel: 'Hybrid cloud', geographicCoverage: 'Western India',
    technologies: ['fintech', 'blockchain', 'iot', 'cloud'],
    capabilities: ['warehouse-receipt-financing', 'collateral-tracking', 'credit-risk-analytics'],
    revenueBand: '₹20L – ₹50L', customerCount: 3, deploymentCount: 3,
    commercializationStage: 'Commercialised',
    complianceStatus: AssuranceStatus.SELF_DECLARED,
    cybersecurityStatus: AssuranceStatus.SELF_DECLARED,
    dataPrivacyStatus: AssuranceStatus.SELF_DECLARED,
    procurementReadiness: ReadinessLevel.MODERATE,
    requiredCertifications: ['Data processing agreement', 'Security assessment report'],
    pilotDurationDays: 120,
    pilotTeamSummary: 'Three engineers, a risk analyst and a warehouse deployment coordinator.',
    infrastructureRequirements: 'Warehouse-side sensor installation and lender system access.',
    implementationDependencies: 'Agreement with a participating lender and a warehouse operator.',
    deploymentRequirements: 'Warehouse survey, sensor commissioning and receipt-issuance onboarding.',
    estimatedPilotBudget: 2_200_000,
    scalingRequirements: 'Multi-warehouse rollout with lender-side API integration and audit separation.',
  },

  'Crop Saver': {
    displayName: 'Crop Saver',
    oneLineDescription: 'Early pest and disease detection to prevent avoidable crop loss.',
    description:
      'Pest and disease damage is usually identified only once it is visible, by which point the loss has happened. Field imaging with early detection puts a treatment advisory in the cultivator\'s hands while intervention still changes the outcome.',
    sector: 'agritech', industry: 'Agriculture', stage: 'EARLY_REVENUE',
    state: 'Maharashtra', city: 'Nashik', website: 'https://cropsaver.example',
    dpiitStatus: 'Recognition claimed by the company. Not verified — simulated record.',
    foundedYear: 2022, teamSize: 13,
    founderSummary:
      'Founded by an agricultural scientist and a machine-learning engineer after fieldwork on grape and onion disease pressure in the Nashik belt.',
    keyTeamMembers: [
      { role: 'Founder & CEO', experience: 'Plant pathology and extension advisory.' },
      { role: 'Head of Machine Learning', experience: 'Image classification for agricultural disease detection.' },
      { role: 'Field Operations Lead', experience: 'Farmer producer organisation engagement.' },
    ] as Prisma.InputJsonValue,
    problemSolved: 'Pest and disease damage is identified after visible crop loss has occurred.',
    solutionSummary: 'Field imaging with early detection and treatment advisory to cultivators.',
    productSummary:
      'A mobile capture app with an on-device pest and disease classifier, backed by a vernacular advisory service and a district-level pressure map for the agriculture department.',
    targetUsers: 'Agriculture departments, farmer producer organisations and cultivators',
    deploymentModel: 'SaaS', geographicCoverage: 'Maharashtra',
    technologies: ['ai', 'computer-vision', 'mobile'],
    capabilities: ['pest-detection', 'advisory-delivery', 'field-deployment'],
    revenueBand: 'Under ₹25L', customerCount: 2, deploymentCount: 2,
    commercializationStage: 'Pre-commercial',
    complianceStatus: AssuranceStatus.SELF_DECLARED,
    cybersecurityStatus: AssuranceStatus.SELF_DECLARED,
    dataPrivacyStatus: AssuranceStatus.SELF_DECLARED,
    procurementReadiness: ReadinessLevel.MODERATE,
    requiredCertifications: ['Data processing agreement'],
    pilotDurationDays: 120,
    pilotTeamSummary: 'Two engineers, an agronomist and a field coordinator per district.',
    infrastructureRequirements: 'Extension-worker devices and district agriculture office data access.',
    implementationDependencies: 'Cooperation of the district agriculture office for advisory distribution.',
    deploymentRequirements: 'Cluster selection, extension-worker training and staged rollout by taluka.',
    estimatedPilotBudget: 1_800_000,
    scalingRequirements: 'District-wide rollout with crop-model expansion and vernacular coverage.',
  },

  WaterManager: {
    displayName: 'WaterManager',
    oneLineDescription: 'Distribution and reuse accountability for water utilities.',
    description:
      'Utilities cannot reconcile water produced against water billed, and treated water that could be reused is discharged because nobody can match supply to demand. District metering with reuse matching closes both gaps against one instrumented network.',
    sector: 'water-distribution', industry: 'Water & Utilities', stage: 'GROWTH',
    state: 'Maharashtra', city: 'Pune', website: 'https://watermanager.example',
    dpiitStatus: 'Recognition claimed by the company. Not verified — simulated record.',
    foundedYear: 2021, teamSize: 20,
    founderSummary:
      'Founded by a water-utility engineer and a data engineer after non-revenue-water work with a municipal water department.',
    keyTeamMembers: [
      { role: 'Founder & CEO', experience: 'Non-revenue water and district metered area design.' },
      { role: 'Chief Technology Officer', experience: 'SCADA integration and telemetry platforms.' },
      { role: 'Head of Compliance', experience: 'Treated-water reuse and discharge norms.' },
    ] as Prisma.InputJsonValue,
    problemSolved: 'Utilities cannot reconcile water produced against water billed, and treated water is not reused.',
    solutionSummary: 'District metering with consumption reconciliation, loss attribution and reuse matching.',
    productSummary:
      'Flow, level and quality telemetry across district metered areas, a reconciliation engine attributing losses, a forecasting model for demand and flow, and a GIS layer matching treatment output to nearby reuse demand.',
    targetUsers: 'Municipal water departments, sewerage boards and utility operators',
    deploymentModel: 'SaaS + IoT edge', geographicCoverage: 'Maharashtra',
    technologies: ['iot', 'scada', 'analytics', 'gis', 'forecasting'],
    capabilities: ['district-metering', 'leak-detection', 'billing-reconciliation', 'field-deployment'],
    revenueBand: '₹25L – ₹1 Cr', customerCount: 3, deploymentCount: 3,
    commercializationStage: 'Commercialised',
    complianceStatus: AssuranceStatus.SELF_DECLARED,
    cybersecurityStatus: AssuranceStatus.SELF_DECLARED,
    dataPrivacyStatus: AssuranceStatus.SELF_DECLARED,
    procurementReadiness: ReadinessLevel.HIGH,
    requiredCertifications: ['Data processing agreement', 'Security assessment report'],
    pilotDurationDays: 168,
    pilotTeamSummary: 'Four engineers, a project manager and field support for installation and calibration.',
    infrastructureRequirements: 'SCADA or API access, sensor mounting points and site connectivity.',
    implementationDependencies: 'Integration with the existing billing system and treatment-works telemetry.',
    deploymentRequirements: 'Asset baseline survey, sensor installation and commissioning across the pilot zone.',
    estimatedPilotBudget: 4_800_000,
    scalingRequirements: 'Zone-by-zone expansion with multi-tenant separation and departmental reporting.',
  },

  EnviroPlus: {
    displayName: 'EnviroPlus',
    oneLineDescription: 'Ambient air quality monitoring with source attribution.',
    description:
      'Air quality is measured at too few points to attribute pollution to a source, so enforcement acts on a city-wide average rather than on the street causing the problem. Distributed low-cost sensing, calibrated against reference stations, makes attribution possible at ward level.',
    sector: 'climate-environment', industry: 'Environment', stage: 'MVP',
    state: 'Maharashtra', city: 'Mumbai', website: 'https://enviroplus.example',
    dpiitStatus: 'Recognition claimed by the company. Not verified — simulated record.',
    foundedYear: 2023, teamSize: 11,
    founderSummary:
      'Founded by an environmental engineer and a sensor-hardware designer following calibration research with a state pollution control board.',
    keyTeamMembers: [
      { role: 'Founder & CEO', experience: 'Ambient air quality measurement and regulatory reporting.' },
      { role: 'Head of Hardware', experience: 'Low-cost sensor design and reference-station calibration.' },
      { role: 'Data Lead', experience: 'Source apportionment and spatial modelling.' },
    ] as Prisma.InputJsonValue,
    problemSolved: 'Air quality is measured at too few points to attribute pollution to sources.',
    solutionSummary: 'Distributed low-cost sensing calibrated against reference stations, with source apportionment.',
    productSummary:
      'A network of calibrated low-cost monitors, a calibration pipeline referenced to a nearby regulatory station, and an apportionment model producing ward-level source estimates with stated uncertainty.',
    targetUsers: 'Pollution control boards, municipal bodies and environment departments',
    deploymentModel: 'SaaS + IoT edge', geographicCoverage: 'Mumbai region',
    technologies: ['sensors', 'analytics', 'cloud', 'remote-sensing'],
    capabilities: ['air-quality-monitoring', 'emissions-accounting', 'compliance-reporting'],
    revenueBand: 'Pre-revenue', customerCount: 1, deploymentCount: 1,
    commercializationStage: 'Pre-commercial',
    complianceStatus: AssuranceStatus.SELF_DECLARED,
    cybersecurityStatus: AssuranceStatus.NOT_PROVIDED,
    dataPrivacyStatus: AssuranceStatus.SELF_DECLARED,
    procurementReadiness: ReadinessLevel.MODERATE,
    requiredCertifications: ['Sensor calibration record'],
    pilotDurationDays: 90,
    pilotTeamSummary: 'Two engineers, a calibration technician and a field installer.',
    infrastructureRequirements: 'Mounting points with power, and access to a reference station for calibration.',
    implementationDependencies: 'Co-location agreement with the regulatory reference station.',
    deploymentRequirements: 'Site selection, sensor installation and a calibration period before any claim.',
    estimatedPilotBudget: 1_400_000,
    scalingRequirements: 'Denser grid with recalibration scheduling and multi-board reporting.',
  },

  'Chalan Solutions': {
    displayName: 'Chalan Solutions',
    oneLineDescription: 'Demand-responsive scheduling for public transport undertakings.',
    description:
      'Public transport runs to timetables written from historical assumptions rather than observed demand, so buses run empty on one corridor while passengers are left behind on another. Scheduling driven by ticketing and vehicle telemetry moves capacity to where the demand actually is.',
    sector: 'urban-mobility', industry: 'Transport', stage: 'GROWTH',
    state: 'Maharashtra', city: 'Pimpri-Chinchwad', website: 'https://chalansolutions.example',
    dpiitStatus: 'Recognition claimed by the company. Not verified — simulated record.',
    foundedYear: 2020, teamSize: 24,
    founderSummary:
      'Founded by a transport planner and an operations-research engineer after scheduling work with a municipal transport undertaking.',
    keyTeamMembers: [
      { role: 'Founder & CEO', experience: 'Public transport planning and undertaking operations.' },
      { role: 'Head of Optimisation', experience: 'Vehicle scheduling and crew rostering under constraints.' },
      { role: 'Head of Integration', experience: 'Ticketing and automatic vehicle location systems.' },
    ] as Prisma.InputJsonValue,
    problemSolved: 'Public transport runs to timetables that do not reflect observed demand.',
    solutionSummary: 'Demand-responsive scheduling built from ticketing and vehicle telemetry.',
    productSummary:
      'A demand model built from ticketing records and AVL feeds, a scheduling optimiser producing depot-ready duty rosters, and an on-time performance dashboard for the undertaking.',
    targetUsers: 'Municipal transport undertakings and city transport authorities',
    deploymentModel: 'SaaS', geographicCoverage: 'Maharashtra',
    technologies: ['ai', 'gis', 'mobile', 'analytics'],
    capabilities: ['demand-forecasting', 'fleet-scheduling', 'ticketing-integration'],
    revenueBand: '₹25L – ₹1 Cr', customerCount: 3, deploymentCount: 4,
    commercializationStage: 'Commercialised',
    complianceStatus: AssuranceStatus.SELF_DECLARED,
    cybersecurityStatus: AssuranceStatus.SELF_DECLARED,
    dataPrivacyStatus: AssuranceStatus.SELF_DECLARED,
    procurementReadiness: ReadinessLevel.HIGH,
    requiredCertifications: ['Data processing agreement', 'Security assessment report'],
    pilotDurationDays: 120,
    pilotTeamSummary: 'Three engineers, a transport planner and a depot liaison.',
    infrastructureRequirements: 'Access to ticketing records and the vehicle location feed.',
    implementationDependencies: 'Integration with the undertaking\'s ticketing and AVL systems.',
    deploymentRequirements: 'Corridor selection, historical data extract and a parallel-run period before cutover.',
    estimatedPilotBudget: 3_200_000,
    scalingRequirements: 'Depot-by-depot rollout with crew-rostering rules configured per undertaking.',
  },

  'Rakshak Innovations': {
    displayName: 'Rakshak Innovations',
    oneLineDescription: 'A common operating picture for municipal emergency response.',
    description:
      'Emergency response is dispatched without a shared view of what is already happening, so two units arrive at one incident while another waits. A shared incident map with unit tracking gives the control room one picture and makes response time measurable afterwards.',
    sector: 'public-safety', industry: 'Safety', stage: 'GROWTH',
    state: 'Maharashtra', city: 'Nanded', website: 'https://rakshakinnovations.example',
    dpiitStatus: 'Recognition claimed by the company. Not verified — simulated record.',
    foundedYear: 2021, teamSize: 18,
    founderSummary:
      'Founded by a former control-room operations lead and a geospatial engineer after work on incident coordination for a city fire service.',
    keyTeamMembers: [
      { role: 'Founder & CEO', experience: 'Emergency control-room operations and dispatch protocol.' },
      { role: 'Head of Geospatial', experience: 'Real-time mapping and unit tracking systems.' },
      { role: 'Head of Deployment', experience: 'Control-room integration and operator training.' },
    ] as Prisma.InputJsonValue,
    problemSolved: 'Emergency response is dispatched without a common operating picture.',
    solutionSummary: 'A shared incident map with unit tracking and response-time measurement.',
    productSummary:
      'An incident intake and mapping console, live unit tracking across participating services, and a post-incident analytics view reporting response times by zone and incident type.',
    targetUsers: 'City control rooms, municipal emergency services and disaster management cells',
    deploymentModel: 'On-premise', geographicCoverage: 'Maharashtra',
    technologies: ['analytics', 'gis', 'computer-vision', 'cloud'],
    capabilities: ['incident-coordination', 'response-analytics', 'surveillance-integration'],
    revenueBand: 'Under ₹25L', customerCount: 2, deploymentCount: 2,
    commercializationStage: 'Commercialised',
    complianceStatus: AssuranceStatus.SELF_DECLARED,
    cybersecurityStatus: AssuranceStatus.SELF_DECLARED,
    dataPrivacyStatus: AssuranceStatus.SELF_DECLARED,
    procurementReadiness: ReadinessLevel.HIGH,
    requiredCertifications: ['Security assessment report', 'Data processing agreement'],
    pilotDurationDays: 90,
    pilotTeamSummary: 'Three engineers, a control-room trainer and an integration lead.',
    infrastructureRequirements: 'Control-room hardware, on-premise hosting and radio or GPS feed access.',
    implementationDependencies: 'Integration with existing dispatch and surveillance systems.',
    deploymentRequirements: 'Control-room survey, operator training and a shadow-running period.',
    estimatedPilotBudget: 2_600_000,
    scalingRequirements: 'Additional services onboarded onto the shared map with role-based access.',
  },
};

/* ------------------------------------------------------------------ */
/* Funding, so the disclosure graphs have points to draw               */
/* ------------------------------------------------------------------ */

/**
 * Simulated funding disclosure.
 *
 * Needed because a company with one round and no dates draws a funding timeline
 * with a single point, which is not a chart. Amounts are round numbers in bands,
 * not precise figures that would imply a verification nobody performed, and
 * `investors` stays empty rather than naming a real firm on a fabricated round.
 */
const FUNDING: Record<string, [string, number, string][]> = {
  CIVORA: [['Pre-seed', 3_500_000, '2022-04-01'], ['Seed', 18_000_000, '2023-09-01']],
  HIX: [['Pre-seed', 2_500_000, '2023-02-01'], ['Seed', 12_000_000, '2024-08-01']],
  'Crop Saver': [['Grant', 1_500_000, '2023-01-01'], ['Pre-seed', 4_000_000, '2024-06-01']],
  WaterManager: [['Seed', 15_000_000, '2022-11-01'], ['Series A', 60_000_000, '2024-10-01']],
  EnviroPlus: [['Grant', 1_200_000, '2024-03-01'], ['Pre-seed', 3_000_000, '2025-05-01']],
  'Chalan Solutions': [['Seed', 20_000_000, '2022-07-01'], ['Series A', 75_000_000, '2024-05-01']],
  'Rakshak Innovations': [['Pre-seed', 4_500_000, '2022-09-01'], ['Seed', 16_000_000, '2024-02-01']],
};

/* ------------------------------------------------------------------ */

interface ManifestEntry {
  ownerEmail: string; filename: string; path: string;
  sha256: string; sizeBytes: number; extension: string; extractedText: string | null;
}

/** Which company a real file in `data/<email>/` belongs to. */
function companyForFile(filename: string, ownerCompanies: string[]): string {
  const f = filename.toLowerCase().replace(/[^a-z]/g, '');
  const match = ownerCompanies.find((c) => f.includes(c.toLowerCase().replace(/[^a-z]/g, '')));
  // A file naming no company (a generic requirements workbook) goes to the
  // owner's primary company rather than being dropped.
  return match ?? ownerCompanies[0];
}

function categoryForFile(filename: string): { category: string; kind: DocumentKind } {
  const f = filename.toLowerCase();
  if (f.includes('legal')) return { category: 'CORPORATE_LEGAL', kind: DocumentKind.ELIGIBILITY };
  if (f.includes('due_diligence') || f.includes('duediligence')) return { category: 'CHECKLIST', kind: DocumentKind.OTHER };
  if (f.includes('funding') || f.includes('requirements')) return { category: 'GOVERNMENT_FUNDING', kind: DocumentKind.PROCUREMENT };
  return { category: 'OTHER', kind: DocumentKind.OTHER };
}

async function main() {
  /* --- 0. the manifest of real files ------------------------------------ */

  let manifest: ManifestEntry[] = [];
  try {
    manifest = JSON.parse(readFileSync(join(__dirname, 'team_files.json'), 'utf-8')) as ManifestEntry[];
  } catch {
    console.log('No team_files.json — run `python scripts/parse-team-files.py` first to');
    console.log('register the real document packs. Continuing with mock documents only.\n');
  }

  const scenario =
    (await prisma.simulationScenario.findFirst({ where: { name: 'SIH 2026 — Innovation Procurement Demo' } })) ??
    (await prisma.simulationScenario.findFirst({ orderBy: { createdAt: 'asc' } }));
  if (!scenario) {
    console.error('No SimulationScenario. Run `npm run demo:seed` first.');
    process.exitCode = 1;
    return;
  }

  /* --- 1. profiles, including the two promotions ------------------------ */

  const resolved: { spec: (typeof TEAM_COMPANIES)[number]; id: string }[] = [];

  for (const spec of TEAM_COMPANIES) {
    const existing = await prisma.startup.findFirst({
      where: { legalName: spec.legalName },
      select: { id: true, displayName: true, origin: true, scenarioId: true },
    });
    if (!existing) {
      console.log(`  ! ${spec.displayName}: no company row found for "${spec.legalName}" — skipped`);
      continue;
    }

    const profile = PROFILES[spec.displayName];
    if (!profile) {
      console.log(`  ! ${spec.displayName}: no profile defined — skipped`);
      continue;
    }

    await prisma.startup.update({
      where: { id: existing.id },
      data: { ...profile, scenarioId: scenario.id, origin: DataOrigin.DEMO },
    });
    resolved.push({ spec, id: existing.id });
    const note = spec.promotedFromSynthetic ? 'promoted from the synthetic population' : 'profile written';
    console.log(`  ${spec.displayName.padEnd(20)} ${note}`);
  }

  /* --- 2. the real files ------------------------------------------------ */

  const byEmail = new Map<string, string[]>();
  TEAM_COMPANIES.forEach((c) => {
    byEmail.set(c.ownerEmail, [...(byEmail.get(c.ownerEmail) ?? []), c.displayName]);
  });
  const idByDisplay = new Map(resolved.map((r) => [r.spec.displayName, r.id]));

  let realFiled = 0;
  let realSkipped = 0;
  for (const entry of manifest) {
    const candidates = byEmail.get(entry.ownerEmail);
    if (!candidates) continue;
    const display = companyForFile(entry.filename, candidates);
    const startupId = idByDisplay.get(display);
    if (!startupId) continue;

    // Keyed on the real content hash, so re-running never files a second copy
    // and a genuinely changed file is recognised as a new document.
    const already = await prisma.document.findFirst({ where: { fileHash: entry.sha256 }, select: { id: true } });
    if (already) {
      realSkipped += 1;
      continue;
    }

    const { category, kind } = categoryForFile(entry.filename);
    await prisma.document.create({
      data: {
        kind,
        title: entry.filename.replace(/\.[a-z]+$/i, '').replace(/_/g, ' '),
        publisher: `${display} — document pack supplied by the company`,
        retrievedAt: new Date(),
        origin: DataOrigin.DEMO,
        originalPath: entry.path,
        fileHash: entry.sha256,
        // Present for the spreadsheets, absent for the PDFs — this environment
        // has no PDF parser, and "filed but not ingested" is the honest state.
        extractedText: entry.extractedText,
        startupDocuments: { create: { startupId, category, label: entry.filename } },
      },
    });
    realFiled += 1;
    console.log(`  filed real file  ${display.padEnd(20)} ${entry.filename}${entry.extractedText ? '  (text ingested)' : ''}`);
  }

  /* --- 3. mock documents, only where a category is bare ----------------- */

  let mockFiled = 0;
  for (const { spec, id } of resolved) {
    const held = await prisma.startupDocument.findMany({ where: { startupId: id }, select: { category: true } });
    const covered = new Set(held.map((d) => d.category));

    const existingMock = await prisma.document.findMany({
      where: { originalPath: { startsWith: `${TEAM_URI}/${id}/` } },
      select: { originalPath: true },
    });
    const filed = new Set(existingMock.map((d) => d.originalPath));

    /*
     * A mock document is added only where the company holds nothing in that
     * category. CIVORA and HIX arrive with 33 real documents each, so most of
     * the catalogue is skipped for them — a placeholder standing beside a real
     * filing is worse than no placeholder, because it dilutes the one piece of
     * evidence that is actually worth reading.
     */
    const wanted = CATALOGUE.filter((d) => !covered.has(d.category));
    const specs = wanted.length > 0
      ? CATALOGUE.filter((d) => wanted.some((w) => w.category === d.category))
      : [];

    for (const d of specs) {
      const path = `${TEAM_URI}/${id}/${d.slug}`;
      if (filed.has(path)) continue;

      await prisma.document.create({
        data: {
          kind: d.kind,
          title: `${d.title} — ${spec.displayName} (mock)`,
          publisher: MOCK_PUBLISHER,
          retrievedAt: new Date(),
          origin: DataOrigin.DEMO,
          originalPath: path,
          fileHash: null,
          extractedText: [
            MOCK_DISCLAIMER,
            '',
            `Requirement: ${d.title}`,
            `Category: ${d.category}`,
            `Why a department asks for it: ${d.why}`,
            `What the real document must contain: ${d.contains}`,
            '',
            `Status: placeholder. ${spec.displayName} must attach the real document before this requirement can be treated as met.`,
          ].join('\n'),
          startupDocuments: { create: { startupId: id, category: d.category, label: d.title } },
        },
      });
      mockFiled += 1;
    }
  }

  /* --- 4. funding disclosure -------------------------------------------- */

  let roundsAdded = 0;
  for (const { spec, id } of resolved) {
    const have = await prisma.fundingRound.count({ where: { startupId: id } });
    // Two points make a line. A company that already discloses two or more keeps
    // exactly what it disclosed.
    if (have >= 2) continue;

    const rounds = FUNDING[spec.displayName] ?? [];
    for (const [roundType, amount, on] of rounds) {
      const dup = await prisma.fundingRound.findFirst({ where: { startupId: id, roundType }, select: { id: true } });
      if (dup) continue;
      await prisma.fundingRound.create({
        data: {
          startupId: id, roundType, amount,
          announcedOn: new Date(on),
          investors: [],
          origin: DataOrigin.DEMO,
        },
      });
      roundsAdded += 1;
    }
  }

  /* --- report ----------------------------------------------------------- */

  console.log(`\nreal files filed      : ${realFiled}  (${realSkipped} already present)`);
  console.log(`mock documents filed  : ${mockFiled}`);
  console.log(`funding rounds added  : ${roundsAdded}`);

  const rows = await prisma.$queryRawUnsafe<
    { display_name: string; evidence_completeness: number; document_count: bigint; funding_round_count: bigint; government_experience: string }[]
  >(`
    SELECT s."displayName" AS display_name, d.evidence_completeness, d.document_count,
           d.funding_round_count, d.government_experience
      FROM startups s JOIN startup_derived_metrics d ON d.startup_id = s.id
     WHERE s."displayName" = ANY($1)
     ORDER BY d.evidence_completeness DESC
  `, TEAM_COMPANIES.map((c) => c.displayName));

  console.log('\n  company              evidence  docs  rounds  government experience');
  rows.forEach((r) =>
    console.log(
      `  ${r.display_name.padEnd(20)} ${String(r.evidence_completeness).padStart(7)}%  ${String(r.document_count).padStart(4)}  ${String(r.funding_round_count).padStart(6)}  ${r.government_experience}`,
    ),
  );

  console.log('\nMock documents are placeholders. None carries a statutory identifier, and each');
  console.log('opens with a disclaimer so a quoted passage carries its own caveat.');
  console.log('Next: `npm run demo:seed-accounts` (needs SUPABASE_SECRET_KEY).');
}

main()
  .catch((e) => {
    console.error('\nFAILED', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
