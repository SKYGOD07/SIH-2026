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
    budgetEnvelope: '',
    pilotDurationDays: '90',
    technologies: '',
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
      // Suggest fields & drafting assistance from problem statement
      const result = await fetchApi<{
        taxonomy?: { field: string; label: string }[];
        browsable?: string[];
      }>('/api/ai/discover/fields', {
        method: 'POST',
        body: JSON.stringify({ problem: plainProblem }),
      });

      setForm((prev) => ({
        ...prev,
        problemStatement: plainProblem,
        title: prev.title || plainProblem.slice(0, 60) + '...',
        targetMetric: prev.targetMetric || 'Efficiency Gain (%)',
      }));

      setAiProposal({
        summary: `AI Proposed outcome-based draft for "${plainProblem.slice(0, 40)}..."`,
        questions: [
          'What baseline measurement does the department currently hold?',
          'Who will independently validate the pilot metric?',
        ],
        missingEvidence: ['Historical baseline dataset', 'Field test access permission'],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Drafting failed.');
    } finally {
      setDrafting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.problemStatement || !form.targetMetric) {
      setError('Title, Problem Statement, and Target Metric are required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        department: form.department,
        title: form.title,
        problemStatement: form.problemStatement,
        domain: form.domain,
        targetMetric: form.targetMetric,
        targetValue: form.targetValue ? Number(form.targetValue) : undefined,
        budgetEnvelope: form.budgetEnvelope ? Number(form.budgetEnvelope) : undefined,
        pilotDurationDays: form.pilotDurationDays ? Number(form.pilotDurationDays) : undefined,
        technologies: form.technologies
          ? form.technologies.split(',').map((t) => t.trim()).filter(Boolean)
          : ['ai', 'analytics'],
      };

      const res = await fetchApi<{ id: string }>('/api/workflow/challenges', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Publish challenge immediately
      await fetchApi(`/api/workflow/challenges/${res.id}/publish`, { method: 'POST' });

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
        title="Create New Challenge"
        subtitle="Formulate an outcome-based problem statement for innovative startups"
        source="demonstration"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* --- Left: AI Drafting Assistant ----------------------------- */}
        <section aria-label="AI Assist">
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
                <div>
                  <p className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-chalk/50">
                    Key Questions for Reviewer:
                  </p>
                  <ul className="mt-1 list-inside list-disc text-chalk/70">
                    {aiProposal.questions?.map((q, i) => <li key={i}>{q}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* --- Right: Official Challenge Fields ------------------------- */}
        <section aria-label="Challenge Form">
          <SectionHead title="2. Review & Publish Challenge" meta="Officer Review Required" />
          <form onSubmit={handleSubmit} className="card space-y-4 p-5">
            {error && <div className="rounded border border-risk/30 p-3 text-[0.8125rem] text-risk">{error}</div>}

            <div>
              <label className="block text-[0.75rem] text-chalk/70">Department</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk"
                required
              />
            </div>

            <div>
              <label className="block text-[0.75rem] text-chalk/70">Challenge Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Municipal Waste & Urban Operations Optimization"
                className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk"
                required
              />
            </div>

            <div>
              <label className="block text-[0.75rem] text-chalk/70">Problem Statement</label>
              <textarea
                value={form.problemStatement}
                onChange={(e) => setForm({ ...form, problemStatement: e.target.value })}
                className="mt-1 h-24 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.75rem] text-chalk/70">Target Metric</label>
                <input
                  type="text"
                  value={form.targetMetric}
                  onChange={(e) => setForm({ ...form, targetMetric: e.target.value })}
                  placeholder="e.g. Route Efficiency Gain"
                  className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk"
                  required
                />
              </div>
              <div>
                <label className="block text-[0.75rem] text-chalk/70">Target Value (%)</label>
                <input
                  type="number"
                  value={form.targetValue}
                  onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                  placeholder="20"
                  className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.75rem] text-chalk/70">Budget Envelope (₹)</label>
                <input
                  type="number"
                  value={form.budgetEnvelope}
                  onChange={(e) => setForm({ ...form, budgetEnvelope: e.target.value })}
                  placeholder="1500000"
                  className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk"
                />
              </div>
              <div>
                <label className="block text-[0.75rem] text-chalk/70">Pilot Duration (Days)</label>
                <input
                  type="number"
                  value={form.pilotDurationDays}
                  onChange={(e) => setForm({ ...form, pilotDurationDays: e.target.value })}
                  className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk"
                />
              </div>
            </div>

            <div>
              <label className="block text-[0.75rem] text-chalk/70">Required Tech (Comma separated)</label>
              <input
                type="text"
                value={form.technologies}
                onChange={(e) => setForm({ ...form, technologies: e.target.value })}
                placeholder="ai, iot, gis, analytics"
                className="mt-1 w-full rounded border border-chalk/20 bg-void p-2 text-[0.875rem] text-chalk"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/challenges" className="rounded px-4 py-2 text-[0.8125rem] text-chalk/60 hover:text-chalk">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-signal px-5 py-2 font-mono text-[0.75rem] font-bold uppercase tracking-[0.1em] text-void disabled:opacity-40"
              >
                {saving ? 'Publishing…' : 'Publish Challenge'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
