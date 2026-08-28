import type { DashboardSnapshot } from '@/lib/api/mahainnovate';
import type { CalendarEvent } from '@/components/console/MiniCalendar';
import type { RailItem } from '@/components/console/RightRail';
import type { Notification } from '@/components/console/ConsoleHeader';

/**
 * Turns a dashboard snapshot into the standing context the rail and header show.
 *
 * Kept out of the layout so the layout stays a layout. More usefully, it keeps
 * every "how many days late is this" calculation in one file: the rail, the
 * calendar, the notification bell and the reminders all have to agree about
 * what is overdue, and they only do if one function decides it.
 *
 * All date arithmetic is local. `toISOString()` would shift the day for anyone
 * east of UTC, which for a Maharashtra department is everyone.
 */

/** Local YYYY-MM-DD. */
export function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

const dayMs = 86_400_000;

/** Whole days from `from` to `to`, counted on local calendar days. */
function daysBetween(from: string, to: string): number {
  const [ay, am, ad] = from.split('-').map(Number);
  const [by, bm, bd] = to.split('-').map(Number);
  return Math.round(
    (Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / dayMs,
  );
}

/** "in 4 days" / "3 days ago" / "today". */
function relative(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

export interface RailContext {
  today: string;
  events: CalendarEvent[];
  upcoming: RailItem[];
  reminders: RailItem[];
  notifications: Notification[];
}

/**
 * The demonstration session.
 *
 * There is no authentication yet, so the signed-in officer is a constant rather
 * than a claim read from a token. Named here, once, so it is obvious that it is
 * fixture data and not something the console discovered.
 */
export const DEMO_SESSION = {
  officer: 'R. Deshpande',
  role: 'Executive Engineer (Water)',
  department: 'Pune Municipal Corporation',
};

export function buildRailContext(snapshot: DashboardSnapshot, now: Date): RailContext {
  const today = localDate(now);

  // Every milestone with a date is a mark on the calendar, open or closed.
  const events: CalendarEvent[] = snapshot.milestones.map((m) => ({
    date: m.dueOn,
    label: `${m.code} ${m.title} — due ${relative(daysBetween(today, m.dueOn))}`,
  }));

  /*
   * What is coming: milestones not yet paid, soonest first. A milestone whose
   * due date has passed is shown in the risk tone — the rail should not report
   * an overdue item in the same voice as a scheduled one.
   */
  const upcoming: RailItem[] = snapshot.milestones
    .filter((m) => m.status !== 'PAID')
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn))
    .slice(0, 2)
    .map((m) => {
      const days = daysBetween(today, m.dueOn);
      const late = days < 0;

      return {
        id: m.id,
        title: `${m.code} · ${m.title}`,
        detail:
          m.status === 'EVIDENCE_SUBMITTED'
            ? 'Evidence filed and waiting on you.'
            : m.status === 'APPROVED'
              ? 'Approved. Payment not yet released.'
              : 'Not yet started.',
        meta: `${late ? 'Overdue' : 'Due'} ${relative(days)}`,
        icon: m.status === 'EVIDENCE_SUBMITTED' ? 'check' : late ? 'alert' : 'clock',
        tone: late ? 'risk' : m.status === 'EVIDENCE_SUBMITTED' ? 'signal' : 'chalk',
        href: '/ledger',
      };
    });

  /*
   * Reminders are things already past a threshold: a milestone waiting longer
   * than the payment standard, and any domain too thin to advise on. Both are
   * conditions a person has to act on, not statuses to admire.
   */
  const reminders: RailItem[] = [];

  const overdue = snapshot.paymentTiming.milestones.filter(
    (m) => m.waitingDays !== null && m.waitingDays > snapshot.paymentTiming.targetDays,
  );
  for (const m of overdue) {
    reminders.push({
      id: `late-${m.code}`,
      title: `${m.code} past the standard`,
      detail: `Waiting ${m.waitingDays} days against ${snapshot.paymentTiming.targetDays}`,
      meta: 'Overdue',
      icon: 'alert',
      tone: 'risk',
      href: '/ledger',
    });
  }

  if (snapshot.corpus.thinDomains.length > 0) {
    reminders.push({
      id: 'thin-domains',
      title: `${snapshot.corpus.thinDomains.length} domains too thin`,
      detail: 'Confidence reported as context, not as a finding',
      meta: 'Evidence base',
      icon: 'corpus',
      tone: 'signal',
      href: '/corpus',
    });
  }

  /* The bell carries exactly what needs a decision. Nothing else. */
  const notifications: Notification[] = snapshot.awaitingValidation.map((item) => ({
    id: `${item.pilotId}-${item.milestoneId}`,
    title: `${item.code} · ${item.title}`,
    detail: `${item.filed} artefacts filed on ${item.pilotId}. Nothing is paid until you clear this.`,
    tone: 'signal',
    when: 'Awaiting validation',
    href: '/ledger',
  }));

  return { today, events, upcoming, reminders, notifications };
}
