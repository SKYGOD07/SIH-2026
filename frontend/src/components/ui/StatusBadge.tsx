import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VerificationStatus } from '@/types';

export type ExtendedStatus =
  | VerificationStatus
  | 'IN_REVIEW'
  | 'NOT_SUBMITTED'
  | 'OPEN'
  | 'ACTIVE'
  | 'EVALUATION'
  | 'SUCCESSFUL'
  | 'PROCURED'
  | 'UNDER_REVIEW'
  | 'CLOSED';

interface StatusBadgeProps {
  status: ExtendedStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  label?: string;
}

export function StatusBadge({
  status,
  size = 'md',
  showIcon = true,
  className,
  label,
}: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'VERIFIED':
      case 'SUCCESSFUL':
      case 'PROCURED':
        return {
          icon: CheckCircle2,
          text: label || (status === 'VERIFIED' ? 'Verified' : status === 'SUCCESSFUL' ? 'Successful' : 'Procured'),
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          dot: 'bg-emerald-500',
        };
      case 'PENDING':
      case 'OPEN':
        return {
          icon: Clock,
          text: label || (status === 'OPEN' ? 'Open for Bids' : 'Pending'),
          bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
          dot: 'bg-amber-500',
        };
      case 'IN_REVIEW':
      case 'UNDER_REVIEW':
      case 'ACTIVE':
      case 'EVALUATION':
        return {
          icon: AlertCircle,
          text: label || (status === 'ACTIVE' ? 'Active Pilot' : status === 'EVALUATION' ? 'Evaluation Stage' : status === 'UNDER_REVIEW' ? 'Under Review' : 'In Review'),
          bg: 'bg-govblue-50 text-govblue-800 border-govblue-200/80',
          dot: 'bg-govblue-500',
        };
      case 'REJECTED':
      case 'CLOSED':
        return {
          icon: XCircle,
          text: label || (status === 'CLOSED' ? 'Closed' : 'Rejected'),
          bg: 'bg-red-50 text-red-800 border-red-200/80',
          dot: 'bg-red-500',
        };
      case 'EXPIRED':
      case 'NOT_SUBMITTED':
      default:
        return {
          icon: HelpCircle,
          text: label || (status === 'EXPIRED' ? 'Expired' : 'Not Submitted'),
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold border transition-all duration-150',
        config.bg,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{config.text}</span>
    </span>
  );
}
