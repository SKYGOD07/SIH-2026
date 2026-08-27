import type { Startup } from '@/types/platform';

/** DEMONSTRATION DATA — simulated startup records. Not a real registry extract. */

export const STARTUPS: Startup[] = [
  {
    id: 'ST-0417',
    name: 'HydroAI',
    technologies: ['Computer Vision', 'IoT', 'Acoustic Sensing'],
    matchScore: 94,
    trl: 8,
    governmentDeployments: 4,
    previousPilots: 3,
    pilotSuccessScore: 91,
    complianceStatus: 'VERIFIED',
    headquarters: 'Pune, Maharashtra',
    founded: '2019',
    fundingRaised: 42000000,
    summary:
      'Acoustic and pressure-signature leak localisation on existing distribution mains, with no excavation required for detection.',
    evidence: [
      { year: '2019', label: 'Founding', detail: 'Incorporated in Pune. DPIIT recognised.', kind: 'founding' },
      { year: '2021', label: 'Funding', detail: '₹4.2Cr raised across two rounds.', kind: 'funding' },
      { year: '2022', label: 'Deployment', detail: 'Deployed on 180 km of mains with two utilities.', kind: 'deployment' },
      { year: '2024', label: 'Government pilot', detail: 'Nashik Municipal Corporation, 2 wards, 120 days.', kind: 'pilot' },
      { year: '2025', label: 'Validated result', detail: '26% water-loss reduction, independently verified.', kind: 'validated' },
    ],
  },
  {
    id: 'ST-0912',
    name: 'AquaSense',
    technologies: ['IoT', 'Edge Analytics'],
    matchScore: 87,
    trl: 7,
    governmentDeployments: 2,
    previousPilots: 2,
    pilotSuccessScore: 84,
    complianceStatus: 'VERIFIED',
    headquarters: 'Nagpur, Maharashtra',
    founded: '2020',
    fundingRaised: 18000000,
    summary:
      'Low-power inline flow and pressure sensing with district-metered-area balance reconciliation.',
    evidence: [
      { year: '2020', label: 'Founding', detail: 'Incorporated in Nagpur.', kind: 'founding' },
      { year: '2022', label: 'Funding', detail: '₹1.8Cr seed round.', kind: 'funding' },
      { year: '2023', label: 'Deployment', detail: 'Two urban local bodies, 40 metered areas.', kind: 'deployment' },
      { year: '2024', label: 'Government pilot', detail: 'Amravati, 1 zone, 90 days.', kind: 'pilot' },
      { year: '2025', label: 'Validated result', detail: '19% loss reduction against baseline.', kind: 'validated' },
    ],
  },
  {
    id: 'ST-1183',
    name: 'LeakVision',
    technologies: ['Computer Vision', 'Thermal Imaging', 'Drones'],
    matchScore: 81,
    trl: 6,
    governmentDeployments: 1,
    previousPilots: 1,
    pilotSuccessScore: 76,
    complianceStatus: 'IN_REVIEW',
    headquarters: 'Bengaluru, Karnataka',
    founded: '2021',
    fundingRaised: 31000000,
    summary:
      'Thermal-drone survey of surface anomalies over buried mains, paired with a repair-priority model.',
    evidence: [
      { year: '2021', label: 'Founding', detail: 'Incorporated in Bengaluru.', kind: 'founding' },
      { year: '2023', label: 'Funding', detail: '₹3.1Cr Series A.', kind: 'funding' },
      { year: '2024', label: 'Deployment', detail: 'One utility, 60 km surveyed.', kind: 'deployment' },
      { year: '2025', label: 'Government pilot', detail: 'Hubballi, 1 ward, 60 days.', kind: 'pilot' },
      { year: '2025', label: 'Validated result', detail: 'Partial — coverage below plan.', kind: 'validated' },
    ],
  },
  {
    id: 'ST-0288',
    name: 'FleetSignal',
    technologies: ['Telematics', 'Predictive Maintenance'],
    matchScore: 78,
    trl: 8,
    governmentDeployments: 3,
    previousPilots: 4,
    pilotSuccessScore: 88,
    complianceStatus: 'VERIFIED',
    headquarters: 'Aurangabad, Maharashtra',
    founded: '2018',
    fundingRaised: 26000000,
    summary: 'Vibration and CAN-bus signature models for heavy passenger fleets.',
    evidence: [
      { year: '2018', label: 'Founding', detail: 'Incorporated in Aurangabad.', kind: 'founding' },
      { year: '2021', label: 'Funding', detail: '₹2.6Cr raised.', kind: 'funding' },
      { year: '2023', label: 'Deployment', detail: 'Three state transport depots.', kind: 'deployment' },
      { year: '2024', label: 'Government pilot', detail: 'MSRTC Solapur, 140 vehicles.', kind: 'pilot' },
      { year: '2025', label: 'Validated result', detail: '24% breakdown reduction.', kind: 'validated' },
    ],
  },
  {
    id: 'ST-0733',
    name: 'TerraGrid',
    technologies: ['Remote Sensing', 'Geospatial ML'],
    matchScore: 72,
    trl: 7,
    governmentDeployments: 2,
    previousPilots: 2,
    pilotSuccessScore: 80,
    complianceStatus: 'VERIFIED',
    headquarters: 'Nashik, Maharashtra',
    founded: '2019',
    fundingRaised: 15000000,
    summary: 'Multispectral change detection for land, crop and infrastructure assessment.',
    evidence: [
      { year: '2019', label: 'Founding', detail: 'Incorporated in Nashik.', kind: 'founding' },
      { year: '2022', label: 'Funding', detail: '₹1.5Cr seed.', kind: 'funding' },
      { year: '2023', label: 'Deployment', detail: 'Two district administrations.', kind: 'deployment' },
      { year: '2024', label: 'Government pilot', detail: 'Vidarbha crop survey, 3 talukas.', kind: 'pilot' },
      { year: '2025', label: 'Validated result', detail: 'Assessment time cut from 21 to 9 days.', kind: 'validated' },
    ],
  },
  {
    id: 'ST-1402',
    name: 'CivicLens',
    technologies: ['NLP', 'Multilingual ASR'],
    matchScore: 69,
    trl: 6,
    governmentDeployments: 1,
    previousPilots: 1,
    pilotSuccessScore: 74,
    complianceStatus: 'ACTION_REQUIRED',
    headquarters: 'Mumbai, Maharashtra',
    founded: '2022',
    fundingRaised: 9000000,
    summary: 'Marathi, Hindi and English grievance classification with routing confidence.',
    evidence: [
      { year: '2022', label: 'Founding', detail: 'Incorporated in Mumbai.', kind: 'founding' },
      { year: '2024', label: 'Funding', detail: '₹90L pre-seed.', kind: 'funding' },
      { year: '2024', label: 'Deployment', detail: 'One collectorate helpdesk.', kind: 'deployment' },
      { year: '2025', label: 'Government pilot', detail: 'Thane, 60 days.', kind: 'pilot' },
      { year: '2025', label: 'Validated result', detail: 'Routing accuracy 84%.', kind: 'validated' },
    ],
  },
  {
    id: 'ST-0559',
    name: 'AirLattice',
    technologies: ['Sensor Networks', 'Calibration ML'],
    matchScore: 66,
    trl: 7,
    governmentDeployments: 2,
    previousPilots: 3,
    pilotSuccessScore: 82,
    complianceStatus: 'VERIFIED',
    headquarters: 'Pune, Maharashtra',
    founded: '2020',
    fundingRaised: 21000000,
    summary: 'Reference-anchored low-cost sensor networks with drift correction.',
    evidence: [
      { year: '2020', label: 'Founding', detail: 'Incorporated in Pune.', kind: 'founding' },
      { year: '2022', label: 'Funding', detail: '₹2.1Cr raised.', kind: 'funding' },
      { year: '2023', label: 'Deployment', detail: 'Two pollution control boards.', kind: 'deployment' },
      { year: '2024', label: 'Government pilot', detail: 'Chandrapur belt, 90 days.', kind: 'pilot' },
      { year: '2025', label: 'Validated result', detail: '±11% against reference stations.', kind: 'validated' },
    ],
  },
  {
    id: 'ST-1077',
    name: 'RouteMesh',
    technologies: ['Optimisation', 'Fleet Telematics'],
    matchScore: 61,
    trl: 8,
    governmentDeployments: 3,
    previousPilots: 3,
    pilotSuccessScore: 86,
    complianceStatus: 'VERIFIED',
    headquarters: 'Nagpur, Maharashtra',
    founded: '2017',
    fundingRaised: 34000000,
    summary: 'Constraint-based route planning for municipal collection fleets.',
    evidence: [
      { year: '2017', label: 'Founding', detail: 'Incorporated in Nagpur.', kind: 'founding' },
      { year: '2020', label: 'Funding', detail: '₹3.4Cr raised.', kind: 'funding' },
      { year: '2022', label: 'Deployment', detail: 'Three municipal corporations.', kind: 'deployment' },
      { year: '2024', label: 'Government pilot', detail: 'Nagpur NMC, 6 zones.', kind: 'pilot' },
      { year: '2025', label: 'Validated result', detail: '17% fleet distance reduction.', kind: 'validated' },
    ],
  },
];

