'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Rocket,
  Landmark,
  Compass,
  FileText,
  Sparkles,
  Lock,
  Menu,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export type ActiveTab = 'LANDING' | 'STARTUP' | 'GOVERNMENT' | 'DISCOVERY' | 'WALLET' | 'PILOTS' | 'DEMO';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export function Navbar({ activeTab, onSelectTab }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleTabClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-sm">
      {/* Top Thin Gov Banner */}
      <div className="bg-navy-950 text-slate-300 text-[11px] px-4 py-1 flex items-center justify-between border-b border-navy-900">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[12px]">🇮🇳</span>
            <span className="font-medium text-slate-200">
              Government of India · Smart India Hackathon 2026 (SIH26136)
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-400 font-mono">
            <span>DPIIT REGISTRY</span>
            <span>•</span>
            <span>MCA21 GATEWAY</span>
            <span>•</span>
            <span>GeM STARTUP RUNWAY</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => handleTabClick('LANDING')}
          className="flex items-center gap-3 text-left focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-navy-900 flex items-center justify-center text-white font-bold shadow-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-lg text-navy-900 tracking-tight">
                SetuBharat
              </span>
              <Badge variant="gov" className="text-[10px] font-mono py-0 px-1.5 border-govblue-300">
                SIH26136
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-none mt-1">
              Digital Startup Verification & Gov Collaboration
            </p>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => handleTabClick('LANDING')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'LANDING'
                ? 'text-navy-900 bg-slate-100'
                : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
            }`}
          >
            Platform Overview
          </button>

          <button
            onClick={() => handleTabClick('DISCOVERY')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'DISCOVERY'
                ? 'text-navy-900 bg-slate-100'
                : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
            }`}
          >
            Startup Discovery
          </button>

          <button
            onClick={() => handleTabClick('WALLET')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'WALLET'
                ? 'text-navy-900 bg-slate-100'
                : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
            }`}
          >
            Document Vault
          </button>

          <button
            onClick={() => handleTabClick('PILOTS')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'PILOTS'
                ? 'text-navy-900 bg-slate-100'
                : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
            }`}
          >
            Pilot Manager & Grants
          </button>

          <button
            onClick={() => handleTabClick('DEMO')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'DEMO'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                : 'text-emerald-700 hover:bg-emerald-50/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Judge Demo Flow</span>
          </button>
        </nav>

        {/* Persona Switcher / Quick Action Buttons */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => handleTabClick('STARTUP')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'STARTUP'
                  ? 'bg-govblue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Startup Portal</span>
            </button>
            <button
              onClick={() => handleTabClick('GOVERNMENT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'GOVERNMENT'
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Gov Portal</span>
            </button>
          </div>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex lg:hidden">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          <button
            onClick={() => handleTabClick('LANDING')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
              activeTab === 'LANDING' ? 'bg-slate-100 text-navy-900' : 'text-slate-700'
            }`}
          >
            Platform Overview
          </button>
          <button
            onClick={() => handleTabClick('STARTUP')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
              activeTab === 'STARTUP' ? 'bg-govblue-50 text-govblue-700' : 'text-slate-700'
            }`}
          >
            <Rocket className="w-4 h-4 text-govblue-600" />
            <span>Startup Workspace</span>
          </button>
          <button
            onClick={() => handleTabClick('GOVERNMENT')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
              activeTab === 'GOVERNMENT' ? 'bg-navy-50 text-navy-900' : 'text-slate-700'
            }`}
          >
            <Landmark className="w-4 h-4 text-navy-900" />
            <span>Government Command Center</span>
          </button>
          <button
            onClick={() => handleTabClick('DISCOVERY')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
              activeTab === 'DISCOVERY' ? 'bg-slate-100 text-navy-900' : 'text-slate-700'
            }`}
          >
            Startup Discovery
          </button>
          <button
            onClick={() => handleTabClick('WALLET')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
              activeTab === 'WALLET' ? 'bg-slate-100 text-navy-900' : 'text-slate-700'
            }`}
          >
            Document Vault
          </button>
          <button
            onClick={() => handleTabClick('PILOTS')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
              activeTab === 'PILOTS' ? 'bg-slate-100 text-navy-900' : 'text-slate-700'
            }`}
          >
            Pilot Manager & Grants
          </button>
          <button
            onClick={() => handleTabClick('DEMO')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 flex items-center gap-2 ${
              activeTab === 'DEMO' ? 'border border-emerald-300' : ''
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Judge Demo Walkthrough</span>
          </button>
        </div>
      )}
    </header>
  );
}
