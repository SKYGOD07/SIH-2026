'use client';

import { useEffect, useState } from 'react';

/**
 * The scan.
 *
 * A sweep runs while the platform classifies the officer's problem and queries
 * the companies working in the matching field. It is doing two honest jobs at
 * once: covering a wait that is genuinely variable — a model call may take
 * seconds, the fallback is instant — and showing *what is being searched*, so
 * the officer understands a field was chosen before companies appeared.
 *
 * The rings are not decoration. Each is a field in the taxonomy, and a blip
 * lands on a ring when that field has companies, at an angle derived from the
 * field name so the same field always appears in the same place. A radar whose
 * marks move at random between runs is a spinner wearing a costume.
 *
 * `prefers-reduced-motion` gets the same information without the sweep: rings,
 * blips and the caption, held still.
 */

export interface RadarField {
  field: string;
  label: string;
  companyCount: number;
}

/** Stable angle per field, so a field keeps its position across scans. */
function angleFor(field: string): number {
  let h = 0;
  for (let i = 0; i < field.length; i += 1) h = (h * 31 + field.charCodeAt(i)) % 360;
  return h;
}

export function Radar({
  fields,
  caption,
  done = false,
}: {
  fields: RadarField[];
  caption: string;
  done?: boolean;
}) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const size = 320;
  const c = size / 2;
  const rings = [0.32, 0.56, 0.8];
  const maxCount = Math.max(1, ...fields.map((f) => f.companyCount));

  return (
    <div className="flex flex-col items-center">
      <div className="liquid-glass relative rounded-full p-5" style={{ ['--glass-tint' as string]: 0.3 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={caption}>
          <defs>
            <radialGradient id="sweepFade">
              <stop offset="0%" stopColor="rgb(var(--c-chalk))" stopOpacity="0" />
              <stop offset="70%" stopColor="rgb(var(--c-signal, 217 0 0))" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#D90000" stopOpacity="0.30" />
            </radialGradient>
          </defs>

          {/* rings — one per taxonomy band */}
          {rings.map((r) => (
            <circle
              key={r}
              cx={c}
              cy={c}
              r={c * r}
              fill="none"
              stroke="rgb(var(--c-chalk) / 0.13)"
              strokeWidth="1"
            />
          ))}
          <line x1={c} y1={c * 0.16} x2={c} y2={size - c * 0.16} stroke="rgb(var(--c-chalk) / 0.08)" />
          <line x1={c * 0.16} y1={c} x2={size - c * 0.16} y2={c} stroke="rgb(var(--c-chalk) / 0.08)" />

          {/* the sweep */}
          {!reduced && !done && (
            <g style={{ transformOrigin: `${c}px ${c}px`, animation: 'radarSweep 2.4s linear infinite' }}>
              <path
                d={`M ${c} ${c} L ${c} ${c - c * 0.86} A ${c * 0.86} ${c * 0.86} 0 0 1 ${
                  c + c * 0.86 * Math.sin(Math.PI / 3)
                } ${c - c * 0.86 * Math.cos(Math.PI / 3)} Z`}
                fill="url(#sweepFade)"
              />
            </g>
          )}

          {/* blips — a field with companies, at its own stable angle */}
          {fields.map((f, i) => {
            const a = (angleFor(f.field) * Math.PI) / 180;
            const ring = rings[i % rings.length];
            const x = c + Math.cos(a) * c * ring;
            const y = c + Math.sin(a) * c * ring;
            const r = 3 + (f.companyCount / maxCount) * 5;
            return (
              <g key={f.field}>
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill="#D90000"
                  opacity={done ? 0.9 : 0.75}
                  style={
                    reduced
                      ? undefined
                      : { animation: `blipPulse 2.4s ease-out ${(i * 0.18).toFixed(2)}s infinite` }
                  }
                />
                <circle cx={x} cy={y} r={r + 5} fill="none" stroke="#D90000" strokeOpacity="0.25" />
              </g>
            );
          })}

          <circle cx={c} cy={c} r="2.5" fill="rgb(var(--c-chalk) / 0.5)" />
        </svg>
      </div>

      <p
        aria-live="polite"
        className="mt-5 max-w-[38ch] text-center font-mono text-[0.6875rem] uppercase leading-relaxed tracking-[0.14em] text-chalk/50"
      >
        {caption}
      </p>

      <style jsx global>{`
        @keyframes radarSweep {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes blipPulse {
          0%,
          100% {
            opacity: 0.35;
          }
          45% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
