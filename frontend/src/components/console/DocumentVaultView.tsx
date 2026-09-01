'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Pill, Tile } from '@/components/console/primitives';
import { Icon } from '@/components/console/Icon';
import { cn } from '@/lib/utils';
import type { DocumentItem } from '@/lib/api/workflow';

interface Props {
  startupId: string;
  companyName: string;
  documents: DocumentItem[];
}

const CATEGORIES = [
  { key: 'ALL', label: 'All Files' },
  { key: 'CORPORATE_LEGAL', label: 'Corporate & Legal' },
  { key: 'GOVERNMENT_FUNDING', label: 'Gov Funding' },
  { key: 'FINANCIAL', label: 'Financials' },
  { key: 'COMPLIANCE', label: 'Compliance' },
  { key: 'TECHNOLOGY', label: 'Technology' },
  { key: 'PILOT', label: 'Pilot Plan' },
  { key: 'AI_GOVERNANCE', label: 'AI Governance' },
  { key: 'OWNERSHIP', label: 'IP Ownership' },
  { key: 'KYC', label: 'KYC & AML' },
  { key: 'CHECKLIST', label: 'Checklists' },
];

export function DocumentVaultView({ startupId, companyName, documents }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);

  const filteredDocs =
    selectedCategory === 'ALL'
      ? documents
      : documents.filter((d) => d.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-chalk/[0.08]">
        {CATEGORIES.map((cat) => {
          const count =
            cat.key === 'ALL'
              ? documents.length
              : documents.filter((d) => d.category === cat.key).length;

          const isActive = selectedCategory === cat.key;

          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.08em] transition-all',
                isActive
                  ? 'bg-signal text-void shadow'
                  : 'bg-chalk/[0.06] text-chalk/70 hover:bg-chalk/10 hover:text-chalk',
              )}
            >
              <span>{cat.label}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 font-mono text-[0.5625rem]',
                  isActive ? 'bg-void/20 text-void' : 'bg-chalk/10 text-chalk/50',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Document cards list */}
      {filteredDocs.length === 0 ? (
        <Card className="py-12 text-center">
          <Icon name="file" className="mx-auto h-8 w-8 text-chalk/30 mb-2" />
          <p className="font-display text-[0.875rem] font-bold text-chalk/70">
            No documents in this category
          </p>
          <p className="mt-1 text-[0.78125rem] text-chalk/40">
            Select another filter or view all files.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filteredDocs.map((doc) => (
            <Card
              key={doc.id}
              interactive
              className="flex flex-col justify-between p-4 cursor-pointer group"
              onClick={() => setActiveDoc(doc)}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Tile icon="file" tone="signal" />
                  <Pill tone="signal">DEMO</Pill>
                </div>

                <h4 className="font-display text-[0.875rem] font-bold text-chalk group-hover:text-signal transition-colors line-clamp-2">
                  {doc.title}
                </h4>

                <span className="mt-2 inline-block font-mono text-[0.625rem] uppercase tracking-[0.1em] text-chalk/40">
                  {doc.category.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-chalk/[0.08] flex items-center justify-between">
                <span className="font-mono text-[0.625rem] text-chalk/40 truncate max-w-[150px]">
                  {doc.originalPath ? doc.originalPath.split('/').pop() : 'Document'}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[0.625rem] font-bold text-signal uppercase tracking-wider">
                  View <Icon name="upRight" className="h-3 w-3" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Document Viewer Modal */}
      {activeDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm p-4">
          <div className="card w-full max-w-2xl max-h-[85vh] flex flex-col p-6 bg-void-soft border-chalk/20 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-chalk/[0.1]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Pill tone="signal">DEMO DOCUMENT</Pill>
                  <span className="font-mono text-[0.625rem] uppercase tracking-wider text-chalk/40">
                    {activeDoc.category.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="font-display text-[1.125rem] font-extrabold text-chalk">
                  {activeDoc.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveDoc(null)}
                className="rounded-lg p-1.5 text-chalk/50 hover:bg-chalk/10 hover:text-chalk transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Metadata */}
            <div className="py-3 border-b border-chalk/[0.06] text-[0.75rem] font-mono text-chalk/50 grid grid-cols-2 gap-2">
              <div>
                <span className="text-chalk/30">File Reference: </span>
                {activeDoc.originalPath || 'Simulated Document'}
              </div>
              <div>
                <span className="text-chalk/30">Hash: </span>
                {activeDoc.fileHash ? activeDoc.fileHash.slice(0, 16) : 'N/A'}
              </div>
            </div>

            {/* Extracted Content Viewer */}
            <div className="flex-1 overflow-y-auto my-4 p-4 rounded-lg bg-void/60 border border-chalk/[0.08]">
              <h5 className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-chalk/40 mb-2">
                Extracted Document Content
              </h5>
              {activeDoc.extractedText ? (
                <div className="text-[0.8125rem] leading-relaxed text-chalk/80 whitespace-pre-wrap font-sans">
                  {activeDoc.extractedText}
                </div>
              ) : (
                <p className="text-[0.78125rem] italic text-chalk/40">
                  Binary document record. Full text extraction stored in dossier.
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-chalk/[0.1] flex items-center justify-between">
              <span className="text-[0.71875rem] text-chalk/40">
                Origin: DEMO Simulation — Sarthi Hackathon Pack
              </span>
              <button
                onClick={() => setActiveDoc(null)}
                className="rounded-lg bg-chalk/10 px-4 py-2 font-mono text-[0.6875rem] font-bold uppercase tracking-wider text-chalk hover:bg-chalk/20 transition-colors"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
