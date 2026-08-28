import { PLATFORM_METRICS } from '@/data/knowledge';
import { PRIMARY_PILOT } from '@/data/pilots';

/**
 * Client for the MahaInnovate API.
 *
 * The backend is built but the database behind it is not, so it may or may not
 * be running on any given machine. Rather than let the dashboard fail closed,
 * every call falls back to the demonstration fixtures the rest of the site
 * already uses, and reports which source it served — the page then says so
 * plainly instead of presenting fixtures as live data.
 */

const BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000/api';

export type DataSource = 'live' | 'demonstration';

export interface DashboardSnapshot {
  source: DataSource;
  corpus: {
    corpusSize: number;
    domains: { domain: string; total: number; met: number }[];
    thinDomains: string[];
  };
  pilot: {
    id: string;
    contractValue: number;
    released: number;
    approvedUnpaid: number;
    outstanding: number;
    awaitingValidation: number;
  };
  awaitingValidation: {
    pilotId: string;
    milestoneId: string;
    code: string;
    title: string;
    payment: number;
    filed: number;
  }[];
  milestones: {
    id: string;
    code: string;
    title: string;
    status: string;
    payment: number;
    dueOn: string;
  }[];
}

/** Built from the local fixtures, shaped exactly like the API response. */
function fallback(): DashboardSnapshot {
  const total = PRIMARY_PILOT.milestones.reduce((s, m) => s + m.payment, 0);
  const released = PRIMARY_PILOT.milestones
    .filter((m) => m.status === 'PAID')
    .reduce((s, m) => s + m.payment, 0);
  const approvedUnpaid = PRIMARY_PILOT.milestones
    .filter((m) => m.status === 'APPROVED')
    .reduce((s, m) => s + m.payment, 0);
  const awaiting = PRIMARY_PILOT.milestones.filter((m) => m.status === 'EVIDENCE_SUBMITTED');

  return {
    source: 'demonstration',
    corpus: {
      corpusSize: 19,
      domains: [
        { domain: 'water-distribution', total: 6, met: 3 },
        { domain: 'transport-fleet', total: 3, met: 1 },
        { domain: 'air-quality', total: 2, met: 1 },
        { domain: 'agri-assessment', total: 2, met: 1 },
        { domain: 'waste-routing', total: 2, met: 1 },
        { domain: 'citizen-services', total: 2, met: 1 },
      ],
      thinDomains: ['transport-fleet', 'air-quality', 'agri-assessment'],
    },
    pilot: {
      id: PRIMARY_PILOT.id,
      contractValue: total,
      released,
      approvedUnpaid,
      outstanding: total - released,
      awaitingValidation: awaiting.length,
    },
    awaitingValidation: awaiting.map((m) => ({
      pilotId: PRIMARY_PILOT.id,
      milestoneId: m.id,
      code: m.code,
      title: m.title,
      payment: m.payment,
      filed: m.evidenceRequired.length,
    })),
    milestones: PRIMARY_PILOT.milestones.map((m) => ({
      id: m.id,
      code: m.code,
      title: m.title,
      status: m.status,
      payment: m.payment,
      dueOn: m.dueOn,
    })),
  };
}

export async function fetchDashboard(): Promise<DashboardSnapshot> {
  try {
    // Short timeout: a dashboard must not hang waiting on a service that is not
    // running locally.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${BASE}/mahainnovate/dashboard`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (!res.ok) return fallback();
    const body = await res.json();
    if (!body?.success || !body?.data) return fallback();

    return { source: 'live', ...body.data } as DashboardSnapshot;
  } catch {
    return fallback();
  }
}

/** Headline counts shown above the console. Static until the API serves them. */
export const PLATFORM_SUMMARY = PLATFORM_METRICS;
