/*
  Warnings:

  - Added the required column `preparedById` to the `Boq` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Boq" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "preparedById" INTEGER NOT NULL,
ALTER COLUMN "totalCost" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Boq_preparedById_idx" ON "Boq"("preparedById");

-- AddForeignKey
ALTER TABLE "Boq" ADD CONSTRAINT "Boq_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
