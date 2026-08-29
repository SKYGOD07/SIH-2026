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
  sessionNotice,
  sessionRequires,
  today,
  events,
  upcoming,
  reminders,
}: {
  /** Why there is no officer named here. */
  sessionNotice: string;
  /** What a real session will have to carry. */
  sessionRequires: string[];
  /** Local YYYY-MM-DD, computed by the server. */
  today: string;
  events: CalendarEvent[];
  upcoming: RailItem[];
  reminders: RailItem[];
}) {
  return (
    <aside
      aria-label="Context"
      className="console-scroll sticky top-0 hidden h-svh flex-col gap-5 border-l border-chalk/[0.08] px-5 pb-7 pt-7 xl:flex"
    >
      {/*
        Who is signed in — which is nobody.

        This card previously named an officer and asserted their authority to
        approve payments. Both were invented, and an invented approver is the
        detail a reader is least likely to question.
      */}
      <div className="card p-[1.125rem]">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal">
          No session
        </span>
        <p className="mt-2.5 text-[0.75rem] leading-relaxed text-chalk/55">{sessionNotice}</p>

        <ul className="mt-3 border-t border-chalk/[0.08] pt-3">
          {sessionRequires.map((item) => (
            <li key={item} className="py-1 text-[0.6875rem] leading-relaxed text-chalk/40">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <MiniCalendar today={today} events={events} />

      {/* --- dated, and coming --- */}
      <section>
        <h3 className="mb-3 font-display text-[0.8125rem] font-bold uppercase tracking-[-0.01em] text-chalk">
          Next up
        </h3>
        {upcoming.length === 0 ? (
          <p className="rounded-[14px] border border-dashed border-chalk/12 px-4 py-5 text-[0.71875rem] leading-relaxed text-chalk/35">
            Nothing scheduled. Milestone dates appear here once a pilot is contracted.
          </p>
        ) : null}

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
