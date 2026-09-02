/**
 * Give every demonstration challenge something to review.
 *
 *   npm run demo:responses
 *
 * A challenge with no responses is a dead end: the review page renders, the
 * matching engine has nothing to score, and the decision queue leads to an
 * empty screen. This files a response from each company whose field matches the
 * challenge, then runs the real scoring engine over them.
 *
 * The responses are written from each company's own stored profile rather than
 * invented — the solution summary is the company's, the technologies are the
 * company's. That matters for more than tidiness: the matching engine scores
 * the *response*, so a response composed of made-up text would produce a
 * ranking that has nothing to do with the companies in the database.
 *
 * Idempotent. Every response is keyed on (challenge, startup) and upserted.
 */
import { DataOrigin, PrismaClient, UserRole } from '@prisma/client';
import { scoreMatch } from '../src/workflow/matching';

const prisma = new PrismaClient();

/** Which company fields answer which challenge domain. */
const RELATED: Record<string, string[]> = {
  'water-distribution': ['water-distribution', 'wastewater'],
  'municipal-waste-management': ['municipal-waste-management', 'municipal-operations', 'e-governance'],
  'urban-mobility': ['urban-mobility', 'e-governance'],
  'renewable-energy': ['renewable-energy'],
  agritech: ['agritech', 'agri-fintech-health'],
};

async function main() {
  const owner =
    (await prisma.userProfile.findFirst({ where: { role: UserRole.GOVERNMENT_OFFICER } })) ??
    (await prisma.userProfile.findFirst({ where: { role: UserRole.ADMIN } }));
  if (!owner) {
    console.error('No government profile exists. Sign in once, then re-run.');
    process.exitCode = 1;
    return;
  }

  const challenges = await prisma.challenge.findMany();
  if (challenges.length === 0) {
    console.error('No challenges. Run `npm run demo:seed` first.');
    process.exitCode = 1;
    return;
  }

  for (const challenge of challenges) {
    const sectors = RELATED[challenge.domain] ?? [challenge.domain];
    const companies = await prisma.startup.findMany({ where: { sector: { in: sectors } } });

    if (companies.length === 0) {
      console.log(`\n${challenge.title}\n  no company works in ${challenge.domain} — skipped`);
      continue;
    }

    console.log(`\n${challenge.title}  [${challenge.domain}]`);

    for (const c of companies) {
      // Composed from the company's own record. Nothing here is invented: if a
      // company has not stated a solution, the response says so rather than
      // inventing one, and the engine scores it lower for exactly that reason.
      const solution =
        c.solutionSummary ?? c.oneLineDescription ?? 'No solution summary has been provided.';
      const deployment =
        c.deploymentRequirements ??
        c.infrastructureRequirements ??
        'No deployment approach has been stated.';
      const pilotApproach = c.pilotTeamSummary
        ? `${c.pilotTeamSummary} Pilot proposed over ${c.pilotDurationDays ?? 90} days.`
        : 'No pilot approach has been stated.';

      await prisma.challengeResponse.upsert({
        where: { challengeId_startupId: { challengeId: challenge.id, startupId: c.id } },
        create: {
          challengeId: challenge.id,
          startupId: c.id,
          solutionSummary: solution,
          capabilities: c.capabilities,
          technologies: c.technologies,
          deploymentApproach: deployment,
          expectedResult: `Reduce ${challenge.targetMetric} against the stated baseline.`,
          pilotApproach,
          evidenceReferences: [],
          status: 'SUBMITTED',
          submittedByUserId: owner.id,
          submittedAt: new Date(),
          origin: DataOrigin.DEMO,
        },
        update: { status: 'SUBMITTED' },
      });
    }

    // --- score them with the real engine, not a copy of it ----------------
    const responses = await prisma.challengeResponse.findMany({
      where: { challengeId: challenge.id, status: 'SUBMITTED' },
      include: { startup: true },
    });

    for (const r of responses) {
      const engagements = await prisma.startupProgramParticipation.count({
        where: { startupId: r.startupId },
      });
      const relevantProjects = await prisma.startupProject.count({
        where: { startupId: r.startupId, sector: challenge.domain },
      });
      const result = scoreMatch({
        challenge: challenge as any,
        startup: r.startup as any,
        response: r,
        governmentEngagements: engagements,
        relevantProjects,
      });
      const scores = {
        problemFitScore: result.problemFitScore,
        technicalFitScore: result.technicalFitScore,
        previousProjectRelevanceScore: result.previousProjectRelevanceScore,
        deploymentCapabilityScore: result.deploymentCapabilityScore,
        evidenceStrengthScore: result.evidenceStrengthScore,
        financialCapacityScore: result.financialCapacityScore,
        governmentReadinessScore: result.governmentReadinessScore,
        complianceReadinessScore: result.complianceReadinessScore,
        pilotReadinessScore: result.pilotReadinessScore,
        scalabilityScore: result.scalabilityScore,
        overallScore: result.overallScore,
        breakdown: result.breakdown as never,
        rationale: result.rationale,
      };
      await prisma.startupMatch.upsert({
        where: { challengeId_startupId: { challengeId: challenge.id, startupId: r.startupId } },
        create: { challengeId: challenge.id, startupId: r.startupId, status: 'SUGGESTED', ...scores },
        update: scores,
      });
    }

    if (challenge.status === 'DRAFT' || challenge.status === 'PUBLISHED') {
      await prisma.challenge.update({ where: { id: challenge.id }, data: { status: 'MATCHING' } });
    }

    const ranked = await prisma.startupMatch.findMany({
      where: { challengeId: challenge.id },
      include: { startup: { select: { displayName: true, legalName: true } } },
      orderBy: { overallScore: 'desc' },
    });
    ranked.forEach((m, i) =>
      console.log(
        `  ${i + 1}. ${(m.overallScore * 100).toFixed(0).padStart(3)}  ${
          m.startup.displayName ?? m.startup.legalName
        }`,
      ),
    );
  }

  console.log('\nNo pilot, measurement or outcome was created — those come from the workflow.');
}

main()
  .catch((e) => {
    console.error('FAILED', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
