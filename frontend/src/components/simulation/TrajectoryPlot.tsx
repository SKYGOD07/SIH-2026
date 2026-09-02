'use client';

/**
 * The pilot, drawn.
 *
 * The median simulated trajectory of the leading companies, from baseline
 * toward the contracted target across the pilot window. This is what "a pilot
 * running" actually looks like: a slow start while nothing is deployed, a
 * steepening middle as wards come online, and a flattening tail as the last
 * unit's effect matures.
 *
 * The target is a line, not a zone, because meeting it is binary in the
 * contract. Curves that finish on the far side of it met it.
 *
 * Each curve is one company's *median* run, not an average of its runs. An
 * averaged curve is a shape no single pilot ever had — it smooths away the
 * mobilisation step that is the most decision-relevant feature of the whole
 * plot.
 */

export interface Curve {
  id: string;
  name: string;
  points: number[];
  metTarget: boolean;
}

export function TrajectoryPlot({
  curves,
  baseline,
  target,
  durationDays,
  highlightId,
}: {
  curves: Curve[];
  baseline: number;
  target: number;
  durationDays: number;
  highlightId?: string | null;
}) {
  const w = 640;
  const h = 240;
  const pad = { top: 14, right: 54, bottom: 26, left: 38 };

  if (curves.length === 0) {
    return (
      <div className="card flex h-[240px] items-center justify-center text-[0.75rem] text-chalk/35">
        Trajectories appear once the first pass completes.
      </div>
    );
  }

  // Scale to the data actually present, plus the target, so a curve that
  // overshoots is not clipped off the top of the frame.
  const all = curves.flatMap((c) => c.points);
  const lo = Math.min(target, baseline, ...all);
  const hi = Math.max(target, baseline, ...all);
  const span = hi - lo || 1;

  const x = (day: number) =>
    pad.left + (day / Math.max(1, durationDays - 1)) * (w - pad.left - pad.right);
  const y = (v: number) => pad.top + (1 - (v - lo) / span) * (h - pad.top - pad.bottom);

  const path = (points: number[]) =>
    points.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  return (
    <div className="card p-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/40">
          Median trajectory · leading candidates
        </span>
        <span className="font-mono text-[0.625rem] text-chalk/45">{durationDays} days</span>
      </div>

      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        role="img"
        aria-label={`Simulated median trajectories for ${curves.length} companies from a baseline of ${baseline} toward a target of ${target} over ${durationDays} days`}
      >
        {/* target line — the bar every curve is judged against */}
        <line
          x1={pad.left}
          y1={y(target)}
          x2={w - pad.right}
          y2={y(target)}
          stroke="rgb(var(--c-validated, 34 197 94))"
          strokeWidth="1"
          strokeDasharray="4 3"
          opacity="0.75"
        />
        <text
          x={w - pad.right + 6}
          y={y(target) + 3}
          className="fill-validated font-mono"
          style={{ fontSize: '9px' }}
        >
          target {target}
        </text>

        {/* baseline */}
        <line
          x1={pad.left}
          y1={y(baseline)}
          x2={w - pad.right}
          y2={y(baseline)}
          stroke="rgb(var(--c-chalk) / 0.18)"
          strokeWidth="1"
        />
        <text
          x={w - pad.right + 6}
          y={y(baseline) + 3}
          className="fill-chalk/40 font-mono"
          style={{ fontSize: '9px' }}
        >
          baseline
        </text>

        {curves.map((c) => {
          const active = highlightId === c.id;
          return (
            <path
              key={c.id}
              d={path(c.points)}
              fill="none"
              stroke={
                active
                  ? 'rgb(var(--c-signal, 217 0 0))'
                  : c.metTarget
                    ? 'rgb(var(--c-validated, 34 197 94))'
                    : 'rgb(var(--c-chalk) / 0.3)'
              }
              strokeWidth={active ? 2 : 1.2}
              opacity={highlightId && !active ? 0.35 : 0.9}
            />
          );
        })}

        {/* day axis */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const day = Math.round(f * (durationDays - 1));
          return (
            <text
              key={f}
              x={x(day)}
              y={h - 8}
              textAnchor="middle"
              className="fill-chalk/35 font-mono"
              style={{ fontSize: '9px' }}
            >
              {day === 0 ? 'day 1' : day + 1}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
