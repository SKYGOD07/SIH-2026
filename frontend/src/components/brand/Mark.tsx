'use client';

import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * The Sarthi mark.
 *
 * A 5 x 5 pixel grid spelling S in rounded tiles. One component, used at both
 * ends of the opening sequence: enormous in the preloader while it assembles,
 * and tiny in the navigation capsule it lands in. Sharing the geometry is what
 * lets the opener hand off to the navbar convincingly — the reader is watching
 * one object move, not two objects swapped.
 *
 * The box is square and sizes from whatever width the parent gives it; every
 * tile is positioned in percentages so it scales without recalculation.
 */

/**
 * 1 = tile. Reading the rows top-to-bottom spells S.
 *
 * The tile COUNT is load-bearing, not just the shape: the preloader schedule in
 * `Preloader.tsx` hard-codes `T.assembled` as assembleStart + travel + stagger,
 * where the stagger total is (tiles - 1) x 0.075s. Thirteen tiles is what makes
 * that 0.9s. Change the glyph and you must retune `T.assembled` to match, or the
 * mark will still be arriving when it is due to fly to the navbar.
 */
export const MARK_GRID: number[][] = [
  [0, 1, 1, 1, 1],
  [1, 0, 0, 0, 0],
  [0, 1, 1, 1, 0],
  [0, 0, 0, 0, 1],
  [1, 1, 1, 1, 0],
];

export interface MarkTile {
  key: string;
  row: number;
  col: number;
  /** Distance from the grid centre — drives centre-out staggering. */
  dist: number;
}

/** Tiles in centre-out order, so a stagger reads as the mark growing outward. */
export const MARK_TILES: MarkTile[] = (() => {
  const c = 2; // (5 - 1) / 2
  const tiles: MarkTile[] = [];
  MARK_GRID.forEach((row, r) =>
    row.forEach((on, col) => {
      if (!on) return;
      tiles.push({ key: `${r}-${col}`, row: r, col, dist: Math.hypot(r - c, col - c) });
    }),
  );
  return tiles.sort((a, b) => a.dist - b.dist);
})();

/** Gutter and tile size as percentages of the square box. */
const STEP = 20;
const INSET = 1.6;
const SIZE = 16.8;

export interface MarkProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  className?: string;
  style?: CSSProperties;
  /** Applied to every tile — colour lives here, not in the component. */
  tileClassName?: string;
  /** Marks tiles for GSAP targeting. */
  tileAttr?: string;
  /** Corner rounding of each tile, as a percentage of tile size. */
  radius?: string;
}

export const Mark = forwardRef<HTMLDivElement, MarkProps>(function Mark(
  { className, tileClassName, tileAttr, radius = '18%', ...rest },
  ref,
) {
  return (
    <div ref={ref} aria-hidden="true" className={cn('relative aspect-square', className)} {...rest}>
      {MARK_TILES.map((t) => (
        <span
          key={t.key}
          {...(tileAttr ? { [tileAttr]: '' } : {})}
          className={cn('absolute bg-chalk', tileClassName)}
          style={{
            left: `${t.col * STEP + INSET}%`,
            top: `${t.row * STEP + INSET}%`,
            width: `${SIZE}%`,
            height: `${SIZE}%`,
            borderRadius: radius,
          }}
        />
      ))}
    </div>
  );
});
