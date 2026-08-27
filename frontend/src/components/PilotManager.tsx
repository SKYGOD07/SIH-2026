'use client';

import React, { useState } from 'react';
import {
  Rocket,
  CheckCircle2,
  Clock,
  Banknote,
  Upload,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
  Calendar,
  Building,
  ShoppingBag,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Pilot, PilotMilestone } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface PilotManagerProps {
  pilot: Pilot;
  userRole?: 'STARTUP' | 'GOVERNMENT';
  onApproveMilestone?: (milestoneId: string) => void;
  className?: string;
}

export function PilotManager({
  pilot,
  userRole = 'STARTUP',
  onApproveMilestone,
  className = '',
}: PilotManagerProps) {
  const [currentPilot, setCurrentPilot] = useState<Pilot>(pilot);
  const [uploadingMilestoneId, setUploadingMilestoneId] = useState<string | null>(null);

  const completedMilestonesCount = currentPilot.milestones.filter((m) => m.completed).length;

  const handleSimulateUCUpload = (milestoneId: string) => {
    setUploadingMilestoneId(milestoneId);
    setTimeout(() => {
      const updated = {
        ...currentPilot,
        milestones: currentPilot.milestones.map((m) => {
          if (m.id === milestoneId) {
            return {
              ...m,
              utilizationCertificateUrl: '/docs/uc-signed.pdf',
            };
          }
          return m;
        }),
      };
      setCurrentPilot(updated);
      setUploadingMilestoneId(null);
    }, 1000);
  };

  const handleOfficerApprove = (milestoneId: string) => {
    const updated = {
      ...currentPilot,
      milestones: currentPilot.milestones.map((m) => {
        if (m.id === milestoneId) {
          return {
            ...m,
            completed: true,
            status: 'COMPLETED' as const,
            trancheStatus: 'RELEASED' as const,
            completionDate: new Date().toISOString().split('T')[0],
          };
        }
        return m;
      }),
      fundingDisbursed: currentPilot.fundingDisbursed + 800000,
      fundingPending: Math.max(0, currentPilot.fundingPending - 800000),
      progressPercentage: 100,
    };
    setCurrentPilot(updated);
    onApproveMilestone?.(milestoneId);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Pilot Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="gov" className="text-xs font-mono">
                PILOT PROJECT #MCD-2026-948
              </Badge>
              <StatusBadge status={currentPilot.status} size="sm" />
              {currentPilot.procurementRecommended && (
                <Badge variant="saffron" className="text-xs">
                  <ShoppingBag className="w-3 h-3 mr-1" />
                  GeM Fast-Track Recommended
                </Badge>
              )}
            </div>
            <h2 className="text-2xl font-extrabold text-navy-900 tracking-tight">
              {currentPilot.title}
            </h2>
            <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
              <span className="text-navy-900 font-semibold">{currentPilot.departmentName}</span>
              <span>•</span>
              <span>{currentPilot.sector}</span>
              <span>•</span>
              <span>Target: {formatDate(currentPilot.targetCompletionDate)}</span>
            </p>
          </div>

          {/* Quick Progress Indicator */}
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl min-w-[240px] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-navy-900">Overall Pilot Health</span>
              <span className="font-extrabold font-mono text-emerald-700">
                {currentPilot.progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${currentPilot.progressPercentage}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 text-right">
              {completedMilestonesCount} of {currentPilot.milestones.length} milestones signed off
            </div>
          </div>
        </div>

        {/* 3-Card Funding Snapshot */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="text-xs font-semibold text-slate-500">Total Pilot Grant Approved</div>
            <div className="text-xl font-extrabold text-navy-900 font-mono mt-1">
              {formatCurrency(currentPilot.fundingTotal)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Ministry sanctioned allocation</div>
          </div>

          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80">
            <div className="text-xs font-semibold text-emerald-800">PFMS Tranches Disbursed</div>
            <div className="text-xl font-extrabold text-emerald-700 font-mono mt-1">
              {formatCurrency(currentPilot.fundingDisbursed)}
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Directly credited to startup escrow</div>
          </div>

          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80">
            <div className="text-xs font-semibold text-amber-800">Pending Deliverable Escrow</div>
            <div className="text-xl font-extrabold text-amber-700 font-mono mt-1">
              {formatCurrency(currentPilot.fundingPending)}
            </div>
            <div className="text-[11px] text-amber-600 mt-0.5">Payable upon Milestone 4 signoff</div>
          </div>
        </div>

        {/* Visual Milestones Timeline */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-navy-900">
              Pilot Milestone & Tranche Roadmap
            </h3>
            <span className="text-xs font-medium text-slate-500">
              Deliverable Verification & Utilization Logs
            </span>
          </div>

          <div className="space-y-3">
            {currentPilot.milestones.map((milestone, idx) => {
              const isCompleted = milestone.completed;
              const isInProgress = milestone.status === 'IN_PROGRESS';

              return (
                <div
                  key={milestone.id}
                  className={`p-4 rounded-xl border transition-all duration-150 ${
                    isCompleted
                      ? 'bg-slate-50/60 border-slate-200'
                      : isInProgress
                      ? 'bg-govblue-50/30 border-govblue-300 shadow-sm'
                      : 'bg-white border-slate-200/80 opacity-70'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isInProgress
                            ? 'bg-govblue-600 text-white animate-pulse'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-navy-900">
                            {milestone.title}
                          </h4>
                          {milestone.trancheAmount > 0 && (
                            <Badge
                              variant={milestone.trancheStatus === 'RELEASED' ? 'verified' : 'pending'}
                              className="text-[11px] font-mono"
                            >
                              Tranche: {formatCurrency(milestone.trancheAmount)} ({milestone.trancheStatus})
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {milestone.description}
                        </p>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-0.5">
                          <span>Due: {formatDate(milestone.dueDate)}</span>
                          {milestone.completionDate && (
                            <span className="text-emerald-700 font-medium">
                              • Completed on {formatDate(milestone.completionDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Milestone Actions (Startup vs Officer) */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {userRole === 'STARTUP' && isInProgress && (
                        <Button
                          onClick={() => handleSimulateUCUpload(milestone.id)}
                          disabled={uploadingMilestoneId === milestone.id || !!milestone.utilizationCertificateUrl}
                          variant={milestone.utilizationCertificateUrl ? 'outline' : 'primary'}
                          size="sm"
                          className="text-xs font-semibold h-8 px-3"
                        >
                          {milestone.utilizationCertificateUrl ? (
                            <span className="text-emerald-700 flex items-center gap-1">
                              <FileCheck2 className="w-3.5 h-3.5" /> UC Submitted
                            </span>
                          ) : uploadingMilestoneId === milestone.id ? (
                            'Uploading...'
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5 mr-1" />
                              Upload Milestone UC
                            </>
                          )}
                        </Button>
                      )}

                      {userRole === 'GOVERNMENT' && isInProgress && (
                        <Button
                          onClick={() => handleOfficerApprove(milestone.id)}
                          variant="emerald"
                          size="sm"
                          className="text-xs font-bold h-8 px-3 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Sign Off & Release Tranche
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
