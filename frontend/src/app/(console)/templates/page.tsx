import type { Metadata } from 'next';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead, Card, Pill } from '@/components/console/primitives';
import { TemplateLibrary } from '@/components/console/TemplateLibrary';
import { STANDARD_TEMPLATES, INTEGRATION_SURFACES } from '@/data/templates';
import { fetchDashboard } from '@/lib/api/mahainnovate';
import { buildRailContext } from '@/lib/console/rail';

export const metadata: Metadata = {
  title: 'Templates',
  description:
    'The seven standard templates the mechanism provides, with their fields, guidance, worked examples and standing clauses.',
};

export const dynamic = 'force-dynamic';

/**
 * The standard template library.
 *
 * The problem statement requires the mechanism to *provide* standard templates
 * for seven things. This is where they are provided — not listed, provided:
 * each with its actual fields, the guidance that stops a field being filled in
 * uselessly, a worked example from the demonstration pilot, and the standing
 * clauses that are not renegotiated per pilot.
 *
 * A template is only standard if it is specific. A named heading over a blank
 * page is what departments already have, and it is why two of them writing the
 * same challenge produce documents that cannot be compared or reused.
 */
export default async function TemplatesPage() {
  const snapshot = await fetchDashboard();
  const rail = buildRailContext(snapshot, new Date());

  const byStage = STANDARD_TEMPLATES.reduce<Record<string, number>>((acc, t) => {
    acc[t.stage] = (acc[t.stage] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <ConsoleHeader
        title="Standard templates"
        subtitle={`${STANDARD_TEMPLATES.length} forms issued by the mechanism, across ${Object.keys(byStage).length} stages`}
        notifications={rail.notifications}
      />

      <section aria-label="Templates">
        <SectionHead title="The library" meta="Fields, guidance and worked examples" />
        <TemplateLibrary />
      </section>

      {/* --- how the templates reach the outside world --- */}
      <section aria-label="Integration surfaces">
        <SectionHead
          title="Integration surfaces"
          meta={`${INTEGRATION_SURFACES.length}, both optional`}
        />

        <div className="grid gap-4 md:grid-cols-2">
          {INTEGRATION_SURFACES.map((surface) => (
            <Card key={surface.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-chalk/35">
                    {surface.id} · stage {surface.stage}
                  </span>
                  <h3 className="mt-1.5 font-display text-[0.9375rem] font-extrabold uppercase tracking-[-0.02em] text-chalk">
                    {surface.name}
                  </h3>
                </div>
                <Pill tone="chalk">{surface.status}</Pill>
              </div>

              <div className="mt-4 border-t border-chalk/[0.06] pt-4">
                <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/30">
                  What it is asked for
                </span>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-chalk/75">
                  {surface.contract}
                </p>
              </div>

              <div className="mt-4">
                <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/30">
                  Without it
                </span>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-chalk/50">
                  {surface.fallback}
                </p>
              </div>
            </Card>
          ))}
        </div>

        <p className="mt-4 max-w-[62ch] text-[0.8125rem] leading-relaxed text-chalk/45">
          The problem statement offers both as optional, so they are built as adapters at two named
          points rather than as dependencies. A department with neither still has a working
          mechanism — discovery reverts to a published open call, and award proceeds through the
          department&rsquo;s ordinary route.
        </p>
      </section>
    </>
  );
}
