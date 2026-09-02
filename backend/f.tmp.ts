import { PrismaClient, UserRole } from '@prisma/client';
import { companyReport, governmentDossier } from './src/workflow/company.service';
const p = new PrismaClient();
async function main(){
  const gov = await p.userProfile.findFirstOrThrow({ where:{ role: UserRole.GOVERNMENT_OFFICER }});
  const sample = await p.startup.findMany({ take:12, orderBy:{legalName:'asc'} });
  for (const s of sample) {
    for (const [n,fn] of [['report',companyReport],['dossier',governmentDossier]] as const) {
      try { await fn(gov, s.id); }
      catch(e){ console.log(`FAIL ${n.padEnd(8)} ${s.legalName.slice(0,42).padEnd(43)} ${(e as Error).message.slice(0,110)}`); }
    }
  }
  console.log('done');
}
main().finally(()=>p.$disconnect());
