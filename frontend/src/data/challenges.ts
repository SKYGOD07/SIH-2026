/**
 * Government challenges.
 *
 * Emptied in the truth pass. This file previously held six invented departmental challenges with budgets, baselines, targets and application counts, invented for a
 * prototype and rendered indistinguishably from departmental records.
 *
 * The exports and their types remain so consumers still compile and so the shape
 * a real record must take is documented. They are populated from
 * a department creating a challenge on the platform — see docs/DATA-SOURCES.md.
 */

import type { Challenge } from '@/types/platform';

/**
 * Shown wherever demonstration or placeholder content could be mistaken for a
 * departmental record. Kept as a single string so the wording cannot drift
 * between the places that show it.
 */
export const DEMO_NOTICE =
  'This is a prototype. It holds no departmental records, and no figure shown here is a government decision, an eligibility determination or a procurement notice.';

export const CHALLENGES: Challenge[] = [];

export const getChallenge = (id: string) => CHALLENGES.find((c) => c.id === id);
