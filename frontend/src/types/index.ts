export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export type UserRole = 'STARTUP' | 'GOVERNMENT' | 'PUBLIC';

export type VerificationStatus =
  | 'VERIFIED'
  | 'PENDING'
  | 'REJECTED'
  | 'EXPIRED'
  | 'IN_REVIEW'
  | 'NOT_SUBMITTED';

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
  verificationMethod: 'DPIIT_API' | 'GSTN_PORTAL' | 'MCA21_GATEWAY' | 'UDYAM_API' | 'MANUAL_REVIEW' | 'AI_OCR';
  lastVerifiedAt?: string;
  fileUrl?: string;
  fileSize?: string;
  documentHash?: string;
  remarks?: string;
}

export interface StartupProfile {
  id: string;
  name: string;
  tagline?: string;
  cin: string;
  dpiitNumber: string;
  pan: string;
  gstin: string;
  msmeUdyam?: string;
  sector: string;
  stage: 'Ideation' | 'Validation' | 'Early Traction' | 'Scaling' | 'Pilot Ready';
  location: string;
  state: string;
  foundedYear: number;
  teamSize: number;
  description: string;
  solutionSummary: string;
  website?: string;
  verificationPercentage: number;
  isPilotReady: boolean;
  verifiedAt: string;
  verificationHash: string;
  documents: DocumentItem[];
  matchedOpportunitiesCount: number;
  activePilotsCount: number;
  fundingTotalApproved: number;
  fundingTotalDisbursed: number;
  actionRequiredItems: {
    id: string;
    title: string;
    description: string;
    actionUrl?: string;
    severity: 'high' | 'medium' | 'low';
    dueDate: string;
  }[];
}

export interface GovernmentDepartment {
  id: string;
  ministry: string;
  departmentName: string;
  nodalOfficer: string;
  officerDesignation: string;
  jurisdiction: 'CENTRAL' | 'STATE';
  location: string;
  state: string;
  contactEmail: string;
}

export interface Challenge {
  id: string;
  title: string;
  department: string;
  ministry: string;
  sector: string;
  problemStatement: string;
  expectedOutcome: string;
  budgetInLakhs: number;
  location: string;
  state: string;
  deadline: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'CLOSED';
  requiredDocuments: DocumentType[];
  minimumStage: string;
  applicationsCount: number;
  shortlistedCount: number;
  aiMatchScore?: number;
  whyMatches?: string[];
  createdAt: string;
}

export interface PilotMilestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
  dueDate: string;
  completionDate?: string;
  trancheAmount: number;
  trancheStatus: 'RELEASED' | 'PENDING' | 'LOCKED';
  utilizationCertificateUrl?: string;
}

export interface Pilot {
  id: string;
  title: string;
  challengeId?: string;
  startupId: string;
  startupName: string;
  departmentName: string;
  ministry: string;
  sector: string;
  progressPercentage: number;
  status: 'ACTIVE' | 'EVALUATION' | 'SUCCESSFUL' | 'PROCURED';
  startDate: string;
  targetCompletionDate: string;
  fundingTotal: number;
  fundingDisbursed: number;
  fundingPending: number;
  currentMilestoneIndex: number;
  milestones: PilotMilestone[];
  procurementRecommended: boolean;
  gemProductId?: string;
}

export interface PlatformStats {
  totalStartups: number;
  verifiedStartups: number;
  verificationRate: number;
  activePilots: number;
  completedPilots: number;
  totalGrantDisbursedInCr: number;
  activeChallenges: number;
  procuredSolutionsCount: number;
}
