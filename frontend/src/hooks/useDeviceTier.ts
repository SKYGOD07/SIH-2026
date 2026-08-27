'use client';

import { useEffect, useState } from 'react';

export type DeviceTier = 'mobile' | 'tablet' | 'desktop';

export interface DeviceProfile {
  tier: DeviceTier;
  /** Coarse pointer (touch) — custom cursor and hover affordances are off. */
  touch: boolean;
  /** Conservative estimate of GPU/CPU headroom, used to scale particle counts. */
  lowPower: boolean;
  /** Clamped device pixel ratio ceiling for <Canvas dpr>. */
  dprCap: number;
  ready: boolean;
}

const DEFAULT: DeviceProfile = {
  tier: 'desktop',
  touch: false,
  lowPower: false,
  dprCap: 1.75,
  ready: false,
};

/**
 * Single source of truth for "how much experience can this device afford".
 * Every 3D scene reads particle counts and DPR from here rather than
 * guessing with its own media query.
 */
export function useDeviceTier(): DeviceProfile {
  const [profile, setProfile] = useState<DeviceProfile>(DEFAULT);

  useEffect(() => {
    const compute = (): DeviceProfile => {
      const w = window.innerWidth;
      const tier: DeviceTier = w < 768 ? 'mobile' : w < 1180 ? 'tablet' : 'desktop';
      const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
      const cores = navigator.hardwareConcurrency ?? 4;
      const mem = (navigator as any).deviceMemory ?? 8;
      const lowPower = tier === 'mobile' || cores <= 4 || mem <= 4;
      const dprCap = tier === 'mobile' ? 1.5 : lowPower ? 1.5 : 1.75;
      return { tier, touch, lowPower, dprCap, ready: true };
    };

    setProfile(compute());
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setProfile(compute()));
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return profile;
}

/** Scales any count (particles, nodes, instances) to the device budget. */
export function scaleCount(base: number, p: DeviceProfile): number {
  if (p.tier === 'mobile') return Math.round(base * 0.28);
  if (p.tier === 'tablet') return Math.round(base * 0.55);
  if (p.lowPower) return Math.round(base * 0.6);
  return base;
}
