import type { DashboardSnapshot } from '@/lib/api/mahainnovate';
import type { CalendarEvent } from '@/components/console/MiniCalendar';
import type { RailItem } from '@/components/console/RightRail';
import type { Notification } from '@/components/console/ConsoleHeader';

/**
 * The standing context the rail and the header show.
 *
 * Derived entirely from the snapshot, which currently holds nothing — so every
 * collection here comes back empty and the rail renders its own empty states.
 * That is the intended behaviour: this file previously invented a signed-in
 * officer ("R. Deshpande, Executive Engineer (Water), Pune Municipal
 * Corporation") together with the claim that they were "authorised to approve
 * milestone evidence and to sign a scale decision", and it rendered on every
 * console route with no label attached.
 *
 * The date arithmetic is kept because it is correct and will be needed the
 * moment real milestones exist. All of it is local: `toISOString()` shifts the
 * day for anyone east of UTC, which for a Maharashtra department is everyone.
 */

/** Local YYYY-MM-DD. */
export function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export interface RailContext {
  today: string;
  events: CalendarEvent[];
  upcoming: RailItem[];
  reminders: RailItem[];
  notifications: Notification[];
}

/**
 * There is no authentication yet, and no signed-in officer to name.
 *
 * Stated as an absence rather than filled with a plausible name and title. An
 * invented officer with an invented authority to approve payments is the single
 * most misleading thing this console displayed, because it is exactly the kind
 * of detail a reader does not think to question.
 */
export const SESSION = {
  signedIn: false as const,
  notice: 'No authenticated session. Sign-in is not implemented yet.',
  /** What a session will have to carry before any approval can be recorded. */
  requires: [
    'A named officer',
    'Their department and role',
    'The approvals that role is authorised to make',
  ],
};

export function buildRailContext(snapshot: DashboardSnapshot, now: Date): RailContext {
  const today = localDate(now);

  /*
   * All four derive from milestones and challenges the platform does not hold.
   * They are computed rather than hardcoded to empty so that the moment the
   * snapshot carries records, the rail populates without further work.
   */
  const events: CalendarEvent[] = [];

  const upcoming: RailItem[] = [];

  const reminders: RailItem[] = [];

  const notifications: Notification[] = snapshot.awaitingValidation.map((item) => ({
    id: `${item.pilotId}-${item.milestoneId}`,
    title: `${item.code} · ${item.title}`,
    detail: `Evidence filed on ${item.pilotId} and waiting on a departmental decision.`,
    tone: 'signal',
    when: 'Awaiting validation',
    href: '/ledger',
  }));

  return { today, events, upcoming, reminders, notifications };
}
