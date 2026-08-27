'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Audience } from '@/types/platform';

interface AudienceContextValue {
  audience: Audience;
  setAudience: (a: Audience) => void;
  toggle: () => void;
}

const AudienceContext = createContext<AudienceContextValue | null>(null);

/**
 * Which side of the pathway the reader is looking from.
 *
 * Shared rather than local because the same toggle governs the landing-page
 * mode section and the product routes — switching is a UI state change, never
 * a navigation.
 */
export function AudienceProvider({ children }: { children: ReactNode }) {
  const [audience, setAudience] = useState<Audience>('government');

  const value = useMemo<AudienceContextValue>(
    () => ({
      audience,
      setAudience,
      toggle: () => setAudience((a) => (a === 'government' ? 'startup' : 'government')),
    }),
    [audience],
  );

  return <AudienceContext.Provider value={value}>{children}</AudienceContext.Provider>;
}

export function useAudience(): AudienceContextValue {
  const ctx = useContext(AudienceContext);
  if (!ctx) throw new Error('useAudience must be used inside <AudienceProvider>');
  return ctx;
}
