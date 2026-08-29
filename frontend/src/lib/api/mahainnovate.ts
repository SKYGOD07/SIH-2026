/**
 * Client for the MahaInnovate API.
 *
 * This module used to manufacture a complete departmental picture whenever the
 * backend was unreachable — a ₹15L contract, four dated milestones, a corpus of
 * nineteen pilots, a median days-to-payment — and hand it to the console under a
 * "Demonstration data" pill. Two things were wrong with that.
 *
 * The pill was easy to miss and the figures were not. A reader scanning a
 * console reads the numbers, not the badge above them.
 *
 * And the badge lied in the other direction too. The backend serves the same
 * invented seed records, so a *successful* call returned `source: 'live'` and
 * the console rendered a green "Live API" — meaning starting the backend made
 * the product assert more confidently that fabricated records were real.
 *
 * So the fallback fabricates nothing, and the source states describe what is
 * actually true: the backend is a demonstration service, or it is unreachable.
 * There is no state that claims live departmental data, because there is no
 * source of it yet.
 */

export type DataSource = 'demonstration' | 'unavailable';

/**
 * What the console has to work with.
 *
 * Every collection is empty rather than absent. A page that maps over these
 * renders its own empty state, which is the correct outcome — the alternative
 * is a null check at every call site and a plausible number wherever one is
 * forgotten.
 */
export interface DashboardSnapshot {
  source: DataSource;
  /** Set when the API answered but its records are demonstration seeds. */
  backendNotice: string | null;
  corpus: {
    /** Pilots the platform actually holds. Counted, never asserted. */
    corpusSize: number;
    domains: { domain: string; total: number; met: number }[];
    thinDomains: string[];
  };
  pilots: {
    id: string;
    title: string;
    status: string;
  }[];
  awaitingValidation: {
    pilotId: string;
    milestoneId: string;
    code: string;
    title: string;
  }[];
}

/** Nothing held, and nothing invented to stand in for it. */
function empty(source: DataSource, backendNotice: string | null = null): DashboardSnapshot {
  return {
    source,
    backendNotice,
    corpus: { corpusSize: 0, domains: [], thinDomains: [] },
    pilots: [],
    awaitingValidation: [],
  };
}

const BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:5000/api';

export async function fetchDashboard(): Promise<DashboardSnapshot> {
  try {
    // Short timeout: a console must not hang waiting on a service that is not
    // running locally.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${BASE}/mahainnovate/dashboard`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (!res.ok) return empty('unavailable');
    const body = await res.json();
    if (!body?.success || !body?.data) return empty('unavailable');

    /*
     * The API answered, and what it holds is a demonstration corpus. That is
     * reported as demonstration data — not as "live" — because the accuracy of
     * the transport says nothing about the provenance of the payload.
     */
    return {
      source: 'demonstration',
      backendNotice:
        'Served by the local API, whose corpus and ledger are demonstration seeds rather than departmental records.',
      corpus: {
        corpusSize: 0,
        domains: [],
        thinDomains: [],
      },
      pilots: [],
      awaitingValidation: [],
    };
  } catch {
    return empty('unavailable');
  }
}
