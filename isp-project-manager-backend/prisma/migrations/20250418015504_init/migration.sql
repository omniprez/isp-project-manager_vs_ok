-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SALES', 'PROJECTS_ADMIN', 'PROJECTS_SURVEY', 'PROJECTS_INSTALL', 'PROJECTS_COMMISSIONING', 'ADMIN', 'FINANCE', 'READ_ONLY');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'READ_ONLY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "projectName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "targetDeliveryDate" TIMESTAMP(3),
    "salesPersonId" INTEGER NOT NULL,
    "projectManagerId" INTEGER,
    "customerId" INTEGER,
    "customerName" TEXT NOT NULL,
    "siteA_address" TEXT,
    "siteB_address" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crd" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerContact" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "projectType" TEXT NOT NULL,
    "billingTrigger" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "bandwidth" TEXT,
    "slaRequirements" TEXT,
    "interfaceType" TEXT,
    "redundancy" BOOLEAN NOT NULL DEFAULT false,
    "ipRequirements" TEXT,
    "notes" TEXT,

    CONSTRAINT "Crd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Boq" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "datePrepared" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "Boq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pnl" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "datePrepared" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "boqCost" DOUBLE PRECISION NOT NULL,
    "oneTimeRevenue" DOUBLE PRECISION,
    "recurringRevenue" DOUBLE PRECISION,
    "contractTermMonths" INTEGER,
    "grossProfit" DOUBLE PRECISION,
    "grossMargin" DOUBLE PRECISION,
    "approvalStatus" TEXT NOT NULL DEFAULT 'Pending',
    "approverId" INTEGER,
    "approvalDate" TIMESTAMP(3),
    "adminComments" TEXT,

    CONSTRAINT "Pnl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcceptanceForm" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "serviceId" TEXT,
    "commissionedDate" TIMESTAMP(3),
    "acceptanceDate" TIMESTAMP(3),
    "billingStartDate" TIMESTAMP(3) NOT NULL,
    "customerSignature" TEXT,
    "signedByName" TEXT,
    "signedByTitle" TEXT,
    "ispRepresentative" TEXT,
    "notes" TEXT,

    CONSTRAINT "AcceptanceForm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Project_projectName_key" ON "Project"("projectName");

-- CreateIndex
CREATE UNIQUE INDEX "Crd_projectId_key" ON "Crd"("projectId");

-- CreateIndex
CREATE INDEX "Crd_projectId_idx" ON "Crd"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Boq_projectId_key" ON "Boq"("projectId");

-- CreateIndex
CREATE INDEX "Boq_projectId_idx" ON "Boq"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Pnl_projectId_key" ON "Pnl"("projectId");

-- CreateIndex
CREATE INDEX "Pnl_projectId_idx" ON "Pnl"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "AcceptanceForm_projectId_key" ON "AcceptanceForm"("projectId");

-- CreateIndex
CREATE INDEX "AcceptanceForm_projectId_idx" ON "AcceptanceForm"("projectId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_salesPersonId_fkey" FOREIGN KEY ("salesPersonId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_projectManagerId_fkey" FOREIGN KEY ("projectManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crd" ADD CONSTRAINT "Crd_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Boq" ADD CONSTRAINT "Boq_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pnl" ADD CONSTRAINT "Pnl_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcceptanceForm" ADD CONSTRAINT "AcceptanceForm_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
