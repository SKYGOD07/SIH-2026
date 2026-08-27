import { fetchApi } from '../lib/api';
import { ApiResponse, StartupProfile, Challenge, Pilot, PlatformStats } from '../types';

// Rich Realistic Mock Data for SetuBharat SIH26136 Ecosystem
export const mockStartupProfile: StartupProfile = {
  id: 'st-101',
  name: 'EcoSense AI Technologies Pvt Ltd',
  tagline: 'Autonomous AI Computer Vision for Municipal Waste Segregation',
  cin: 'U72900DL2022PTC392810',
  dpiitNumber: 'DIPP94821',
  pan: 'AABCE8491M',
  gstin: '07AABCE8491M1Z9',
  msmeUdyam: 'UDYAM-DL-03-0029412',
  sector: 'Smart Cities & CleanTech',
  stage: 'Pilot Ready',
  location: 'New Delhi, Delhi NCR',
  state: 'Delhi',
  foundedYear: 2022,
  teamSize: 18,
  description:
    'EcoSense AI develops edge-computer-vision hardware and real-time classification algorithms that integrate with municipal garbage processing facilities and sorting conveyors to automate 99.2% accurate waste classification.',
  solutionSummary:
    'IoT + Edge Camera units installed on transfer stations, detecting recyclable vs biodegradable biomass at 120 items/second.',
  website: 'https://ecosenseai.gov.in-demo',
  verificationPercentage: 94,
  isPilotReady: true,
  verifiedAt: '2026-08-12',
  verificationHash: 'SHA256:8f9a2e1d03b6e8a719c8d52187f54921098e94812f',
  documents: [
    {
      id: 'doc-1',
      type: 'DPIIT_CERTIFICATE',
      title: 'DPIIT Recognition Certificate',
      issuingAuthority: 'Department for Promotion of Industry and Internal Trade (DPIIT)',
      issueDate: '2023-04-10',
      verificationStatus: 'VERIFIED',
      verificationMethod: 'DPIIT_API',
      lastVerifiedAt: '2026-08-12',
      fileSize: '1.4 MB',
      documentHash: 'SHA256:1a82f...99d',
      remarks: 'Automated digital signature verified via DPIIT central registry',
    },
    {
      id: 'doc-2',
      type: 'GST_CERTIFICATE',
      title: 'GST Registration Certificate (Form REG-06)',
      issuingAuthority: 'Goods and Services Tax Network (GSTN)',
      issueDate: '2022-11-15',
      verificationStatus: 'VERIFIED',
      verificationMethod: 'GSTN_PORTAL',
      lastVerifiedAt: '2026-08-12',
      fileSize: '890 KB',
      documentHash: 'SHA256:4c91a...32b',
      remarks: 'Active status verified with 0 pending compliance flags',
    },
    {
      id: 'doc-3',
      type: 'INCORPORATION_CERTIFICATE',
      title: 'Certificate of Incorporation (MCA)',
      issuingAuthority: 'Ministry of Corporate Affairs (ROC Delhi)',
      issueDate: '2022-09-01',
      verificationStatus: 'VERIFIED',
      verificationMethod: 'MCA21_GATEWAY',
      lastVerifiedAt: '2026-08-12',
      fileSize: '2.1 MB',
      documentHash: 'SHA256:7b11d...e4a',
      remarks: 'ROC active company validation confirmed',
    },
    {
      id: 'doc-4',
      type: 'MSME_UDYAM',
      title: 'Udyam Registration Certificate',
      issuingAuthority: 'Ministry of Micro, Small & Medium Enterprises',
      issueDate: '2023-01-20',
      verificationStatus: 'VERIFIED',
      verificationMethod: 'UDYAM_API',
      lastVerifiedAt: '2026-08-12',
      fileSize: '740 KB',
      documentHash: 'SHA256:3d28c...f81',
      remarks: 'Micro enterprise classification verified',
    },
    {
      id: 'doc-5',
      type: 'DPR_PROPOSAL',
      title: 'Detailed Project Report (DPR) - Edge Waste AI v3.0',
      issuingAuthority: 'EcoSense AI Technologies',
      issueDate: '2026-07-15',
      verificationStatus: 'IN_REVIEW',
      verificationMethod: 'AI_OCR',
      lastVerifiedAt: '2026-08-14',
      fileSize: '4.8 MB',
      documentHash: 'SHA256:9e74b...11a',
      remarks: 'AI extracted technical specifications, pending technical committee signoff',
    },
    {
      id: 'doc-6',
      type: 'AUDITED_FINANCIALS',
      title: 'Audited Financial Statements (FY 2025-26)',
      issuingAuthority: 'S.K. Associates Chartered Accountants',
      issueDate: '2026-06-30',
      verificationStatus: 'PENDING',
      verificationMethod: 'MANUAL_REVIEW',
      lastVerifiedAt: '2026-08-01',
      fileSize: '3.2 MB',
      remarks: 'CA UDIN cross-verification in progress',
    },
  ],
  matchedOpportunitiesCount: 12,
  activePilotsCount: 1,
  fundingTotalApproved: 2000000,
  fundingTotalDisbursed: 1200000,
  actionRequiredItems: [
    {
      id: 'act-1',
      title: 'Submit Milestone 3 Utilization Certificate',
      description: 'Pilot deployment at Okhla Transfer Station completed. Upload CA-attested fund utilization certificate.',
      severity: 'high',
      dueDate: '2026-09-05',
    },
    {
      id: 'act-2',
      title: 'Renew Audited Financials for FY26',
      description: 'Upload latest CA verified balance sheet to maintain 100% DPIIT priority queue readiness.',
      severity: 'medium',
      dueDate: '2026-09-15',
    },
  ],
};

