import type { Challenge } from '@/types/platform';

/**
 * DEMONSTRATION DATA — simulated departmental challenges.
 * Not real government records. See `DEMO_NOTICE`.
 */
export const DEMO_NOTICE =
  'Demonstration data. Departments, startups, pilots and outcomes shown here are simulated for this prototype and are not real government records.';

export const PRIMARY_CHALLENGE_ID = 'CH-2601';

export const CHALLENGES: Challenge[] = [
  {
    id: PRIMARY_CHALLENGE_ID,
    title: 'AI-Based Municipal Water Leakage Detection',
    department: 'Municipal Administration',
    sector: 'Water & Sanitation',
    budget: 1500000,
    duration: 90,
    target: '20% reduction in non-revenue water loss across the pilot wards',
    metrics: ['Water loss rate', 'Leak detection latency', 'Maintenance cost', 'Repair response time'],
    measurement: [
      { label: 'Water loss', baseline: '31%', target: '≤ 24.8%' },
      { label: 'Detection latency', baseline: '9 days', target: '≤ 48 hours' },
      { label: 'Maintenance cost', baseline: '₹42L / quarter', target: '↓ 15%' },
    ],
    rawNote:
      'Water supply lines in the older wards keep developing leaks and we only find out when residents complain or a road caves in. Repair teams are stretched, and a lot of treated water is lost before it reaches households. Costs keep going up every quarter.',
    location: 'Pune Municipal Corporation',
    pilotScope: '3 wards',
    status: 'PILOT',
    applications: 142,
    publishedOn: '2026-02-11',
  },
  {
    id: 'CH-2602',
    title: 'Predictive Maintenance for State Transport Bus Fleet',
    department: 'Transport',
    sector: 'Mobility',
    budget: 2200000,
    duration: 180,
    target: '30% reduction in unplanned breakdowns across three depots',
    metrics: ['Breakdown rate', 'Maintenance cost', 'Vehicle uptime', 'Prediction accuracy'],
    measurement: [
      { label: 'Unplanned breakdowns', baseline: '18 / 1000 km', target: '↓ 30%' },
      { label: 'Vehicle uptime', baseline: '86%', target: '≥ 92%' },
      { label: 'Prediction accuracy', baseline: '—', target: '≥ 80%' },
    ],
    rawNote:
      'Buses frequently break down and maintenance is expensive. Depot staff cannot tell which vehicles are about to fail, so servicing is either too early or too late. This has been the pattern for the last two quarters across our three main depots.',
    location: 'MSRTC — Nashik, Aurangabad, Solapur depots',
    pilotScope: '3 depots',
    status: 'OPEN',
    applications: 87,
    publishedOn: '2026-04-02',
  },
  {
    id: 'CH-2603',
    title: 'Air Quality Micro-Sensing for Industrial Corridors',
    department: 'Environment & Climate Change',
    sector: 'Environment',
    budget: 1800000,
    duration: 100,
    target: 'Ward-level PM2.5 attribution accurate to ±12% against reference stations',
    metrics: ['Attribution accuracy', 'Sensor uptime', 'Alert lead time'],
    measurement: [
      { label: 'Attribution accuracy', baseline: 'District only', target: '±12% ward level' },
      { label: 'Sensor uptime', baseline: '—', target: '≥ 95%' },
    ],
    rawNote:
      'We only have a handful of reference monitoring stations, so we cannot say which locality or which source is driving a bad air day. Enforcement action gets challenged because the data is too coarse.',
    location: 'Chandrapur Industrial Belt',
    pilotScope: '2 corridors',
    status: 'EVALUATION',
    applications: 64,
    publishedOn: '2026-03-18',
  },
  {
    id: 'CH-2604',
    title: 'Crop Damage Assessment from Satellite and Drone Imagery',
    department: 'Agriculture',
    sector: 'AgriTech',
    budget: 2600000,
    duration: 150,
    target: 'Reduce claim assessment time from 21 days to under 7 days',
    metrics: ['Assessment turnaround', 'Assessment variance', 'Claims reopened'],
    measurement: [
      { label: 'Assessment turnaround', baseline: '21 days', target: '≤ 7 days' },
      { label: 'Claims reopened', baseline: '14%', target: '≤ 6%' },
    ],
    rawNote:
      'After unseasonal rain, damage assessment depends on manual field visits. Farmers wait weeks for claims and disputes are common because two surveyors record different numbers for the same plot.',
    location: 'Vidarbha region',
    pilotScope: '4 talukas',
    status: 'OPEN',
    applications: 51,
    publishedOn: '2026-05-09',
  },
  {
    id: 'CH-2605',
    title: 'Solid Waste Route Optimisation for Municipal Fleets',
    department: 'Urban Development',
    sector: 'Urban Services',
    budget: 1200000,
    duration: 75,
    target: '18% reduction in collection fleet distance without reducing coverage',
    metrics: ['Fleet distance', 'Missed collection points', 'Fuel cost'],
    measurement: [
      { label: 'Fleet distance / day', baseline: '2,480 km', target: '↓ 18%' },
      { label: 'Missed pickups', baseline: '4.1%', target: '≤ 2%' },
    ],
    rawNote:
      'Collection routes were drawn years ago and never revised. Some trucks run half empty while other points get missed entirely, and fuel spend keeps climbing.',
    location: 'Nagpur Municipal Corporation',
    pilotScope: '6 zones',
    status: 'CLOSED',
    applications: 98,
    publishedOn: '2025-11-24',
  },
  {
    id: 'CH-2606',
    title: 'Assistive Grievance Triage for District Collectorates',
    department: 'General Administration',
    sector: 'Citizen Services',
    budget: 900000,
    duration: 60,
    target: 'Route 90% of grievances to the correct desk on first classification',
    metrics: ['First-pass routing accuracy', 'Time to first response', 'Escalation rate'],
    measurement: [
      { label: 'First-pass routing', baseline: '62%', target: '≥ 90%' },
      { label: 'Time to first response', baseline: '6.5 days', target: '≤ 2 days' },
    ],
    rawNote:
      'Grievances arrive through five different channels in three languages. Staff re-route a large share of them by hand, which is where most of the delay comes from.',
    location: 'Statewide — 4 pilot collectorates',
    pilotScope: '4 collectorates',
    status: 'DRAFT',
    applications: 0,
    publishedOn: '2026-06-30',
  },
];

