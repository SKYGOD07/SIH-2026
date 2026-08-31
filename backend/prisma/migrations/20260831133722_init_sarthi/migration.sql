-- pgvector must exist before document_chunks.embedding is created.
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "DataOrigin" AS ENUM ('VERIFIED', 'DEMO', 'USER_ENTERED');

-- CreateEnum
CREATE TYPE "EvidenceSourceKind" AS ENUM ('OFFICIAL_GOVERNMENT', 'PROGRAM_PAGE', 'POLICY', 'REPORT', 'DATABASE', 'NEWS', 'OTHER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('GOVERNMENT_OFFICER', 'STARTUP', 'EVALUATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "AIProvider" AS ENUM ('OLLAMA', 'ANTHROPIC');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'MATCHING', 'UNDER_EVALUATION', 'PILOT_READY', 'CLOSED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SUGGESTED', 'SHORTLISTED', 'REJECTED', 'SELECTED');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'FINAL');

-- CreateEnum
CREATE TYPE "EvaluationRecommendation" AS ENUM ('PILOT', 'REJECT', 'NEEDS_MORE_EVIDENCE', 'HOLD');

-- CreateEnum
CREATE TYPE "PilotStatus" AS ENUM ('PLANNED', 'ACTIVE', 'AWAITING_VALIDATION', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PilotOutcome" AS ENUM ('TARGET_MET', 'PARTIALLY_MET', 'TARGET_MISSED');

-- CreateEnum
CREATE TYPE "BaselineQuality" AS ENUM ('NONE', 'PARTIAL', 'GOOD');

-- CreateEnum
CREATE TYPE "FailureCause" AS ENUM ('INSUFFICIENT_BASELINE', 'DELIVERY_CAPACITY', 'COVERAGE_SHORTFALL', 'DATA_QUALITY', 'SEASONAL_WINDOW', 'INTEGRATION_GAP', 'SCOPE_TOO_WIDE', 'TAXONOMY_MISMATCH');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('LOCKED', 'IN_PROGRESS', 'EVIDENCE_SUBMITTED', 'APPROVED', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "ScaleDecisionType" AS ENUM ('SCALE', 'EXTEND_PILOT', 'STOP');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('POLICY', 'ELIGIBILITY', 'AGREEMENT', 'CYBERSECURITY', 'IP_DATA', 'PILOT_REPORT', 'EVALUATION', 'PROCUREMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CHALLENGE_STATUS_CHANGED', 'MATCH_STATUS_CHANGED', 'EVALUATION_SUBMITTED', 'EVALUATION_DECIDED', 'PILOT_STATUS_CHANGED', 'EVIDENCE_SUBMITTED', 'MILESTONE_APPROVED', 'MILESTONE_REJECTED', 'PAYMENT_RELEASED', 'VALIDATION_RECORDED', 'SCALE_DECISION_RECORDED');

-- CreateTable
CREATE TABLE "evidence_sources" (
    "id" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "retrievedAt" DATE NOT NULL,
    "kind" "EvidenceSourceKind" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "departmentName" TEXT,
    "designation" TEXT,
    "startupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_provider_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AIProvider" NOT NULL,
    "baseUrl" TEXT,
    "model" TEXT NOT NULL,
    "keyCipher" BYTEA,
    "keyNonce" BYTEA,
    "keyTag" BYTEA,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_provider_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "startups" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "displayName" TEXT,
    "description" TEXT,
    "sector" TEXT NOT NULL,
    "industry" TEXT,
    "stage" TEXT,
    "state" TEXT,
    "city" TEXT,
    "website" TEXT,
    "dpiitStatus" TEXT,
    "origin" "DataOrigin" NOT NULL,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "startups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funding_rounds" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "roundType" TEXT NOT NULL,
    "amount" DECIMAL(14,2),
    "announcedOn" DATE,
    "investors" TEXT[],
    "origin" "DataOrigin" NOT NULL,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funding_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "government_programs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "origin" "DataOrigin" NOT NULL,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "government_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "startup_program_participations" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "edition" TEXT,
    "outcome" TEXT,
    "workOrderValue" DECIMAL(14,2),
    "sponsoringDepartment" TEXT,
    "origin" "DataOrigin" NOT NULL,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "startup_program_participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenges" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "problemStatement" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "technologies" TEXT[],
    "targetMetric" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "budgetEnvelope" DECIMAL(14,2),
    "pilotDurationDays" INTEGER,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'DRAFT',
    "origin" "DataOrigin" NOT NULL,
    "demoScenario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "startup_matches" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "problemFitScore" DOUBLE PRECISION NOT NULL,
    "technicalFitScore" DOUBLE PRECISION NOT NULL,
    "deploymentExperienceScore" DOUBLE PRECISION NOT NULL,
    "governmentExperienceScore" DOUBLE PRECISION NOT NULL,
    "complianceEvidenceScore" DOUBLE PRECISION NOT NULL,
    "pilotEvidenceScore" DOUBLE PRECISION NOT NULL,
    "financialEvidenceScore" DOUBLE PRECISION,
    "scalabilityScore" DOUBLE PRECISION,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "rationale" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'SUGGESTED',
    "generatedByConnectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "startup_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "evaluatorUserId" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "compositeScore" DOUBLE PRECISION NOT NULL,
    "recommendation" "EvaluationRecommendation" NOT NULL,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "comments" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pilots" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "location" TEXT,
    "contractValue" DECIMAL(14,2) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "baselineDays" INTEGER NOT NULL,
    "baselineQuality" "BaselineQuality" NOT NULL,
    "scopeUnits" INTEGER NOT NULL,
    "scopeUnitLabel" TEXT NOT NULL,
    "status" "PilotStatus" NOT NULL DEFAULT 'PLANNED',
    "outcome" "PilotOutcome",
    "failureCauses" "FailureCause"[],
    "origin" "DataOrigin" NOT NULL,
    "demoScenario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pilots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pilot_milestones" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payment" DECIMAL(14,2) NOT NULL,
    "evidenceRequired" TEXT[],
    "status" "MilestoneStatus" NOT NULL DEFAULT 'LOCKED',
    "dueOn" DATE NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pilot_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pilot_metrics" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "baselineValue" DOUBLE PRECISION,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "achievedValue" DOUBLE PRECISION,
    "measuredAt" TIMESTAMP(3),
    "method" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pilot_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pilot_evidence" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "metricId" TEXT,
    "label" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "submittedByUserId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pilot_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scale_decisions" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "decision" "ScaleDecisionType" NOT NULL,
    "rationale" TEXT NOT NULL,
    "decidedByUserId" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scale_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "kind" "DocumentKind" NOT NULL,
    "title" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "url" TEXT,
    "retrievedAt" DATE NOT NULL,
    "origin" "DataOrigin" NOT NULL,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_chunks" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "pageNumber" INTEGER,
    "sectionRef" TEXT,
    "tokenCount" INTEGER,
    "embeddingModel" TEXT NOT NULL,
    "embedding" vector(768),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "detail" TEXT NOT NULL,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evidence_sources_kind_idx" ON "evidence_sources"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_email_key" ON "user_profiles"("email");

-- CreateIndex
CREATE INDEX "user_profiles_role_idx" ON "user_profiles"("role");

-- CreateIndex
CREATE INDEX "user_profiles_startupId_idx" ON "user_profiles"("startupId");

-- CreateIndex
CREATE INDEX "ai_provider_connections_userId_idx" ON "ai_provider_connections"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_provider_connections_userId_provider_model_key" ON "ai_provider_connections"("userId", "provider", "model");

-- CreateIndex
CREATE INDEX "startups_sector_idx" ON "startups"("sector");

-- CreateIndex
CREATE INDEX "startups_origin_idx" ON "startups"("origin");

-- CreateIndex
CREATE INDEX "startups_state_idx" ON "startups"("state");

-- CreateIndex
CREATE INDEX "funding_rounds_startupId_idx" ON "funding_rounds"("startupId");

-- CreateIndex
CREATE INDEX "funding_rounds_origin_idx" ON "funding_rounds"("origin");

-- CreateIndex
CREATE UNIQUE INDEX "government_programs_code_key" ON "government_programs"("code");

-- CreateIndex
CREATE INDEX "startup_program_participations_programId_idx" ON "startup_program_participations"("programId");

-- CreateIndex
CREATE INDEX "startup_program_participations_origin_idx" ON "startup_program_participations"("origin");

-- CreateIndex
CREATE UNIQUE INDEX "startup_program_participations_startupId_programId_edition_key" ON "startup_program_participations"("startupId", "programId", "edition");

-- CreateIndex
CREATE INDEX "challenges_ownerUserId_idx" ON "challenges"("ownerUserId");

-- CreateIndex
CREATE INDEX "challenges_domain_idx" ON "challenges"("domain");

-- CreateIndex
CREATE INDEX "challenges_status_idx" ON "challenges"("status");

-- CreateIndex
CREATE INDEX "challenges_origin_idx" ON "challenges"("origin");

-- CreateIndex
CREATE INDEX "startup_matches_challengeId_idx" ON "startup_matches"("challengeId");

-- CreateIndex
CREATE INDEX "startup_matches_startupId_idx" ON "startup_matches"("startupId");

-- CreateIndex
CREATE INDEX "startup_matches_status_idx" ON "startup_matches"("status");

-- CreateIndex
CREATE UNIQUE INDEX "startup_matches_challengeId_startupId_key" ON "startup_matches"("challengeId", "startupId");

-- CreateIndex
CREATE INDEX "evaluations_matchId_idx" ON "evaluations"("matchId");

-- CreateIndex
CREATE INDEX "evaluations_evaluatorUserId_idx" ON "evaluations"("evaluatorUserId");

-- CreateIndex
CREATE INDEX "evaluations_status_idx" ON "evaluations"("status");

-- CreateIndex
CREATE INDEX "pilots_challengeId_idx" ON "pilots"("challengeId");

-- CreateIndex
CREATE INDEX "pilots_startupId_idx" ON "pilots"("startupId");

-- CreateIndex
CREATE INDEX "pilots_status_idx" ON "pilots"("status");

-- CreateIndex
CREATE INDEX "pilots_origin_idx" ON "pilots"("origin");

-- CreateIndex
CREATE INDEX "pilot_milestones_status_idx" ON "pilot_milestones"("status");

-- CreateIndex
CREATE UNIQUE INDEX "pilot_milestones_pilotId_code_key" ON "pilot_milestones"("pilotId", "code");

-- CreateIndex
CREATE INDEX "pilot_metrics_pilotId_idx" ON "pilot_metrics"("pilotId");

-- CreateIndex
CREATE INDEX "pilot_evidence_pilotId_idx" ON "pilot_evidence"("pilotId");

-- CreateIndex
CREATE INDEX "pilot_evidence_milestoneId_idx" ON "pilot_evidence"("milestoneId");

-- CreateIndex
CREATE INDEX "pilot_evidence_metricId_idx" ON "pilot_evidence"("metricId");

-- CreateIndex
CREATE UNIQUE INDEX "scale_decisions_pilotId_key" ON "scale_decisions"("pilotId");

-- CreateIndex
CREATE INDEX "scale_decisions_decidedByUserId_idx" ON "scale_decisions"("decidedByUserId");

-- CreateIndex
CREATE INDEX "documents_kind_idx" ON "documents"("kind");

-- CreateIndex
CREATE INDEX "documents_origin_idx" ON "documents"("origin");

-- CreateIndex
CREATE INDEX "document_chunks_documentId_idx" ON "document_chunks"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "document_chunks_documentId_ordinal_key" ON "document_chunks"("documentId", "ordinal");

-- CreateIndex
CREATE INDEX "audit_events_subjectType_subjectId_at_idx" ON "audit_events"("subjectType", "subjectId", "at");

-- CreateIndex
CREATE INDEX "audit_events_at_idx" ON "audit_events"("at");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_provider_connections" ADD CONSTRAINT "ai_provider_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startups" ADD CONSTRAINT "startups_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "evidence_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_rounds" ADD CONSTRAINT "funding_rounds_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_rounds" ADD CONSTRAINT "funding_rounds_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "evidence_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "government_programs" ADD CONSTRAINT "government_programs_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "evidence_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startup_program_participations" ADD CONSTRAINT "startup_program_participations_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startup_program_participations" ADD CONSTRAINT "startup_program_participations_programId_fkey" FOREIGN KEY ("programId") REFERENCES "government_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startup_program_participations" ADD CONSTRAINT "startup_program_participations_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "evidence_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startup_matches" ADD CONSTRAINT "startup_matches_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startup_matches" ADD CONSTRAINT "startup_matches_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startup_matches" ADD CONSTRAINT "startup_matches_generatedByConnectionId_fkey" FOREIGN KEY ("generatedByConnectionId") REFERENCES "ai_provider_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "startup_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_evaluatorUserId_fkey" FOREIGN KEY ("evaluatorUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilots" ADD CONSTRAINT "pilots_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilots" ADD CONSTRAINT "pilots_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilot_milestones" ADD CONSTRAINT "pilot_milestones_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "pilots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilot_metrics" ADD CONSTRAINT "pilot_metrics_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "pilots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilot_evidence" ADD CONSTRAINT "pilot_evidence_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "pilots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilot_evidence" ADD CONSTRAINT "pilot_evidence_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "pilot_milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilot_evidence" ADD CONSTRAINT "pilot_evidence_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "pilot_metrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilot_evidence" ADD CONSTRAINT "pilot_evidence_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scale_decisions" ADD CONSTRAINT "scale_decisions_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "pilots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scale_decisions" ADD CONSTRAINT "scale_decisions_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "evidence_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Hand-added: guarantees Prisma's schema language cannot express.
-- ---------------------------------------------------------------------------

-- Approximate-nearest-neighbour index for retrieval. Cosine, matching how
-- nomic-embed-text vectors are compared.
CREATE INDEX "document_chunks_embedding_idx"
  ON "document_chunks" USING hnsw ("embedding" vector_cosine_ops);

-- Provenance. A row may only claim VERIFIED if it names the source it came
-- from. Without this, "verified" is a string any bug can write.
ALTER TABLE "startups"
  ADD CONSTRAINT "startups_verified_needs_source"
  CHECK ("origin" <> 'VERIFIED' OR "sourceId" IS NOT NULL);

ALTER TABLE "funding_rounds"
  ADD CONSTRAINT "funding_rounds_verified_needs_source"
  CHECK ("origin" <> 'VERIFIED' OR "sourceId" IS NOT NULL);

ALTER TABLE "government_programs"
  ADD CONSTRAINT "government_programs_verified_needs_source"
  CHECK ("origin" <> 'VERIFIED' OR "sourceId" IS NOT NULL);

ALTER TABLE "startup_program_participations"
  ADD CONSTRAINT "startup_program_participations_verified_needs_source"
  CHECK ("origin" <> 'VERIFIED' OR "sourceId" IS NOT NULL);

ALTER TABLE "documents"
  ADD CONSTRAINT "documents_verified_needs_source"
  CHECK ("origin" <> 'VERIFIED' OR "sourceId" IS NOT NULL);

-- AI credentials. Shape is per-provider and strict in both directions: a local
-- Ollama connection must carry no credential at all, and a hosted Anthropic
-- connection must carry a complete one. A partially populated credential would
-- otherwise save cleanly and fail only at call time.
ALTER TABLE "ai_provider_connections"
  ADD CONSTRAINT "ai_provider_connections_credential_shape"
  CHECK (
    ("provider" = 'OLLAMA'
       AND "keyCipher" IS NULL AND "keyNonce" IS NULL AND "keyTag" IS NULL)
    OR
    ("provider" = 'ANTHROPIC'
       AND "keyCipher" IS NOT NULL AND "keyNonce" IS NOT NULL AND "keyTag" IS NOT NULL)
  );

-- Evidence may point at a milestone or a metric, but never at both: a single
-- artefact backing two different claims makes the trail ambiguous about which
-- one it was filed against.
ALTER TABLE "pilot_evidence"
  ADD CONSTRAINT "pilot_evidence_single_attachment"
  CHECK (NOT ("milestoneId" IS NOT NULL AND "metricId" IS NOT NULL));
