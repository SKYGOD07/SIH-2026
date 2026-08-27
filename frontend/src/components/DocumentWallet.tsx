'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Upload,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
  Download,
  Eye,
  Building,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DocumentItem, DocumentType } from '@/types';
import { formatDate } from '@/utils/formatters';

interface DocumentWalletProps {
  documents: DocumentItem[];
  startupName?: string;
  className?: string;
}

export function DocumentWallet({
  documents,
  startupName = 'EcoSense AI Technologies',
  className = '',
}: DocumentWalletProps) {
  const [docList, setDocList] = useState<DocumentItem[]>(documents);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');

  const verifiedCount = docList.filter((d) => d.verificationStatus === 'VERIFIED').length;
  const pendingCount = docList.filter((d) => d.verificationStatus !== 'VERIFIED').length;

  const filteredDocs = docList.filter((d) => {
    if (filterType === 'VERIFIED') return d.verificationStatus === 'VERIFIED';
    if (filterType === 'PENDING') return d.verificationStatus !== 'VERIFIED';
    return true;
  });

  const handleSimulateUpload = () => {
    setUploading(true);
    setTimeout(() => {
      const newDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        type: 'COMPLIANCE_DECLARATION',
        title: 'GeM Innovation Compliance Undertaking (Form 3A)',
        issuingAuthority: 'Self-Certified Board Undertaking',
        issueDate: new Date().toISOString().split('T')[0],
        verificationStatus: 'IN_REVIEW',
        verificationMethod: 'AI_OCR',
        lastVerifiedAt: new Date().toISOString().split('T')[0],
        fileSize: '1.1 MB',
        remarks: 'Uploaded document undergoing AI verification against DPIIT guidelines',
      };
      setDocList([newDoc, ...docList]);
      setUploading(false);
    }, 1000);
  };

  const getAuthorityBadge = (method: string) => {
    switch (method) {
      case 'DPIIT_API':
        return 'DPIIT Central Registry';
      case 'GSTN_PORTAL':
        return 'GSTN Gateway API';
      case 'MCA21_GATEWAY':
        return 'MCA21 Corporate Registry';
      case 'UDYAM_API':
        return 'Ministry of MSME API';
      case 'AI_OCR':
        return 'AI Extraction & OCR';
      default:
        return 'Manual Nodal Review';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Vault Header */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 shadow-gov relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-govblue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Lock className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                Zero-Paperwork Digital Vault
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Document Wallet & Credential Vault
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Tamper-proof digital certificates connected to Digilocker, DPIIT, MCA21, and GSTN gateways.
              Uploaded documents undergo automated cryptographic verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-navy-950/80 border border-navy-700/80 px-4 py-2.5 rounded-xl text-center">
              <div className="text-xl font-extrabold text-emerald-400 font-mono">{verifiedCount}</div>
              <div className="text-[11px] text-slate-400 font-medium">Verified Credentials</div>
            </div>
            <div className="bg-navy-950/80 border border-navy-700/80 px-4 py-2.5 rounded-xl text-center">
              <div className="text-xl font-extrabold text-amber-400 font-mono">{pendingCount}</div>
              <div className="text-[11px] text-slate-400 font-medium">Under Review</div>
            </div>
            <Button
              onClick={handleSimulateUpload}
              disabled={uploading}
              className="bg-govblue-600 hover:bg-govblue-500 text-white font-semibold text-xs h-11 px-4 gap-2 rounded-xl"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Uploading & Verifying...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload New Document</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Verification Clarification Note */}
        <div className="mt-4 pt-4 border-t border-navy-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>
              <strong>Rule of Law:</strong> Uploaded does not mean verified. Certificates require real-time statutory gateway validation.
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Vault Hash: SHA256:4a8b...199c
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'ALL'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-slate-600 hover:text-navy-900'
            }`}
          >
            All Documents ({docList.length})
          </button>
          <button
            onClick={() => setFilterType('VERIFIED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'VERIFIED'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-navy-900'
            }`}
          >
            🟢 Verified ({verifiedCount})
          </button>
          <button
            onClick={() => setFilterType('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'PENDING'
                ? 'bg-white text-amber-800 shadow-sm'
                : 'text-slate-600 hover:text-navy-900'
            }`}
          >
            🟡 In Review / Pending ({pendingCount})
          </button>
        </div>
      </div>

      {/* Documents Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map((doc) => {
          const isVerified = doc.verificationStatus === 'VERIFIED';
          return (
            <Card
              key={doc.id}
              className={`p-5 rounded-2xl border transition-all duration-200 hover:shadow-card-hover ${
                isVerified ? 'border-slate-200 bg-white' : 'border-amber-200/80 bg-amber-50/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      isVerified
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy-900 leading-snug">
                      {doc.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{doc.issuingAuthority}</p>
                  </div>
                </div>
                <StatusBadge status={doc.verificationStatus} size="sm" />
              </div>

              {/* Document Details Metadata */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Verification Source</span>
                  <span className="font-semibold text-navy-900 font-mono text-[11px]">
                    {getAuthorityBadge(doc.verificationMethod)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Issue / Verify Date</span>
                  <span className="font-medium text-slate-700 text-[11px]">
                    {doc.lastVerifiedAt ? formatDate(doc.lastVerifiedAt) : formatDate(doc.issueDate)}
                  </span>
                </div>
              </div>

              {doc.remarks && (
                <div className="mt-3 p-2 rounded-lg bg-slate-50 border border-slate-200/60 text-[11px] text-slate-600 flex items-start gap-1.5">
                  <span className="font-bold text-slate-700">Audit Note:</span>
                  <span className="line-clamp-1">{doc.remarks}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-mono text-slate-400">
                  {doc.fileSize || 'PDF • Signed'}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={() => setSelectedDoc(doc)}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-govblue-600 hover:text-govblue-700 hover:bg-govblue-50 h-7 px-2.5 font-semibold"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Inspect Details
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Inspection Modal for Document */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-navy-900">Credential Verification Details</h3>
              </div>
              <StatusBadge status={selectedDoc.verificationStatus} size="sm" />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium block">Document Title</label>
                <div className="font-bold text-navy-900 text-sm">{selectedDoc.title}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block">Issuing Authority</label>
                  <div className="font-semibold text-slate-800">{selectedDoc.issuingAuthority}</div>
                </div>
                <div>
                  <label className="text-slate-400 font-medium block">Validation Source</label>
                  <div className="font-mono font-semibold text-govblue-700">{getAuthorityBadge(selectedDoc.verificationMethod)}</div>
                </div>
                <div>
                  <label className="text-slate-400 font-medium block">Issue Date</label>
                  <div className="font-medium text-slate-700">{formatDate(selectedDoc.issueDate)}</div>
                </div>
                <div>
                  <label className="text-slate-400 font-medium block">Last Verified Date</label>
                  <div className="font-medium text-slate-700">
                    {selectedDoc.lastVerifiedAt ? formatDate(selectedDoc.lastVerifiedAt) : 'Pending'}
                  </div>
                </div>
              </div>

              {selectedDoc.remarks && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-navy-900 text-[11px] mb-0.5">Statutory Audit Verification Summary:</div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{selectedDoc.remarks}</p>
                </div>
              )}

              <div className="p-3 bg-navy-900 text-white rounded-xl text-[11px] font-mono space-y-1">
                <div className="text-slate-400">Cryptographic Signature Digest:</div>
                <div className="text-emerald-400 break-all">
                  {selectedDoc.documentHash || 'SHA256:7f10b2e8a34d89a710e20b991823a749102c84918e'}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                onClick={() => setSelectedDoc(null)}
                variant="outline"
                size="sm"
                className="font-semibold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