export const getChallenge = (id: string) => CHALLENGES.find((c) => c.id === id);

export const PRIMARY_CHALLENGE = CHALLENGES[0];

/**
 * The worked example for the Define stage.
 *
 * `note` is the departmental message as written. Each highlight names the exact
 * span the corresponding structured field was derived from, so the reader can
 * see the parse rather than being asked to trust it.
 */
export const DEFINE_EXAMPLE = {
  challengeId: 'CH-2602',
  note: 'Buses frequently break down and maintenance is expensive. Depot staff cannot tell which vehicles are about to fail, so servicing is either too early or too late. This has been the pattern for the last two quarters across our three main depots.',
  highlights: [
    {
      key: 'problem',
      label: 'Problem',
      span: 'Buses frequently break down',
      value: 'Unplanned in-service vehicle failure',
    },
    {
      key: 'metric',
      label: 'Metric',
      span: 'maintenance is expensive',
      value: 'Breakdown rate and maintenance cost',
    },
    {
      key: 'location',
      label: 'Location',
      span: 'our three main depots',
      value: 'MSRTC — Nashik, Aurangabad, Solapur',
    },
    {
      key: 'timeframe',
      label: 'Timeframe',
      span: 'the last two quarters',
      value: '6 months',
    },
    {
      key: 'target',
      label: 'Target',
      span: 'about to fail',
      value: '30% reduction in unplanned breakdowns',
    },
  ],
  /** The measurable challenge the note becomes. */
  structured: {
    target: '30% reduction in unplanned breakdowns',
    pilot: '3 depots',
    duration: '6 months',
    metrics: ['Breakdown rate', 'Maintenance cost', 'Vehicle uptime', 'Prediction accuracy'],
  },
} as const;
