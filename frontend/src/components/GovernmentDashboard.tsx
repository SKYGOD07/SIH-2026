'use client';

import React, { useState } from 'react';
import {
  Landmark,
  ShieldCheck,
  Rocket,
  ShoppingBag,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileText,
  Users,
  Sparkles,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Challenge, Pilot, PlatformStats, StartupProfile } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface GovernmentDashboardProps {
  stats: PlatformStats;
  challenges: Challenge[];
  pilots: Pilot[];
  startups: StartupProfile[];
  onNavigateToDiscovery: () => void;
  onNavigateToPilots: () => void;
  className?: string;
}

export function GovernmentDashboard({
  stats,
  challenges,
  pilots,
  startups,
  onNavigateToDiscovery,
  onNavigateToPilots,
  className = '',
}: GovernmentDashboardProps) {
  const [challengeList, setChallengeList] = useState<Challenge[]>(challenges);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDept, setNewDept] = useState('Ministry of Housing and Urban Affairs');
  const [newBudget, setNewBudget] = useState('25');
  const [newProblem, setNewProblem] = useState('');

  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const created: Challenge = {
      id: `ch-${Date.now()}`,
      title: newTitle,
      department: newDept,
      ministry: newDept,
      sector: 'Smart Cities & CleanTech',
      problemStatement: newProblem || 'Departmental problem statement requiring verified startup innovation.',
      expectedOutcome: 'Working pilot deployed in designated zonal facility.',
      budgetInLakhs: parseFloat(newBudget) || 25,
      location: 'National / State Testbed',
      state: 'All India',
      deadline: '2026-11-30',
      status: 'OPEN',
      requiredDocuments: ['DPIIT_CERTIFICATE', 'GST_CERTIFICATE'],
      minimumStage: 'Pilot Ready',
      applicationsCount: 0,
      shortlistedCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setChallengeList([created, ...challengeList]);
    setIsCreatingChallenge(false);
    setNewTitle('');
    setNewProblem('');
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Top Government Command Header */}
      <div className="bg-navy-900 text-white p-6 sm:p-8 rounded-2xl shadow-gov relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-govblue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-govblue-600/30 border border-govblue-400/40 flex items-center justify-center text-govblue-300">
                <Landmark className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold tracking-widest text-govblue-300 uppercase">
                GOVERNMENT INNOVATION COMMAND CENTER
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Departmental Oversight & Innovation Procurement
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Publish Grand Challenges, inspect cryptographically verified DPIIT startups, and monitor live pilot deployments moving to GeM procurement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={onNavigateToDiscovery}
              variant="outline"
              className="bg-navy-950/60 border-navy-700 text-white hover:bg-navy-800 text-xs font-semibold h-10 px-4 gap-2 rounded-xl"
            >
              <Search className="w-4 h-4" />
              <span>Search Verified Startups</span>
            </Button>
            <Button
              onClick={() => setIsCreatingChallenge(true)}
              className="bg-govblue-600 hover:bg-govblue-500 text-white text-xs font-bold h-10 px-4 gap-2 rounded-xl shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Grand Challenge</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 4-KPI Institutional Command Cards - Prompt Section 14 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Startups Registered</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold text-navy-900 font-mono mt-2">
            {stats.totalStartups}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across 28 States & 8 Union Territories
          </div>
        </Card>

        <Card className="p-5 border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Statutory Verified</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 font-mono mt-2">
            {stats.verifiedStartups}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <Check className="w-3 h-3 stroke-[3]" /> 94% Gateway Verification Rate
          </div>
        </Card>

        <Card className="p-5 border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Active Pilot Trials</span>
            <Rocket className="w-4 h-4 text-govblue-600" />
          </div>
          <div className="text-3xl font-extrabold text-govblue-700 font-mono mt-2">
            {stats.activePilots}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            ₹14.8 Cr milestone grant allocation
          </div>
        </Card>

        <Card className="p-5 border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>GeM Procurement Pipeline</span>
            <ShoppingBag className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-navy-900 font-mono mt-2">
            {stats.procuredSolutionsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Solutions transitioned to national scale
          </div>
        </Card>
      </div>

      {/* Active Departmental Challenges Table / Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-navy-900">
              Departmental Grand Challenges & Tenders
            </h2>
            <p className="text-xs text-slate-500">
              Review incoming startup proposals, AI shortlists, and statutory compliance status
            </p>
          </div>
          <Badge variant="outline" className="text-xs bg-white text-slate-600">
            {challengeList.length} Active Challenges
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challengeList.map((ch) => (
            <Card
              key={ch.id}
              className="p-5 border-slate-200 bg-white hover:border-govblue-300 transition shadow-card flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-govblue-700 bg-govblue-50 px-2.5 py-0.5 rounded-full border border-govblue-200">
                        {ch.department}
                      </span>
                      <StatusBadge status={ch.status} size="sm" />
                    </div>
                    <h3 className="text-base font-bold text-navy-900 mt-1.5 leading-snug">
                      {ch.title}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-400 font-medium block">Pilot Budget</span>
                    <span className="text-base font-extrabold text-navy-900 font-mono">
                      ₹{ch.budgetInLakhs}L
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {ch.problemStatement}
                </p>

                {/* Submissions Stats Bar */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Proposals Received</span>
                    <span className="font-extrabold text-navy-900 font-mono text-sm">
                      {ch.applicationsCount} Startups
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">AI Shortlisted</span>
                    <span className="font-extrabold text-emerald-700 font-mono text-sm">
                      {ch.shortlistedCount} Verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  Deadline: {formatDate(ch.deadline)}
                </span>
                <Button
                  onClick={onNavigateToDiscovery}
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold h-8 px-3 border-slate-300 text-navy-900 hover:bg-govblue-50 hover:text-govblue-700"
                >
                  <span>Evaluate Shortlist</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Active Pilot Supervision Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-navy-900">
              Active Pilot Supervision & Tranche Approvals
            </h2>
            <p className="text-xs text-slate-500">
              Real-time milestone progress tracking for deployed departmental trials
            </p>
          </div>
          <Button
            onClick={onNavigateToPilots}
            variant="ghost"
            size="sm"
            className="text-xs font-semibold text-govblue-600 hover:text-govblue-700"
          >
            <span>View Full Pilot Console</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {pilots.map((pilot) => (
          <Card key={pilot.id} className="p-6 border-slate-200 bg-white shadow-card space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-navy-900">{pilot.startupName}</span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-600">{pilot.departmentName}</span>
                  <StatusBadge status={pilot.status} size="sm" />
                </div>
                <h3 className="text-base font-bold text-navy-900 mt-1">
                  {pilot.title}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-slate-400">Tranches Disbursed</div>
                  <div className="text-sm font-extrabold text-emerald-700 font-mono">
                    {formatCurrency(pilot.fundingDisbursed)} / {formatCurrency(pilot.fundingTotal)}
                  </div>
                </div>
                <Button
                  onClick={onNavigateToPilots}
                  variant="emerald"
                  size="sm"
                  className="text-xs font-bold h-9 px-4"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Review Tranche Signoff
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Pilot Milestone Completion</span>
                <span className="font-bold font-mono text-emerald-700">{pilot.progressPercentage}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${pilot.progressPercentage}%` }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Publish Challenge Modal */}
      {isCreatingChallenge && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateChallenge}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-govblue-600" />
                <h3 className="font-bold text-base text-navy-900">Publish Departmental Grand Challenge</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingChallenge(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Challenge Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI-Powered River Silt & Heavy Metal Telemetry Monitoring"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-navy-900 focus:outline-none focus:ring-2 focus:ring-govblue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Department / Ministry</label>
                  <input
                    type="text"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-navy-900 focus:outline-none focus:ring-2 focus:ring-govblue-600"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Pilot Budget (₹ in Lakhs)</label>
                  <input
                    type="number"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-navy-900 focus:outline-none focus:ring-2 focus:ring-govblue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Problem Statement & Scope</label>
                <textarea
                  rows={3}
                  placeholder="Describe the operational bottleneck, required testing site, and expected pilot deliverables..."
                  value={newProblem}
                  onChange={(e) => setNewProblem(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-navy-900 focus:outline-none focus:ring-2 focus:ring-govblue-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => setIsCreatingChallenge(false)}
                variant="outline"
                size="sm"
                className="font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="font-bold bg-govblue-600 hover:bg-govblue-700"
              >
                Publish Live Challenge
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
