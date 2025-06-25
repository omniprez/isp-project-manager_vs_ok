// src/types/index.ts

// Project Status Types
export type ProjectStatus =
  | 'CRD Submitted'
  | 'Feasibility'
  | 'BOQ Ready'
  | 'Pending Approval'
  | 'Approved'
  | 'Installation Pending'
  | 'In Progress'
  | 'Provisioning Complete'
  | 'Physical Installation Complete'
  | 'Commissioning Complete'
  | 'UAT Pending'
  | 'Soak Period'
  | 'Completed'
  | 'P&L Under Review';

// P&L Approval Status Types
export type PnlApprovalStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Under Review';

// Deletion Request Status Types
export type DeletionRequestStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected';

// User interface
export interface User {
  id: number;
  name: string | null;
  email: string;
  role: string;
}

// Billing Status Types
export type BillingStatus =
  | 'Not Ready'
  | 'Pending'
  | 'Initiated'
  | 'Billed';

// Project Detail interface
export interface ProjectDetail {
    id: number;
    projectName: string;
    status: ProjectStatus | string;
    billingStatus: BillingStatus | string | null;
    customerName: string;
    siteA_address: string | null;
    siteB_address: string | null;
    targetDeliveryDate: string | null;
    createdAt: string;
    updatedAt: string;
    salesPerson: { id: number; name: string | null; email: string; } | null;
    projectManager: { id: number; name: string | null; email: string; } | null;
    crd: { id: number; dateCreated: string; customerContact: string | null; customerPhone: string | null; customerEmail: string | null; projectType: string; billingTrigger: string; serviceType: string; bandwidth: string | null; slaRequirements: string | null; interfaceType: string | null; redundancy: boolean; ipRequirements: string | null; notes: string | null; } | null;
    boq: { id: number; datePrepared: string; totalCost: number; notes: string | null; preparedBy: { id: number; name: string | null; email: string; } | null; } | null;
    pnl: { id: number; datePrepared: string; boqCost: number; oneTimeRevenue: number | null; recurringRevenue: number | null; contractTermMonths: number | null; grossProfit: number | null; grossMargin: number | null; approvalStatus: PnlApprovalStatus | string; approvalDate: string | null; adminComments: string | null; submittedBy: { id: number; name: string | null; email: string; } | null; approver: { id: number; name: string | null; email: string; } | null; } | null;
    acceptanceForm: { id: number; serviceId: string | null; commissionedDate: string | null; acceptanceDate: string; billingStartDate: string; customerSignature: string | null; signedByName: string | null; signedByTitle: string | null; ispRepresentative: string | null; notes: string | null; loggedBy: { id: number; name: string | null; email: string; } | null; } | null;
    deletionRequest?: { id: number; status: DeletionRequestStatus; reason: string; requestDate: string; responseDate: string | null; responseComments: string | null; requestedBy: { id: number; name: string | null; email: string; } | null; respondedBy: { id: number; name: string | null; email: string; } | null; } | null;
}

// Deletion Request interface
export interface DeletionRequest {
    id: number;
    projectId: number;
    status: DeletionRequestStatus;
    reason: string;
    requestDate: string;
    responseDate: string | null;
    responseComments: string | null;
    requestedBy: { id: number; name: string | null; email: string; role: string; };
    respondedBy?: { id: number; name: string | null; email: string; } | null;
    project: {
        id: number;
        projectName: string;
        customerName: string;
        status: ProjectStatus | string;
        salesPerson: { id: number; name: string | null; email: string; } | null;
    };
}