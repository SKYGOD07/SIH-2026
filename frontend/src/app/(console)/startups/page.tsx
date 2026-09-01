import type { Metadata } from 'next';
import Link from 'next/link';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { Card, Pill, SectionHead, Tile } from '@/components/console/primitives';
import { Icon } from '@/components/console/Icon';
import { fetchDashboard } from '@/lib/api/sarthi';

export const metadata: Metadata = {
  title: 'Startups Register',
  description: 'Simulated startup companies, evidence dossiers, and claimable demonstration accounts.',
};

export const dynamic = 'force-dynamic';

interface StartupItem {
  id: string;
  legalName: string;
  displayName: string | null;
  sector: string;
  oneLineDescription: string | null;
  origin: string;
  hasDocuments: boolean;
  documentCount: number;
}

let BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:5000';
if (!BASE.endsWith('/api')) {
  BASE = `${BASE}/api`;
}

async function fetchStartups(): Promise<StartupItem[]> {
  try {
    const res = await fetch(`${BASE}/workflow/scenarios`, { cache: 'no-store' });
    if (!res.ok) return [];
    const body = await res.json();
    const scenarios = body?.data ?? [];
    const demoScenario = scenarios.find((s: { name: string }) =>
      s.name.includes('SIH 2026'),
    ) || scenarios[0];

    if (!demoScenario?.id) return [];

    const resClaim = await fetch(`${BASE}/workflow/company/claimable/${demoScenario.id}`, {
      cache: 'no-store',
    });
    if (!resClaim.ok) return [];
    const claimBody = await resClaim.json();
    const items = claimBody?.data ?? [];

    return items.map((item: { id: string; legalName: string; sector: string; oneLineDescription: string | null }) => ({
      id: item.id,
      legalName: item.legalName,
      displayName: item.legalName.includes('CIVORA') ? 'CIVORA' : item.legalName.includes('HIX') ? 'HIX' : item.legalName.split(' ')[0],
      sector: item.sector,
      oneLineDescription: item.oneLineDescription,
      origin: 'DEMO',
      hasDocuments: item.legalName.includes('CIVORA') || item.legalName.includes('HIX'),
      documentCount: item.legalName.includes('CIVORA') ? 33 : item.legalName.includes('HIX') ? 33 : 0,
    }));
  } catch {
    return [];
  }
}

export default async function StartupsPage() {
  const { source } = await fetchDashboard();
  const startups = await fetchStartups();

  return (
    <>
      <ConsoleHeader
        title="Startups Register"
        subtitle="Registered Startups"
        source={source}
      />

      <section aria-label="Registered Companies">
        <SectionHead
          title="Registered Startups"
          meta={`${startups.length} Registered Companies`}
        />

        {startups.length === 0 ? (
          <Card className="py-12 text-center">
            <Icon name="alert" className="mx-auto h-8 w-8 text-risk mb-2" />
            <p className="font-display text-[0.875rem] font-bold text-chalk">
              No startups discovered
            </p>
            <p className="mt-1 text-[0.78125rem] text-chalk/50">
              Run <code className="font-mono text-signal">npm run demo:seed</code> in backend to ingest registered startups.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {startups.map((s) => (
              <Card key={s.id} interactive className="flex flex-col justify-between p-5">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-chalk/40">
                      {s.sector}
                    </span>
                  </div>

                  <h3 className="font-display text-[1.0625rem] font-extrabold text-chalk">
                    {s.displayName || s.legalName}
                  </h3>

                  <p className="mt-2 text-[0.78125rem] leading-relaxed text-chalk/60 line-clamp-2">
                    {s.oneLineDescription || s.legalName}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-chalk/[0.08] flex items-center justify-between">
                  <span className="font-mono text-[0.6875rem] text-chalk/50">
                    {s.hasDocuments ? `${s.documentCount} Evidenced Files` : 'Light Profile'}
                  </span>

                  <Link
                    href={`/startups/${s.id}`}
                    className="inline-flex items-center gap-1 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-signal hover:text-signal/80 transition-colors"
                  >
                    View Dossier <Icon name="upRight" className="h-3 w-3" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
