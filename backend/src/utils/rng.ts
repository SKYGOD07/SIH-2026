/**
 * Seeded pseudo-randomness.
 *
 * Everything in Sarthi that uses randomness must be reproducible. A demo
 * dataset that changes between runs cannot be verified; a simulation whose
 * ranking shifts on a rerun cannot be defended to the department it advised.
 * So there is no `Math.random()` anywhere in the generated or simulated paths —
 * a seed goes in, and the same numbers come out, on any machine, forever.
 */

/** mulberry32 — small, fast, and identical across runs for a given seed. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A stable 32-bit seed from a string.
 *
 * Used to derive a company's own seed from its UUID, so a given company behaves
 * identically in every run of a given simulation regardless of the order the
 * cohort happened to be iterated in. Order-dependent seeding would make the
 * result depend on the database's row order, which is not a guarantee Postgres
 * makes.
 */
export function seedFromString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/**
 * Combine seeds without the collisions that plain addition or XOR produce.
 *
 * `mix(a, b)` and `mix(b, a)` differ, and mixing sequentially does not drift
 * toward a fixed point — both matter when deriving thousands of per-run seeds
 * from one run seed.
 */
export function mixSeed(a: number, b: number): number {
  let h = (a ^ Math.imul(b ^ (b >>> 16), 2246822507)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** Standard normal via Box–Muller, drawn from a seeded uniform source. */
export function gaussian(next: () => number): number {
  // u must be non-zero for the log; the transform is otherwise standard.
  const u = 1 - next();
  const v = next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
