'use client';

import React, { useState } from 'react';
import {
  Rocket,
  ShieldCheck,
  AlertTriangle,
  Banknote,
  Compass,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StartupVerificationCard } from './StartupVerificationCard';
import { PlatformIntelligence } from './PlatformIntelligence';
import { StartupProfile, Challenge, Pilot } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface StartupDashboardProps {
  startup: StartupProfile;
  challenges: Challenge[];
  pilots: Pilot[];
  onNavigateToWallet: () => void;
  onNavigateToPilots: () => void;
  onApplyChallenge: (challenge: Challenge) => void;
  className?: string;
}

export function StartupDashboard({
  startup,
  challenges,
  pilots,
  onNavigateToWallet,
  onNavigateToPilots,
  onApplyChallenge,
  className = '',
}: StartupDashboardProps) {
  const [appliedMap, setAppliedMap] = useState<{ [id: string]: boolean }>({});

  const handleApply = (ch: Challenge) => {
    setAppliedMap((prev) => ({ ...prev, [ch.id]: true }));
    onApplyChallenge(ch);
  };

  const activePilot = pilots[0];

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Top Welcome & Health Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-govblue-600 bg-govblue-50 px-2.5 py-0.5 rounded-full border border-govblue-200">
              Startup Workspace
            </span>
            <span className="text-xs text-slate-400 font-medium">DPIIT Reg: {startup.dpiitNumber}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            Good morning, {startup.name} 👋
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Your single window for national departmental challenges, verified digital wallets, and milestone-based grant funding.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={onNavigateToWallet}
            variant="outline"
            className="text-xs font-semibold h-10 gap-2 border-slate-300 text-navy-900 hover:bg-slate-50"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Digital Document Wallet</span>
          </Button>
          <Button
            onClick={onNavigateToPilots}
            variant="primary"
            className="text-xs font-semibold h-10 gap-2 shadow-sm"
          >
            <Rocket className="w-4 h-4" />
            <span>Track Active Pilots</span>
          </Button>
        </div>
      </div>

      {/* 4-Column Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Verification Card */}
        <Card className="p-5 border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Verification Health</span>
            <span className="text-emerald-700 font-mono font-bold">{startup.verificationPercentage}%</span>
          </div>
          <div className="text-2xl font-extrabold text-navy-900 mt-2 font-mono">
            {startup.verificationPercentage}%
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-600 h-full rounded-full"
              style={{ width: `${startup.verificationPercentage}%` }}
            />
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> DPIIT, GST & MCA21 Verified
          </div>
        </Card>

        {/* Matching Opportunities */}
        <Card className="p-5 border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Gov Opportunities</span>
            <span className="text-govblue-600 font-semibold">12 matching</span>
          </div>
          <div className="text-2xl font-extrabold text-navy-900 mt-2 font-mono">
            12
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Across 4 central ministries & state departments
          </div>
        </Card>

        {/* Active Pilots */}
        <Card className="p-5 border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Active Pilot Trials</span>
            <StatusBadge status="ACTIVE" size="sm" />
          </div>
          <div className="text-2xl font-extrabold text-navy-900 mt-2 font-mono">
            {startup.activePilotsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Okhla Material Recovery Facility (MCD)
          </div>
        </Card>

        {/* Funding Released */}
        <Card className="p-5 border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Pilot Grant Escrow</span>
            <span className="text-emerald-700 font-mono font-bold">60% Released</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2 font-mono">
            ₹12L <span className="text-xs text-slate-400 font-normal font-sans">/ ₹20L</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Next Tranche: ₹8,00,000 on Milestone 4
          </div>
        </Card>
      </div>

      {/* ACTION REQUIRED SECTION - Prompt Section 13 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
            <h2 className="text-base font-extrabold text-navy-900">
              Actions Required ({startup.actionRequiredItems.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">Pending tasks required to maintain 100% compliance</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {startup.actionRequiredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex items-start justify-between gap-4 transition hover:bg-amber-50"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-navy-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                  <div className="text-[11px] text-amber-900 font-semibold pt-1">
                    Action Deadline: {formatDate(item.dueDate)}
                  </div>
                </div>
              </div>
              <Button
                onClick={onNavigateToPilots}
                variant="outline"
                size="sm"
                className="text-xs font-bold shrink-0 bg-white border-amber-300 text-amber-900 hover:bg-amber-100 h-8"
              >
                Resolve
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Matched Challenges & Platform Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Matched Government Opportunities */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-navy-900">
                Matching Government Opportunities
              </h2>
              <p className="text-xs text-slate-500">
                Departmental problem statements matched to your DPIIT technology profile
              </p>
            </div>
            <Badge variant="gov" className="text-xs font-semibold">
              <Sparkles className="w-3 h-3 mr-1" /> AI Matched
            </Badge>
          </div>

          <div className="space-y-4">
            {challenges.map((ch) => {
              const isApplied = appliedMap[ch.id];
              return (
                <Card
                  key={ch.id}
                  className="p-5 border-slate-200 bg-white hover:border-govblue-300 transition shadow-card flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-govblue-700 bg-govblue-50 px-2.5 py-0.5 rounded-full border border-govblue-200">
                            {ch.department}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{ch.ministry}</span>
                        </div>
                        <h3 className="text-base font-bold text-navy-900 mt-1.5 leading-snug">
                          {ch.title}
                        </h3>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-slate-400 font-medium">Grant Budget</div>
                        <div className="text-base font-extrabold text-navy-900 font-mono">
                          ₹{ch.budgetInLakhs} Lakhs
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {ch.problemStatement}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
                      <span>📍 {ch.location}</span>
                      <span>⏳ Deadline: {formatDate(ch.deadline)}</span>
                      <span className="text-emerald-700 font-semibold">
                        ✓ {ch.requiredDocuments.length} required documents verified in wallet
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-govblue-700 font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{ch.aiMatchScore || 90}% Match Confidence</span>
                    </div>

                    <Button
                      onClick={() => handleApply(ch)}
                      disabled={isApplied}
                      variant={isApplied ? 'secondary' : 'primary'}
                      size="sm"
                      className="text-xs font-bold h-8 px-4"
                    >
                      {isApplied ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Applied via Wallet
                        </span>
                      ) : (
                        <>
                          <span>Apply with 1-Click Wallet</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Platform Intelligence & Verification Card */}
        <div className="space-y-6">
          <PlatformIntelligence
            matchScore={94}
            challengeTitle="AI-Based Municipal Waste Segregation (MoHUA)"
            onExploreMatching={() => onApplyChallenge(challenges[0])}
          />
          <StartupVerificationCard startup={startup} onOpenWallet={onNavigateToWallet} />
        </div>
      </div>
    </div>
  );
}
