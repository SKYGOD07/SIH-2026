'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  ShieldCheck,
  Building2,
  MapPin,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Send,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StartupProfile } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface StartupDiscoveryProps {
  startups: StartupProfile[];
  onSelectStartup?: (startup: StartupProfile) => void;
  onInviteToPilot?: (startup: StartupProfile) => void;
  className?: string;
}

export function StartupDiscovery({
  startups,
  onSelectStartup,
  onInviteToPilot,
  className = '',
}: StartupDiscoveryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [onlyPilotReady, setOnlyPilotReady] = useState(false);
  const [invitedMap, setInvitedMap] = useState<{ [id: string]: boolean }>({});

  const sectors = ['ALL', 'Smart Cities & CleanTech', 'Water Resources & Environment', 'Agriculture & Rural Development', 'Healthcare & MedTech', 'EV & Clean Energy'];

  const filteredStartups = startups.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSector = selectedSector === 'ALL' || s.sector === selectedSector;
    const matchesStage = selectedStage === 'ALL' || s.stage === selectedStage;
    const matchesPilotReady = !onlyPilotReady || s.isPilotReady;

    return matchesSearch && matchesSector && matchesStage && matchesPilotReady;
  });

  const handleInvite = (startup: StartupProfile) => {
    setInvitedMap((prev) => ({ ...prev, [startup.id]: true }));
    onInviteToPilot?.(startup);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search verified Indian startups by technology, sector, city, or DPIIT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-govblue-600 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setOnlyPilotReady(!onlyPilotReady)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 whitespace-nowrap ${
                onlyPilotReady
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${onlyPilotReady ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Pilot Ready Only</span>
            </button>
          </div>
        </div>

        {/* Sector Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" /> Sector:
          </span>
          {sectors.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                selectedSector === sec
                  ? 'bg-navy-900 text-white shadow-sm font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sec === 'ALL' ? 'All Sectors' : sec}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span>Showing {filteredStartups.length} Verified Solutions matching governance criteria</span>
        <span className="text-emerald-700 font-semibold flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> 100% Cryptographically Verified
        </span>
      </div>

      {/* Startups Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredStartups.map((startup) => {
          const isInvited = invitedMap[startup.id];
          return (
            <Card
              key={startup.id}
              className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-govblue-300 hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Card Top */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-navy-900 leading-tight">
                        {startup.name}
                      </h3>
                      <Badge variant="verified" className="text-[11px]">
                        🟢 {startup.verificationPercentage}% Verified
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-govblue-700">
                      {startup.sector}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-navy-900 shrink-0">
                    <Building2 className="w-5 h-5 text-navy-900" />
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {startup.description}
                </p>

                {/* Statutory Check Badges */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                  <div className="flex items-center gap-1 text-slate-700 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>DPIIT: <strong>{startup.dpiitNumber}</strong></span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-700 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Location: <strong>{startup.state}</strong></span>
                  </div>
                </div>

                {/* Verification Bar */}
                <div className="space-y-1 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600">Verification Readiness</span>
                    <span className="font-mono font-bold text-emerald-700">{startup.verificationPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{ width: `${startup.verificationPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  onClick={() => onSelectStartup?.(startup)}
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold border-slate-200 text-slate-700 hover:text-navy-900 h-8 px-3"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-govblue-600" />
                  View Credentials
                </Button>

                <Button
                  onClick={() => handleInvite(startup)}
                  disabled={isInvited}
                  variant={isInvited ? 'secondary' : 'primary'}
                  size="sm"
                  className="text-xs font-bold h-8 px-3 gap-1.5 shadow-sm"
                >
                  {isInvited ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Invited to Pilot
                    </span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Invite to Pilot</span>
                    </>
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
