'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/console/Icon';

interface WalletCardProps {
  role?: 'GOVERNMENT_OFFICER' | 'STARTUP' | 'EVALUATOR' | 'ADMIN';
  entityName?: string;
  departmentOrSector?: string;
  walletId?: string;
  balanceAmount?: string;
  activeMilestonesCount?: number;
  dpiitStatus?: string;
}

export function WalletMasterCard3D({
  role = 'GOVERNMENT_OFFICER',
  entityName = 'Sarthi Demonstration Officer',
  departmentOrSector = 'Simulated Municipal Water Dept',
  walletId = 'IN-GOV-9874-3210-2026',
  balanceAmount = '₹50.00 Cr',
  activeMilestonesCount = 3,
  dpiitStatus = 'DPIIT DEMO RECOGNIZED',
}: WalletCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const isGov = role === 'GOVERNMENT_OFFICER' || role === 'ADMIN' || role === 'EVALUATOR';

  return (
    <div className="w-full max-w-md mx-auto my-4 group perspective-[1000px]">
      {/* Flip Container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className={cn(
          'relative w-full h-[230px] rounded-[18px] transition-transform duration-700 cursor-pointer select-none shadow-2xl preserve-3d',
          isFlipped ? 'rotate-y-180' : 'hover:scale-[1.02] hover:-rotate-y-6 hover:rotate-x-3',
        )}
      >
        {/* ==================================================== FRONT SIDE */}
        <div
          className={cn(
            'absolute inset-0 w-full h-full rounded-[18px] p-6 flex flex-col justify-between overflow-hidden backface-hidden border',
            isGov
              ? 'bg-gradient-to-br from-[#1c1917] via-[#292524] to-[#0c0a09] border-amber-500/30 text-amber-100 shadow-[0_10px_30px_rgba(217,119,6,0.15)]'
              : 'bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#020617] border-cyan-500/30 text-cyan-100 shadow-[0_10px_30px_rgba(6,182,212,0.15)]',
          )}
        >
          {/* Background Metallic Sheen Lines */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

          {/* Top Header */}
          <div className="flex items-center justify-between z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border bg-white/10 text-white/90">
                  {isGov ? 'GOVERNMENT TREASURY' : 'STARTUP ESCROW WALLET'}
                </span>
                <span className="font-mono text-[0.5625rem] opacity-60">DEMO</span>
              </div>
              <p className="mt-1 text-[0.6875rem] font-medium opacity-70 truncate max-w-[220px]">
                {departmentOrSector}
              </p>
            </div>

            {/* Contactless Wave Icon */}
            <div className="flex items-center gap-1.5 opacity-80">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
            </div>
          </div>

          {/* Middle: Gold Metallic Chip & Balance */}
          <div className="flex items-center justify-between my-2 z-10">
            {/* Metallic Chip */}
            <div className="w-11 h-8 rounded-md bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-200 border border-amber-600/40 p-1 flex flex-col justify-between shadow-inner">
              <div className="w-full h-0.5 bg-amber-700/40" />
              <div className="w-full h-0.5 bg-amber-700/40" />
              <div className="w-full h-0.5 bg-amber-700/40" />
            </div>

            {/* Wallet Balance Display */}
            <div className="text-right">
              <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] opacity-60 block">
                {isGov ? 'Available Budget Envelope' : 'Escrow Milestone Balance'}
              </span>
              <span className="font-display text-[1.25rem] font-extrabold tracking-tight block">
                {balanceAmount}
              </span>
            </div>
          </div>

          {/* Bottom Footer: Wallet ID & Holder Name */}
          <div className="z-10 flex items-end justify-between">
            <div>
              <span className="font-mono text-[0.75rem] font-semibold tracking-[0.18em] block opacity-90">
                {walletId}
              </span>
              <span className="font-display text-[0.875rem] font-bold block uppercase mt-0.5 truncate max-w-[200px]">
                {entityName}
              </span>
            </div>

            {/* Mastercard Brand Circles */}
            <div className="flex items-center -space-x-2">
              <div className={cn('w-7 h-7 rounded-full opacity-90', isGov ? 'bg-amber-500' : 'bg-cyan-500')} />
              <div className={cn('w-7 h-7 rounded-full opacity-80', isGov ? 'bg-orange-600' : 'bg-blue-600')} />
            </div>
          </div>
        </div>

        {/* ==================================================== BACK SIDE */}
        <div
          className={cn(
            'absolute inset-0 w-full h-full rounded-[18px] py-5 flex flex-col justify-between overflow-hidden backface-hidden rotate-y-180 border',
            isGov
              ? 'bg-gradient-to-br from-[#1c1917] via-[#292524] to-[#0c0a09] border-amber-500/30 text-amber-100'
              : 'bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#020617] border-cyan-500/30 text-cyan-100',
          )}
        >
          {/* Black Magnetic Strip */}
          <div className="w-full h-10 bg-black/90 shadow-md" />

          {/* Signature & CVC Box */}
          <div className="px-6 py-1">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-8 bg-white/10 rounded px-3 flex items-center font-mono text-[0.6875rem] italic text-white/50 border border-white/10">
                Authorized Signature — Sarthi Verified
              </div>
              <div className="w-14 h-8 bg-white/90 text-black font-mono text-[0.8125rem] font-extrabold flex items-center justify-center rounded">
                {isGov ? '789' : '456'}
              </div>
            </div>
          </div>

          {/* Security & Details */}
          <div className="px-6 space-y-1">
            <div className="flex justify-between font-mono text-[0.625rem] opacity-60">
              <span>SECURITY CODE: {isGov ? 'GOV-789' : 'STU-456'}</span>
              <span>EXP: 12/2029</span>
            </div>

            <p className="text-[0.625rem] leading-tight opacity-50 font-sans">
              This card is a simulated 3D wallet representation for the Sarthi Innovation Procurement Platform.
              No live financial transaction is processed.
            </p>
          </div>

          {/* Flip Back Action Bar */}
          <div className="px-6 pt-2 border-t border-white/10 flex items-center justify-between text-[0.6875rem] font-mono">
            <span className="opacity-70">{dpiitStatus}</span>
            <span className="text-xs font-bold underline cursor-pointer">Click to flip front ↺</span>
          </div>
        </div>
      </div>
    </div>
  );
}
