'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Building,
  Landmark,
  ShieldCheck,
  Rocket,
  Banknote,
  ShoppingBag,
  RotateCcw,
  Check,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function HeroDemoFlow() {
  const [currentStep, setCurrentStep] = useState(0);

  const demoSteps = [
    {
      stage: '1. Departmental Need',
      role: 'GOVERNMENT',
      icon: Landmark,
      title: 'MoHUA Publishes Municipal AI Waste Segregation Challenge',
      desc: 'Municipal Corporation of Delhi posts an urgent problem statement: Automate sorting of wet vs dry recyclable waste at Okhla transfer station (₹20 Lakhs pilot grant).',
      highlight: 'Challenge published with statutory criteria: DPIIT verified, Pilot-ready edge AI.',
    },
    {
      stage: '2. Automated Matching',
      role: 'PLATFORM_AI',
      icon: Sparkles,
      title: 'Platform Intelligence Scans Central Registry & Matches 12 Startups',
      desc: 'Algorithm matches EcoSense AI Technologies with 94% confidence based on verified computer vision patents, DPIIT classification, and past municipal data.',
      highlight: 'Zero manual paperwork; instantaneous compatibility scoring.',
    },
    {
      stage: '3. Digital Verification',
      role: 'STARTUP',
      icon: ShieldCheck,
      title: 'Startup Submits 1-Click Tamper-Proof Document Wallet',
      desc: 'EcoSense AI applies in 5 seconds. All DPIIT, GST, MCA21, and MSME certificates are cryptographically verified via direct gateway APIs.',
      highlight: 'Uploaded does not mean verified — all 4 credentials bear SHA-256 digital seals.',
    },
    {
      stage: '4. Pilot Deployment',
      role: 'PILOT_SANDBOX',
      icon: Rocket,
      title: 'Sandbox Pilot Commissioned at Okhla Material Recovery Facility',
      desc: 'Hardware cameras installed on conveyor lines. Real-time telemetry streams sorting accuracy logs directly to the nodal officer command center.',
      highlight: 'Real-world testing with 99.2% classification accuracy achieved.',
    },
    {
      stage: '5. Milestone Grant Release',
      role: 'FISCAL_GOVERNANCE',
      icon: Banknote,
      title: 'Milestone Deliverables Verified & Tranche 2 (₹12 Lakhs) Disbursed',
      desc: 'Startup uploads CA-attested fund utilization certificate. Nodal officer signs off milestone and PFMS automatically credits the next tranche.',
      highlight: 'Predictable milestone-based fiscal transparency.',
    },
    {
      stage: '6. GeM Scale & Procurement',
      role: 'NATIONAL_SCALE',
      icon: ShoppingBag,
      title: 'Successful Pilot Transitioned to GeM Startup Runway for 500+ Cities',
      desc: 'Having proven efficacy in live municipal trials, EcoSense AI is granted direct GeM rate contract onboarding without repetitive public tenders.',
      highlight: 'From local innovation to nationwide digital governance procurement.',
    },
  ];

  const step = demoSteps[currentStep];
  const StepIcon = step.icon;

  return (
    <Card className="border-govblue-300 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 text-white rounded-2xl shadow-gov overflow-hidden">
      {/* Top Banner */}
      <div className="p-6 border-b border-navy-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/30 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> SIH26136 End-to-End Judge Walkthrough
            </span>
            <span className="text-xs text-slate-400">Step {currentStep + 1} of {demoSteps.length}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            How SetuBharat Bridges Indian Innovation to Government at Scale
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCurrentStep(0)}
            variant="outline"
            size="sm"
            className="text-xs font-semibold bg-navy-900 border-navy-700 text-slate-300 hover:text-white h-8"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset Flow
          </Button>
        </div>
      </div>

      {/* Interactive Step Progress Stepper */}
      <div className="p-4 bg-navy-950/60 border-b border-navy-800 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[640px] gap-2">
          {demoSteps.map((s, idx) => {
            const isPassed = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all ${
                  isCurrent
                    ? 'bg-govblue-600 text-white shadow-md'
                    : isPassed
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50'
                    : 'bg-navy-900/60 text-slate-400 border border-navy-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-white text-govblue-600'
                      : isPassed
                      ? 'bg-emerald-500 text-navy-950'
                      : 'bg-navy-800 text-slate-400'
                  }`}
                >
                  {isPassed ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                </div>
                <div className="text-xs font-bold whitespace-nowrap">{s.stage}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Stage Display */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-govblue-600/30 border border-govblue-400/40 flex items-center justify-center text-govblue-300 font-bold shrink-0">
              <StepIcon className="w-7 h-7 text-govblue-300" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-govblue-300 bg-govblue-950/80 px-2 py-0.5 rounded border border-govblue-800">
                  {step.stage}
                </span>
                <span className="text-xs text-emerald-400 font-semibold">• Active Simulation</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                {step.title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-3xl pt-1">
                {step.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlight Callout */}
        <div className="p-4 rounded-xl bg-navy-950/80 border border-navy-700 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300">
              <strong>Key GovTech Innovation:</strong> {step.highlight}
            </span>
          </div>
          <span className="font-mono text-emerald-400 font-bold text-[11px] hidden sm:inline">
            Status: VERIFIED & ACTIVE
          </span>
        </div>

        {/* Stepper Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-navy-800">
          <Button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            variant="outline"
            size="sm"
            className="bg-navy-900 border-navy-700 text-slate-300 hover:text-white font-semibold h-9 px-4 disabled:opacity-30"
          >
            Previous Step
          </Button>

          <Button
            onClick={() => setCurrentStep((prev) => (prev < demoSteps.length - 1 ? prev + 1 : 0))}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 px-5 gap-1.5 shadow-md"
          >
            <span>{currentStep < demoSteps.length - 1 ? 'Next Innovation Stage' : 'Restart Walkthrough'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
