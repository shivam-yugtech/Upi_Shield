-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('FALSE_POSITIVE', 'CONFIRMED_SCAM', 'UNSURE');

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "messageHash" TEXT NOT NULL,
    "messageText" TEXT NOT NULL,
    "isScam" BOOLEAN NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "signals" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "urlDetected" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanFeedback" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "feedback" "FeedbackType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scan_createdAt_idx" ON "Scan"("createdAt");

-- CreateIndex
CREATE INDEX "Scan_messageHash_idx" ON "Scan"("messageHash");

-- CreateIndex
CREATE UNIQUE INDEX "ScanFeedback_scanId_key" ON "ScanFeedback"("scanId");

-- AddForeignKey
ALTER TABLE "ScanFeedback" ADD CONSTRAINT "ScanFeedback_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
