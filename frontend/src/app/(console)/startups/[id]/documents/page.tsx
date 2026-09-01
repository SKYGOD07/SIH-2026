import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { DocumentVaultView } from '@/components/console/DocumentVaultView';
import { fetchCompanyDossier, fetchCompanyDocuments } from '@/lib/api/workflow';

export const metadata: Metadata = {
  title: 'Document Vault',
  description: 'Categorized document vault and evidence dossier for startup evaluation.',
};

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentVaultPage({ params }: PageProps) {
  const { id } = await params;
  const dossier = await fetchCompanyDossier(id);

  if (!dossier) {
    notFound();
  }

  const documents = await fetchCompanyDocuments(id);

  return (
    <>
      <div className="flex items-center justify-between">
        <Link
          href={`/startups/${id}`}
          className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-chalk/45 transition-colors hover:text-chalk"
        >
          ← Back to Company Analysis
        </Link>
      </div>

      <ConsoleHeader
        title={`Document Vault — ${dossier.company.displayName || dossier.company.legalName}`}
        subtitle={`${documents.length} Evidenced Files · Categorized Dossier`}
      />

      <DocumentVaultView
        startupId={id}
        companyName={dossier.company.displayName || dossier.company.legalName}
        documents={documents}
      />
    </>
  );
}
