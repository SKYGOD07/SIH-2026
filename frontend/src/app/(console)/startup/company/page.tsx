'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead } from '@/components/console/primitives';
import { RoleGate } from '@/components/auth/RoleGate';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthProvider';

/**
 * Company profile editor.
 *
 * The startup's own view of its profile — every field the backend allows
 * through `companyProfileSchema` is editable here, grouped into sections
 * that match the government dossier's reading order. Changes are saved
 * per-section rather than as a single giant form, so the profile can be
 * built up over multiple sessions without losing partial progress.
 */

interface CompanyData {
  id: string;
  legalName: string;
  displayName: string | null;
  sector: string;
  industry: string | null;
  stage: string | null;
  state: string | null;
  city: string | null;
  website: string | null;
  oneLineDescription: string | null;
  description: string | null;
  foundedYear: number | null;
  teamSize: number | null;
  founderSummary: string | null;
  problemSolved: string | null;
  solutionSummary: string | null;
  productSummary: string | null;
  targetUsers: string | null;
  deploymentModel: string | null;
  geographicCoverage: string | null;
  technologies: string[];
  capabilities: string[];
  revenueBand: string | null;
  customerCount: number | null;
  deploymentCount: number | null;
  commercializationStage: string | null;
  governmentExperienceSummary: string | null;
  complianceStatus: string;
  cybersecurityStatus: string;
  dataPrivacyStatus: string;
  requiredCertifications: string[];
  pilotDurationDays: number | null;
  pilotTeamSummary: string | null;
  infrastructureRequirements: string | null;
  implementationDependencies: string | null;
  deploymentRequirements: string | null;
  estimatedPilotBudget: number | null;
  scalingRequirements: string | null;
}

export default function CompanyPage() {
  return (
    <RoleGate roles={['STARTUP']}>
      <CompanyEditor />
    </RoleGate>
  );
}

