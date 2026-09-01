import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const ch = await p.challenge.findMany({ select: { id: true, title: true, status: true, origin: true, scenarioId: true, ownerUserId: true, domain: true, department: true, _count: { select: { responses: true, matches: true } } } });
  const one = await p.challenge.findUnique({ where: { id: 'e5f65219-afb7-4c94-8655-34aa9eb4764f' } });
  const users = await p.userProfile.findMany({ select: { id: true, email: true, role: true, displayName: true, startupId: true, departmentName: true } });
  const docsCat = await p.startupDocument.groupBy({ by: ['category'], _count: true });
  const docKinds = await p.document.groupBy({ by: ['kind','origin'], _count: true });
  console.log(JSON.stringify({ ch, oneExists: !!one, users, docsCat, docKinds }, null, 1));
})().catch(e=>console.error('ERR',e.message)).finally(()=>p.$disconnect());
