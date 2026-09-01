import { PrismaClient, UserRole } from '@prisma/client';
import { companyReport, governmentDossier } from './src/workflow/company.service';
const p = new PrismaClient();
async function main(){
  const gov = await p.userProfile.findFirstOrThrow({ where:{ role: UserRole.GOVERNMENT_OFFICER }});
  const featured = await p.startup.findFirstOrThrow({ where:{ legalName:{ contains:'CIVORA' }}});
  const synth = await p.startup.findFirstOrThrow({ where:{ legalName:{ contains:'Punarva' }}});
  for (const [tag, s] of [['FEATURED', featured], ['SYNTHETIC', synth]] as const) {
    for (const [name, fn] of [['report', companyReport], ['dossier', governmentDossier]] as const) {
      try { await fn(gov, s.id); console.log(`PASS  ${tag.padEnd(10)} ${name}`); }
      catch(e){ console.log(`FAIL  ${tag.padEnd(10)} ${name}: ${(e as Error).message.slice(0,90)}`); }
    }
  }
}
main().finally(()=>p.$disconnect());
