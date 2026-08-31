/*
  Warnings:

  - You are about to drop the column `complianceEvidenceScore` on the `startup_matches` table. All the data in the column will be lost.
  - You are about to drop the column `deploymentExperienceScore` on the `startup_matches` table. All the data in the column will be lost.
  - You are about to drop the column `pilotEvidenceScore` on the `startup_matches` table. All the data in the column will be lost.
  - Added the required column `deploymentReadinessScore` to the `startup_matches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `evidenceStrengthScore` to the `startup_matches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pilotReadinessScore` to the `startup_matches` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SimulationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('SUBMITTED', 'ACCEPTED', 'REJECTED');

-- DropIndex
DROP INDEX "document_chunks_embedding_idx";

-- AlterTable
ALTER TABLE "challenges" ADD COLUMN     "scenarioId" TEXT;

-- AlterTable
ALTER TABLE "pilot_evidence" ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedByUserId" TEXT,
ADD COLUMN     "status" "EvidenceStatus" NOT NULL DEFAULT 'SUBMITTED';

-- AlterTable
ALTER TABLE "pilot_metrics" ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "pilots" ADD COLUMN     "scenarioId" TEXT;

-- AlterTable
ALTER TABLE "startup_matches" DROP COLUMN "complianceEvidenceScore",
DROP COLUMN "deploymentExperienceScore",
DROP COLUMN "pilotEvidenceScore",
ADD COLUMN     "deploymentReadinessScore" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "evidenceStrengthScore" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "pilotReadinessScore" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "startups" ADD COLUMN     "capabilities" TEXT[],
ADD COLUMN     "scenarioId" TEXT,
ADD COLUMN     "technologies" TEXT[];

-- CreateTable
CREATE TABLE "simulation_scenarios" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "SimulationStatus" NOT NULL DEFAULT 'DRAFT',
    "disclaimer" TEXT NOT NULL DEFAULT 'Simulated for demonstration. Not a government decision, procurement notice, contract, payment or departmental record.',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulation_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_responses" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "solutionSummary" TEXT NOT NULL,
    "capabilities" TEXT[],
    "technologies" TEXT[],
    "deploymentApproach" TEXT NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "pilotApproach" TEXT NOT NULL,
    "constraints" TEXT,
    "evidenceReferences" TEXT[],
    "status" "ResponseStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedByUserId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "origin" "DataOrigin" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "simulation_scenarios_status_idx" ON "simulation_scenarios"("status");

-- CreateIndex
CREATE INDEX "challenge_responses_challengeId_idx" ON "challenge_responses"("challengeId");

-- CreateIndex
CREATE INDEX "challenge_responses_startupId_idx" ON "challenge_responses"("startupId");

-- CreateIndex
CREATE INDEX "challenge_responses_status_idx" ON "challenge_responses"("status");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_responses_challengeId_startupId_key" ON "challenge_responses"("challengeId", "startupId");

-- CreateIndex
CREATE INDEX "challenges_scenarioId_idx" ON "challenges"("scenarioId");

-- CreateIndex
CREATE INDEX "pilot_evidence_status_idx" ON "pilot_evidence"("status");

-- CreateIndex
CREATE INDEX "pilots_scenarioId_idx" ON "pilots"("scenarioId");

-- CreateIndex
CREATE INDEX "startups_scenarioId_idx" ON "startups"("scenarioId");

-- AddForeignKey
ALTER TABLE "startups" ADD CONSTRAINT "startups_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "simulation_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_scenarios" ADD CONSTRAINT "simulation_scenarios_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_responses" ADD CONSTRAINT "challenge_responses_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_responses" ADD CONSTRAINT "challenge_responses_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_responses" ADD CONSTRAINT "challenge_responses_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "simulation_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilots" ADD CONSTRAINT "pilots_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "simulation_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilot_evidence" ADD CONSTRAINT "pilot_evidence_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Hand-added: a filtered unique index, which Prisma cannot express.
-- ---------------------------------------------------------------------------

-- Exactly one headline metric per pilot. Without this a pilot could carry two
-- rows flagged primary and the reported outcome would depend on row order.
CREATE UNIQUE INDEX "pilot_metrics_one_primary_per_pilot"
  ON "pilot_metrics" ("pilotId") WHERE "isPrimary";
