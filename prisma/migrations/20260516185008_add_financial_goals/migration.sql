-- CreateTable
CREATE TABLE "FinancialGoal" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmount" DECIMAL(12,2) NOT NULL,
    "currentAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancialGoal_userId_isArchived_idx" ON "FinancialGoal"("userId", "isArchived");

-- CreateIndex
CREATE INDEX "FinancialGoal_userId_deadline_idx" ON "FinancialGoal"("userId", "deadline");

-- AddForeignKey
ALTER TABLE "FinancialGoal" ADD CONSTRAINT "FinancialGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
