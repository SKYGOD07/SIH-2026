'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Rocket,
  Landmark,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Compass,
  Banknote,
  ShoppingBag,
  TrendingUp,
  FileCheck2,
  Building2,
  ChevronRight,
  ExternalLink,
  Layers,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Navbar, ActiveTab } from '@/components/Navbar';
import { LifecycleTimeline } from '@/components/LifecycleTimeline';
import { StartupVerificationCard } from '@/components/StartupVerificationCard';
import { DocumentWallet } from '@/components/DocumentWallet';
import { StartupDashboard } from '@/components/StartupDashboard';
import { GovernmentDashboard } from '@/components/GovernmentDashboard';
import { StartupDiscovery } from '@/components/StartupDiscovery';
import { PilotManager } from '@/components/PilotManager';
import { HeroDemoFlow } from '@/components/HeroDemoFlow';
import {
  startupService,
  mockStartupProfile,
  mockStartupsList,
  mockChallenges,
  mockPilots,
  mockPlatformStats,
} from '@/services/startupService';
import { StartupProfile, Challenge, Pilot, PlatformStats } from '@/types';
import { formatCurrency } from '@/utils/formatters';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('LANDING');
  const [startupProfile, setStartupProfile] = useState<StartupProfile>(mockStartupProfile);
  const [startupsList, setStartupsList] = useState<StartupProfile[]>(mockStartupsList);
  const [challenges, setChallenges] = useState<Challenge[]>(mockChallenges);
  const [pilots, setPilots] = useState<Pilot[]>(mockPilots);
  const [stats, setStats] = useState<PlatformStats>(mockPlatformStats);
  const [selectedStartupForWallet, setSelectedStartupForWallet] = useState<StartupProfile>(mockStartupProfile);

  useEffect(() => {
    async function loadData() {
      try {
        const [profRes, stListRes, chRes, piRes, statsRes] = await Promise.all([
          startupService.getProfile(),
          startupService.getStartupsList(),
          startupService.getChallenges(),
          startupService.getPilots(),
          startupService.getStats(),
        ]);
        if (profRes.data) setStartupProfile(profRes.data);
        if (stListRes.data) setStartupsList(stListRes.data);
        if (chRes.data) setChallenges(chRes.data);
        if (piRes.data) setPilots(piRes.data);
        if (statsRes.data) setStats(statsRes.data);
      } catch (err) {
        console.warn('Using built-in resilient mock state', err);
      }
    }
    loadData();
  }, []);

  const handleApplyChallenge = (ch: Challenge) => {
    alert(`Application submitted for "${ch.title}" using your verified DPIIT & GST Document Wallet!`);
  };

  const handleInspectStartupWallet = (st: StartupProfile) => {
    setSelectedStartupForWallet(st);
    setActiveTab('WALLET');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-govblue-100 selection:text-govblue-900 font-sans">
      {/* Institutional Top Navbar */}
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Dynamic View Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* VIEW 1: LANDING PAGE */}
        {activeTab === 'LANDING' && (
          <div className="space-y-16">
            {/* Hero Section */}
            <div className="text-center space-y-5 max-w-4xl mx-auto pt-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-govblue-50 text-govblue-800 border border-govblue-200 shadow-sm">
                <span>🇮🇳</span>
                <span>SIH26136 · DIGITAL GOVERNANCE</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-navy-900 tracking-tight leading-[1.15]">
                Connecting Indian Innovation to Government at Scale
              </h1>

              <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                A unified platform to discover, verify, evaluate, pilot, fund and scale startup solutions.
              </p>

              {/* Primary Dual CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <Button
                  onClick={() => setActiveTab('STARTUP')}
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto text-sm font-bold bg-govblue-600 hover:bg-govblue-700 h-12 px-6 gap-2 shadow-gov"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Explore as Startup</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>

                <Button
                  onClick={() => setActiveTab('GOVERNMENT')}
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto text-sm font-bold bg-white text-navy-900 border-slate-300 hover:bg-slate-50 h-12 px-6 gap-2 shadow-sm"
                >
                  <Landmark className="w-4 h-4 text-navy-900" />
                  <span>Explore as Government</span>
                </Button>

                <Button
                  onClick={() => setActiveTab('DEMO')}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-sm font-bold bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 h-12 px-5 gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Judge Demo Flow</span>
                </Button>
              </div>

              {/* Key Quantitative Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-8 border-t border-slate-200">
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm">
                  <div className="text-2xl font-extrabold text-navy-900 font-mono">248+</div>
                  <div className="text-[11px] text-slate-500 font-medium">Verified Startups</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm">
                  <div className="text-2xl font-extrabold text-emerald-700 font-mono">94%</div>
                  <div className="text-[11px] text-slate-500 font-medium">Gateway Verification</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm">
                  <div className="text-2xl font-extrabold text-govblue-700 font-mono">34</div>
                  <div className="text-[11px] text-slate-500 font-medium">Active Pilots Deployed</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm">
                  <div className="text-2xl font-extrabold text-navy-900 font-mono">₹14.8 Cr</div>
                  <div className="text-[11px] text-slate-500 font-medium">PFMS Grant Escrow</div>
                </div>
              </div>
            </div>

            {/* DUAL PERSONA CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Startup Entry Card */}
              <Card className="p-7 border-slate-200 bg-white hover:border-govblue-400 transition-all duration-200 shadow-card hover:shadow-card-hover flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-govblue-50 border border-govblue-200 flex items-center justify-center text-govblue-600 font-bold">
                    <Rocket className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-navy-900">
                      For Indian Startups
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      Verify your digital credentials once and access nationwide departmental problem statements, pilot sandboxes, and milestone disbursements.
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-700 pt-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Digital Document Wallet:</strong> DPIIT, GST, MCA21, and Udyam API integration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Automated Eligibility Engine:</strong> Instant matching to departmental challenges</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Milestone-Based PFMS Grants:</strong> Track tranches from deployment to signoff</span>
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={() => setActiveTab('STARTUP')}
                  variant="primary"
                  className="w-full text-xs font-bold h-11 bg-govblue-600 hover:bg-govblue-700 shadow-sm gap-2"
                >
                  <span>Enter Startup Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Card>

              {/* Government Entry Card */}
              <Card className="p-7 border-slate-200 bg-white hover:border-navy-400 transition-all duration-200 shadow-card hover:shadow-card-hover flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-navy-50 border border-navy-200 flex items-center justify-center text-navy-900 font-bold">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-navy-900">
                      For Government Officers
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      Publish departmental grand challenges, discover verified high-readiness startups, and supervise pilot trials transitioning to GeM procurement.
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-700 pt-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Instant Verified Discovery:</strong> Zero manual vetting of startup credentials</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Challenge & Tender Publisher:</strong> Deploy problem statements to the startup grid</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>GeM Startup Runway:</strong> Fast-track tested pilot solutions to rate contracts</span>
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={() => setActiveTab('GOVERNMENT')}
                  variant="default"
                  className="w-full text-xs font-bold h-11 bg-navy-900 hover:bg-navy-800 shadow-sm gap-2 text-white"
                >
                  <span>Enter Government Command Center</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Card>
            </div>

            {/* 8-STAGE INNOVATION LIFECYCLE COMPONENT */}
            <LifecycleTimeline
              activeStageId="discover"
              onSelectStage={(id) => console.log('Stage selected:', id)}
            />

            {/* Verification Visual Highlight Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center bg-white p-8 rounded-2xl border border-slate-200 shadow-card">
              <div className="lg:col-span-2 space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Government-Grade Trust Architecture</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
                  Cryptographic Verification & Single Document Wallet
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Startups no longer need to photocopy and notarize documents for every single government tender or challenge.
                  SetuBharat interfaces directly with DPIIT, GSTN, MCA21, and Udyam to issue a tamper-proof verification seal.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Button
                    onClick={() => setActiveTab('WALLET')}
                    variant="outline"
                    className="text-xs font-bold border-slate-300 text-navy-900"
                  >
                    <span>Explore Document Vault</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                  <Button
                    onClick={() => setActiveTab('DISCOVERY')}
                    variant="primary"
                    className="text-xs font-bold bg-govblue-600"
                  >
                    <span>Browse Verified Startups</span>
                  </Button>
                </div>
              </div>

              <div className="w-full">
                <StartupVerificationCard
                  startup={startupProfile}
                  onOpenWallet={() => setActiveTab('WALLET')}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: STARTUP PORTAL */}
        {activeTab === 'STARTUP' && (
          <StartupDashboard
            startup={startupProfile}
            challenges={challenges}
            pilots={pilots}
            onNavigateToWallet={() => setActiveTab('WALLET')}
            onNavigateToPilots={() => setActiveTab('PILOTS')}
            onApplyChallenge={handleApplyChallenge}
          />
        )}

        {/* VIEW 3: GOVERNMENT PORTAL */}
        {activeTab === 'GOVERNMENT' && (
          <GovernmentDashboard
            stats={stats}
            challenges={challenges}
            pilots={pilots}
            startups={startupsList}
            onNavigateToDiscovery={() => setActiveTab('DISCOVERY')}
            onNavigateToPilots={() => setActiveTab('PILOTS')}
          />
        )}

        {/* VIEW 4: STARTUP DISCOVERY */}
        {activeTab === 'DISCOVERY' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-govblue-50 text-govblue-700 border border-govblue-200">
                  <Search className="w-3.5 h-3.5" />
                  <span>National Startup Directory</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 mt-1">
                  Verified Startup Discovery & Capability Search
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Filter DPIIT-verified innovations by domain readiness, past trials, and geographical jurisdiction
                </p>
              </div>
            </div>

            <StartupDiscovery
              startups={startupsList}
              onSelectStartup={handleInspectStartupWallet}
              onInviteToPilot={(st) => alert(`Pilot invitation sent to ${st.name}!`)}
            />
          </div>
        )}

        {/* VIEW 5: DOCUMENT WALLET */}
        {activeTab === 'WALLET' && (
          <div className="space-y-6">
            <DocumentWallet
              documents={selectedStartupForWallet.documents}
              startupName={selectedStartupForWallet.name}
            />
          </div>
        )}

        {/* VIEW 6: PILOT MANAGER & GRANTS */}
        {activeTab === 'PILOTS' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Rocket className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pilot Lifecycle & Fiscal Governance</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 mt-1">
                  Pilot Sandboxes & PFMS Grant Disbursements
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Supervise milestone deliverables, verify statutory Utilization Certificates, and disburse grant tranches
                </p>
              </div>
            </div>

            {pilots.map((p) => (
              <PilotManager
                key={p.id}
                pilot={p}
                userRole="STARTUP"
                onApproveMilestone={(mId) => alert(`Milestone ${mId} signed off!`)}
              />
            ))}
          </div>
        )}

        {/* VIEW 7: HERO DEMO FLOW */}
        {activeTab === 'DEMO' && (
          <div className="space-y-6">
            <HeroDemoFlow />
          </div>
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-navy-900 flex items-center justify-center text-white font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="font-bold text-navy-900 text-sm">
                  SetuBharat · SIH26136
                </span>
                <p className="text-xs text-slate-500">
                  Unified Digital Platform Connecting Startups & Government Departments
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-600 font-medium">
              <button onClick={() => setActiveTab('LANDING')} className="hover:text-navy-900">Platform</button>
              <button onClick={() => setActiveTab('STARTUP')} className="hover:text-navy-900">Startups</button>
              <button onClick={() => setActiveTab('GOVERNMENT')} className="hover:text-navy-900">Government</button>
              <button onClick={() => setActiveTab('DISCOVERY')} className="hover:text-navy-900">Discovery</button>
              <button onClick={() => setActiveTab('DEMO')} className="hover:text-emerald-700 font-bold">Demo Walkthrough</button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div>
              Designed for Smart India Hackathon 2026 · Problem Statement ID: SIH26136
            </div>
            <div className="flex items-center gap-4">
              <span>Zero-Paperwork Verification</span>
              <span>•</span>
              <span>Milestone Grant PFMS</span>
              <span>•</span>
              <span>GeM Scale</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
