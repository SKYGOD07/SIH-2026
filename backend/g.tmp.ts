import { PrismaClient } from '@prisma/client';
import { FIELD_TAXONOMY } from './src/sarthi/ai/discovery.service';
const p = new PrismaClient();
async function main(){
  const inDb = (await p.startup.groupBy({ by:['sector'], _count:true })).map(r=>r.sector);
  const inTax = FIELD_TAXONOMY.map(f=>f.field);
  const missing = inDb.filter(s=>!inTax.includes(s));
  console.log(`db fields: ${inDb.length}  taxonomy: ${inTax.length}`);
  console.log(missing.length === 0 ? 'PASS  every company field is discoverable' : `FAIL  undiscoverable: ${missing}`);
  console.log('total companies:', await p.startup.count());
}
main().finally(()=>p.$disconnect());
