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

/**
 * Payment timing, as the ledger measures it.
 *
 * Every figure is nullable on purpose: a milestone that has not been filed,
 * decided or paid has no elapsed time, and reporting a zero there would read as
 * "instant" rather than as "has not happened".
 */
export interface PaymentTiming {
  /** The service standard the pathway commits to, in days. */
  targetDays: number;
  medianDaysToPay: number | null;
  settledCount: number;
  breachedCount: number;
  milestones: {
    code: string;
    title: string;
    payment: number;
    status: string;
    filedAt: string | null;
    approvedAt: string | null;
    paidAt: string | null;
    /** Days the department held it before deciding. */
    daysToDecide: number | null;
    /** Days from approval to money leaving. */
    daysToRelease: number | null;
    /** Filed to paid. Null while anything is still outstanding. */
    daysToPay: number | null;
    /** Age of an undecided milestone, as of the request. */
    waitingDays: number | null;
  }[];
}

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
  paymentTiming: PaymentTiming;
}

/**
 * The demonstration pilot's timing, expressed as day offsets from the request
 * rather than as fixed dates.
 *
 * Fixed dates go stale: a fixture written in March reads, six months later, as
 * a pilot that has been waiting half a year, and the console then demonstrates
 * a broken department rather than a working mechanism. Offsets keep the
 * demonstration coherent on whatever day it is opened.
 *
 * M3 is deliberately past the fifteen-day standard. A console that only ever
 * shows compliance has not shown what it is for.
 */
const DEMO_TIMING: { code: string; filed: number; approved: number | null; paid: number | null }[] =
  [
    { code: 'M1', filed: -96, approved: -94, paid: -88 },
    { code: 'M2', filed: -64, approved: -62, paid: -56 },
    { code: 'M3', filed: -19, approved: -16, paid: null },
    { code: 'M4', filed: -6, approved: null, paid: null },
  ];

/**
 * Comparable pilots the simulator can reason from, by domain.
 *
 * Shaped so the console has something real to say: one domain well covered,
 * one just short, and several thin. A corpus where everything clears the
 * threshold demonstrates nothing about what the threshold is for.
 */
const DEMO_DOMAINS = [
  { domain: 'water-distribution', total: 6, met: 3 },
  { domain: 'transport-fleet', total: 3, met: 1 },
  { domain: 'air-quality', total: 2, met: 1 },
  { domain: 'agri-assessment', total: 2, met: 1 },
  { domain: 'waste-routing', total: 2, met: 1 },
  { domain: 'citizen-services', total: 2, met: 1 },
];

/** Mirrors REPORTING_THRESHOLD in the backend's confidence module. */
const REPORTING_THRESHOLD = 4;

function demoTiming(): PaymentTiming {
  const today = Date.now();
  const iso = (offsetDays: number) => new Date(today + offsetDays * 86_400_000).toISOString();

  const milestones = DEMO_TIMING.map((t) => {
    const source = PRIMARY_PILOT.milestones.find((m) => m.code === t.code);
    const settled = t.paid !== null;

    return {
      code: t.code,
      title: source?.title ?? t.code,
      payment: source?.payment ?? 0,
      status: source?.status ?? 'LOCKED',
      filedAt: iso(t.filed),
      approvedAt: t.approved === null ? null : iso(t.approved),
      paidAt: t.paid === null ? null : iso(t.paid),
      daysToDecide: t.approved === null ? null : t.approved - t.filed,
      daysToRelease: t.paid === null || t.approved === null ? null : t.paid - t.approved,
      daysToPay: settled ? (t.paid as number) - t.filed : null,
      waitingDays: settled ? null : -t.filed,
    };
  });

  const settled = milestones
    .map((m) => m.daysToPay)
    .filter((d): d is number => d !== null)
    .sort((a, b) => a - b);

  const median =
    settled.length === 0
      ? null
      : settled.length % 2 === 1
        ? settled[(settled.length - 1) / 2]
        : Math.round((settled[settled.length / 2 - 1] + settled[settled.length / 2]) / 2);

  return {
    targetDays: 15,
    medianDaysToPay: median,
    settledCount: settled.length,
    breachedCount: settled.filter((d) => d > 15).length,
    milestones,
  };
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
      domains: DEMO_DOMAINS,
      // Derived, never listed. A hand-written list drifts from the counts beside
      // it, and the console then marks one two-pilot domain advisable and
      // another too thin on the same screen.
      thinDomains: DEMO_DOMAINS.filter((d) => d.total < REPORTING_THRESHOLD).map((d) => d.domain),
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
    paymentTiming: demoTiming(),
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

    // An API that predates a field on this page is served as demonstration
    // data rather than patched up with fixtures — half-live is the one state
    // the source badge could not describe honestly.
    if (!body.data.paymentTiming) return fallback();

    return { source: 'live', ...body.data } as DashboardSnapshot;
  } catch {
    return fallback();
  }
}

/** Headline counts shown above the console. Static until the API serves them. */
export const PLATFORM_SUMMARY = PLATFORM_METRICS;
