import { discoverStartups } from './src/sarthi/ai/discovery.service';
async function main(){
  for (const f of ['municipal-waste-management','agri-fintech-health']) {
    const r = await discoverStartups({ field: f, limit: 6 });
    console.log(`\n${f}: total=${r.total} shown=${r.shown} hasMore=${r.hasMore}`);
    r.startups.forEach(s=>console.log(`   ${(s.displayName??s.legalName).padEnd(30)} ${String(s.documentCount).padStart(2)} docs  ${s.dossier}`));
  }
}
main().catch(e=>{console.error(e);process.exitCode=1});
