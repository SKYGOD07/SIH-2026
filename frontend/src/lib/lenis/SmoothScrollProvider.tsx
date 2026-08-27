'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const LenisContext = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisContext);

/**
 * USER SCROLL -> LENIS -> GSAP ScrollTrigger -> page / camera / typography.
 *
 * Lenis is driven from GSAP's ticker (not its own rAF) so there is exactly one
 * animation loop and ScrollTrigger reads positions after Lenis has written them.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const reduced = usePrefersReducedMotion();
  const raf = useRef<((time: number) => void) | null>(null);

  useEffect(() => {
    if (reduced) return; // native scrolling for reduced-motion users
    const instance = new Lenis({
      duration: 1.05,
      // Heavy but responsive: fast approach, long settle, no rubber-band lag.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      syncTouch: false,
      autoRaf: false,
    });

    instance.on('scroll', ScrollTrigger.update);

    raf.current = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf.current);
    gsap.ticker.lagSmoothing(500, 33);

    setLenis(instance);

    return () => {
      if (raf.current) gsap.ticker.remove(raf.current);
      instance.destroy();
      setLenis(null);
    };
  }, [reduced]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
