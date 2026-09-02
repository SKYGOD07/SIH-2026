'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthProvider';

interface Metrics {
  challengesRequiringAction: number;
  applicationsReceived: number;
  startupsShortlisted: number;
  pilotsActive: number;
  evidenceAwaitingReview: number;
  upcomingMilestones: number;
  recentDecisions: number;
}

export function DashboardMetricsOverview() {
  const { profile } = useAuth();
  const [data, setData] = useState<Metrics | null>(null);

  useEffect(() => {
    if (profile?.role === 'GOVERNMENT_OFFICER' || profile?.role === 'ADMIN') {
      fetchApi<Metrics>('/api/workflow/dashboard/metrics')
        .then(setData)
        .catch(console.error);
    }
  }, [profile]);

  if (!data) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricTile label="Challenges Action Required" value={data.challengesRequiringAction} alert={data.challengesRequiringAction > 0} />
      <MetricTile label="Applications Received" value={data.applicationsReceived} />
      <MetricTile label="Active Pilots" value={data.pilotsActive} />
      <MetricTile label="Evidence Awaiting Review" value={data.evidenceAwaitingReview} />
    </div>
  );
}

function MetricTile({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className={`card p-4 border ${alert ? 'border-signal/50 bg-signal/5' : 'border-chalk/[0.08]'}`}>
      <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/50">{label}</span>
      <p className={`mt-1.5 font-display text-[1.625rem] font-black leading-none ${alert ? 'text-signal' : 'text-chalk'}`}>
        {value}
      </p>
    </div>
  );
}