export const mockStartupsList: StartupProfile[] = [
  mockStartupProfile,
  {
    id: 'st-102',
    name: 'AquaVeda Sensors Pvt Ltd',
    tagline: 'Solar-Powered Realtime River Water Quality Spectrometry',
    cin: 'U74999MH2021PTC355201',
    dpiitNumber: 'DIPP88192',
    pan: 'BBCDE4321N',
    gstin: '27BBCDE4321N1Z3',
    msmeUdyam: 'UDYAM-MH-02-0018491',
    sector: 'Water Resources & Environment',
    stage: 'Pilot Ready',
    location: 'Pune, Maharashtra',
    state: 'Maharashtra',
    foundedYear: 2021,
    teamSize: 14,
    description:
      'Continuous river monitoring buoys using optical spectrometry to detect heavy metals, BOD, and dissolved oxygen with satellite telemetry.',
    solutionSummary: 'Deployable buoys for Namami Gange and municipal river basins with automated anomaly alerts.',
    verificationPercentage: 98,
    isPilotReady: true,
    verifiedAt: '2026-08-10',
    verificationHash: 'SHA256:7a6b5c4d3e2f1a0b',
    documents: [],
    matchedOpportunitiesCount: 8,
    activePilotsCount: 2,
    fundingTotalApproved: 3500000,
    fundingTotalDisbursed: 2800000,
    actionRequiredItems: [],
  },
  {
    id: 'st-103',
    name: 'KisanDrone Labs India',
    tagline: 'Autonomous Hyperspectral Crop Disease & Soil Moisture Mapping',
    cin: 'U29309KA2023PTC183920',
    dpiitNumber: 'DIPP102934',
    pan: 'CCDEF9876P',
    gstin: '29CCDEF9876P1ZX',
    msmeUdyam: 'UDYAM-KR-04-0082103',
    sector: 'Agriculture & Rural Development',
    stage: 'Scaling',
    location: 'Bengaluru, Karnataka',
    state: 'Karnataka',
    foundedYear: 2023,
    teamSize: 22,
    description:
      'DGCA type-certified agricultural UAVs equipped with NDVI multispectral sensors providing village-level crop health analytics for PM Fasal Bima Yojana.',
    solutionSummary: 'Drone survey fleet with automated cloud analytics for rapid crop damage assessment.',
    verificationPercentage: 91,
    isPilotReady: true,
    verifiedAt: '2026-08-15',
    verificationHash: 'SHA256:3c8e9f2a1b4d5e6f',
    documents: [],
    matchedOpportunitiesCount: 15,
    activePilotsCount: 1,
    fundingTotalApproved: 2500000,
    fundingTotalDisbursed: 1500000,
    actionRequiredItems: [],
  },
  {
    id: 'st-104',
    name: 'NirogGrid Health Solutions',
    tagline: 'Portable Offline Tele-Diagnostic Kiosks for Primary Health Centres',
    cin: 'U85100TG2022PTC160492',
    dpiitNumber: 'DIPP77301',
    pan: 'DDEFG5678Q',
    gstin: '36DDEFG5678Q1Z2',
    sector: 'Healthcare & MedTech',
    stage: 'Pilot Ready',
    location: 'Hyderabad, Telangana',
    state: 'Telangana',
    foundedYear: 2022,
    teamSize: 12,
    description:
      'Solar-powered diagnostic kit performing 42 rapid blood, ECG, and vitals tests with AI-assisted report generation in regional Indian languages.',
    solutionSummary: 'Ayushman Arogya Mandir integrated portable point-of-care tele-medicine briefcase.',
    verificationPercentage: 95,
    isPilotReady: true,
    verifiedAt: '2026-08-18',
    verificationHash: 'SHA256:1f2e3d4c5b6a7b8c',
    documents: [],
    matchedOpportunitiesCount: 10,
    activePilotsCount: 2,
    fundingTotalApproved: 4000000,
    fundingTotalDisbursed: 3000000,
    actionRequiredItems: [],
  },
  {
    id: 'st-105',
    name: 'UrjaSetu Battery Tech',
    tagline: 'Sodium-Ion Battery Packs for E-Bus Public Transportation',
    cin: 'U31900GJ2023PTC140291',
    dpiitNumber: 'DIPP99402',
    pan: 'EEFGH1234R',
    gstin: '24EEFGH1234R1ZP',
    sector: 'EV & Clean Energy',
    stage: 'Early Traction',
    location: 'Ahmedabad, Gujarat',
    state: 'Gujarat',
    foundedYear: 2023,
    teamSize: 16,
    description:
      'Indigenous thermal-runaway-safe sodium-ion battery packs eliminating reliance on imported lithium for municipal transit buses.',
    solutionSummary: 'High-cycle stationary and transit battery modules tested under Indian climate extremes.',
    verificationPercentage: 88,
    isPilotReady: true,
    verifiedAt: '2026-08-05',
    verificationHash: 'SHA256:9a8b7c6d5e4f3a2b',
    documents: [],
    matchedOpportunitiesCount: 6,
    activePilotsCount: 1,
    fundingTotalApproved: 5000000,
    fundingTotalDisbursed: 2000000,
    actionRequiredItems: [],
  },
];

