import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const rows = await p.$queryRawUnsafe(`select migration_name, finished_at, rolled_back_at from _prisma_migrations order by started_at`);
  console.log(rows);
  const views = await p.$queryRawUnsafe(`select table_name from information_schema.views where table_schema='public'`);
  console.log('views:', views);
})().catch(e=>console.error('ERR', e.message)).finally(()=>p.$disconnect());
