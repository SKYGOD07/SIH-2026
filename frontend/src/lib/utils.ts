import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * The project's custom font sizes, declared to tailwind-merge.
 *
 * Without this it cannot tell `text-display-xl` from `text-chalk` — both are
 * `text-*`, and an unrecognised value is assumed to be a colour. The two then
 * count as conflicting, the later one wins, and the size is silently dropped:
 * a display headline written as `text-display-xl … text-chalk` renders at the
 * inherited 16px with no error anywhere. The same trap catches `text-meta`
 * against a tone class in every label on the site.
 *
 * These names must stay in step with the `fontSize` ramp in tailwind.config.ts.
 */
const FONT_SIZES = [
  'display-xs',
  'display-sm',
  'display-md',
  'display-lg',
  'display-xl',
  'hero-line',
  'meta',
  'meta-lg',
];

const twMerge = extendTailwindMerge({
  extend: { classGroups: { 'font-size': [{ text: FONT_SIZES }] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Maps v from [inMin,inMax] into [outMin,outMax], clamped to the output range. */
export const mapRange = (
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) =>
  clamp(
    outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin),
    Math.min(outMin, outMax),
    Math.max(outMin, outMax),
  );

/** Deterministic PRNG — keeps SSR markup and client scenes identical. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const formatINR = (rupees: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);

/** 1500000 -> "₹15L", 25000000 -> "₹2.5Cr" */
export const formatLakh = (rupees: number) => {
  if (rupees >= 10000000) {
    const cr = rupees / 10000000;
    return '₹' + (Number.isInteger(cr) ? cr : cr.toFixed(1)) + 'Cr';
  }
  const l = rupees / 100000;
  return '₹' + (Number.isInteger(l) ? l : l.toFixed(1)) + 'L';
};

export const pad2 = (n: number) => String(n).padStart(2, '0');
