import { SessionPanel } from './SessionPanel';
import Link from 'next/link';
import { Icon, type IconName } from './Icon';
import { MiniCalendar, type CalendarEvent } from './MiniCalendar';
import { Tile, type Tone } from './primitives';
import { cn } from '@/lib/utils';

/**
 * The standing context column.
 *
 * The reference carries profile, calendar, schedule and reminders here — things
 * true regardless of which page you are on. Ours carries the same four, and
 * currently all four are empty, because the platform holds no session, no
 * milestones and no pilots.
 *
 * They render as stated absences rather than being hidden. A rail that
 * disappears when it has nothing to say leaves a reader unsure whether the
 * feature exists; one that says "nothing overdue" has actually answered the
 * question.
 */

export interface RailItem {
  id: string;
  title: string;
  detail: string;
  meta: string;
  icon: IconName;
  tone: Tone;
  href: string;
}

export function RightRail({
  today,
  events,
  upcoming,
  reminders,
}: {
  /** Local YYYY-MM-DD, computed by the server. */
  today: string;
  events: CalendarEvent[];
  upcoming: RailItem[];
  reminders: RailItem[];
}) {
  return (
    <aside
      aria-label="Context"
      data-lenis-prevent
      className="console-scroll sticky top-0 hidden h-svh max-h-svh flex-col gap-5 border-l border-chalk/[0.08] px-5 pb-7 pt-7 xl:flex"
    >
      {/* Who is signed in, read from the verified token. */}
      <SessionPanel />

      {/* --- what is already late --- */}
      <section className="pb-2">
        <h3 className="mb-3 font-display text-[0.8125rem] font-bold uppercase tracking-[-0.01em] text-chalk">
          Reminders
        </h3>
        {reminders.length === 0 ? (
          <p className="rounded-[14px] border border-dashed border-chalk/12 px-4 py-5 text-[0.71875rem] leading-relaxed text-chalk/35">
            Nothing overdue. Breaches of the payment standard are raised here.
          </p>
        ) : null}

        <ul className="flex flex-col gap-2.5">
          {reminders.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                data-cursor="open"
                className="card card-interactive flex items-center gap-3 p-3"
              >
                <Tile icon={item.icon} tone={item.tone} />
                <span className="min-w-0">
                  <span className="block truncate text-[0.78125rem] font-semibold text-chalk">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[0.6875rem] text-chalk/45">
                    {item.detail}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Link
        href="/"
        data-cursor="home"
        className="mt-auto inline-flex items-center gap-1.5 pt-2 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-chalk/35 transition-colors hover:text-chalk"
      >
        <Icon name="chevronLeft" className="h-2.5 w-2.5" strokeWidth={2.2} />
        Back to the site
      </Link>
    </aside>
  );
}
