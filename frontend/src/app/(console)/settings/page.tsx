import type { Metadata } from 'next';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead, Card, Pill } from '@/components/console/primitives';
import { Icon, type IconName } from '@/components/console/Icon';
import { fetchDashboard } from '@/lib/api/mahainnovate';
import { buildRailContext, DEMO_SESSION } from '@/lib/console/rail';
import { STANDARD_TEMPLATES } from '@/data/templates';

export const metadata: Metadata = {
  title: 'Settings',
  description:
    'The thresholds and standards this console enforces, where each one is defined, and what is deliberately not configurable.',
};

export const dynamic = 'force-dynamic';

/**
 * Settings.
 *
 * Deliberately not a page of toggles. Every value the mechanism enforces is set
 * once, in code, and this page says what those values are and which file they
 * live in — because a threshold a user can move from a settings screen is a
 * threshold that gets moved the first time it is inconvenient, which is exactly
 * the moment it was written for.
 *
 * The second half is more important than the first: the things that are *not*
 * configurable, and why. A procurement system's integrity is a list of what it
 * refuses to let you do, and that list should be readable by the person it
 * constrains rather than buried in a service.
 */

interface Setting {
  label: string;
  value: string;
  where: string;
  note: string;
  icon: IconName;
}

const LOCKED: { title: string; body: string }[] = [
  {
    title: 'Payment cannot precede validated evidence',
    body: 'The ledger is a state machine with no transition from filed evidence to paid. There is no argument to any method that releases an unapproved tranche — bypassing it means editing the service, which leaves a diff.',
  },
  {
    title: 'A failure cannot be recorded without a named cause',
    body: 'Closing a pilot that missed its target is refused unless the cause is given. An uncaused failure adds a row to the corpus and teaches the next pilot nothing.',
  },
  {
    title: 'A thin domain cannot report a finding',
    body: 'Below the reporting threshold the simulator still runs, but its confidence ratio is returned as context with a mandatory caveat rather than as a result.',
  },
  {
    title: 'An unanswerable question is not answered',
    body: 'Policy retrieval returns `unanswered: true` with an empty analysis when nothing clears the relevance floor, rather than composing a plausible reply from the nearest clause.',
  },
];

export default async function SettingsPage() {
  const snapshot = await fetchDashboard();
  const rail = buildRailContext(snapshot, new Date());

  const settings: Setting[] = [
    {
      label: 'Payment standard',
      value: `${snapshot.paymentTiming.targetDays} days`,
      where: 'backend · ledger.service.ts · PAYMENT_TARGET_DAYS',
      note: 'Filed to paid. Our commitment, not a statutory figure — the problem statement asks for timely payment without naming a number, so the mechanism names one.',
      icon: 'clock',
    },
    {
      label: 'Reporting threshold',
      value: '4 pilots',
      where: 'backend · confidence.ts · REPORTING_THRESHOLD',
      note: 'Comparable pilots needed in a domain before a confidence ratio is reported as a finding.',
      icon: 'corpus',
    },
    {
      label: 'Similarity floor',
      value: '0.45',
      where: 'backend · retrieval.service.ts · SIMILARITY_FLOOR',
      note: 'Below this a prior pilot is not comparable enough to inform a design, and is excluded rather than weighted down.',
      icon: 'target',
    },
    {
      label: 'Standard templates',
      value: `${STANDARD_TEMPLATES.length} issued`,
      where: 'frontend · data/templates.ts',
      note: 'Fields, guidance and standing clauses. Changing a standing clause changes every document generated after it.',
      icon: 'templates',
    },
    {
      label: 'Data residency',
      value: 'India only',
      where: 'Template TPL-05 · standing clause',
      note: 'State data centre or an empanelled cloud in an India region. Data leaving it needs written approval recorded against the pilot agreement.',
      icon: 'shield',
    },
    {
      label: 'Storage',
      value: 'In-memory',
      where: 'backend · repository interfaces',
      note: 'The database is deliberately not wired yet. Every service talks to a repository interface, so it slots in without touching a service.',
      icon: 'ledger',
    },
  ];

  return (
    <>
      <ConsoleHeader
        title="Settings"
        subtitle="What this console enforces, and where each value is defined"
        notifications={rail.notifications}
      />

      {/* --- who is signed in --- */}
      <section aria-label="Session">
        <SectionHead title="Session" meta="No authentication yet" />
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-signal font-display text-[0.9375rem] font-extrabold text-void">
                {DEMO_SESSION.officer
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')}
              </span>
              <div>
                <p className="font-display text-[0.9375rem] font-bold uppercase tracking-[-0.01em] text-chalk">
                  {DEMO_SESSION.officer}
                </p>
                <p className="mt-0.5 text-[0.78125rem] text-chalk/45">
                  {DEMO_SESSION.role} · {DEMO_SESSION.department}
                </p>
              </div>
            </div>
            <Pill tone="chalk">Demonstration session</Pill>
          </div>

          <p className="mt-4 border-t border-chalk/[0.06] pt-4 text-[0.8125rem] leading-relaxed text-chalk/50">
            The signed-in officer is a fixture, not a claim read from a token. Approval and scale
            decisions are recorded against a named officer, so this is the one thing that must
            become real before the console is used on an actual pilot.
          </p>
        </Card>
      </section>

      {/* --- the values --- */}
      <section aria-label="Thresholds and standards">
        <SectionHead title="Thresholds and standards" meta="Set in code, shown here" />

        <div className="grid gap-4 md:grid-cols-2">
          {settings.map((setting) => (
            <Card key={setting.label}>
              <div className="flex items-start gap-3.5">
                <span className="grid h-[2.375rem] w-[2.375rem] shrink-0 place-items-center rounded-[10px] tint-chalk">
                  <Icon name={setting.icon} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="text-[0.8125rem] font-semibold text-chalk">
                      {setting.label}
                    </span>
                    <span className="font-display text-[0.9375rem] font-extrabold tabular-nums text-signal">
                      {setting.value}
                    </span>
                  </div>

                  <p className="mt-2 text-[0.78125rem] leading-relaxed text-chalk/50">
                    {setting.note}
                  </p>

                  <p className="mt-2.5 truncate font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-chalk/30">
                    {setting.where}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* --- what cannot be changed from here --- */}
      <section aria-label="Not configurable">
        <SectionHead title="Not configurable" meta="On purpose" />

        <Card className="p-0">
          <ul>
            {LOCKED.map((rule, i) => (
              <li
                key={rule.title}
                className="flex gap-4 border-b border-chalk/[0.06] px-[1.125rem] py-4 last:border-b-0"
              >
                <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/30">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <Icon name="lock" className="h-3.5 w-3.5 shrink-0 text-risk" />
                    <span className="font-display text-[0.875rem] font-bold uppercase tracking-[-0.02em] text-chalk">
                      {rule.title}
                    </span>
                  </div>
                  <p className="mt-2 max-w-[70ch] text-[0.78125rem] leading-relaxed text-chalk/50">
                    {rule.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <p className="mt-4 max-w-[62ch] text-[0.8125rem] leading-relaxed text-chalk/45">
          A procurement system that cannot say no is not a procurement system. These four refusals
          are enforced in code rather than in guidance, which is the difference between a rule and a
          suggestion under deadline pressure.
        </p>
      </section>
    </>
  );
}
