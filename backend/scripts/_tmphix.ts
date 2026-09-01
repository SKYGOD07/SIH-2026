import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const rows = await p.startup.findMany({
    where: { OR: [{ displayName: { in: ['CIVORA','HIX','Crop Saver','WaterManager','EnviroPlus'] } }, { stage: { notIn: ['IDEA','MVP','EARLY_REVENUE','GROWTH','SCALE'] } }, { stage: null }] },
    select: { id:true, legalName:true, displayName:true, sector:true, industry:true, stage:true, state:true, city:true, origin:true, technologies:true, capabilities:true, description:true, oneLineDescription:true, teamSize:true, revenueBand:true, deploymentCount:true, scenarioId:true },
  });
  console.log(JSON.stringify(rows, null, 1));
})().catch(e=>console.error('ERR',e.message)).finally(()=>p.$disconnect());
