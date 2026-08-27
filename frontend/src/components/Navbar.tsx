'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Rocket, Landmark, Award, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  currentRole?: 'STARTUP' | 'GOVERNMENT' | 'PUBLIC';
  onRoleChange?: (role: 'STARTUP' | 'GOVERNMENT' | 'PUBLIC') => void;
}

export function Navbar({ currentRole = 'PUBLIC', onRoleChange }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              SetuBharat <Badge variant="outline" className="text-[10px] font-mono border-blue-500/30 text-blue-400">SIH26136</Badge>
            </span>
            <p className="text-xs text-slate-400">Digital Startup Verification & Gov Collaboration</p>
          </div>
        </Link>

        {/* Demo Persona Quick Switcher */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onRoleChange?.('STARTUP')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              currentRole === 'STARTUP'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Rocket className="h-3.5 w-3.5" /> Startup View
          </button>
          <button
            onClick={() => onRoleChange?.('GOVERNMENT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              currentRole === 'GOVERNMENT'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Landmark className="h-3.5 w-3.5" /> Government View
          </button>
        </div>
      </div>
    </header>
  );
}
