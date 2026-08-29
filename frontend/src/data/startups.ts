/**
 * Startups.
 *
 * Emptied in the truth pass. This file previously held eight invented companies with match scores, funding raised, government deployment claims and forty evidence-timeline events, invented for a
 * prototype and rendered indistinguishably from departmental records.
 *
 * The exports and their types remain so consumers still compile and so the shape
 * a real record must take is documented. They are populated from
 * the MSInS winner directory and the SISFS portfolio — see docs/DATA-SOURCES.md.
 */

import type { Startup } from '@/types/platform';

export const STARTUPS: Startup[] = [];

export const getStartup = (id: string) => STARTUPS.find((s) => s.id === id);

export const COMPLIANCE_LABEL: Record<Startup['complianceStatus'], string> = {
  VERIFIED: 'Verified',
  IN_REVIEW: 'In review',
  ACTION_REQUIRED: 'Action required',
};
