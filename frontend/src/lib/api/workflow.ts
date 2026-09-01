/**
 * API client for Sarthi Workflow endpoints.
 */

let BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:5000';
if (!BASE.endsWith('/api')) {
  BASE = `${BASE}/api`;
}

export interface CompanyDossierResponse {
  company: {
    id: string;
    legalName: string;
    displayName: string | null;
    oneLineDescription: string | null;
    description: string | null;
    sector: string;
    industry: string | null;
    stage: string | null;
    state: string | null;
    city: string | null;
    website: string | null;
    foundedYear: number | null;
    teamSize: number | null;
    founderSummary: string | null;
    dpiitStatus: string | null;
    problemSolved: string | null;
    solutionSummary: string | null;
    productSummary: string | null;
    targetUsers: string | null;
    deploymentModel: string | null;
    geographicCoverage: string | null;
    technologies: string[];
    capabilities: string[];
    revenueBand: string | null;
    customerCount: number | null;
    deploymentCount: number | null;
    commercializationStage: string | null;
    governmentExperienceSummary: string | null;
    complianceStatus: string;
    cybersecurityStatus: string;
    dataPrivacyStatus: string;
    procurementReadiness: string;
    requiredCertifications: string[];
    pilotDurationDays: number | null;
    pilotTeamSummary: string | null;
    infrastructureRequirements: string | null;
    implementationDependencies: string | null;
    deploymentRequirements: string | null;
    estimatedPilotBudget: number | null;
    scalingRequirements: string | null;
    origin: string;
    scenarioId: string | null;
    createdAt: string;
    fundingRounds?: Array<{
      roundType: string;
      amount: number | null;
      announcedOn: string | null;
      investors: string[];
      origin: string;
    }>;
    participations?: Array<{
      edition: string | null;
      outcome: string | null;
      workOrderValue: number | null;
      sponsoringDepartment: string | null;
      program: { code: string; name: string; operator: string };
    }>;
    documents?: Array<{
      id: string;
      category: string;
      label: string | null;
      createdAt: string;
      document: {
        id: string;
        kind: string;
        title: string;
        origin: string;
        fileHash: string | null;
        originalPath: string | null;
        extractedText: string | null;
      };
    }>;
  };
  signals: Array<{
    label: string;
    level: 'NOT_ASSESSED' | 'LOW' | 'MODERATE' | 'HIGH';
    basis: string[];
  }>;
  documentReadiness: Record<string, number>;
  totalDocuments: number;
  whyThisStartup: {
    summary: string;
    strengths: string[];
    limitations: string[];
  };
  gaps: string[];
  disclaimer: string;
}

export interface DocumentItem {
  id: string;
  documentId: string;
  title: string;
  category: string;
  kind: string;
  origin: string;
  fileHash: string | null;
  originalPath: string | null;
  extractedText: string | null;
  createdAt: string;
}

export async function fetchCompanyDossier(
  startupId: string,
  token?: string,
): Promise<CompanyDossierResponse | null> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}/workflow/startups/${startupId}/dossier`, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) return null;
    const body = await res.json();
    return body?.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchCompanyDocuments(
  startupId: string,
  category?: string,
  token?: string,
): Promise<DocumentItem[]> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = `${BASE}/workflow/startups/${startupId}/documents${
      category ? `?category=${category}` : ''
    }`;

    const res = await fetch(url, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) return [];
    const body = await res.json();
    return body?.data ?? [];
  } catch {
    return [];
  }
}
