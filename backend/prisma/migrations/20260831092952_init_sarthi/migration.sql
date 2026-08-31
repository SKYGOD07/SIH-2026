-- CreateEnum
CREATE TYPE "PilotOutcome" AS ENUM ('TARGET_MET', 'PARTIALLY_MET', 'TARGET_MISSED');

-- CreateEnum
CREATE TYPE "BaselineQuality" AS ENUM ('NONE', 'PARTIAL', 'GOOD');

-- CreateEnum
CREATE TYPE "FailureCause" AS ENUM ('INSUFFICIENT_BASELINE', 'DELIVERY_CAPACITY', 'COVERAGE_SHORTFALL', 'DATA_QUALITY', 'SEASONAL_WINDOW', 'INTEGRATION_GAP', 'SCOPE_TOO_WIDE', 'TAXONOMY_MISMATCH');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('LOCKED', 'IN_PROGRESS', 'EVIDENCE_SUBMITTED', 'APPROVED', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "SourceKind" AS ENUM ('policy', 'eligibility', 'agreement', 'cybersecurity', 'ip-data', 'pilot-report', 'evaluation');

-- CreateEnum
CREATE TYPE "LedgerAction" AS ENUM ('EVIDENCE_SUBMITTED', 'APPROVED', 'REJECTED', 'PAID');

-- CreateTable
CREATE TABLE "pilot_records" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "technologies" TEXT[],
    "year" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "baselineDays" INTEGER NOT NULL,
    "baselineQuality" "BaselineQuality" NOT NULL,
    "scopeUnits" INTEGER NOT NULL,
    "scopeUnitLabel" TEXT NOT NULL,
    "contractValue" DECIMAL(14,2) NOT NULL,
    "milestoneSplit" DOUBLE PRECISION[],
    "outcome" "PilotOutcome" NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "achievedValue" DOUBLE PRECISION NOT NULL,
    "failureCauses" "FailureCause"[],
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pilot_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pilot_ledgers" (
    "pilotId" TEXT NOT NULL,
    "contractValue" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pilot_ledgers_pkey" PRIMARY KEY ("pilotId")
);

-- CreateTable
CREATE TABLE "milestones" (
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

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone_evidence" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestone_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_events" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pilotId" TEXT NOT NULL,
    "milestoneCode" TEXT NOT NULL,
    "action" "LedgerAction" NOT NULL,
    "actor" TEXT NOT NULL,
    "detail" TEXT NOT NULL,

    CONSTRAINT "ledger_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_clauses" (
    "id" TEXT NOT NULL,
    "kind" "SourceKind" NOT NULL,
    "title" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "keywords" TEXT[],

    CONSTRAINT "policy_clauses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pilot_records_domain_idx" ON "pilot_records"("domain");

-- CreateIndex
CREATE INDEX "pilot_records_outcome_idx" ON "pilot_records"("outcome");

-- CreateIndex
CREATE INDEX "milestones_status_idx" ON "milestones"("status");

-- CreateIndex
CREATE UNIQUE INDEX "milestones_pilotId_code_key" ON "milestones"("pilotId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "milestone_evidence_milestoneId_code_key" ON "milestone_evidence"("milestoneId", "code");

-- CreateIndex
CREATE INDEX "ledger_events_pilotId_at_idx" ON "ledger_events"("pilotId", "at");

-- CreateIndex
CREATE INDEX "policy_clauses_kind_idx" ON "policy_clauses"("kind");

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "pilot_ledgers"("pilotId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_evidence" ADD CONSTRAINT "milestone_evidence_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
