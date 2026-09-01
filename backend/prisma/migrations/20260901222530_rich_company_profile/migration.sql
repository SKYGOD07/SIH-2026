-- CreateEnum
CREATE TYPE "AssuranceStatus" AS ENUM ('NOT_PROVIDED', 'SELF_DECLARED', 'PARTIALLY_VERIFIED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "ReadinessLevel" AS ENUM ('NOT_ASSESSED', 'LOW', 'MODERATE', 'HIGH');

-- AlterTable
ALTER TABLE "startups" ADD COLUMN     "commercializationStage" TEXT,
ADD COLUMN     "complianceStatus" "AssuranceStatus" NOT NULL DEFAULT 'NOT_PROVIDED',
ADD COLUMN     "customerCount" INTEGER,
ADD COLUMN     "cybersecurityStatus" "AssuranceStatus" NOT NULL DEFAULT 'NOT_PROVIDED',
ADD COLUMN     "dataPrivacyStatus" "AssuranceStatus" NOT NULL DEFAULT 'NOT_PROVIDED',
ADD COLUMN     "deploymentCount" INTEGER,
ADD COLUMN     "deploymentModel" TEXT,
ADD COLUMN     "deploymentRequirements" TEXT,
ADD COLUMN     "estimatedPilotBudget" DECIMAL(14,2),
ADD COLUMN     "foundedYear" INTEGER,
ADD COLUMN     "founderSummary" TEXT,
ADD COLUMN     "geographicCoverage" TEXT,
ADD COLUMN     "governmentExperienceSummary" TEXT,
ADD COLUMN     "implementationDependencies" TEXT,
ADD COLUMN     "infrastructureRequirements" TEXT,
ADD COLUMN     "keyTeamMembers" JSONB,
ADD COLUMN     "oneLineDescription" TEXT,
ADD COLUMN     "pilotDurationDays" INTEGER,
ADD COLUMN     "pilotTeamSummary" TEXT,
ADD COLUMN     "problemSolved" TEXT,
ADD COLUMN     "procurementReadiness" "ReadinessLevel" NOT NULL DEFAULT 'NOT_ASSESSED',
ADD COLUMN     "productSummary" TEXT,
ADD COLUMN     "requiredCertifications" TEXT[],
ADD COLUMN     "revenueBand" TEXT,
ADD COLUMN     "scalingRequirements" TEXT,
ADD COLUMN     "solutionSummary" TEXT,
ADD COLUMN     "targetUsers" TEXT,
ADD COLUMN     "teamSize" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_startupId_key" ON "user_profiles"("startupId");