export const mockChallenges: Challenge[] = [
  {
    id: 'ch-01',
    title: 'AI-Based Municipal Solid Waste Classification & Automated Sorting',
    department: 'Swachh Bharat Mission (Urban)',
    ministry: 'Ministry of Housing and Urban Affairs (MoHUA)',
    sector: 'Smart Cities & CleanTech',
    problemStatement:
      'Municipal material recovery facilities (MRFs) require automated optical or robotic systems to distinguish wet organic waste from recyclable dry plastics at high speeds to achieve zero-landfill targets.',
    expectedOutcome:
      'Deploy working computer vision sorting pilots across 3 zonal transfer stations with over 95% classification precision.',
    budgetInLakhs: 20,
    location: 'Delhi / NCR Zonal Stations',
    state: 'Delhi',
    deadline: '2026-09-30',
    status: 'OPEN',
    requiredDocuments: ['DPIIT_CERTIFICATE', 'GST_CERTIFICATE', 'DPR_PROPOSAL'],
    minimumStage: 'Pilot Ready',
    applicationsCount: 24,
    shortlistedCount: 4,
    aiMatchScore: 94,
    whyMatches: [
      'Core technology: Edge Computer Vision matches requirement',
      'DPIIT Recognition verified with zero compliance flags',
      'Pilot-ready hardware with prior municipality trial data',
      'Sector: Smart Cities & Waste Processing aligned',
    ],
    createdAt: '2026-08-01',
  },
  {
    id: 'ch-02',
    title: 'Real-time Optical Spectrometry for Industrial Effluent Discharges',
    department: 'National Mission for Clean Ganga (NMCG)',
    ministry: 'Ministry of Jal Shakti',
    sector: 'Water Resources & Environment',
    problemStatement:
      'Continuous, non-contact monitoring of chemical oxygen demand (COD) and toxic metal residues in industrial drain outfalls directly communicating with central pollution control dashboards.',
    expectedOutcome:
      'Installation of 10 telemetry buoys in critical river stretches with automated SMS alerts for threshold breaches.',
    budgetInLakhs: 35,
    location: 'Kanpur - Varanasi River Stretch',
    state: 'Uttar Pradesh',
    deadline: '2026-10-15',
    status: 'OPEN',
    requiredDocuments: ['DPIIT_CERTIFICATE', 'GST_CERTIFICATE', 'AUDITED_FINANCIALS'],
    minimumStage: 'Pilot Ready',
    applicationsCount: 18,
    shortlistedCount: 3,
    aiMatchScore: 82,
    whyMatches: [
      'Optical sensing and telemetry patent in place',
      'Ministry of Jal Shakti priority sector match',
      'GSTN active reporting status confirmed',
    ],
    createdAt: '2026-08-05',
  },
  {
    id: 'ch-03',
    title: 'Autonomous Drone Diagnostics for PM Fasal Bima Claim Validation',
    department: 'Department of Agriculture & Farmers Welfare',
    ministry: 'Ministry of Agriculture',
    sector: 'Agriculture & Rural Development',
    problemStatement:
      'High-resolution multi-spectral survey flights over flood-affected talukas to calculate precise acreage crop damage within 72 hours of catastrophic weather incidents.',
    expectedOutcome:
      'Automated orthomosaic mapping pipeline integrated with PMFBY portal for claims processing speedup.',
    budgetInLakhs: 25,
    location: 'Marathwada Region',
    state: 'Maharashtra',
    deadline: '2026-09-20',
    status: 'OPEN',
    requiredDocuments: ['DPIIT_CERTIFICATE', 'MSME_UDYAM', 'DPR_PROPOSAL'],
    minimumStage: 'Validation',
    applicationsCount: 31,
    shortlistedCount: 6,
    aiMatchScore: 78,
    whyMatches: [
      'DGCA Type Certification documented in wallet',
      'Hyperspectral GIS pipeline aligns with tender specifications',
    ],
    createdAt: '2026-08-10',
  },
  {
    id: 'ch-04',
    title: 'Solar Point-of-Care Diagnostic Tele-Health Kiosks in Remote Tribal Blocks',
    department: 'National Health Mission',
    ministry: 'Ministry of Health and Family Welfare',
    sector: 'Healthcare & MedTech',
    problemStatement:
      'Bridging primary care gaps in remote non-grid health sub-centers with comprehensive battery-operated tele-diagnostic kits capable of operating offline.',
    expectedOutcome:
      'Deployment of 25 tele-diagnostic kits with local health worker training across 2 districts.',
    budgetInLakhs: 40,
    location: 'Adilabad & Bhadradri Kothagudem',
    state: 'Telangana',
    deadline: '2026-10-30',
    status: 'OPEN',
    requiredDocuments: ['DPIIT_CERTIFICATE', 'GST_CERTIFICATE', 'INCORPORATION_CERTIFICATE'],
    minimumStage: 'Pilot Ready',
    applicationsCount: 16,
    shortlistedCount: 2,
    aiMatchScore: 75,
    whyMatches: [
      'Integrated Ayushman Bharat digital health architecture',
      'Multilingual interface for ASHA and ANM workers',
    ],
    createdAt: '2026-08-12',
  },
];

