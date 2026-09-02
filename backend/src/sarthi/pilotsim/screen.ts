import type { Challenge, Startup } from '@prisma/client';

/**
 * The eligibility screen.
 *
 * Cheap, explainable, and deliberately generous. Its job is to remove companies
 * for which simulating a pilot would be meaningless — a road-safety company
 * against a water-leakage challenge — not to pre-judge the ranking. Anything
 * arguable survives to the model, where it will be scored on its merits.
 *
 * **Excluded companies keep their row.** Who was ruled out, and on what
 * grounds, is part of the answer: an officer who cannot see that 377 of 515
 * companies were screened out on domain has no way to tell a thorough search
 * from a broken query. Silently dropping them would also let a bug that
 * excluded everyone look exactly like a small eligible cohort.
 */

const norm = (s: string) => s.trim().toLowerCase();

export interface ScreenResult {
  eligible: boolean;
  reason: string | null;
}

export function screen(startup: Startup, challenge: Challenge): ScreenResult {
  const sector = norm(startup.sector);
  const domain = norm(challenge.domain);

  const wanted = new Set(challenge.technologies.map(norm).filter(Boolean));
  const offered = new Set(
    [...startup.technologies, ...startup.capabilities].map(norm).filter(Boolean),
  );
  const shared = [...wanted].filter((t) => offered.has(t));

  // Same domain is sufficient on its own — a company working in this sector is
  // worth simulating even if it names none of the technologies the challenge
  // happened to list, because that list is the department's guess at a solution.
  if (sector === domain) return { eligible: true, reason: null };

  // Cross-domain is allowed on a real technology overlap. This is where genuine
  // innovation usually comes from, so the bar is one shared technology.
  if (shared.length > 0) return { eligible: true, reason: null };

  if (offered.size === 0) {
    return {
      eligible: false,
      reason: 'No technologies or capabilities are declared, so fit cannot be assessed.',
    };
  }

  return {
    eligible: false,
    reason: `Works in ${startup.sector}, not ${challenge.domain}, and shares none of the ${challenge.technologies.length} technologies the challenge names.`,
  };
}
