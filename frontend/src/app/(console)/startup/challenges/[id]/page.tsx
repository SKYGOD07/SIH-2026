'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead } from '@/components/console/primitives';
import { fetchApi } from '@/lib/api';

interface OpenChallenge {
  id: string;
  department: string;
  title: string;
  problemStatement: string;
  domain: string;
  technologies: string[];
  targetMetric: string;
  budgetEnvelope?: string;
  pilotDurationDays?: number;
}

interface StartupResponse {
  solutionSummary: string;
  capabilities: string[];
  technologies: string[];
  deploymentApproach: string;
  expectedResult: string;
  pilotApproach: string;
  constraints: string;
  status: 'DRAFT' | 'SUBMITTED';
}

export default function ChallengeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [challenge, setChallenge] = useState<OpenChallenge | null>(null);
  const [response, setResponse] = useState<StartupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<StartupResponse>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let live = true;
    
    Promise.all([
      fetchApi<OpenChallenge[]>('/api/workflow/challenges/open'),
      fetchApi<{ challengeId: string; status: 'DRAFT' | 'SUBMITTED'; solutionSummary: string; capabilities: string[]; technologies: string[]; deploymentApproach: string; expectedResult: string; pilotApproach: string; constraints?: string }[]>('/api/workflow/responses/mine')
    ]).then(([challenges, responses]) => {
      if (!live) return;
      const found = challenges.find((c) => c.id === params.id);
      if (found) {
        setChallenge(found);
      } else {
        setError('Challenge not found or no longer open.');
      }
      
      const existing = responses.find((r) => r.challengeId === params.id);
      if (existing) {
        setResponse(existing as any);
        setFormData(existing);
      }
      
      setLoading(false);
    }).catch(err => {
      if (live) {
        setError(err instanceof Error ? err.message : 'Failed to load challenge details.');
        setLoading(false);
      }
    });
    
    return () => { live = false; };
  }, [params.id]);

  const handleSubmit = async (submit: boolean) => {
    try {
      setSaving(true);
      await fetchApi(`/api/workflow/challenges/${params.id}/response`, {
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          capabilities: formData.capabilities || [],
          technologies: formData.technologies || [],
          submit
        })
      });
      router.push(submit ? '/startup/applications' : '/startup/challenges');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save response.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-chalk/50">Loading...</div>;
  if (error || !challenge) return <div className="p-8 text-risk">{error}</div>;

  const isSubmitted = response?.status === 'SUBMITTED';

  return (
    <>
      <ConsoleHeader
        title={challenge.title}
        subtitle={`${challenge.department} · ${challenge.domain}`}
        source="demonstration"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section aria-label="Challenge Details">
          <SectionHead title="Opportunity Details" />
          <div className="card p-6 space-y-4 text-[0.875rem] text-chalk/80 leading-relaxed">
            <div>
              <strong className="text-chalk block mb-1">Problem Statement</strong>
              <p>{challenge.problemStatement}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong className="text-chalk block mb-1">Target Metric</strong>
                <p>{challenge.targetMetric}</p>
              </div>
              {challenge.budgetEnvelope && (
                <div>
                  <strong className="text-chalk block mb-1">Budget Envelope</strong>
                  <p>₹{challenge.budgetEnvelope}</p>
                </div>
              )}
            </div>

            {challenge.technologies && challenge.technologies.length > 0 && (
              <div>
                <strong className="text-chalk block mb-1">Requested Technologies</strong>
                <div className="flex flex-wrap gap-2 mt-2">
                  {challenge.technologies.map(t => (
                    <span key={t} className="bg-chalk/10 text-chalk px-2 py-1 rounded text-xs">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section aria-label="My Response">
          <SectionHead title="My Response" />
          <div className="card p-6">
            {isSubmitted ? (
              <div className="space-y-4 text-[0.875rem] text-chalk/80">
                <div className="bg-signal/10 text-signal p-4 rounded text-sm mb-6">
                  You have submitted this response. It is now under review by the department.
                </div>
                <div>
                  <strong className="text-chalk block mb-1">Solution Summary</strong>
                  <p>{response.solutionSummary}</p>
                </div>
                <div>
                  <strong className="text-chalk block mb-1">Deployment Approach</strong>
                  <p>{response.deploymentApproach}</p>
                </div>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={e => e.preventDefault()}>
                <div>
                  <label className="block text-[0.8125rem] text-chalk mb-1">Solution Summary</label>
                  <textarea 
                    className="w-full bg-black border border-chalk/20 rounded p-2 text-[0.875rem] text-chalk focus:border-signal outline-none h-24"
                    value={formData.solutionSummary || ''}
                    onChange={e => setFormData({ ...formData, solutionSummary: e.target.value })}
                    placeholder="How does your product solve this specific problem?"
                  />
                </div>
                
                <div>
                  <label className="block text-[0.8125rem] text-chalk mb-1">Deployment Approach</label>
                  <textarea 
                    className="w-full bg-black border border-chalk/20 rounded p-2 text-[0.875rem] text-chalk focus:border-signal outline-none h-20"
                    value={formData.deploymentApproach || ''}
                    onChange={e => setFormData({ ...formData, deploymentApproach: e.target.value })}
                    placeholder="How will you deploy it in the department?"
                  />
                </div>
                
                <div>
                  <label className="block text-[0.8125rem] text-chalk mb-1">Expected Result (Impact)</label>
                  <textarea 
                    className="w-full bg-black border border-chalk/20 rounded p-2 text-[0.875rem] text-chalk focus:border-signal outline-none h-20"
                    value={formData.expectedResult || ''}
                    onChange={e => setFormData({ ...formData, expectedResult: e.target.value })}
                    placeholder="What change in the target metric do you expect to achieve?"
                  />
                </div>
                
                <div>
                  <label className="block text-[0.8125rem] text-chalk mb-1">Pilot Approach</label>
                  <textarea 
                    className="w-full bg-black border border-chalk/20 rounded p-2 text-[0.875rem] text-chalk focus:border-signal outline-none h-20"
                    value={formData.pilotApproach || ''}
                    onChange={e => setFormData({ ...formData, pilotApproach: e.target.value })}
                    placeholder="How would you structure a 90-day pilot to prove this?"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSubmit(false)}
                    className="px-4 py-2 rounded font-semibold text-[0.8125rem] bg-chalk/10 text-chalk hover:bg-chalk/20 transition-colors"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    disabled={saving || !formData.solutionSummary}
                    onClick={() => handleSubmit(true)}
                    className="px-4 py-2 rounded font-semibold text-[0.8125rem] bg-signal text-black hover:bg-white transition-colors disabled:opacity-50"
                  >
                    Submit Response
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
