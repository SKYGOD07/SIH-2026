import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.startup.count().then(async n=>{
  const names = await p.startup.findMany({ select:{legalName:true}, orderBy:{legalName:'asc'}, take:3 });
  console.log(`${process.argv[2]}  startups=${n}  first=${names.map(x=>x.legalName.slice(0,22)).join(' | ')}`);
}).finally(()=>p.$disconnect());
