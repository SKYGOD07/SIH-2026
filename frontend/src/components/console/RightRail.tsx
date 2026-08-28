import Link from 'next/link';
import { Icon, type IconName } from './Icon';
import { MiniCalendar, type CalendarEvent } from './MiniCalendar';
import { Tile, type Tone } from './primitives';
import { cn } from '@/lib/utils';

/**
 * The standing context column.
 *
 * The reference carries profile, calendar, schedule and reminders here — things
 * true regardless of which page you are on. Ours carries the same four, filled
 * with the only things that are constant across this console: who is signed in
 * and what they can therefore approve, what is dated, what is next, and what is
 * overdue.
 *
 * Everything in the rail is a link. A column of context you cannot act from is
 * a column of decoration, and it is the first thing to get ignored.
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
  officer,
  role,
  department,
  today,
  events,
  upcoming,
  reminders,
}: {
  officer: string;
  role: string;
  department: string;
  /** Local YYYY-MM-DD, computed by the server. */
  today: string;
  events: CalendarEvent[];
  upcoming: RailItem[];
  reminders: RailItem[];
}) {
  const initials = officer
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');

  return (
    <aside
      aria-label="Context"
      className="console-scroll sticky top-0 hidden h-svh flex-col gap-5 border-l border-chalk/[0.08] px-5 pb-7 pt-7 xl:flex"
    >
      {/* --- who is signed in, and what that lets them do --- */}
      <div className="card p-[1.125rem] text-center">
        <span className="mx-auto grid h-[4.25rem] w-[4.25rem] place-items-center rounded-full bg-signal font-display text-[1.25rem] font-extrabold text-void">
          {initials}
        </span>
        <p className="mt-3 font-display text-[0.875rem] font-bold uppercase tracking-[-0.01em] text-chalk">
          {officer}
        </p>
        <p className="mt-1 text-[0.71875rem] leading-relaxed text-chalk/45">{role}</p>
        <p className="mt-0.5 text-[0.71875rem] text-chalk/35">{department}</p>

        <p className="mt-3 border-t border-chalk/[0.08] pt-3 text-[0.6875rem] leading-relaxed text-chalk/45">
          Authorised to approve milestone evidence and to sign a scale decision.
        </p>
      </div>

      <MiniCalendar today={today} events={events} />

      {/* --- dated, and coming --- */}
      <section>
        <h3 className="mb-3 font-display text-[0.8125rem] font-bold uppercase tracking-[-0.01em] text-chalk">
          Next up
        </h3>
        <ul className="flex flex-col gap-2.5">
          {upcoming.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                data-cursor="open"
                className={cn(
                  'relative block rounded-[14px] py-3.5 pl-5 pr-4 transition-transform duration-200 hover:-translate-y-0.5',
                  item.tone === 'risk'
                    ? 'bg-risk/[0.09]'
                    : item.tone === 'validated'
                      ? 'bg-validated/[0.09]'
                      : 'bg-signal/[0.09]',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute bottom-3.5 left-2 top-3.5 w-[3px] rounded-full',
                    item.tone === 'risk'
                      ? 'bg-risk'
                      : item.tone === 'validated'
                        ? 'bg-validated'
                        : 'bg-signal',
                  )}
                />
                <span className="block font-mono text-[0.625rem] uppercase tracking-[0.1em] text-chalk/50">
                  {item.meta}
                </span>
                <span className="mt-1.5 block text-[0.8125rem] font-bold text-chalk">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-[0.71875rem] leading-relaxed text-chalk/50">
                  {item.detail}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* --- what is already late --- */}
      <section className="pb-2">
        <h3 className="mb-3 font-display text-[0.8125rem] font-bold uppercase tracking-[-0.01em] text-chalk">
          Reminders
        </h3>
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
