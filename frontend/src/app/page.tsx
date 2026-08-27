'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Landmark, 
  ShieldCheck, 
  FileCheck2, 
  Sparkles, 
  ArrowRight, 
  Rocket, 
  Search, 
  CheckCircle2, 
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top GovTech Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-white flex items-center gap-1.5">
                SetuBharat <Badge variant="outline" className="text-[10px] font-mono border-blue-500/30 text-blue-400">SIH26136</Badge>
              </span>
              <p className="text-[11px] text-slate-400">Digital Startup Verification & Gov Collaboration</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-slate-900 border-slate-800 text-slate-300">
              Demo Persona Switcher
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sparkles className="h-3.5 w-3.5" /> One-Time Verification • Zero Redundant Paperwork
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Connecting Startups & Government from <span className="text-blue-500">Discovery to Scale</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400">
            A unified digital verification layer, reusable document wallet, and live pilot procurement workflow for Indian innovations.
          </p>
        </div>

        {/* Dual Persona Entry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Startup Portal Entry */}
          <Card className="border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-900/40 hover:border-blue-500/50 transition duration-200">
            <CardHeader className="space-y-2">
              <div className="h-12 w-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2">
                <Rocket className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl text-white font-bold">For Startups</CardTitle>
              <CardDescription className="text-slate-400">
                Create your verified digital profile once and access nationwide government opportunities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Digital Document Wallet (DPIIT, GST, MCA)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Automated Scheme & Challenge Eligibility Engine
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Track Pilot Milestones & Funding Disbursements
                </li>
              </ul>

              <div className="pt-2">
                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white gap-2 font-medium">
                  Enter Startup Portal <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Government Portal Entry */}
          <Card className="border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-900/40 hover:border-emerald-500/50 transition duration-200">
            <CardHeader className="space-y-2">
              <div className="h-12 w-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                <Landmark className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl text-white font-bold">For Government Officers</CardTitle>
              <CardDescription className="text-slate-400">
                Publish departmental challenges, discover verified startups, and supervise pilot deployments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Instant Verified Startup Search & Sector Filters
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Publish Departmental Challenges & Grant Tenders
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Supervise Pilots $\rightarrow$ GeM Procurement Scale
                </li>
              </ul>

              <div className="pt-2">
                <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-white gap-2 font-medium">
                  Enter Government Portal <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 7-Stage Complete Lifecycle Bar */}
        <div className="border border-slate-800 rounded-2xl bg-slate-900/50 p-6 max-w-5xl mx-auto space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
            Unified SIH26136 Innovation Lifecycle
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-center">
            {[
              { title: '1. Discover', desc: 'Challenges & Needs' },
              { title: '2. Verify', desc: 'Document Wallet' },
              { title: '3. Evaluate', desc: 'Rule Match & DPR' },
              { title: '4. Pilot', desc: 'Deploy Solution' },
              { title: '5. Fund', desc: 'Milestone Tranches' },
              { title: '6. Monitor', desc: 'Utilization Certs' },
              { title: '7. Procure', desc: 'GeM & Scale' },
            ].map((step, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="font-bold text-xs text-blue-400">{step.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
