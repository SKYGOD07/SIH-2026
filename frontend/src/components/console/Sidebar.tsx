'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from './Icon';
import { Mark } from '@/components/brand/Mark';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/AuthProvider';
import { workspaceFor } from '@/lib/nav/workspaces';

/**
 * The console sidebar.
 *
 * Fixed, full height, and the only navigation on these routes — the floating
 * capsule belongs to the landing deck and does not follow the reader in here.
 * A console is a place you stay in, and a nav that hides until you scroll is
 * exactly wrong for that.
 *
 * The active state is the reference's, unchanged in structure: a filled pill in
 * the accent, plus a short bar hard against the left edge. The bar is not
 * decoration — it is what still marks the active row for a reader who cannot
 * separate the accent from the ground, and it is why the state does not rely on
 * colour alone.
 *
 * Two groups, deliberately. The first is the operational workspace, the second
 * is the reference material the workspace argues from. Flattening them into one
 * list of nine is how a sidebar stops being scannable.
 *
 * The items themselves come from the signed-in role. A startup and a government
 * officer share this component, this shell and this visual language, and share
 * none of the navigation: one is looking after a single company, the other is
 * deciding between five. A universal list with rows hidden per role would still
 * have been written as though there were one kind of user.
 */

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /**
   * Count shown as a red badge. Only ever a number that needs a person.
   *
   * Nothing sets one today. It used to be hardcoded to 1 on the ledger, which
   * meant the navigation asserted an outstanding decision on every page of the
   * console whether or not one existed.
   */
  badge?: number;
}



function NavList({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = pathname === item.href;

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              data-cursor="open"
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex items-center gap-[0.6875rem] rounded-[10px] py-2.5 pl-5 pr-3 text-[0.78125rem] transition-colors duration-200',
                active
                  ? 'bg-signal font-bold text-void'
                  : 'font-medium text-chalk/55 hover:bg-chalk/[0.06] hover:text-chalk',
              )}
            >
              {active ? (
                <span
                  aria-hidden="true"
                  className="absolute left-[7px] top-1/2 h-[55%] w-[3px] -translate-y-1/2 rounded-full bg-void"
                />
              ) : null}

              <Icon name={item.icon} />
              <span className="truncate">{item.label}</span>

              {item.badge ? (
                <span
                  className={cn(
                    'ml-auto grid h-[1.0625rem] min-w-[1.0625rem] place-items-center rounded-full px-1 font-mono text-[0.625rem] font-bold',
                    active ? 'bg-void text-signal' : 'bg-risk text-void',
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Console"
      data-lenis-prevent
      className="console-scroll sticky top-0 hidden h-svh max-h-svh flex-col border-r border-chalk/[0.08] px-[1.125rem] pb-6 pt-7 lg:flex"
    >
      <Link
        href="/"
        data-cursor="home"
        aria-label="Sarthi home"
        className="mb-7 flex items-center gap-2.5 px-2 transition-opacity hover:opacity-80"
      >
        <span className="block w-[1.375rem] shrink-0">
          <Mark radius="22%" />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-[0.75rem] font-extrabold uppercase tracking-[0.14em] text-chalk">
            Sarthi
          </span>
          <span className="mt-px block font-mono text-[0.5625rem] uppercase tracking-[0.28em] text-chalk/35">
            Procurement
          </span>
        </span>
      </Link>

      <NavList items={WORKSPACE} pathname={pathname} />

      <span className="my-4 block h-px bg-chalk/[0.08]" />

      <NavList items={REFERENCE} pathname={pathname} />

      {/*
        The reference ends its sidebar with a help card. Ours ends with the
        thing an officer actually needs to know at a glance and cannot get
        anywhere else on the page: whether what they are looking at is live
        departmental data or a demonstration.
      */}
      <div className="mt-auto rounded-[16px] border border-chalk/[0.08] bg-void-soft p-4">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal">
          Pilot stage
        </span>
        <p className="mt-2 text-[0.6875rem] leading-relaxed text-chalk/50">
          Payment follows validated evidence. No tranche is released from this console without it.
        </p>
        <Link
          href="/templates"
          data-cursor="open"
          className="mt-3 inline-flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-chalk transition-colors hover:text-signal"
        >
          Read the standing clauses
          <Icon name="upRight" className="h-2.5 w-2.5" strokeWidth={2.2} />
        </Link>
      </div>
    </nav>
  );
}
