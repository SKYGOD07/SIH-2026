/**
 * Abstract Maharashtra geometry.
 *
 * Deliberately a stylised outline rather than a survey-accurate boundary: it
 * exists to make the scale sequence legible, not to depict administrative
 * borders. Coordinates are in the 1000 x 640 viewBox used by the map SVG.
 */

export const MAP_VIEWBOX = '0 0 1000 640';

/** Simplified state outline — one continuous path, drawn clockwise from the NW coast. */
export const MAHARASHTRA_PATH = [
  'M 95 250',
  'L 105 302 L 121 352 L 136 402 L 150 456 L 161 520',
  'L 216 541 L 281 556 L 351 546 L 421 561 L 500 570',
  'L 620 560 L 700 590 L 772 611',
  'L 801 540 L 820 470 L 841 420',
  'L 881 360 L 899 330',
  'L 860 300 L 800 281 L 740 300 L 690 265 L 620 240',
  'L 560 255 L 500 226 L 430 241 L 360 216 L 300 236 L 230 216 L 160 236',
  'Z',
].join(' ');

/** Interior hairlines — abstract division lines, not district boundaries. */
export const INTERIOR_LINES = [
  'M 175 268 L 300 330 L 296 470',
  'M 300 330 L 520 300 L 700 330',
  'M 520 300 L 540 430 L 500 560',
  'M 700 330 L 760 450 L 772 611',
  'M 296 470 L 500 560',
  'M 136 402 L 296 470',
];

export interface MapPoint {
  id: string;
  label: string;
  x: number;
  y: number;
}

export const DISTRICTS: MapPoint[] = [
  { id: 'pune', label: 'Pune', x: 250, y: 430 },
  { id: 'mumbai', label: 'Mumbai', x: 112, y: 333 },
  { id: 'thane', label: 'Thane', x: 138, y: 312 },
  { id: 'nashik', label: 'Nashik', x: 208, y: 300 },
  { id: 'aurangabad', label: 'Chh. Sambhajinagar', x: 332, y: 322 },
  { id: 'nagpur', label: 'Nagpur', x: 758, y: 332 },
  { id: 'amravati', label: 'Amravati', x: 620, y: 302 },
  { id: 'kolhapur', label: 'Kolhapur', x: 218, y: 518 },
  { id: 'solapur', label: 'Solapur', x: 392, y: 480 },
  { id: 'chandrapur', label: 'Chandrapur', x: 758, y: 452 },
  { id: 'nanded', label: 'Nanded', x: 540, y: 392 },
  { id: 'jalgaon', label: 'Jalgaon', x: 352, y: 252 },
  { id: 'ratnagiri', label: 'Ratnagiri', x: 152, y: 462 },
  { id: 'satara', label: 'Satara', x: 240, y: 478 },
];

export const getDistrict = (id: string) => DISTRICTS.find((d) => d.id === id);

/**
 * The scale sequence. Each step names what actually expanded — a proven result
 * being offered outward, not the same pilot being re-run.
 */
export const SCALE_STEPS = [
  {
    label: 'Pilot',
    count: 1,
    unit: 'pilot',
    districts: ['pune'],
    note: 'Three wards. One department. One validated result.',
  },
  {
    label: 'Districts',
    count: 3,
    unit: 'districts',
    districts: ['pune', 'nashik', 'thane'],
    note: 'Comparable networks adopt the validated configuration.',
  },
  {
    label: 'Districts',
    count: 8,
    unit: 'districts',
    districts: ['pune', 'nashik', 'thane', 'mumbai', 'aurangabad', 'kolhapur', 'solapur', 'nagpur'],
    note: 'Evidence accepted once is reused, not re-established.',
  },
  {
    label: 'Departments',
    count: 14,
    unit: 'departments',
    districts: DISTRICTS.map((d) => d.id),
    note: 'The pathway, the templates and the evidence transfer across departments.',
  },
] as const;

/** Connection lines drawn between activated points at the widest step. */
export const NETWORK_EDGES: [string, string][] = [
  ['pune', 'nashik'],
  ['pune', 'thane'],
  ['pune', 'satara'],
  ['pune', 'solapur'],
  ['thane', 'mumbai'],
  ['nashik', 'jalgaon'],
  ['nashik', 'aurangabad'],
  ['aurangabad', 'nanded'],
  ['nanded', 'amravati'],
  ['amravati', 'nagpur'],
  ['nagpur', 'chandrapur'],
  ['solapur', 'kolhapur'],
  ['kolhapur', 'ratnagiri'],
  ['ratnagiri', 'mumbai'],
  ['satara', 'kolhapur'],
  ['solapur', 'nanded'],
];
