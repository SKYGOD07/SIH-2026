/**
 * Where a figure came from.
 *
 * Every number this product shows is one of exactly three things, and the type
 * forces a caller to say which:
 *
 *   verified  a fact from a named public source, with the URL and the date it
 *             was read. Renders as a figure, with its source beside it.
 *   demo      a deliberately constructed scenario. Renders with a Demo Scenario
 *             label attached, never bare.
 *   pending   we do not have this yet. Renders as an em-dash plus what will
 *             fill it and where from — never as zero, and never as a guess.
 *
 * The distinction that matters most is the last one. The failure this module
 * exists to prevent is not lying on purpose; it is a placeholder quietly
 * becoming a fact because a plausible number was easier to render than an
 * absence. `pending` carries no `value` field at all, so there is nothing to
 * accidentally print.
 *
 * A second distinction is worth keeping in mind when writing these: a figure
 * published *by* a programme ("MSInS states 120 winners work with departments")
 * is verified; the number of those winners *we hold records for* is a different
 * quantity and is currently pending. Collapsing the two is exactly the move
 * that produced this codebase's "2,481 startups indexed".
 */

export type Sourced<T = string> =
  | {
      state: 'verified';
      value: T;
      /** Publisher, as a reader would name it. */
      source: string;
      url: string;
      /** ISO date the source was read. */
      retrieved: string;
    }
  | {
      state: 'demo';
      value: T;
      /** What the scenario is, in one line, shown next to the figure. */
      scenario: string;
    }
  | {
      state: 'pending';
      /** What this will hold. */
      awaiting: string;
      /** Where it will come from. */
      from: string;
    };

/** Narrowings, so callers do not re-derive the discriminant every time. */
export const isVerified = <T>(s: Sourced<T>): s is Extract<Sourced<T>, { state: 'verified' }> =>
  s.state === 'verified';

export const isPending = <T>(s: Sourced<T>): s is Extract<Sourced<T>, { state: 'pending' }> =>
  s.state === 'pending';

/** The value, or null where there is not one. Never invents a zero. */
export function valueOf<T>(s: Sourced<T>): T | null {
  return s.state === 'pending' ? null : s.value;
}

/* ------------------------------------------------------------- builders --- */

export const verified = <T>(
  value: T,
  source: string,
  url: string,
  retrieved: string,
): Sourced<T> => ({ state: 'verified', value, source, url, retrieved });

export const demo = <T>(value: T, scenario: string): Sourced<T> => ({
  state: 'demo',
  value,
  scenario,
});

export const pending = <T = string>(awaiting: string, from: string): Sourced<T> => ({
  state: 'pending',
  awaiting,
  from,
});

/**
 * The date the public sources below were last read.
 *
 * One constant rather than a date repeated on each record: they were all read in
 * the same sitting, and a set of dates that drift apart by hand is a set of
 * dates nobody trusts. When a source is re-checked, this moves.
 */
export const LAST_VERIFIED = '2026-08-29';

/** Sources cited by name in more than one place. */
export const SOURCES = {
  msinsFlyer: {
    name: 'MSInS — Key Initiatives flyer',
    url: 'https://msins.in/assets/MSINS_Info-Flyers_English-D-I7b6l_.pdf',
  },
  msinsWinners: {
    name: 'MSInS — Startup Week winner directory',
    url: 'https://msins.in/StartupWeekwinner',
  },
  msinsProgramme: {
    name: 'MSInS — Maharashtra Startup Week',
    url: 'https://msins.in/MaharashtraStartupMain',
  },
  sisfsPortfolio: {
    name: 'Startup India — SISFS startup portfolio',
    url: 'https://seedfund.startupindia.gov.in/startup_portfolio',
  },
  sisfsScheme: {
    name: 'Startup India — Seed Fund Scheme',
    url: 'https://seedfund.startupindia.gov.in/',
  },
  suppliedTracker: {
    name: 'Supplied file — Startup_Government_Funding_Tracker.xlsx',
    url: '',
  },
} as const;
