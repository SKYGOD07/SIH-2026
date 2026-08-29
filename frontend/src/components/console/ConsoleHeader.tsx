'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from './Icon';
import { Pill, type Tone } from './primitives';
import { cn } from '@/lib/utils';

/**
 * The console header.
 *
 * Rendered by each page rather than by the layout, so the title is written next
 * to the content it describes. A route-to-title map in the shell is one more
 * place to forget when a page is renamed, and it always is.
 *
 * The search field is honest about itself: it filters what is on the page and
 * says so in its placeholder. A search box that looks global and is not is a
 * worse affordance than no search box.
 */

export interface Notification {
  id: string;
  title: string;
  detail: string;
  tone: Tone;
  /** Human-relative, computed on the server so it does not drift at midnight. */
  when: string;
  href: string;
}

export function ConsoleHeader({
  title,
  subtitle,
  source,
  notifications = [],
}: {
  title: string;
  subtitle: string;
  /**
   * Where this page's figures came from.
   *
   * There is deliberately no 'live' state. The backend serves demonstration
   * seeds, so a successful call says nothing about the provenance of the
   * payload — and a green "Live API" badge over invented records is worse than
   * no badge at all.
   */
  source?: 'demonstration' | 'unavailable';
  notifications?: Notification[];
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Dismiss on outside click and on Escape. A panel that can only be closed by
  // the button that opened it is a trap on a page this dense.
  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-[1.375rem] font-extrabold uppercase tracking-[-0.03em] text-chalk">
          {title}
        </h1>
        <p className="mt-1 text-[0.78125rem] text-chalk/45">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {source ? (
          <Pill tone={source === 'unavailable' ? 'risk' : 'signal'}>
            {source === 'unavailable' ? 'API unavailable' : 'Prototype — no live records'}
          </Pill>
        ) : null}

        <label className="hidden h-[2.375rem] w-[15.375rem] items-center gap-2.5 rounded-[10px] border border-chalk/[0.08] bg-void-soft px-3 text-chalk/40 transition-colors focus-within:border-chalk/25 md:flex">
          <Icon name="search" className="h-[0.9375rem] w-[0.9375rem]" />
          <input
            type="search"
            placeholder="Filter this page"
            className="min-w-0 flex-1 bg-transparent text-[0.78125rem] text-chalk outline-none placeholder:text-chalk/30"
          />
        </label>

        <div ref={wrapRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={`Notifications, ${notifications.length} waiting`}
            className="relative grid h-[2.375rem] w-[2.375rem] place-items-center rounded-[10px] border border-chalk/[0.08] bg-void-soft text-chalk transition-colors hover:border-chalk/20"
          >
            <Icon name="bell" />
            {notifications.length > 0 ? (
              <span
                aria-hidden="true"
                className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-void-soft bg-risk"
              />
            ) : null}
          </button>

          {open ? (
            <div className="card absolute right-0 top-[calc(100%+0.625rem)] z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-chalk/[0.08] px-4 py-3">
                <span className="font-display text-[0.8125rem] font-bold uppercase tracking-[-0.01em] text-chalk">
                  Needs a decision
                </span>
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-chalk/40">
                  {notifications.length}
                </span>
              </div>

              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-[0.78125rem] text-chalk/40">
                  Nothing waiting on you.
                </p>
              ) : (
                <ul>
                  {notifications.map((n) => (
                    <li key={n.id} className="border-b border-chalk/[0.06] last:border-b-0">
                      <Link
                        href={n.href}
                        onClick={() => setOpen(false)}
                        className="flex gap-3 px-4 py-3 transition-colors hover:bg-chalk/[0.04]"
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                            n.tone === 'risk'
                              ? 'bg-risk'
                              : n.tone === 'validated'
                                ? 'bg-validated'
                                : 'bg-signal',
                          )}
                        />
                        <span className="min-w-0">
                          <span className="block text-[0.78125rem] font-semibold text-chalk">
                            {n.title}
                          </span>
                          <span className="mt-0.5 block text-[0.6875rem] leading-relaxed text-chalk/45">
                            {n.detail}
                          </span>
                          <span className="mt-1 block font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-chalk/30">
                            {n.when}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
