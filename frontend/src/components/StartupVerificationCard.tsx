'use client';

import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ExternalLink,
  QrCode,
  Calendar,
  Building,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StartupProfile } from '@/types';
import { formatDate } from '@/utils/formatters';

interface StartupVerificationCardProps {
  startup: StartupProfile;
  onOpenWallet?: () => void;
  className?: string;
}

export function StartupVerificationCard({
  startup,
  onOpenWallet,
  className = '',
}: StartupVerificationCardProps) {
  const isHighVerification = startup.verificationPercentage >= 90;

  return (
    <Card
      className={`relative overflow-hidden border-slate-200 bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 ${className}`}
    >
      {/* Top Verification Header Strip */}
      <div className="bg-navy-900 text-white px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold tracking-wider uppercase">
            {startup.verificationPercentage >= 80 ? 'Verified Indian Startup' : 'Verification In Progress'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-navy-950/70 px-2 py-0.5 rounded border border-emerald-500/30">
          <Lock className="w-3 h-3" />
          <span>DPIIT SECURED</span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Startup Basic Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-extrabold text-navy-900 leading-tight">
                {startup.name}
              </h3>
              <Badge variant="outline" className="text-[11px] font-mono text-slate-600 bg-slate-50">
                {startup.dpiitNumber}
              </Badge>
            </div>
            <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
              <span>{startup.sector}</span>
              <span>•</span>
              <span>{startup.location}</span>
              <span>•</span>
              <span className="text-govblue-600 font-semibold">{startup.stage}</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-navy-900 font-bold shrink-0">
            <Building className="w-6 h-6 text-navy-900" />
          </div>
        </div>

        {/* Verification Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 text-xs font-semibold">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>DPIIT Recognised</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 text-xs font-semibold">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>GST Active</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 text-xs font-semibold">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>MCA21 Validated</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 text-xs font-semibold">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>MSME Udyam</span>
          </div>
        </div>

        {/* Verification Progress Meter */}
        <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-navy-900">Government Readiness Score</span>
            <span className="font-extrabold font-mono text-emerald-700">
              {startup.verificationPercentage}% Verified
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${startup.verificationPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Last verified: {formatDate(startup.verifiedAt)}
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              HASH: {startup.verificationHash.slice(0, 16)}...
            </span>
          </div>
        </div>

        {/* Action Button to Open Document Wallet */}
        {onOpenWallet && (
          <Button
            onClick={onOpenWallet}
            variant="outline"
            size="sm"
            className="w-full text-xs font-semibold justify-center gap-1.5 border-slate-300 text-navy-900 hover:bg-govblue-50 hover:text-govblue-700 hover:border-govblue-300"
          >
            <ShieldCheck className="w-4 h-4 text-govblue-600" />
            <span>Inspect Verified Document Wallet</span>
          </Button>
        )}
      </div>
    </Card>
  );
}
