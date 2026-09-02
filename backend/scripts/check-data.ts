import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  // Check team companies
  const companies = await p.startup.findMany({
    where: {
      legalName: {
        in: [
          'EnviroPlus Environmental Systems Private Limited',
          'Rakshak Innovations Private Limited',
          'CIVORA Technologies Private Limited',
          'Crop Saver Agritech Private Limited',
          'WaterManager Utilities Private Limited',
          'HIX Health & FinTech Solutions Private Limited',
          'Chalan Solutions Private Limited',
        ],
      },
    },
    select: { id: true, legalName: true, displayName: true },
  });
  console.log('=== COMPANIES ===');
  console.log(JSON.stringify(companies, null, 2));

  // Check user profiles  
  const profiles = await p.userProfile.findMany({
    where: {
      email: {
        in: [
          'Suhanigoyal856@gmail.com',
          'mohammadhaaris791@gmail.com',
          'pathaniqra303@gmail.com',
          'sr5937424@gmail.com',
          'heoric361004@gmail.com',
        ],
      },
    },
    select: { id: true, email: true, role: true, startupId: true },
  });
  console.log('\n=== USER PROFILES ===');
  console.log(JSON.stringify(profiles, null, 2));

  // Count total startups
  const count = await p.startup.count();
  console.log(`\nTotal startups: ${count}`);

  await p.$disconnect();
}

main().catch(console.error);