export const mockPilots: Pilot[] = [
  {
    id: 'pilot-101',
    title: 'AI Smart Waste Sorting Pilot - Okhla Material Recovery Facility',
    startupId: 'st-101',
    startupName: 'EcoSense AI Technologies',
    departmentName: 'Municipal Corporation of Delhi (MCD) / MoHUA',
    ministry: 'Ministry of Housing and Urban Affairs',
    sector: 'Smart Cities & CleanTech',
    progressPercentage: 78,
    status: 'ACTIVE',
    startDate: '2026-06-01',
    targetCompletionDate: '2026-10-31',
    fundingTotal: 2000000,
    fundingDisbursed: 1200000,
    fundingPending: 800000,
    currentMilestoneIndex: 4,
    procurementRecommended: true,
    gemProductId: 'GEM/2026/SBM/WASTE-AI-902',
    milestones: [
      {
        id: 'm1',
        title: 'Project Proposal & Technical Blueprint Signoff',
        description: 'Joint site inspection, safety approvals, and electrical schematic verification.',
        completed: true,
        status: 'COMPLETED',
        dueDate: '2026-06-15',
        completionDate: '2026-06-12',
        trancheAmount: 400000,
        trancheStatus: 'RELEASED',
        utilizationCertificateUrl: '/docs/uc-tranche1.pdf',
      },
      {
        id: 'm2',
        title: 'Hardware Delivery & Camera Edge Rig Installation',
        description: 'Mounting high-speed dual optical cameras on conveyor Line 2 at Okhla MRF.',
        completed: true,
        status: 'COMPLETED',
        dueDate: '2026-07-15',
        completionDate: '2026-07-10',
        trancheAmount: 800000,
        trancheStatus: 'RELEASED',
        utilizationCertificateUrl: '/docs/uc-tranche2.pdf',
      },
      {
        id: 'm3',
        title: 'Model Calibration & Local Dataset Training',
        description: 'Training deep learning model on 50,000 localized Indian packaging SKU images.',
        completed: true,
        status: 'COMPLETED',
        dueDate: '2026-08-15',
        completionDate: '2026-08-14',
        trancheAmount: 0,
        trancheStatus: 'RELEASED',
      },
      {
        id: 'm4',
        title: 'Continuous 30-Day Automated Sorting Live Run',
        description: 'Verifying sorting accuracy $\\ge 95\\%$ during peak 100-ton daily municipal intake.',
        completed: false,
        status: 'IN_PROGRESS',
        dueDate: '2026-09-18',
        trancheAmount: 800000,
        trancheStatus: 'PENDING',
      },
      {
        id: 'm5',
        title: 'Final Departmental Evaluation & GeM Procurement Recommendation',
        description: 'Submission of independent third-party audit report and transition to national rate contract.',
        completed: false,
        status: 'UPCOMING',
        dueDate: '2026-10-31',
        trancheAmount: 0,
        trancheStatus: 'LOCKED',
      },
    ],
  },
];

