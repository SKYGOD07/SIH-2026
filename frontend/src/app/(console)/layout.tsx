import { Sidebar } from '@/components/console/Sidebar';
import { RightRail } from '@/components/console/RightRail';
import { MobileNav } from '@/components/console/MobileNav';
import { MaximizeReveal } from '@/components/console/MaximizeReveal';
import { fetchDashboard } from '@/lib/api/sarthi';
import { buildRailContext } from '@/lib/console/rail';
import { DEMO_NOTICE } from '@/data/challenges';
import { RequireAuth } from '@/components/auth/RequireAuth';

/**
 * The console shell.
 *
 * Three columns: a fixed sidebar, a scrolling middle, and a rail of standing
 * context. The outer columns are `sticky` at full viewport height and scroll
 * their own overflow, which is what makes the console feel like an application
 * rather than a document — the navigation does not slide away under you.
 *
 * Both outer columns drop out on smaller screens, in that order: the rail first
 * (it is context, not navigation), then the sidebar, which is replaced by the
 * bottom bar. The middle column is never squeezed below its own minimum, which
 * is what `minmax(0, 1fr)` is for — without it a wide table inside would push
 * the grid past the viewport.
 *
 * The rail is filled here rather than per page because it is standing context:
 * it says the same thing on every route, and rebuilding it in each page is how
 * two routes end up disagreeing about what is overdue.
 */
export const dynamic = 'force-dynamic';

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const snapshot = await fetchDashboard();
  const rail = buildRailContext(snapshot, new Date());

  return (
    <RequireAuth>
      <MaximizeReveal>
      <div className="console-shell mx-auto grid min-h-svh w-full max-w-[112rem] grid-cols-1 lg:grid-cols-[13.25rem_minmax(0,1fr)] xl:grid-cols-[13.25rem_minmax(0,1fr)_17rem]">
        <Sidebar />

        <div className="flex min-w-0 flex-col gap-7 px-5 pb-24 pt-7 md:px-8 lg:pb-12">
          {children}
        </div>

        <RightRail
          today={rail.today}
          events={rail.events}
          upcoming={rail.upcoming}
          reminders={rail.reminders}
        />

        <MobileNav />
      </div>
      </MaximizeReveal>
    </RequireAuth>
  );
}