function CompanyEditor() {
  const { profile } = useAuth();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchApi<{ startup: CompanyData }>('/api/workflow/company/me')
      .then((r) => {
        setCompany(r.startup);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load company'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (profile?.startupId) load();
    else setLoading(false);
  }, [profile, load]);

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const res = await fetchApi<{ startup: CompanyData }>('/api/workflow/company/me', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setCompany(res.startup);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <ConsoleHeader title="Company profile" subtitle="Loading…" />
        <div className="card p-6 text-chalk/50 text-[0.8125rem]">Loading your company data…</div>
      </>
    );
  }

  if (!profile?.startupId || error) {
    return (
      <>
        <ConsoleHeader
          title="Company profile"
          subtitle="No company linked to your account yet."
        />
        <div className="card p-6">
          <p className="text-[0.875rem] text-chalk/60">
            {error ?? 'Your account is not linked to a company. Go back to the dashboard.'}
          </p>
          <Link href="/startup" className="mt-4 inline-block text-signal hover:underline text-[0.8125rem]">
            ← Back to dashboard
          </Link>
        </div>
      </>
    );
  }

  if (!company) return null;

  const name = company.displayName || company.legalName;

  return (
    <>
      <ConsoleHeader
        title={name}
        subtitle={`${company.sector}${company.city ? ` · ${company.city}` : ''}${company.state ? `, ${company.state}` : ''}`}
      />

      <Link href="/startup" className="mb-4 inline-block text-[0.8125rem] text-chalk/50 hover:text-signal">
        ← Back to dashboard
      </Link>

      {/* Save feedback */}
      {saved && (
        <div className="mb-4 rounded-[10px] border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-[0.8125rem] text-green-400 font-mono">
          ✓ Saved successfully
        </div>
      )}
      {saveError && (
        <div className="mb-4 rounded-[10px] border border-risk/30 bg-risk/10 px-4 py-2.5 text-[0.8125rem] text-risk">
          {saveError}
        </div>
      )}

      {/* Identity */}
      <EditSection
        title="Identity"
        company={company}
        saving={saving}
        onSave={save}
        fields={[
          { key: 'legalName', label: 'Legal name', type: 'text' },
          { key: 'displayName', label: 'Display name', type: 'text' },
          { key: 'oneLineDescription', label: 'One-line description', type: 'text' },
          { key: 'foundedYear', label: 'Founded year', type: 'number' },
          { key: 'teamSize', label: 'Team size', type: 'number' },
          { key: 'website', label: 'Website', type: 'text' },
        ]}
      />

      {/* Location & stage */}
      <EditSection
        title="Location & stage"
        company={company}
        saving={saving}
        onSave={save}
        fields={[
          { key: 'sector', label: 'Sector', type: 'text' },
          { key: 'industry', label: 'Industry', type: 'text' },
          { key: 'stage', label: 'Stage', type: 'text' },
          { key: 'state', label: 'State', type: 'text' },
          { key: 'city', label: 'City', type: 'text' },
        ]}
      />

      {/* Solution */}
      <EditSection
        title="What you build"
        company={company}
        saving={saving}
        onSave={save}
        fields={[
          { key: 'problemSolved', label: 'Problem solved', type: 'textarea' },
          { key: 'solutionSummary', label: 'Solution summary', type: 'textarea' },
          { key: 'productSummary', label: 'Product summary', type: 'textarea' },
          { key: 'targetUsers', label: 'Target users', type: 'text' },
          { key: 'deploymentModel', label: 'Deployment model', type: 'text' },
          { key: 'geographicCoverage', label: 'Geographic coverage', type: 'text' },
        ]}
      />

      {/* Tags */}
      <EditSection
        title="Technologies & capabilities"
        company={company}
        saving={saving}
        onSave={save}
        fields={[
          { key: 'technologies', label: 'Technologies (comma-separated)', type: 'tags' },
          { key: 'capabilities', label: 'Capabilities (comma-separated)', type: 'tags' },
        ]}
      />

      {/* Traction */}
      <EditSection
        title="Traction"
        company={company}
        saving={saving}
        onSave={save}
        fields={[
          { key: 'revenueBand', label: 'Revenue band', type: 'text' },
          { key: 'customerCount', label: 'Customer count', type: 'number' },
          { key: 'deploymentCount', label: 'Deployment count', type: 'number' },
          { key: 'commercializationStage', label: 'Commercialization stage', type: 'text' },
        ]}
      />

      {/* Team & leadership */}
      <EditSection
        title="Team & leadership"
        company={company}
        saving={saving}
        onSave={save}
        fields={[
          { key: 'founderSummary', label: 'Founder summary', type: 'textarea' },
          { key: 'description', label: 'Company description', type: 'textarea' },
        ]}
      />

      {/* Government experience */}
      <EditSection
        title="Government experience"
        company={company}
        saving={saving}
        onSave={save}
        fields={[
          { key: 'governmentExperienceSummary', label: 'Government experience', type: 'textarea' },
        ]}
      />

      {/* Assurance */}
      <EditSection
        title="Compliance & assurance"
        company={company}
        saving={saving}
        onSave={save}
        fields={[
          { key: 'complianceStatus', label: 'Compliance status', type: 'select', options: ['NOT_PROVIDED', 'SELF_DECLARED'] },
          { key: 'cybersecurityStatus', label: 'Cybersecurity status', type: 'select', options: ['NOT_PROVIDED', 'SELF_DECLARED'] },
          { key: 'dataPrivacyStatus', label: 'Data privacy status', type: 'select', options: ['NOT_PROVIDED', 'SELF_DECLARED'] },
          { key: 'requiredCertifications', label: 'Certifications (comma-separated)', type: 'tags' },
        ]}
      />

      {/* Pilot readiness */}
      <EditSection
        title="Pilot readiness"
        company={company}
        saving={saving}
        onSave={save}
        fields={[
          { key: 'pilotDurationDays', label: 'Pilot duration (days)', type: 'number' },
          { key: 'pilotTeamSummary', label: 'Pilot team summary', type: 'textarea' },
          { key: 'infrastructureRequirements', label: 'Infrastructure requirements', type: 'textarea' },
          { key: 'implementationDependencies', label: 'Implementation dependencies', type: 'textarea' },
          { key: 'deploymentRequirements', label: 'Deployment requirements', type: 'textarea' },
          { key: 'estimatedPilotBudget', label: 'Estimated pilot budget (₹)', type: 'number' },
          { key: 'scalingRequirements', label: 'Scaling requirements', type: 'textarea' },
        ]}
      />
    </>
  );
}

