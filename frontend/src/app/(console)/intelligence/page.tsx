import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { KnowledgeGraphSection } from '@/components/sections/KnowledgeGraphSection';
import { FailureSection } from '@/components/sections/FailureSection';
import { EVIDENCE_SOURCES, SOURCE_LABEL } from '@/data/evidence';
import { Label } from '@/components/typography';

export const metadata: Metadata = {
  title: 'Intelligence',
  description:
    'The institutional record: what each pilot produced, what the failures taught, and the policy corpus every eligibility conclusion is cited against.',
};

export default function IntelligencePage() {
  return (
    <>
      <PageHeader
        index="—"
        eyebrow="Institutional intelligence"
        title="What the state has learned"
        lede="Every completed pilot leaves a node behind: the problem it addressed, the evidence it produced, and the constraint it exposed. A department starting a comparable challenge starts from this record rather than from scratch."
      />

      <KnowledgeGraphSection />
      <FailureSection />

      {/* --- the corpus every conclusion is cited against --- */}
      <section
        aria-label="Policy corpus"
        className="relative w-full ground-void py-[clamp(5rem,12vh,9rem)]"
      >
        <div className="edge mx-auto max-w-[110rem]">
          <Label index="—">Policy corpus</Label>
          <h2 className="mt-6 max-w-[22ch] font-display text-display-sm font-medium uppercase leading-[0.9] text-chalk">
            Every conclusion cites a clause.
          </h2>
          <p className="mt-6 max-w-[62ch] text-pretty text-base leading-relaxed text-chalk/50">
            Eligibility, security and contracting questions are answered by retrieving from this
            corpus and quoting it. The analysis that accompanies a retrieval is assistive; the
            determination stays with the department’s competent authority.
          </p>

          <ul className="mt-14 grid gap-px border-t border-chalk/15 md:grid-cols-2">
            {EVIDENCE_SOURCES.map((s) => (
              <li key={s.id} className="border-b border-chalk/15 py-7 md:pr-10">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <span className="font-mono text-meta uppercase text-signal">
                    {SOURCE_LABEL[s.kind]}
                  </span>
                  <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-chalk/50">
                    {s.id}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-xl uppercase leading-tight text-chalk">
                  {s.title}
                </h3>
                <p className="mt-1.5 font-mono text-meta uppercase text-chalk/50">{s.reference}</p>
                <blockquote className="mt-4 border-l border-chalk/20 pl-4">
                  <p className="max-w-[56ch] text-sm italic leading-relaxed text-chalk/70">
                    “{s.excerpt}”
                  </p>
                </blockquote>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
