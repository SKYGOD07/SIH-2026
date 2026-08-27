'use client';

import React, { useState } from 'react';
import {
  Compass,
  ShieldCheck,
  ClipboardCheck,
  Rocket,
  Banknote,
  Activity,
  ShoppingBag,
  TrendingUp,
  Check,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface LifecycleStage {
  id: string;
  number: string;
  title: string;
  tagline: string;
  icon: any;
  startupPerspective: string;
  govPerspective: string;
  keyArtifact: string;
}

export const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    id: 'discover',
    number: '01',
    title: 'DISCOVER',
    tagline: 'Find relevant government opportunities',
    icon: Compass,
    startupPerspective: 'AI algorithms match your DPIIT domain with active departmental problem statements.',
    govPerspective: 'Publish grand challenges and explore sector-filtered, pilot-ready startup solutions.',
    keyArtifact: 'Departmental Challenge & Grant Tender',
  },
  {
    id: 'verify',
    number: '02',
    title: 'VERIFY',
    tagline: 'Validate startup identity and documents',
    icon: ShieldCheck,
    startupPerspective: 'One-time automated verification of DPIIT, GST, MCA21, and Udyam via Digilocker APIs.',
    govPerspective: 'Zero manual vetting; instantaneous digital credential inspection with cryptographic signatures.',
    keyArtifact: 'Digital Startup Verification Vault',
  },
  {
    id: 'evaluate',
    number: '03',
    title: 'EVALUATE',
    tagline: 'Assess eligibility and proposals',
    icon: ClipboardCheck,
    startupPerspective: 'Instant rule-based eligibility calculation with AI summarization of Detailed Project Reports (DPR).',
    govPerspective: 'Automated compliance checklist and ranked shortlist generated in minutes instead of weeks.',
    keyArtifact: 'Automated Evaluation Matrix & DPR Summary',
  },
  {
    id: 'pilot',
    number: '04',
    title: 'PILOT',
    tagline: 'Deploy and test the solution',
    icon: Rocket,
    startupPerspective: 'Clear sandbox deployment parameters, departmental site access, and defined trial deliverables.',
    govPerspective: 'Controlled testing environment with real-world municipal or district testbed telemetry.',
    keyArtifact: 'Pilot Sandbox Agreement & Scope of Work',
  },
  {
    id: 'fund',
    number: '05',
    title: 'FUND',
    tagline: 'Track milestone-based funding',
    icon: Banknote,
    startupPerspective: 'Predictable, direct PFMS tranche disbursements upon verified milestone deliverable completion.',
    govPerspective: 'Transparent fiscal accountability with automated fund release upon officer signoff.',
    keyArtifact: 'Tranche Disbursement Schedule (Tranche 1-3)',
  },
  {
    id: 'monitor',
    number: '06',
    title: 'MONITOR',
    tagline: 'Track progress and utilization',
    icon: Activity,
    startupPerspective: 'Digital upload of CA-attested Utilization Certificates (UC) and live sensor telemetry logs.',
    govPerspective: 'Live command-center tracking of pilot deployment health, KPIs, and audit trails.',
    keyArtifact: 'Fund Utilization Certificate (UC) & Live KPIs',
  },
  {
    id: 'procure',
    number: '07',
    title: 'PROCURE',
    tagline: 'Move successful solutions toward procurement',
    icon: ShoppingBag,
    startupPerspective: 'Direct fast-track onboarding onto the Government e-Marketplace (GeM) Startup Runway.',
    govPerspective: 'Single-source or preferential procurement enabled without repeating redundant RPFs.',
    keyArtifact: 'GeM Fast-Track Onboarding & Rate Contract',
  },
  {
    id: 'scale',
    number: '08',
    title: 'SCALE',
    tagline: 'Expand successful innovations',
    icon: TrendingUp,
    startupPerspective: 'Nationwide replication across other state departments and central ministries.',
    govPerspective: 'Adopt proven, tested innovations across multi-state administrations with reduced risk.',
    keyArtifact: 'National Scaling Playbook & Replication Order',
  },
];

interface LifecycleTimelineProps {
  activeStageId?: string;
  onSelectStage?: (stageId: string) => void;
  className?: string;
}

export function LifecycleTimeline({
  activeStageId = 'discover',
  onSelectStage,
  className = '',
}: LifecycleTimelineProps) {
  const [selectedId, setSelectedId] = useState<string>(activeStageId);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelectStage?.(id);
  };

  const currentStage = LIFECYCLE_STAGES.find((s) => s.id === selectedId) || LIFECYCLE_STAGES[0];
  const CurrentIcon = currentStage.icon;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-govblue-50 text-govblue-700 border border-govblue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-govblue-600" />
            <span>End-to-End Innovation Pipeline</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight mt-2">
            The 8-Stage Innovation Lifecycle
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl mt-1">
            Bridging Indian startups from initial government discovery to national procurement and scale.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Click any stage below to inspect workflow details</span>
        </div>
      </div>

      {/* Responsive Horizontal / Grid Lifecycle Bar */}
      <div className="bg-navy-900 p-2 sm:p-3 rounded-2xl shadow-gov overflow-x-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 min-w-[700px] lg:min-w-0">
          {LIFECYCLE_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isSelected = stage.id === selectedId;
            return (
              <button
                key={stage.id}
                onClick={() => handleSelect(stage.id)}
                className={`relative flex flex-col items-start p-3 rounded-xl text-left transition-all duration-200 group ${
                  isSelected
                    ? 'bg-govblue-600 text-white shadow-md ring-2 ring-white/20'
                    : 'bg-navy-800/80 hover:bg-navy-800 text-slate-200 border border-navy-700/50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span
                    className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-navy-950/40 text-white' : 'bg-navy-950/60 text-slate-300'
                    }`}
                  >
                    {stage.number}
                  </span>
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isSelected ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                </div>
                <div className="font-bold text-xs tracking-wider">{stage.title}</div>
                <div
                  className={`text-[11px] line-clamp-1 mt-0.5 ${
                    isSelected ? 'text-govblue-100' : 'text-slate-400'
                  }`}
                >
                  {stage.tagline}
                </div>
                {isSelected && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-govblue-600 rotate-45 hidden lg:block"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Detail Card */}
      <Card className="border-slate-200 bg-white p-6 rounded-2xl shadow-card transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-govblue-50 border border-govblue-200 flex items-center justify-center text-govblue-700 font-bold shrink-0">
              <CurrentIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-govblue-600 bg-govblue-50 px-2 py-0.5 rounded">
                  STAGE {currentStage.number}
                </span>
                <Badge variant="verified" className="text-[11px]">
                  Official SIH26136 Protocol
                </Badge>
              </div>
              <h3 className="text-xl font-extrabold text-navy-900 mt-1">
                {currentStage.title} — {currentStage.tagline}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700">
            <span className="text-slate-400">Core Output:</span>
            <span className="text-navy-900 font-bold">{currentStage.keyArtifact}</span>
          </div>
        </div>

        {/* Startup vs Government Dual Benefit View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-govblue-700">
              <Rocket className="w-4 h-4 text-govblue-600" />
              <span>For Indian Startups</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {currentStage.startupPerspective}
            </p>
          </div>

          <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>For Government Departments</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {currentStage.govPerspective}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
