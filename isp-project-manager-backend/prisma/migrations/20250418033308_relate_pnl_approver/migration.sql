-- CreateIndex
CREATE INDEX "Pnl_approverId_idx" ON "Pnl"("approverId");

-- AddForeignKey
ALTER TABLE "Pnl" ADD CONSTRAINT "Pnl_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
