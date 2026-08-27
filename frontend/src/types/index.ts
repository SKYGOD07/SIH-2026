export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export type UserRole = 'STARTUP' | 'GOVERNMENT' | 'ADMIN';

export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'REJECTED' | 'EXPIRED';

export type DocumentType =
  | 'DPIIT_CERTIFICATE'
  | 'GST_CERTIFICATE'
  | 'PAN_CARD'
  | 'INCORPORATION_CERTIFICATE'
  | 'MSME_UDYAM'
  | 'DPR_PROPOSAL'
  | 'AUDITED_FINANCIALS'
  | 'COMPLIANCE_DECLARATION';

export interface DocumentItem {
  id: string;
  type: DocumentType;
  title: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate?: string;
  verificationStatus: VerificationStatus;
  verificationMethod: string;
  lastVerifiedAt?: string;
  fileUrl?: string;
}

export interface StartupProfile {
  id: string;
  name: string;
  cin: string;
  dpiitNumber: string;
  pan: string;
  gstin: string;
  sector: string;
  stage: string;
  location: string;
  description: string;
  website?: string;
  verificationPercentage: number;
  documents: DocumentItem[];
}

export interface GovernmentDepartment {
  id: string;
  ministry: string;
  departmentName: string;
  nodalOfficer: string;
  jurisdiction: 'CENTRAL' | 'STATE';
  location: string;
}

export interface Challenge {
  id: string;
  title: string;
  department: string;
  ministry: string;
  sector: string;
  problemStatement: string;
  budgetInLakhs: number;
  location: string;
  deadline: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'CLOSED';
  requiredDocuments: DocumentType[];
  minimumStage: string;
}

export interface Pilot {
  id: string;
  title: string;
  startupName: string;
  departmentName: string;
  progressPercentage: number;
  status: 'ACTIVE' | 'EVALUATION' | 'SUCCESSFUL' | 'PROCURED';
  milestones: {
    title: string;
    completed: boolean;
    dueDate: string;
  }[];
  fundingTotal: number;
  fundingDisbursed: number;
}
