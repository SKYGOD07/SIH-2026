'use client';

import React from 'react';
import { Sparkles, Check, BrainCircuit, FileCheck2, Info, ArrowRight, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PlatformIntelligenceProps {
  matchScore?: number;
  matchingPoints?: string[];
  challengeTitle?: string;
  onExploreMatching?: () => void;
  className?: string;
}

export function PlatformIntelligence({
  matchScore = 94,
  matchingPoints = [
    'Core technology: Edge Computer Vision matches municipal RFP requirements',
    'DPIIT Recognition verified with 0 pending compliance flags',
    'Pilot-ready hardware with existing sorting testbed telemetry',
    'Sector: Smart Cities & Waste Processing aligned with Swachh Bharat Mission',
  ],
  challengeTitle = 'AI-Based Municipal Solid Waste Classification & Automated Sorting',
  onExploreMatching,
  className = '',
}: PlatformIntelligenceProps) {
  return (
    <Card
      className={`border-govblue-200 bg-gradient-to-br from-govblue-50/50 via-white to-slate-50 p-6 rounded-2xl shadow-card relative overflow-hidden ${className}`}
    >
      {/* Decorative top-right accent */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-govblue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="space-y-4 relative z-10">
        {/* Header with AI Pill */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-govblue-600 text-white shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PLATFORM INTELLIGENCE</span>
          </div>
          <Badge variant="outline" className="text-[11px] font-medium text-slate-500 bg-white">
            AI-Assisted Match (Non-Binding)
          </Badge>
        </div>

        <div>
          <h3 className="text-base font-extrabold text-navy-900 leading-snug">
            {matchScore}% Match Confidence for Departmental Challenge
          </h3>
          <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
            {challengeTitle}
          </p>
        </div>

        {/* Match Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Algorithm Match Rating</span>
            <span className="font-extrabold font-mono text-govblue-700">{matchScore}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-govblue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${matchScore}%` }}
            />
          </div>
        </div>

        {/* Why this matches checklist */}
        <div className="space-y-2 pt-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Why this matches your startup profile:
          </div>
          <div className="space-y-1.5">
            {matchingPoints.map((point, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs text-slate-700 bg-white/80 p-2 rounded-lg border border-slate-200/60"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span className="font-medium leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="p-2.5 rounded-xl bg-slate-100/80 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <span>
            AI recommendations assist in discovery and eligibility screening. Final pilot shortlisting is conducted exclusively by designated nodal officers.
          </span>
        </div>

        {onExploreMatching && (
          <Button
            onClick={onExploreMatching}
            variant="primary"
            size="sm"
            className="w-full text-xs font-bold justify-center gap-1.5 h-9"
          >
            <span>Apply With Verified Document Wallet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </Card>
  );
}
