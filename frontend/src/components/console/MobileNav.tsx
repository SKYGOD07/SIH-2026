'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from './Icon';
import { cn } from '@/lib/utils';

/**
 * The console on a phone.
 *
 * The sidebar and the rail both disappear below their breakpoints, so without
 * this there is no navigation at all on a small screen. Five destinations —
 * the ones an officer actually moves between — because a bottom bar with nine
 * items is a bottom bar nobody hits the right target in.
 */

const ITEMS: { href: string; label: string; icon: IconName; badge?: number }[] = [
  { href: '/dashboard', label: 'Console', icon: 'console' },
  { href: '/ledger', label: 'Ledger', icon: 'ledger' },
  { href: '/pilots', label: 'Pilots', icon: 'flask' },
  { href: '/templates', label: 'Forms', icon: 'templates' },
  { href: '/corpus', label: 'Evidence', icon: 'corpus' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Console"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-around border-t border-chalk/[0.08] bg-void/95 px-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"
    >
      {ITEMS.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex flex-1 flex-col items-center gap-0.5 py-1 font-mono text-[0.5625rem] uppercase tracking-[0.06em] transition-colors',
              active ? 'text-chalk' : 'text-chalk/40',
            )}
          >
            <span
              className={cn(
                'grid h-[1.4375rem] w-10 place-items-center rounded-full transition-colors',
                active && 'bg-signal text-void',
              )}
            >
              <Icon name={item.icon} />
            </span>
            {item.label}

            {item.badge ? (
              <span
                aria-hidden="true"
                className="absolute right-1/2 top-0 h-2 w-2 translate-x-4 rounded-full bg-risk"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
