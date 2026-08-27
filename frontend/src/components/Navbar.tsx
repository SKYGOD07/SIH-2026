'use client';

import React from 'react';
import { Truck, ShieldCheck, Activity, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NavbarProps {
  backendConnected?: boolean;
}

export function Navbar({ backendConnected = false }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              LogiPulse <span className="text-xs text-blue-400 font-mono font-normal">v1.0</span>
            </span>
            <p className="text-xs text-slate-400">Real-Time Logistics Engine</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          <span className="flex items-center gap-1.5 hover:text-white cursor-pointer transition">
            <Activity className="h-4 w-4 text-blue-400" /> Dashboard
          </span>
          <span className="flex items-center gap-1.5 hover:text-white cursor-pointer transition">
            <MapPin className="h-4 w-4 text-emerald-400" /> Live Fleet
          </span>
          <span className="flex items-center gap-1.5 hover:text-white cursor-pointer transition">
            <ShieldCheck className="h-4 w-4 text-indigo-400" /> Dispatch
          </span>
        </nav>

        <div className="flex items-center gap-3">
          {backendConnected ? (
            <Badge variant="success" className="gap-1.5 py-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              API Online
            </Badge>
          ) : (
            <Badge variant="warning" className="gap-1.5 py-1">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              Checking API...
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
