-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "sourceExpenseId" UUID;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_sourceExpenseId_fkey" FOREIGN KEY ("sourceExpenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "Expense_userId_competenceMonth_sourceExpenseId_key" ON "Expense"("userId", "competenceMonth", "sourceExpenseId");
