/**
 * The team-owned companies, and who owns them.
 *
 * One registry, imported by every script that must treat these companies
 * differently from the 500 synthetic ones:
 *
 *   generate-companies.ts   never renames, reconciles or prunes them
 *   generate-evidence.ts    never writes invented evidence against them
 *   seed-team-companies.ts  writes their full profiles and mock dossiers
 *   seed-team-accounts.ts   creates their sign-in accounts and claims
 *   verify-demo.ts          asserts all of the above still holds
 *
 * It used to be three separate hardcoded lists that drifted apart within a day.
 *
 * OWNERSHIP IS NOT AUTHENTICATION. `ownerEmail` records which teammate a company
 * belongs to. Sign-in is Supabase Auth and nothing else; these addresses are not
 * credentials and no password is stored anywhere in this repository.
 */

export interface TeamCompany {
  legalName: string;
  displayName: string;
  /** The teammate this company belongs to. Mapping data, never a credential. */
  ownerEmail: string;
  /**
   * Whether this is the company the owner's account actually claims.
   *
   * `UserProfile.startupId` is unique in both directions, so one account can
   * claim exactly one company. Two teammates own two companies each; the second
   * is recorded here and stays unclaimed until ownership moves onto `Startup`
   * as a many-to-one relation. Marking it in data beats discovering it as a
   * constraint violation at seed time.
   */
  primary: boolean;
  /** Set when the company was promoted out of the synthetic population. */
  promotedFromSynthetic?: boolean;
}

export const TEAM_COMPANIES: TeamCompany[] = [
  // Iqra — two companies, CIVORA claimed
  { legalName: 'CIVORA Technologies Private Limited', displayName: 'CIVORA',
    ownerEmail: 'pathaniqra303@gmail.com', primary: true },
  { legalName: 'HIX Health & FinTech Solutions Private Limited', displayName: 'HIX',
    ownerEmail: 'pathaniqra303@gmail.com', primary: false },

  // SR — two companies, Crop Saver claimed
  { legalName: 'Crop Saver Agritech Private Limited', displayName: 'Crop Saver',
    ownerEmail: 'sr5937424@gmail.com', primary: true },
  { legalName: 'WaterManager Utilities Private Limited', displayName: 'WaterManager',
    ownerEmail: 'sr5937424@gmail.com', primary: false },

  // Suhani
  { legalName: 'EnviroPlus Environmental Systems Private Limited', displayName: 'EnviroPlus',
    ownerEmail: 'Suhanigoyal856@gmail.com', primary: true },

  /*
   * Promoted out of the synthetic population rather than created.
   *
   * Neither account had any source material — both `data/` folders are empty —
   * so inventing two more companies would have added two more fictions to a
   * dataset that already has 500. These two were already in it, already sat in
   * fields the team did not cover, and are simply moved across: the row keeps
   * its id, its funding history and its programme participation, and gains a
   * full profile and a procurement dossier.
   */
  { legalName: 'Chalan Solutions Private Limited', displayName: 'Chalan Solutions',
    ownerEmail: 'heoric361004@gmail.com', primary: true, promotedFromSynthetic: true },
  { legalName: 'Rakshak Innovations Private Limited', displayName: 'Rakshak Innovations',
    ownerEmail: 'mohammadhaaris791@gmail.com', primary: true, promotedFromSynthetic: true },
];

/** Display names, for the `notIn` guards that keep generators away from them. */
export const TEAM_DISPLAY_NAMES = TEAM_COMPANIES.map((c) => c.displayName);

/** Legal names, for the reconcile and prune guards keyed on legal name. */
export const TEAM_LEGAL_NAMES = TEAM_COMPANIES.map((c) => c.legalName);

/** The five accounts. Order is stable so seed output is diffable run to run. */
export const TEAM_EMAILS = [...new Set(TEAM_COMPANIES.map((c) => c.ownerEmail))];

export const companiesFor = (email: string) =>
  TEAM_COMPANIES.filter((c) => c.ownerEmail.toLowerCase() === email.toLowerCase());

export const primaryFor = (email: string) =>
  companiesFor(email).find((c) => c.primary) ?? companiesFor(email)[0];

/**
 * Companies seeded by something other than `generate-companies.ts`.
 *
 * Enumerated rather than inferred. An earlier version recognised generated rows
 * by name shape, which failed in both directions — surplus rows survived the
 * prune, and hand-seeded companies became deletable.
 */
export const PROTECTED_LEGAL_NAMES = new Set<string>([
  // demo.ts — rich profiles with imported document packs
  'CIVORA Technologies Private Limited',
  'HIX Health & FinTech Solutions Private Limited',
  'AquaSense Systems Private Limited',
  'TransitPulse Analytics Private Limited',
  'SolarFlux Dynamics Private Limited',
  // seed-fields.ts — one company per field, some carrying challenge responses
  'Nirmal Flow Technologies Private Limited',
  'Sanchay Wastewater Systems Private Limited',
  'GatiMarg Mobility Analytics Private Limited',
  'Suryodaya Grid Solutions Private Limited',
  'Krishi Setu Agritech Private Limited',
  'Arogya Reach Health Systems Private Limited',
  'Suraksha Grid Public Safety Private Limited',
  'Seva Setu Digital Governance Private Limited',
  'Vidya Bridge Learning Private Limited',
  'Chakra Circular Waste Private Limited',
  // every team-owned company, including the two promoted ones
  ...TEAM_LEGAL_NAMES,
]);
