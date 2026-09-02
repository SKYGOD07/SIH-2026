'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead } from '@/components/console/primitives';
import { RoleGate } from '@/components/auth/RoleGate';
import { fetchApi } from '@/lib/api';

export default function CreateChallengePage() {
  return (
    <RoleGate roles={['GOVERNMENT_OFFICER', 'ADMIN']}>
      <ChallengeForm />
    </RoleGate>
  );
}

function ChallengeForm() {
  const router = useRouter();
  const [plainProblem, setPlainProblem] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    department: 'Municipal Urban Administration & Environmental Department',
    title: '',
    domain: 'municipal-urban-operations',
    problemStatement: '',
    targetMetric: '',
    targetValue: '',
    targetTolerance: '',
    budgetEnvelope: '',
    pilotDurationDays: '90',
    technologies: '',
    currentBaseline: '',
    desiredOutcome: '',
    measurementMethod: '',
    measurementOwner: '',
    operatingConstraints: '',
    geographicScope: '',
    eligibilityRequirements: '',
    requiredCapabilities: '',
    dataRequirements: '',
    cybersecurityRequirements: '',
    deploymentRequirements: '',
    ipDataConstraints: '',
    evaluationCriteria: '',
  });

  const [aiProposal, setAiProposal] = useState<{
    summary?: string;
    questions?: string[];
    missingEvidence?: string[];
  } | null>(null);

  async function handleDraftWithAi() {
    if (!plainProblem.trim()) return;
    setDrafting(true);
    setError(null);
    try {
      const res = await fetchApi<{
        assisted: boolean;
        draft: any;
      }>('/api/ai/draft-challenge-proposal', {
        method: 'POST',
        body: JSON.stringify({ problem: plainProblem }),
      });

      if (res.draft) {
        setForm((prev) => ({
          ...prev,
          title: res.draft.title || prev.title,
          problemStatement: res.draft.problemStatement || prev.problemStatement,
          desiredOutcome: res.draft.desiredOutcome || prev.desiredOutcome,
          currentBaseline: res.draft.currentBaseline || prev.currentBaseline,
          targetMetric: res.draft.targetMetric || prev.targetMetric,
          targetValue: res.draft.targetValue ? String(res.draft.targetValue) : prev.targetValue,
          targetTolerance: res.draft.targetTolerance || prev.targetTolerance,
          measurementMethod: res.draft.measurementMethod || prev.measurementMethod,
          measurementOwner: res.draft.measurementOwner || prev.measurementOwner,
          operatingConstraints: res.draft.operatingConstraints || prev.operatingConstraints,
          geographicScope: res.draft.geographicScope || prev.geographicScope,
          eligibilityRequirements: (res.draft.eligibilityRequirements || []).join(', '),
          requiredCapabilities: (res.draft.requiredCapabilities || []).join(', '),
          dataRequirements: res.draft.dataRequirements || prev.dataRequirements,
          cybersecurityRequirements: res.draft.cybersecurityRequirements || prev.cybersecurityRequirements,
          deploymentRequirements: res.draft.deploymentRequirements || prev.deploymentRequirements,
          ipDataConstraints: res.draft.ipDataConstraints || prev.ipDataConstraints,
          evaluationCriteria: (res.draft.evaluationCriteria || []).join(', '),
        }));

        setAiProposal({
          summary: res.draft.summary || 'AI drafted a proposal.',
          questions: res.draft.questions || [],
          missingEvidence: res.draft.missingEvidence || [],
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Drafting failed.');
    } finally {
      setDrafting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent, publish: boolean = true) {
    e.preventDefault();
    if (publish && (!form.title || !form.problemStatement || !form.targetMetric)) {
      setError('Title, Problem Statement, and Target Metric are required to publish.');
      return;
    }
    if (!form.title) {
      setError('A title is required to save.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        targetValue: form.targetValue ? Number(form.targetValue) : undefined,
        budgetEnvelope: form.budgetEnvelope ? Number(form.budgetEnvelope) : undefined,
        pilotDurationDays: form.pilotDurationDays ? Number(form.pilotDurationDays) : undefined,
        technologies: form.technologies
          ? form.technologies.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        eligibilityRequirements: form.eligibilityRequirements ? form.eligibilityRequirements.split(',').map(s=>s.trim()).filter(Boolean) : undefined,
        requiredCapabilities: form.requiredCapabilities ? form.requiredCapabilities.split(',').map(s=>s.trim()).filter(Boolean) : undefined,
        evaluationCriteria: form.evaluationCriteria ? form.evaluationCriteria.split(',').map(s=>s.trim()).filter(Boolean) : undefined,
      };

      const res = await fetchApi<{ id: string }>('/api/workflow/challenges', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (publish) {
        await fetchApi(`/api/workflow/challenges/${res.id}/publish`, { method: 'POST' });
      }

      router.push(`/challenges/${res.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save challenge.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <ConsoleHeader
        title="Create New Opportunity"
        subtitle="Formulate an outcome-based problem statement for innovative startups"
        source="demonstration"
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
        {/* --- Left: AI Drafting Assistant ----------------------------- */}
        <section aria-label="AI Assist">
          <div className="sticky top-24">
            <SectionHead title="1. Plain-Language Operational Problem" meta="AI Assisted" />
            <div className="card space-y-4 p-5">
              <p className="text-[0.8125rem] leading-relaxed text-chalk/60">
                Describe the operational bottleneck or problem in your own words. Sarthi AI will help
                structure it into an outcome-based challenge specification.
              </p>

              <textarea
                value={plainProblem}
                onChange={(e) => setPlainProblem(e.target.value)}
                placeholder="e.g. Cities face waste collection route inefficiencies and unmonitored overflow during monsoon..."
                className="h-32 w-full rounded-[8px] border border-chalk/20 bg-void p-3 text-[0.875rem] text-chalk outline-none focus:border-signal"
              />

              <button
                type="button"
                onClick={handleDraftWithAi}
                disabled={drafting || !plainProblem.trim()}
                className="rounded-[8px] bg-signal px-4 py-2 font-mono text-[0.75rem] font-bold uppercase tracking-[0.1em] text-void transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {drafting ? 'Drafting with AI…' : '✨ Draft with AI'}
              </button>

              {aiProposal && (
                <div className="mt-4 space-y-3 rounded-[8px] border border-signal/30 bg-signal/5 p-4 text-[0.8125rem]">
                  <p className="font-semibold text-signal">AI Proposal Generated</p>
                  <p className="text-chalk/80">{aiProposal.summary}</p>
                  
                  {aiProposal.questions && aiProposal.questions.length > 0 && (
                    <div>
                      <p className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-chalk/50">
                        Key Questions for Reviewer:
                      </p>
                      <ul className="mt-1 list-inside list-disc text-chalk/70">
                        {aiProposal.questions.map((q, i) => <li key={i}>{q}</li>)}
                      </ul>
                    </div>
                  )}
                  {aiProposal.missingEvidence && aiProposal.missingEvidence.length > 0 && (
                    <div>
                      <p className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-chalk/50">
                        Missing context:
                      </p>
                      <ul className="mt-1 list-inside list-disc text-chalk/70">
                        {aiProposal.missingEvidence.map((q, i) => <li key={i}>{q}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* --- Right: Official Challenge Fields ------------------------- */}
        <section aria-label="Challenge Form">
          <SectionHead title="2. Review & Publish Challenge" meta="Officer Review Required" />
          <form className="card space-y-6 p-5">
            {error && <div className="rounded border border-risk/30 p-3 text-[0.8125rem] text-risk">{error}</div>}

            <div className="space-y-4">
              <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-signal">Core Definition</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.75rem] font-medium text-chalk/70">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk focus:border-signal outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[0.75rem] font-medium text-chalk/70">Challenge Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk focus:border-signal outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[0.75rem] font-medium text-chalk/70">Problem Statement</label>
                <p className="text-[0.6875rem] text-chalk/50">The operational problem without assuming the solution.</p>
                <textarea
                  value={form.problemStatement}
                  onChange={(e) => setForm({ ...form, problemStatement: e.target.value })}
                  className="mt-1 h-24 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk focus:border-signal outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[0.75rem] font-medium text-chalk/70">Desired Outcome</label>
                <p className="text-[0.6875rem] text-chalk/50">What does success look like for the department?</p>
                <textarea
                  value={form.desiredOutcome}
                  onChange={(e) => setForm({ ...form, desiredOutcome: e.target.value })}
                  className="mt-1 h-20 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk focus:border-signal outline-none"
                />
              </div>
            </div>

            <hr className="border-chalk/10" />

            <div className="space-y-4">
              <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-signal">Measurement & Targets</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.75rem] font-medium text-chalk/70">Current Baseline</label>
                  <p className="text-[0.6875rem] text-chalk/50">What is the baseline before the pilot?</p>
                  <input
                    type="text"
                    value={form.currentBaseline}
                    onChange={(e) => setForm({ ...form, currentBaseline: e.target.value })}
                    className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk focus:border-signal outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.75rem] font-medium text-chalk/70">Target Metric</label>
                  <p className="text-[0.6875rem] text-chalk/50">The single KPI to measure success against.</p>
                  <input
                    type="text"
                    value={form.targetMetric}
                    onChange={(e) => setForm({ ...form, targetMetric: e.target.value })}
                    className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk focus:border-signal outline-none"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[0.75rem] font-medium text-chalk/70">Target Value</label>
                  <input
                    type="number"
                    value={form.targetValue}
                    onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                    className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk focus:border-signal outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.75rem] font-medium text-chalk/70">Tolerance</label>
                  <input
                    type="text"
                    value={form.targetTolerance}
                    onChange={(e) => setForm({ ...form, targetTolerance: e.target.value })}
                    className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk focus:border-signal outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.75rem] font-medium text-chalk/70">Measurement Owner</label>
                  <input
                    type="text"
                    value={form.measurementOwner}
                    onChange={(e) => setForm({ ...form, measurementOwner: e.target.value })}
                    className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk focus:border-signal outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[0.75rem] font-medium text-chalk/70">Measurement Method</label>
                <input
                  type="text"
                  value={form.measurementMethod}
                  onChange={(e) => setForm({ ...form, measurementMethod: e.target.value })}
                  className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk focus:border-signal outline-none"
                />
              </div>
            </div>

            <hr className="border-chalk/10" />

            <div className="space-y-4">
              <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-signal">Pilot Constraints & Requirements</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.75rem] font-medium text-chalk/70">Budget Envelope (₹)</label>
                  <input
                    type="number"
                    value={form.budgetEnvelope}
                    onChange={(e) => setForm({ ...form, budgetEnvelope: e.target.value })}
                    className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk focus:border-signal outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.75rem] font-medium text-chalk/70">Pilot Duration (Days)</label>
                  <input
                    type="number"
                    value={form.pilotDurationDays}
                    onChange={(e) => setForm({ ...form, pilotDurationDays: e.target.value })}
                    className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk focus:border-signal outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[0.75rem] font-medium text-chalk/70">Operating Constraints</label>
                <input
                  type="text"
                  value={form.operatingConstraints}
                  onChange={(e) => setForm({ ...form, operatingConstraints: e.target.value })}
                  className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk focus:border-signal outline-none"
                />
              </div>
              <div>
                <label className="block text-[0.75rem] font-medium text-chalk/70">Geographic Scope</label>
                <input
                  type="text"
                  value={form.geographicScope}
                  onChange={(e) => setForm({ ...form, geographicScope: e.target.value })}
                  className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk focus:border-signal outline-none"
                />
              </div>
              <div>
                <label className="block text-[0.75rem] font-medium text-chalk/70">Data Requirements</label>
                <input
                  type="text"
                  value={form.dataRequirements}
                  onChange={(e) => setForm({ ...form, dataRequirements: e.target.value })}
                  className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk focus:border-signal outline-none"
                />
              </div>
              <div>
                <label className="block text-[0.75rem] font-medium text-chalk/70">Cybersecurity Requirements</label>
                <input
                  type="text"
                  value={form.cybersecurityRequirements}
                  onChange={(e) => setForm({ ...form, cybersecurityRequirements: e.target.value })}
                  className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk focus:border-signal outline-none"
                />
              </div>
            </div>

            <hr className="border-chalk/10" />

            <div className="space-y-4">
              <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-signal">Tags & Eligibility (Comma separated)</h3>
              
              <div>
                <label className="block text-[0.75rem] font-medium text-chalk/70">Eligibility Requirements</label>
                <input
                  type="text"
                  value={form.eligibilityRequirements}
                  onChange={(e) => setForm({ ...form, eligibilityRequirements: e.target.value })}
                  className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk focus:border-signal outline-none"
                />
              </div>
              <div>
                <label className="block text-[0.75rem] font-medium text-chalk/70">Required Capabilities</label>
                <input
                  type="text"
                  value={form.requiredCapabilities}
                  onChange={(e) => setForm({ ...form, requiredCapabilities: e.target.value })}
                  className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk focus:border-signal outline-none"
                />
              </div>
              <div>
                <label className="block text-[0.75rem] font-medium text-chalk/70">Evaluation Criteria</label>
                <input
                  type="text"
                  value={form.evaluationCriteria}
                  onChange={(e) => setForm({ ...form, evaluationCriteria: e.target.value })}
                  className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk focus:border-signal outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-chalk/10">
              <Link href="/challenges" className="rounded px-4 py-2 text-[0.8125rem] text-chalk/60 hover:text-chalk flex items-center">
                Cancel
              </Link>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={saving}
                className="rounded border border-chalk/20 px-5 py-2 font-mono text-[0.75rem] font-bold uppercase tracking-[0.1em] text-chalk hover:bg-chalk/5 disabled:opacity-40"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={saving}
                className="rounded bg-signal px-5 py-2 font-mono text-[0.75rem] font-bold uppercase tracking-[0.1em] text-void hover:bg-signal/90 disabled:opacity-40"
              >
                {saving ? 'Publishing…' : 'Publish Opportunity'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
