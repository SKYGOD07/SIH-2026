import type { Metadata } from 'next';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { Figure, ProvenanceLine, AwaitingData } from '@/components/console/Figure';
import { Card, SectionHead } from '@/components/console/primitives';
import { fetchDashboard } from '@/lib/api/sarthi';
import { PROGRAMMES } from '@/data/programs';
import { SISFS_PATHWAY, SISFS_PATHWAY_SOURCE } from '@/data/sisfsPathway';

export const metadata: Metadata = {
  title: 'Intelligence',
  description:
    'What the platform knows about government startup programmes, every figure carrying the source it was read from.',
};

export const dynamic = 'force-dynamic';

/**
 * Programme intelligence.
 *
 * The one page in the console where figures are asserted as fact, and the only
 * one where that is currently defensible: everything here was read from a public
 * source on a recorded date, and every number carries a link back to it.
 *
 * It replaces a page that quoted seven government policy clauses verbatim, with
 * reference numbers and relevance scores, under the headline "Every conclusion
 * cites a clause". Those clauses were invented. Fabricating the citations on a
 * page whose whole argument is citation was the worst thing this prototype did,
 * and the correction is not a disclaimer — it is fewer claims, each real.
 *
 * The eligibility pathway at the bottom is the first checkable content the
 * platform has: nine stages and their document requirements, transcribed from
 * the tracker supplied for this project, with the scheme parameters it states
 * cross-checked against published descriptions of the scheme.
 */
export default async function IntelligencePage() {
  const { source } = await fetchDashboard();

  return (
    <>
      <ConsoleHeader
        title="Programme intelligence"
        subtitle={`${PROGRAMMES.length} programmes indexed · no startup records yet`}
        source={source}
      />

      {/* --- the verified layer --- */}
      {PROGRAMMES.map((programme) => (
        <section key={programme.id} aria-label={programme.name}>
          <SectionHead title={programme.name} meta={programme.operator} />

          <Card>
            <p className="max-w-[68ch] text-[0.875rem] leading-relaxed text-chalk/70">
              {programme.purpose}
            </p>

            <div className="mt-8 grid gap-x-10 gap-y-9 border-t border-chalk/[0.08] pt-8 sm:grid-cols-2 xl:grid-cols-3">
              {programme.facts.map((fact) => (
                <Figure key={fact.label} label={fact.label} data={fact.data} size="sm" />
              ))}

              <Figure
                label={`${programme.name} records held on this platform`}
                data={programme.records}
                size="sm"
              />
            </div>
          </Card>
        </section>
      ))}

      {/* --- the eligibility pathway --- */}
      <section aria-label="Seed Fund eligibility pathway">
        <SectionHead
          title="Seed Fund application pathway"
          meta={`${SISFS_PATHWAY.length} stages`}
        />

        <Card>
          <p className="max-w-[68ch] text-[0.8125rem] leading-relaxed text-chalk/55">
            What a startup must produce at each stage. Eligibility screening is stage 03 of the
            procurement pathway, and this is the first content the platform holds that an officer
            or a startup could actually work from.
          </p>

          <div className="mt-4">
            <ProvenanceLine data={SISFS_PATHWAY_SOURCE} />
          </div>

          <ol className="mt-8 border-t border-chalk/[0.08]">
            {SISFS_PATHWAY.map((stage) => (
              <li key={stage.step} className="border-b border-chalk/[0.06] py-4 last:border-b-0">
                <div className="flex items-baseline gap-4">
                  <span className="w-6 shrink-0 font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-chalk/30">
                    {String(stage.step).padStart(2, '0')}
                  </span>
                  <span className="font-display text-[0.875rem] font-bold uppercase tracking-[-0.02em] text-chalk">
                    {stage.name}
                  </span>
                </div>

                <ul className="mt-2 sm:pl-10">
                  {stage.requires.map((item) => (
                    <li
                      key={item}
                      className="py-0.5 text-[0.78125rem] leading-relaxed text-chalk/50"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      {/* --- what is still missing --- */}
      <section aria-label="Policy corpus">
        <SectionHead title="Policy corpus" meta="Empty" />

        <AwaitingData
          title="No policy documents ingested"
          holds="The scheme, procurement and policy documents every eligibility conclusion is cited against, chunked and retrievable, so an answer can name the clause it came from."
          blockedBy="Seven policy clauses were previously quoted here verbatim with reference numbers. They were invented and have been removed."
          next="Ingesting the actual documents: Seed Fund scheme guidelines, Maharashtra startup policy, public procurement rules and pilot guidelines."
        />
      </section>
    </>
  );
}
