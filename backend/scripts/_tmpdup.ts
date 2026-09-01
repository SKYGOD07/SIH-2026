import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const rows = await p.startup.findMany({ select: { id: true, legalName: true, displayName: true, sector: true, stage: true, teamSize: true, deploymentCount: true, procurementReadiness: true, pilotDurationDays: true, estimatedPilotBudget: true, city: true, state: true, industry: true, technologies: true, revenueBand: true } });
  const byLegal = new Map<string, number>(); const byDisplay = new Map<string, number>();
  rows.forEach(r => { byLegal.set(r.legalName, (byLegal.get(r.legalName)??0)+1); if(r.displayName) byDisplay.set(r.displayName, (byDisplay.get(r.displayName)??0)+1); });
  const dupLegal = [...byLegal].filter(([,n])=>n>1); const dupDisplay = [...byDisplay].filter(([,n])=>n>1);
  const nulls = {
    stage: rows.filter(r=>!r.stage).length, teamSize: rows.filter(r=>r.teamSize==null).length,
    city: rows.filter(r=>!r.city).length, state: rows.filter(r=>!r.state).length,
    industry: rows.filter(r=>!r.industry).length, deploymentCount: rows.filter(r=>r.deploymentCount==null).length,
    pilotDurationDays: rows.filter(r=>r.pilotDurationDays==null).length, budget: rows.filter(r=>r.estimatedPilotBudget==null).length,
    revenueBand: rows.filter(r=>!r.revenueBand).length, technologies: rows.filter(r=>r.technologies.length===0).length,
  };
  const stages = new Map<string,number>(); rows.forEach(r=>{const k=r.stage??'(null)'; stages.set(k,(stages.get(k)??0)+1);});
  const states = new Map<string,number>(); rows.forEach(r=>{const k=r.state??'(null)'; states.set(k,(states.get(k)??0)+1);});
  const industries = new Map<string,number>(); rows.forEach(r=>{const k=r.industry??'(null)'; industries.set(k,(industries.get(k)??0)+1);});
  const cities = new Map<string,number>(); rows.forEach(r=>{const k=r.city??'(null)'; cities.set(k,(cities.get(k)??0)+1);});
  const ready = new Map<string,number>(); rows.forEach(r=>{ready.set(r.procurementReadiness,(ready.get(r.procurementReadiness)??0)+1);});
  const tech = new Map<string,number>(); rows.forEach(r=>r.technologies.forEach(t=>tech.set(t,(tech.get(t)??0)+1)));
  console.log(JSON.stringify({ n: rows.length, dupLegal, dupDisplay, nulls,
    stages:[...stages], states:[...states], industries:[...industries].sort((a,b)=>b[1]-a[1]), cities:[...cities].sort((a,b)=>b[1]-a[1]), ready:[...ready], tech:[...tech].sort((a,b)=>b[1]-a[1]) }, null, 1));
})().catch(e=>console.error('ERR',e.message)).finally(()=>p.$disconnect());
