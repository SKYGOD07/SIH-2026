import { LAST_VERIFIED, SOURCES, verified, type Sourced } from '@/lib/provenance';

/**
 * The SISFS application pathway, stage by stage.
 *
 * Transcribed from the tracker supplied for this project
 * (`Startup_Government_Funding_Tracker.xlsx`), which sets out the nine stages a
 * startup passes through to receive Seed Fund support and the documents each one
 * requires.
 *
 * The scheme parameters the tracker states — ₹20 lakh grant, ₹50 lakh debt,
 * incorporation within two years, 51% Indian promoter shareholding, and the
 * ₹10 lakh cap on prior government support — were cross-checked against published
 * descriptions of the scheme before being reproduced here. Everything else is a
 * documentary requirement rather than a figure.
 *
 * Why this is in the product at all: eligibility screening is stage 03 of the
 * pathway the problem statement names, and this is the first real, checkable
 * eligibility content the platform has. It is a checklist a startup or an officer
 * can actually work from, which is more than any generated text would be.
 */

export interface PathwayStage {
  step: number;
  name: string;
  /** What must be produced or supplied at this stage. */
  requires: string[];
}

export const SISFS_PATHWAY: PathwayStage[] = [
  {
    step: 1,
    name: 'DPIIT recognition',
    requires: [
      'Company incorporation certificate',
      'Business description and sector',
      'Proof of startup eligibility — age, innovation criteria, turnover cap',
    ],
  },
  {
    step: 2,
    name: 'Eligibility check against scheme criteria',
    requires: [
      'DPIIT recognition certificate',
      'Incorporation date — under two years',
      'Shareholding proof — 51% or more held by Indian promoters',
      'Declaration of prior government funding received — under ₹10 lakh',
    ],
  },
  {
    step: 3,
    name: 'Incubator selection',
    requires: [
      'Shortlist of one to three approved incubators relevant to the sector and state',
      'Incubator contact and application window details',
    ],
  },
  {
    step: 4,
    name: 'Application submission',
    requires: [
      "Founders' details and identity proof",
      'Bank account and financial details',
      'Product or prototype stage details',
      'Pitch deck',
      'Company registration certificate',
      'Financial statements',
    ],
  },
  {
    step: 5,
    name: 'Incubator-level screening',
    requires: [
      'Response to incubator queries on eligibility, innovation and business potential',
      'Any additional clarifications requested',
    ],
  },
  {
    step: 6,
    name: 'Pitching to the incubator committee',
    requires: [
      'Final pitch deck',
      'Demonstration or prototype where available',
      'Team and market-need presentation',
    ],
  },
  {
    step: 7,
    name: 'Expert Advisory Committee approval',
    requires: [
      'Any additional documentation requested by the committee',
      'Presentation to the committee',
      'Approval or rejection communication',
    ],
  },
  {
    step: 8,
    name: 'Milestone-based disbursement',
    requires: [
      'Milestone plan agreed with the incubator',
      'Bank account for fund transfer',
      'Grant or debt component confirmation',
    ],
  },
  {
    step: 9,
    name: 'Post-funding compliance',
    requires: [
      'Utilisation certificates',
      'Expenditure receipts',
      'Periodic progress reports to the incubator',
    ],
  },
];

/** Where the pathway above came from. */
export const SISFS_PATHWAY_SOURCE: Sourced<string> = verified(
  `${SISFS_PATHWAY.length} stages`,
  SOURCES.suppliedTracker.name,
  SOURCES.suppliedTracker.url,
  LAST_VERIFIED,
);