/* ─── Section component ──────────────────────────────────────────────── */

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'tags' | 'select';
  options?: string[];
}

function EditSection({
  title,
  company,
  fields,
  saving,
  onSave,
}: {
  title: string;
  company: CompanyData;
  fields: FieldDef[];
  saving: boolean;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState<Record<string, string>>({});

  function startEdit() {
    const state: Record<string, string> = {};
    for (const f of fields) {
      const val = (company as unknown as Record<string, unknown>)[f.key];
      if (f.type === 'tags') {
        state[f.key] = Array.isArray(val) ? (val as string[]).join(', ') : '';
      } else {
        state[f.key] = val == null ? '' : String(val);
      }
    }
    setLocal(state);
    setEditing(true);
  }

  async function handleSave() {
    const patch: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = local[f.key] ?? '';
      if (f.type === 'number') {
        patch[f.key] = raw === '' ? null : Number(raw);
      } else if (f.type === 'tags') {
        patch[f.key] = raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        patch[f.key] = raw === '' ? null : raw;
      }
    }
    await onSave(patch);
    setEditing(false);
  }

  return (
    <section className="mb-4">
      <SectionHead title={title} />
      <div className="card p-5">
        {editing ? (
          <div className="space-y-4">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="mb-1.5 block font-mono text-[0.625rem] uppercase tracking-[0.16em] text-chalk/50">
                  {f.label}
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    className="w-full rounded-[8px] border border-chalk/10 bg-chalk/[0.04] px-3 py-2.5 text-[0.8125rem] text-chalk placeholder:text-chalk/25 focus:border-signal/50 focus:outline-none transition-colors resize-y min-h-[80px]"
                    rows={3}
                    value={local[f.key] ?? ''}
                    onChange={(e) => setLocal({ ...local, [f.key]: e.target.value })}
                  />
                ) : f.type === 'select' ? (
                  <select
                    className="w-full rounded-[8px] border border-chalk/10 bg-chalk/[0.04] px-3 py-2.5 text-[0.8125rem] text-chalk focus:border-signal/50 focus:outline-none transition-colors"
                    value={local[f.key] ?? ''}
                    onChange={(e) => setLocal({ ...local, [f.key]: e.target.value })}
                  >
                    {f.options?.map((o) => (
                      <option key={o} value={o} className="bg-[#1a1a1a] text-chalk">
                        {o.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    className="w-full rounded-[8px] border border-chalk/10 bg-chalk/[0.04] px-3 py-2.5 text-[0.8125rem] text-chalk placeholder:text-chalk/25 focus:border-signal/50 focus:outline-none transition-colors"
                    value={local[f.key] ?? ''}
                    onChange={(e) => setLocal({ ...local, [f.key]: e.target.value })}
                  />
                )}
              </div>
            ))}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-[8px] bg-signal px-4 py-2 text-[0.75rem] font-bold uppercase tracking-[0.1em] text-ink transition-all hover:brightness-110 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-[8px] border border-chalk/10 px-4 py-2 text-[0.75rem] uppercase tracking-[0.1em] text-chalk/60 hover:text-chalk transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="space-y-3">
              {fields.map((f) => {
                const val = (company as unknown as Record<string, unknown>)[f.key];
                const display = f.type === 'tags'
                  ? Array.isArray(val) ? (val as string[]).join(', ') : '—'
                  : val == null || val === ''
                    ? '—'
                    : String(val);
                return (
                  <div key={f.key} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
                    <span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-chalk/40 sm:w-[180px]">
                      {f.label}
                    </span>
                    <span className={`text-[0.8125rem] leading-relaxed ${display === '—' ? 'text-chalk/25' : 'text-chalk/80'}`}>
                      {f.type === 'select' ? display.replace(/_/g, ' ') : display}
                    </span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={startEdit}
              className="mt-4 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-signal hover:underline"
            >
              Edit section ↗
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
