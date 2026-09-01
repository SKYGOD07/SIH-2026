import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const total = await p.startup.count();
  const byOrigin = await p.startup.groupBy({ by: ['origin'], _count: true });
  const bySector = await p.startup.groupBy({ by: ['sector'], _count: true });
  const scenarios = await p.simulationScenario.findMany({ select: { id: true, name: true, status: true } });
  const team = await p.startup.findMany({
    where: { displayName: { in: ['CIVORA', 'HIX', 'Crop Saver', 'WaterManager', 'EnviroPlus'] } },
    select: { id: true, legalName: true, displayName: true, sector: true, origin: true, scenarioId: true,
      _count: { select: { documents: true, responses: true, matches: true, pilots: true, participations: true, fundingRounds: true } } },
  });
  const docs = await p.startupDocument.count();
  const challenges = await p.challenge.count();
  const responses = await p.challengeResponse.count();
  const matches = await p.startupMatch.count();
  const programs = await p.governmentProgram.count();
  const parts = await p.startupProgramParticipation.count();
  const funding = await p.fundingRound.count();
  const pilots = await p.pilot.count();
  const users = await p.userProfile.count();
  console.log(JSON.stringify({ total, byOrigin, sectorCount: bySector.length, bySector: bySector.sort((a,b)=>b._count-a._count), scenarios, team, docs, challenges, responses, matches, programs, parts, funding, pilots, users }, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exitCode = 1; }).finally(() => p.$disconnect());
