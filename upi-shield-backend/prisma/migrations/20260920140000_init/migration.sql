-- CreateEnum
CREATE TYPE "PhraseStatus" AS ENUM ('ACTIVE', 'PENDING', 'DISABLED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ThreatPhrase" (
    "id" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" "PhraseStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThreatPhrase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScamReport" (
    "id" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScamReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThreatPhrase_phrase_key" ON "ThreatPhrase"("phrase");

-- CreateIndex
CREATE INDEX "ThreatPhrase_status_idx" ON "ThreatPhrase"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ScamReport_phrase_key" ON "ScamReport"("phrase");

-- CreateIndex
CREATE INDEX "ScamReport_status_idx" ON "ScamReport"("status");
