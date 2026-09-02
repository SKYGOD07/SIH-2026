import { PrismaClient, UserRole } from '@prisma/client';
import { FIELD_TAXONOMY, browsableFields, discoverStartups, compareStartups } from './src/sarthi/ai/discovery.service';
import { companyReport, governmentDossier } from './src/workflow/company.service';
const p = new PrismaClient();
const ok = (n:string,c:boolean,d='')=>console.log(`${c?'PASS':'FAIL'}  ${n}${d?'  — '+d:''}`);

async function main(){
  const total = await p.startup.count();
  ok('all companies are DEMO', (await p.startup.count({where:{origin:'DEMO'}}))===total, `${total} rows`);
  ok('none marked VERIFIED', (await p.startup.count({where:{origin:'VERIFIED'}}))===0);

  const dbFields = (await p.startup.groupBy({by:['sector'],_count:true})).map(r=>r.sector);
  const tax = FIELD_TAXONOMY.map(f=>f.field);
  ok('every field discoverable', dbFields.every(f=>tax.includes(f)), `${dbFields.length} db fields`);
  ok('browsable fields resolve', (await browsableFields()).length>=dbFields.length-1);

  const page1 = await discoverStartups({ field:'water-distribution', limit:24, offset:0 });
  const page2 = await discoverStartups({ field:'water-distribution', limit:24, offset:24 });
  ok('server pagination', page1.shown<=24 && page1.total>page1.shown && page2.offset===24,
     `total=${page1.total} page1=${page1.shown} page2=${page2.shown}`);
  ok('total is a count query, not page length', page1.total !== page1.shown);

  const sorted = await discoverStartups({ field:'water-distribution', sort:'name', limit:5 });
  const names = sorted.startups.map(s=>s.legalName);
  ok('server sorting', [...names].sort().join()===names.join());

  const filtered = await discoverStartups({ field:'water-distribution', cybersecurityProvided:true, limit:60 });
  ok('server filtering narrows', filtered.total <= page1.total, `${page1.total} -> ${filtered.total}`);

  // dossier states
  const civora = await p.startup.findFirstOrThrow({ where:{legalName:{contains:'CIVORA'}}, include:{_count:{select:{documents:true}}}});
  const hix = await p.startup.findFirstOrThrow({ where:{legalName:{contains:'HIX'}}, include:{_count:{select:{documents:true}}}});
  ok('CIVORA document count from DB', civora._count.documents>0, `${civora._count.documents} docs`);
  ok('HIX document count from DB', hix._count.documents>0, `${hix._count.documents} docs`);
  const noDocs = await p.startup.findFirst({ where:{ documents:{none:{}} }});
  if (noDocs) {
    const d = await discoverStartups({ field: noDocs.sector, limit:60 });
    const row = d.startups.find(s=>s.id===noDocs.id);
    ok('doc-less company reports METADATA_ONLY', row?.dossier==='METADATA_ONLY', row?.dossier ?? 'not in page');
  } else ok('doc-less company reports METADATA_ONLY', true, 'none without docs');

  // every company has a reachable dossier
  const gov = await p.userProfile.findFirstOrThrow({ where:{ role: UserRole.GOVERNMENT_OFFICER }});
  const sample = await p.startup.findMany({ take:12, orderBy:{legalName:'asc'} });
  let good = 0;
  for (const s of sample) { try { await companyReport(gov, s.id); await governmentDossier(gov, s.id); good++; } catch {} }
  ok('sampled dossiers all reachable', good===sample.length, `${good}/${sample.length}`);

  // comparison
  const four = (await p.startup.findMany({ where:{sector:'water-distribution'}, take:4 })).map(x=>x.id);
  const cmp = await compareStartups(four);
  ok('comparison 2–5 works', cmp.startups.length===4 && cmp.top2.length===2);
  let refused=0;
  try{ await compareStartups([four[0]]);}catch{refused++;}
  try{ await compareStartups([...four,...four]);}catch{refused++;}
  ok('comparison bounds enforced', refused===2);

  // provenance isolation
  const demoChallenges = await p.challenge.count({ where:{ origin:'DEMO' }});
  ok('demo challenges labelled', demoChallenges>0, `${demoChallenges} DEMO challenges`);
}
main().finally(()=>p.$disconnect());
