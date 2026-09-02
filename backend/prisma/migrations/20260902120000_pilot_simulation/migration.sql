-- CreateEnum
CREATE TYPE "SimulationRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETE', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "pilot_simulation_runs" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "status" "SimulationRunStatus" NOT NULL DEFAULT 'QUEUED',
    "seed" INTEGER NOT NULL,
    "runsPerCompany" INTEGER NOT NULL,
    "perturbationPasses" INTEGER NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "assumptions" JSONB NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'QUEUED',
    "cohortSize" INTEGER NOT NULL DEFAULT 0,
    "eligibleCount" INTEGER NOT NULL DEFAULT 0,
    "companiesDone" INTEGER NOT NULL DEFAULT 0,
    "passesDone" INTEGER NOT NULL DEFAULT 0,
    "runsDone" INTEGER NOT NULL DEFAULT 0,
    "simulatedDays" BIGINT NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,
    "origin" "DataOrigin" NOT NULL DEFAULT 'DEMO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pilot_simulation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pilot_simulation_results" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "eligible" BOOLEAN NOT NULL,
    "exclusionReason" TEXT,
    "runsMetTarget" INTEGER NOT NULL DEFAULT 0,
    "runsPartial" INTEGER NOT NULL DEFAULT 0,
    "runsMissed" INTEGER NOT NULL DEFAULT 0,
    "runsTotal" INTEGER NOT NULL DEFAULT 0,
    "medianAchieved" DOUBLE PRECISION,
    "p10" DOUBLE PRECISION,
    "p90" DOUBLE PRECISION,
    "medianCoverage" DOUBLE PRECISION,
    "medianMobilisationDays" DOUBLE PRECISION,
    "dominantCause" "FailureCause",
    "precondition" TEXT,
    "rankPosition" INTEGER,
    "rankStability" DOUBLE PRECISION,
    "trajectory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pilot_simulation_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pilot_simulation_runs_challengeId_idx" ON "pilot_simulation_runs"("challengeId");

-- CreateIndex
CREATE INDEX "pilot_simulation_runs_status_idx" ON "pilot_simulation_runs"("status");

-- CreateIndex
CREATE INDEX "pilot_simulation_runs_createdByUserId_idx" ON "pilot_simulation_runs"("createdByUserId");

-- CreateIndex
CREATE INDEX "pilot_simulation_results_runId_rankPosition_idx" ON "pilot_simulation_results"("runId", "rankPosition");

-- CreateIndex
CREATE INDEX "pilot_simulation_results_startupId_idx" ON "pilot_simulation_results"("startupId");

-- CreateIndex
CREATE UNIQUE INDEX "pilot_simulation_results_runId_startupId_key" ON "pilot_simulation_results"("runId", "startupId");

-- AddForeignKey
ALTER TABLE "pilot_simulation_runs" ADD CONSTRAINT "pilot_simulation_runs_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilot_simulation_runs" ADD CONSTRAINT "pilot_simulation_runs_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilot_simulation_results" ADD CONSTRAINT "pilot_simulation_results_runId_fkey" FOREIGN KEY ("runId") REFERENCES "pilot_simulation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilot_simulation_results" ADD CONSTRAINT "pilot_simulation_results_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

