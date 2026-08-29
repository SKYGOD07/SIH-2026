/**
 * Pilots.
 *
 * Emptied in the truth pass. This file previously held four invented pilots with sixteen milestones, rupee values, real Pune ward names and measured outcome deltas, invented for a
 * prototype and rendered indistinguishably from departmental records.
 *
 * The exports and their types remain so consumers still compile and so the shape
 * a real record must take is documented. They are populated from
 * a pilot being contracted through the platform — see docs/DATA-SOURCES.md.
 */

import type { Pilot } from '@/types/platform';

export const PILOTS: Pilot[] = [];

export const getPilot = (id: string) => PILOTS.find((p) => p.id === id);

/** The rule the ledger enforces. Process description, not a record. */
export const PAYMENT_RULE = 'Evidence → Approval → Payment';
