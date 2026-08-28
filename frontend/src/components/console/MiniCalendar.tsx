'use client';

import { useMemo, useState } from 'react';
import { Icon } from './Icon';
import { cn } from '@/lib/utils';

/**
 * The rail's month view.
 *
 * `today` arrives as a prop rather than being read from the clock in here. A
 * component that calls `new Date()` during render disagrees with the server
 * that rendered it — silently most of the time, and visibly at midnight, on the
 * first of a month, and for anyone in a different timezone from the machine
 * that built the page. The server owns the date; this owns the interaction.
 *
 * Marked days come from the milestone dates the console already knows about, so
 * the calendar is a view of the ledger rather than a decoration that happens to
 * be shaped like a month.
 */

export interface CalendarEvent {
  /** ISO date, YYYY-MM-DD. */
  date: string;
  label: string;
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Local YYYY-MM-DD. `toISOString` would shift the day for anyone east of UTC. */
const key = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export function MiniCalendar({ today, events }: { today: string; events: CalendarEvent[] }) {
  const [y0, m0, d0] = today.split('-').map(Number);
  const [view, setView] = useState({ year: y0, month: m0 - 1 });

  const marked = useMemo(() => {
    const map = new Map<string, string>();
    for (const event of events) map.set(event.date, event.label);
    return map;
  }, [events]);

  const { cells, label } = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    // getDay() is Sunday-first; the grid is Monday-first.
    const lead = (first.getDay() + 6) % 7;

    const out: ({ day: number; iso: string } | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      out.push({ day: d, iso: key(view.year, view.month, d) });
    }

    return { cells: out, label: `${MONTHS[view.month]} ${view.year}` };
  }, [view]);

  const step = (by: number) => {
    setView((v) => {
      const next = v.month + by;
      return { year: v.year + Math.floor(next / 12), month: ((next % 12) + 12) % 12 };
    });
  };

  const todayIso = key(y0, m0 - 1, d0);
  const nextEvent = events.find((e) => e.date >= todayIso);

  return (
    <div className="card p-[1.125rem]">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display text-[0.8125rem] font-bold uppercase tracking-[-0.01em] text-chalk">
          {label}
        </span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous month"
            className="grid h-[1.625rem] w-[1.625rem] place-items-center rounded-full text-chalk/40 transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
          >
            <Icon name="chevronLeft" className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next month"
            className="grid h-[1.625rem] w-[1.625rem] place-items-center rounded-full text-chalk/40 transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
          >
            <Icon name="chevronRight" className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((d, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="pb-1.5 text-center font-mono text-[0.5625rem] font-bold uppercase tracking-[0.05em] text-chalk/30"
          >
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) => {
          if (!cell) return <span key={`pad-${i}`} className="aspect-square" />;

          const isToday = cell.iso === todayIso;
          const event = marked.get(cell.iso);

          return (
            <span
              key={cell.iso}
              title={event}
              className={cn(
                'relative grid aspect-square place-items-center rounded-full text-[0.6875rem] tabular-nums',
                isToday ? 'bg-chalk font-bold text-void' : 'text-chalk/70',
              )}
            >
              {cell.day}
              {event ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute bottom-[3px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full',
                    isToday ? 'bg-void' : 'bg-signal',
                  )}
                />
              ) : null}
            </span>
          );
        })}
      </div>

      {nextEvent ? (
        <p className="mt-3 rounded-[8px] bg-signal px-2.5 py-2 text-[0.6875rem] font-semibold text-void">
          {nextEvent.label}
        </p>
      ) : null}
    </div>
  );
}
