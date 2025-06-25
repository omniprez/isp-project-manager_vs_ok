-- CreateTable
CREATE TABLE "DeletionRequest" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "reason" TEXT NOT NULL,
    "responseDate" TIMESTAMP(3),
    "responseComments" TEXT,
    "requestedById" INTEGER NOT NULL,
    "respondedById" INTEGER,

    CONSTRAINT "DeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeletionRequest_projectId_key" ON "DeletionRequest"("projectId");

-- CreateIndex
CREATE INDEX "DeletionRequest_projectId_idx" ON "DeletionRequest"("projectId");

-- CreateIndex
CREATE INDEX "DeletionRequest_requestedById_idx" ON "DeletionRequest"("requestedById");

-- CreateIndex
CREATE INDEX "DeletionRequest_respondedById_idx" ON "DeletionRequest"("respondedById");

-- AddForeignKey
ALTER TABLE "DeletionRequest" ADD CONSTRAINT "DeletionRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletionRequest" ADD CONSTRAINT "DeletionRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletionRequest" ADD CONSTRAINT "DeletionRequest_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