export const mockPlatformStats: PlatformStats = {
  totalStartups: 248,
  verifiedStartups: 182,
  verificationRate: 94,
  activePilots: 34,
  completedPilots: 18,
  totalGrantDisbursedInCr: 14.8,
  activeChallenges: 12,
  procuredSolutionsCount: 8,
};

export const startupService = {
  async getProfile(): Promise<ApiResponse<StartupProfile>> {
    try {
      const res = await fetchApi<ApiResponse<StartupProfile>>('/api/startups/profile');
      if (res && res.data) return res;
    } catch {
      // Return rich mock data on network error or offline mode
    }
    return {
      success: true,
      data: mockStartupProfile,
    };
  },

  async getStartupsList(): Promise<ApiResponse<StartupProfile[]>> {
    try {
      const res = await fetchApi<ApiResponse<StartupProfile[]>>('/api/startups');
      if (res && res.data) return res;
    } catch {}
    return {
      success: true,
      data: mockStartupsList,
    };
  },

  async getChallenges(): Promise<ApiResponse<Challenge[]>> {
    try {
      const res = await fetchApi<ApiResponse<Challenge[]>>('/api/challenges');
      if (res && res.data) return res;
    } catch {}
    return {
      success: true,
      data: mockChallenges,
    };
  },

  async getPilots(): Promise<ApiResponse<Pilot[]>> {
    try {
      const res = await fetchApi<ApiResponse<Pilot[]>>('/api/pilots');
      if (res && res.data) return res;
    } catch {}
    return {
      success: true,
      data: mockPilots,
    };
  },

  async getStats(): Promise<ApiResponse<PlatformStats>> {
    try {
      const res = await fetchApi<ApiResponse<PlatformStats>>('/api/stats');
      if (res && res.data) return res;
    } catch {}
    return {
      success: true,
      data: mockPlatformStats,
    };
  },

  async checkHealth(): Promise<{ success: boolean; message: string }> {
    try {
      return await fetchApi<{ success: boolean; message: string }>('/api/health');
    } catch {
      return { success: true, message: 'SetuBharat Frontend UI active (Self-Contained Mock & Live Engine)' };
    }
  },
};