export const getStartup = (id: string) => STARTUPS.find((s) => s.id === id);

/** The three finalists surfaced by the discovery sequence, in rank order. */
export const SHORTLIST = ['ST-0417', 'ST-0912', 'ST-1183']
  .map((id) => STARTUPS.find((s) => s.id === id))
  .filter((s): s is Startup => Boolean(s));

export const PRIMARY_STARTUP = SHORTLIST[0];

/**
 * The discovery funnel. Each step is a visible filtering pass over the node
 * field, with the rule that produced it — never an unexplained jump.
 */
export const DISCOVERY_FUNNEL: { count: number; rule: string; caption: string }[] = [
  { count: 2481, rule: 'Recognised startup databases', caption: 'Indexed startups' },
  { count: 142, rule: 'Sector + capability relevance', caption: 'Sector relevant' },
  { count: 23, rule: 'TRL ≥ 6 and deployable at ward scale', caption: 'Readiness cleared' },
  { count: 8, rule: 'Eligibility and compliance screening passed', caption: 'Eligible' },
  { count: 3, rule: 'Prior evidence in comparable deployments', caption: 'Shortlisted for evaluation' },
];

export const COMPLIANCE_LABEL: Record<Startup['complianceStatus'], string> = {
  VERIFIED: 'Verified',
  IN_REVIEW: 'In review',
  ACTION_REQUIRED: 'Action required',
};
