import { Sidebar } from '@/components/console/Sidebar';
import { RightRail } from '@/components/console/RightRail';
import { MobileNav } from '@/components/console/MobileNav';
import { fetchDashboard } from '@/lib/api/mahainnovate';
import { buildRailContext, SESSION } from '@/lib/console/rail';
import { DEMO_NOTICE } from '@/data/challenges';

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
    <div className="console-shell mx-auto grid min-h-svh w-full max-w-[112rem] grid-cols-1 lg:grid-cols-[13.25rem_minmax(0,1fr)] xl:grid-cols-[13.25rem_minmax(0,1fr)_17rem]">
      <Sidebar />

      <div className="flex min-w-0 flex-col gap-7 px-5 pb-24 pt-7 md:px-8 lg:pb-12">
        {/*
          The prototype notice, on every console route.
          
          It used to live only in the site footer, which `SiteChrome` renders on
          the landing route alone — so six console pages full of figures carried
          no disclosure at all. A reader who lands on /pilots directly must be
          told there, not on a page they may never visit.
        */}
        <p className="rounded-[10px] border border-signal/25 bg-signal/[0.06] px-4 py-2.5 text-[0.71875rem] leading-relaxed text-signal">
          {DEMO_NOTICE}
        </p>

        {children}
      </div>

      <RightRail
        sessionNotice={SESSION.notice}
        sessionRequires={SESSION.requires}
        today={rail.today}
        events={rail.events}
        upcoming={rail.upcoming}
        reminders={rail.reminders}
      />

      <MobileNav />
    </div>
  );
}
