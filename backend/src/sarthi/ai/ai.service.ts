import { z } from 'zod';
import { DataOrigin, UserProfile } from '@prisma/client';
import { prisma } from '../../workflow/repositories';
import { defaultAIProvider, AIProvider } from './ollama.provider';

export const AIAnalysisOutputSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  limitations: z.array(z.string()),
  evidenceUsed: z.array(z.string()),
});

export type AIAnalysisOutput = z.infer<typeof AIAnalysisOutputSchema> & {
  isFallback?: boolean;
  provider?: string;
  model?: string;
};

const SYSTEM_PROMPT = `You are an analysis assistant for Sarthi — Innovation Procurement Platform.

Use ONLY the supplied facts and evidence.

Do NOT invent:
- companies
- customers
- government contracts
- certifications
- funding
- government approvals
- pilot outcomes
- legal status

If evidence is missing, say that evidence is missing.
Distinguish DEMO from VERIFIED information.
Do not make a final procurement decision.

Return a concise evidence-grounded analysis as a valid JSON object matching this schema:
{
  "summary": "...",
  "strengths": ["...", "..."],
  "limitations": ["...", "..."],
  "evidenceUsed": ["document title / reference"]
}`;

/**
 * Generate AI-assisted analysis for a startup dossier and optional challenge context.
 *
 * Grounded strictly in stored database facts. If Ollama is unavailable or fails,
 * a deterministic fallback explanation is returned so the workflow is never blocked.
 */
export async function analyzeStartupWithAI(
  u: UserProfile,
  startupId: string,
  challengeId?: string,
  aiProvider: AIProvider = defaultAIProvider,
): Promise<AIAnalysisOutput> {
  // Fetch startup with documents, funding, participations, and optional match
  const startup = await prisma.startup.findUnique({
    where: { id: startupId },
    include: {
      documents: {
        include: { document: { select: { title: true, kind: true, origin: true } } },
      },
      fundingRounds: true,
      participations: { include: { program: true } },
      matches: challengeId ? { where: { challengeId } } : false,
    },
  });

  if (!startup) {
    throw new Error('Startup not found');
  }

  // Fetch optional challenge details
  const challenge = challengeId
    ? await prisma.challenge.findUnique({ where: { id: challengeId } })
    : null;

  const match = startup.matches && startup.matches.length > 0 ? startup.matches[0] : null;

  // Prepare structured facts payload for the LLM
  const facts = {
    startup: {
      legalName: startup.legalName,
      displayName: startup.displayName,
      sector: startup.sector,
      origin: startup.origin,
      problemSolved: startup.problemSolved,
      solutionSummary: startup.solutionSummary,
      technologies: startup.technologies,
      capabilities: startup.capabilities,
      pilotDurationDays: startup.pilotDurationDays,
      estimatedPilotBudget: startup.estimatedPilotBudget ? Number(startup.estimatedPilotBudget) : null,
      complianceStatus: startup.complianceStatus,
      cybersecurityStatus: startup.cybersecurityStatus,
    },
    challenge: challenge
      ? {
          title: challenge.title,
          department: challenge.department,
          domain: challenge.domain,
          targetMetric: challenge.targetMetric,
          targetValue: challenge.targetValue,
        }
      : null,
    matchScores: match
      ? {
          overallScore: match.overallScore,
          problemFitScore: match.problemFitScore,
          technicalFitScore: match.technicalFitScore,
          pilotReadinessScore: match.pilotReadinessScore,
        }
      : null,
    evidenceDocuments: startup.documents.map((d) => ({
      title: d.label || d.document.title,
      category: d.category,
      origin: d.document.origin,
    })),
  };

  const userPrompt = `Analyze this startup based strictly on the following facts:\n\nFACTS:\n${JSON.stringify(facts, null, 2)}`;

  // Attempt Ollama structured generation
  const result = await aiProvider.generateStructured(userPrompt, AIAnalysisOutputSchema, SYSTEM_PROMPT);

  if (result) {
    // Record AI audit event
    await prisma.auditEvent.create({
      data: {
        actorUserId: u.id,
        subjectType: 'Startup',
        subjectId: startup.id,
        action: 'EVALUATION_SUBMITTED',
        detail: `AI Analysis generated via Ollama for startup ${startup.displayName || startup.legalName}`,
      },
    });

    return {
      ...result,
      isFallback: false,
      provider: 'OLLAMA',
      model: process.env.OLLAMA_MODEL || 'llama3.1',
    };
  }

  // Deterministic Fallback if AI unavailable or parsing failed
  const docCount = startup.documents.length;
  const fallback: AIAnalysisOutput = {
    summary: `${startup.displayName || startup.legalName} operates in ${startup.sector} and proposes ${startup.solutionSummary || 'its solution'}. (AI enhancement temporarily unavailable — showing deterministic snapshot).`,
    strengths: [
      `Dossier backed by ${docCount} ${startup.origin} documents.`,
      `Stated technologies: ${startup.technologies.join(', ') || 'None specified'}.`,
      `Proposed pilot duration: ${startup.pilotDurationDays ? `${startup.pilotDurationDays} days` : 'Not specified'}.`,
    ],
    limitations: [
      startup.origin === DataOrigin.DEMO
        ? 'All records are part of a DEMO simulation workspace and require formal verification.'
        : 'Self-declared claims require independent verification.',
    ],
    evidenceUsed: startup.documents.slice(0, 3).map((d) => d.label || d.document.title),
    isFallback: true,
    provider: 'DETERMINISTIC_FALLBACK',
  };

  return fallback;
}
