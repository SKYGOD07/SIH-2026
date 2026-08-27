'use client';

import { cn } from '@/lib/utils';

/**
 * What stands in for a 3D scene under reduced-motion, before mount, or where
 * WebGL is unavailable.
 *
 * Deliberately not an empty box: the reduced-motion path has to keep the story
 * legible, so each fallback is a still composition of the same geometry the
 * scene would have animated.
 */
export function SceneFallback({
  variant = 'orbit',
  className,
}: {
  variant?: 'orbit' | 'field' | 'archive' | 'ward';
  className?: string;
}) {
  return (
    <div className={cn('absolute inset-0 flex items-center justify-center', className)} aria-hidden="true">
      <svg viewBox="0 0 400 400" className="h-[70%] w-auto max-w-[70%] opacity-70">
        <defs>
          <radialGradient id="sf-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f6f3ec" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#e8762b" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#0a0b0d" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="200" cy="200" r="150" fill="url(#sf-core)" />

        {variant === 'orbit' ? (
          <>
            <ellipse
              cx="200"
              cy="200"
              rx="140"
              ry="58"
              fill="none"
              stroke="#a6a49c"
              strokeOpacity="0.35"
            />
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return (
                <circle
                  key={i}
                  cx={200 + Math.cos(a) * 140}
                  cy={200 + Math.sin(a) * 58}
                  r={i === 0 ? 8 : 4.5}
                  fill={i === 0 ? '#e8762b' : '#a6a49c'}
                />
              );
            })}
            <circle cx="200" cy="200" r="34" fill="none" stroke="#f6f3ec" strokeOpacity="0.4" />
          </>
        ) : null}

        {variant === 'field' ? (
          <>
            {Array.from({ length: 90 }, (_, i) => {
              const a = i * 2.39996;
              const r = 24 + (i / 90) * 150;
              return (
                <circle
                  key={i}
                  cx={200 + Math.cos(a) * r}
                  cy={200 + Math.sin(a) * r * 0.6}
                  r={1.6}
                  fill="#a6a49c"
                  fillOpacity={0.5}
                />
              );
            })}
            {[-70, 0, 70].map((dx) => (
              <circle key={dx} cx={200 + dx} cy={200} r="10" fill="#e8762b" />
            ))}
          </>
        ) : null}

        {variant === 'archive' ? (
          <>
            {Array.from({ length: 16 }, (_, i) => {
              const a = i * 2.39996;
              const r = 60 + (i % 5) * 24;
              return (
                <rect
                  key={i}
                  x={200 + Math.cos(a) * r - 11}
                  y={200 + Math.sin(a) * r - 15}
                  width="22"
                  height="30"
                  fill="#f6f3ec"
                  fillOpacity="0.22"
                />
              );
            })}
            <circle cx="200" cy="200" r="46" fill="none" stroke="#e8762b" strokeOpacity="0.7" />
            {[-58, 0, 58].map((dx) => (
              <rect key={dx} x={200 + dx - 15} y="292" width="30" height="40" fill="#e8762b" fillOpacity="0.75" />
            ))}
          </>
        ) : null}

        {variant === 'ward' ? (
          <>
            {Array.from({ length: 30 }, (_, i) => {
              const ix = i % 6;
              const iz = Math.floor(i / 6);
              const h = 16 + ((i * 37) % 52);
              return (
                <rect
                  key={i}
                  x={72 + ix * 44}
                  y={286 - h + iz * 14}
                  width="30"
                  height={h}
                  fill="#33363b"
                />
              );
            })}
            <path
              d="M 60 300 L 340 300 M 60 320 L 340 320"
              stroke="#e8762b"
              strokeOpacity="0.5"
              strokeWidth="1.5"
            />
            {[100, 170, 240, 310].map((x) => (
              <circle key={x} cx={x} cy="310" r="5" fill="#e8762b" />
            ))}
          </>
        ) : null}
      </svg>
    </div>
  );
}
