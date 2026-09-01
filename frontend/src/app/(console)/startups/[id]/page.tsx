import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { Card, Pill, SectionHead, Tile } from '@/components/console/primitives';
import { Icon } from '@/components/console/Icon';
import { fetchCompanyDossier } from '@/lib/api/workflow';
import { AIAnalyzeButton } from '@/components/console/AIAnalyzeButton';

export const metadata: Metadata = {
  title: 'Government Company Analysis',
  description: 'Concise departmental decision view and evidence dossier for startup evaluation.',
};

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GovernmentAnalysisPage({ params }: PageProps) {
  const { id } = await params;
  const dossier = await fetchCompanyDossier(id);

  if (!dossier) {
    notFound();
  }

  const { company, signals, documentReadiness, totalDocuments, whyThisStartup, disclaimer } = dossier;

  const categoryLabels: Record<string, string> = {
    CORPORATE_LEGAL: 'Corporate & Legal',
    GOVERNMENT_FUNDING: 'Government Funding',
    FINANCIAL: 'Financial & Taxes',
    COMPLIANCE: 'Compliance & Cyber',
    TECHNOLOGY: 'Technology & Architecture',
    PILOT: 'Municipal Pilot Plan',
    AI_GOVERNANCE: 'AI Governance',
    OWNERSHIP: 'IP & Ownership',
    KYC: 'KYC & AML',
    CHECKLIST: 'Checklist',
    OTHER: 'Other Records',
  };

  return (
    <>
      <ConsoleHeader
        title={company.displayName || company.legalName}
        subtitle={`${company.sector} · ${company.city || ''} ${company.state || ''}`}
      />

      {/* --- DEMO SIMULATION NOTICE --- */}
      <div className="rounded-[12px] border border-signal/30 bg-signal/[0.08] px-4 py-3 text-chalk">
        <div className="flex items-center gap-2 font-mono text-[0.75rem] font-bold uppercase tracking-[0.1em] text-signal">
          <Pill tone="signal">DEMO SIMULATION</Pill>
          <span>Internal Hackathon Scenario</span>
        </div>
        <p className="mt-1.5 text-[0.78125rem] leading-relaxed text-chalk/80">{disclaimer}</p>
      </div>

      {/* --- COMPANY SNAPSHOT --- */}
      <section aria-label="Company Snapshot">
        <SectionHead title="Company Snapshot" meta={company.legalName} />
        <Card className="space-y-4">
          <div>
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-chalk/40">
              One-Line Description
            </span>
            <p className="mt-1 text-[0.9375rem] font-medium text-chalk">
              {company.oneLineDescription || company.description || 'No description provided.'}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-chalk/[0.08]">
            <div>
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-chalk/40">
                Problem Solved
              </span>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-chalk/70">
                {company.problemSolved || 'Not specified.'}
              </p>
            </div>
            <div>
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-chalk/40">
                Solution Summary
              </span>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-chalk/70">
                {company.solutionSummary || 'Not specified.'}
              </p>
            </div>
          </div>

          {/* Technologies & Capabilities */}
          <div className="pt-2 border-t border-chalk/[0.08]">
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-chalk/40">
              Technologies & Capabilities
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {company.technologies.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-signal/[0.12] px-2.5 py-0.5 font-mono text-[0.6875rem] font-semibold text-signal uppercase tracking-wider"
                >
                  {t}
                </span>
              ))}
              {company.capabilities.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-chalk/[0.08] px-2.5 py-0.5 font-mono text-[0.6875rem] text-chalk/70 uppercase tracking-wider"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* --- WHY THIS STARTUP? (DETERMINISTIC & AI ANALYSIS) --- */}
      <section aria-label="Why This Startup?">
        <SectionHead title="Sarthi Analysis — Why This Startup?" meta="Evidence-Grounded Summary" />
        <Card className="border-signal/30 bg-void-soft">
          <div className="flex items-center gap-2 mb-3">
            <Tile icon="intelligence" tone="signal" />
            <h3 className="font-display text-[0.9375rem] font-bold uppercase text-chalk">
              Evidence-Grounded Recommendation Analysis
            </h3>
          </div>

          <p className="text-[0.84375rem] leading-relaxed text-chalk/90 mb-4">
            {whyThisStartup.summary}
          </p>

          <div className="grid gap-4 md:grid-cols-2 pt-3 border-t border-chalk/[0.08]">
            <div>
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-validated font-bold">
                Key Strengths & Alignment
              </span>
              <ul className="mt-2 space-y-1.5">
                {whyThisStartup.strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[0.78125rem] text-chalk/80">
                    <Icon name="check" className="h-3.5 w-3.5 text-validated shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-risk font-bold">
                Limitations & Verification Notes
              </span>
              <ul className="mt-2 space-y-1.5">
                {whyThisStartup.limitations.map((l, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[0.78125rem] text-chalk/80">
                    <Icon name="alert" className="h-3.5 w-3.5 text-risk shrink-0 mt-0.5" />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Trigger Ollama AI Analysis */}
          <AIAnalyzeButton startupId={company.id} />
        </Card>
      </section>

      {/* --- GOVERNMENT READINESS & SIGNALS --- */}
      <section aria-label="Government Readiness">
        <SectionHead title="Government Readiness & Assurance" meta="Assurance Signals" />
        <div className="grid gap-3 md:grid-cols-3">
          {signals.map((sig) => (
            <Card key={sig.label}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-display text-[0.8125rem] font-bold text-chalk">
                  {sig.label}
                </span>
                <Pill
                  tone={
                    sig.level === 'HIGH'
                      ? 'validated'
                      : sig.level === 'MODERATE'
                      ? 'signal'
                      : sig.level === 'LOW'
                      ? 'risk'
                      : 'chalk'
                  }
                >
                  {sig.level}
                </Pill>
              </div>
              <ul className="space-y-1">
                {sig.basis.map((b, i) => (
                  <li key={i} className="text-[0.71875rem] leading-relaxed text-chalk/60">
                    • {b}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* --- PILOT READINESS --- */}
      <section aria-label="Pilot Readiness">
        <SectionHead title="Pilot Readiness" meta="Proposed Deployment Parameters" />
        <Card className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-chalk/40">
              Pilot Duration
            </span>
            <p className="mt-1 font-display text-[1.125rem] font-extrabold text-signal">
              {company.pilotDurationDays ? `${company.pilotDurationDays} Days` : 'Not specified'}
            </p>
          </div>
          <div>
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-chalk/40">
              Estimated Budget
            </span>
            <p className="mt-1 font-display text-[1.125rem] font-extrabold text-chalk">
              {company.estimatedPilotBudget
                ? `₹${(company.estimatedPilotBudget / 100000).toFixed(2)} Lakhs`
                : 'Not specified'}
            </p>
          </div>
          <div>
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-chalk/40">
              Deployment Model
            </span>
            <p className="mt-1 text-[0.8125rem] font-semibold text-chalk">
              {company.deploymentModel || 'Standard Deployment'}
            </p>
          </div>
          <div className="sm:col-span-2 md:col-span-3 pt-2 border-t border-chalk/[0.08]">
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-chalk/40">
              Infrastructure & Dependencies
            </span>
            <p className="mt-1 text-[0.78125rem] leading-relaxed text-chalk/70">
              {company.infrastructureRequirements || company.implementationDependencies || 'No special requirements specified.'}
            </p>
          </div>
        </Card>
      </section>

      {/* --- DOCUMENT READINESS COUNTERS --- */}
      <section aria-label="Document Readiness">
        <div className="flex items-center justify-between mb-4">
          <SectionHead title="Document Readiness" meta={`${totalDocuments} Evidenced Files`} />
          <Link
            href={`/startups/${id}/documents`}
            className="inline-flex items-center gap-1.5 rounded-[8px] bg-signal px-3 py-1.5 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-void transition-colors hover:bg-signal/90"
          >
            View Document Vault ({totalDocuments})
            <Icon name="upRight" className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {Object.entries(documentReadiness).map(([catKey, count]) => (
            <Card key={catKey} className="flex items-center justify-between p-3">
              <div>
                <span className="block font-mono text-[0.625rem] uppercase tracking-[0.1em] text-chalk/50">
                  {categoryLabels[catKey] || catKey}
                </span>
                <span className="mt-0.5 block font-display text-[1.125rem] font-extrabold tabular-nums text-chalk">
                  {count} file{count === 1 ? '' : 's'}
                </span>
              </div>
              <Tile
                icon={count > 0 ? 'check' : 'file'}
                tone={count > 0 ? 'validated' : 'chalk'}
              />
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
