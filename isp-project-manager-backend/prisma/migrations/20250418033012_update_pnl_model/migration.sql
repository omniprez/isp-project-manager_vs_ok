/*
  Warnings:

  - Added the required column `submittedById` to the `Pnl` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pnl" ADD COLUMN     "submittedById" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Pnl_submittedById_idx" ON "Pnl"("submittedById");

-- AddForeignKey
ALTER TABLE "Pnl" ADD CONSTRAINT "Pnl_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
