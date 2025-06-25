/*
  Warnings:

  - Added the required column `loggedById` to the `AcceptanceForm` table without a default value. This is not possible if the table is not empty.
  - Made the column `acceptanceDate` on table `AcceptanceForm` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AcceptanceForm" ADD COLUMN     "loggedById" INTEGER NOT NULL,
ALTER COLUMN "acceptanceDate" SET NOT NULL;

-- CreateIndex
CREATE INDEX "AcceptanceForm_loggedById_idx" ON "AcceptanceForm"("loggedById");

-- AddForeignKey
ALTER TABLE "AcceptanceForm" ADD CONSTRAINT "AcceptanceForm_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
