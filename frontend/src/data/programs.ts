import { LAST_VERIFIED, SOURCES, pending, verified, type Sourced } from '@/lib/provenance';

/**
 * Government startup programmes, as their operators publish them.
 *
 * This is the only file in the product that contains figures presented as fact,
 * and every one of them was read from a public source on the date recorded in
 * `LAST_VERIFIED`. Nothing here is inferred, rounded, or filled in to make a
 * row look complete.
 *
 * Two programmes, chosen because they are the two that actually put a startup in
 * front of a government department:
 *
 *   Maharashtra Startup Week (MSInS) — issues government work orders, which
 *   makes its winners the only population with demonstrated government delivery
 *   experience in this state. Directly relevant to the problem statement.
 *
 *   Startup India Seed Fund Scheme (DPIIT) — the national eligibility and
 *   funding baseline most Maharashtra startups will already have been measured
 *   against.
 *
 * The `records` field on each is deliberately pending. How many winners a
 * programme has is a published fact; how many of them we hold structured records
 * for is a different quantity, and it is currently none. Reporting the first as
 * though it were the second is precisely the error this round exists to remove.
 */

export interface ProgrammeFact {
  label: string;
  data: Sourced<string | number>;
}

export interface Programme {
  id: string;
  name: string;
  operator: string;
  /** One line on what the programme actually does for a startup. */
  purpose: string;
  facts: ProgrammeFact[];
  /** Structured records we hold from this programme. */
  records: Sourced<number>;
}

const msins = (value: string | number): Sourced<string | number> =>
  verified(value, SOURCES.msinsFlyer.name, SOURCES.msinsFlyer.url, LAST_VERIFIED);

const sisfs = (value: string | number): Sourced<string | number> =>
  verified(value, SOURCES.sisfsScheme.name, SOURCES.sisfsScheme.url, LAST_VERIFIED);

export const PROGRAMMES: Programme[] = [
  {
    id: 'MSW',
    name: 'Maharashtra Startup Week',
    operator: 'Maharashtra State Innovation Society (MSInS)',
    purpose:
      'Selects startups to pilot solutions with state departments, and issues a government work order to each winner.',
    facts: [
      { label: 'Startups selected per edition', data: msins(24) },
      { label: 'Maximum work order per winner', data: msins('₹15,00,000') },
      { label: 'Winners working with departments, last 5 editions', data: msins(120) },
      { label: 'Shortlisted to showcase before final selection', data: msins('~100') },
    ],
    records: pending(
      'Winner records — name, edition, sector, sponsoring department',
      SOURCES.msinsWinners.name,
    ),
  },
  {
    id: 'SISFS',
    name: 'Startup India Seed Fund Scheme',
    operator: 'DPIIT, Government of India',
    purpose:
      'Funds proof of concept, prototype development, product trials, market entry and commercialisation, through DPIIT-selected incubators.',
    facts: [
      { label: 'Maximum grant — PoC, prototype, product trials', data: sisfs('₹20,00,000') },
      {
        label: 'Maximum convertible debentures — market entry, scaling',
        data: sisfs('₹50,00,000'),
      },
      { label: 'Maximum age of startup at application', data: sisfs('2 years') },
      { label: 'Minimum Indian promoter shareholding', data: sisfs('51%') },
      { label: 'Cap on prior government monetary support', data: sisfs('₹10,00,000') },
    ],
    records: pending(
      'Selected startup records — name, sector, state, stage completed',
      SOURCES.sisfsPortfolio.name,
    ),
  },
];

/**
 * The three figures the console leads with.
 *
 * One verified, two pending, and the pending pair is the honest half of the
 * picture: the platform knows what these programmes publish about themselves and
 * holds no startup records of its own yet.
 */
export const PROGRAMME_INTELLIGENCE: ProgrammeFact[] = [
  {
    label: 'MSW winners working with departments (published by MSInS)',
    data: msins(120),
  },
  {
    label: 'MSW winner records held on this platform',
    data: pending('Name, edition, sector, sponsoring department', SOURCES.msinsWinners.name),
  },
  {
    label: 'SISFS selected startups indexed on this platform',
    data: pending('Name, sector, state, stage completed', SOURCES.sisfsPortfolio.name),
  },
];
