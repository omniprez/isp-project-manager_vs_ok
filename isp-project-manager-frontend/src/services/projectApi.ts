// src/services/projectApi.ts (Ensuring assignPm is correctly exported)
import axios, { AxiosError } from 'axios';
// Import the shared Axios instance
import { apiClient } from './api';
// Import the complex ProjectDetail type
import { ProjectDetail } from '../types'; // Adjust path if needed

// --- Interfaces specific to projects ---
export interface CreateProjectData {
    projectName: string; customerName: string; siteA_address?: string | null; siteB_address?: string | null;
    targetDeliveryDate?: string | null; customerContact?: string | null; customerPhone?: string | null;
    customerEmail?: string | null; projectType: string; billingTrigger: string; serviceType: string;
    bandwidth?: string | null; slaRequirements?: string | null; interfaceType?: string | null;
    redundancy: boolean; ipRequirements?: string | null; notes?: string | null;
}
export interface CreatedProjectResponse {
    id: number; projectName: string; status: string; crd: object | null;
}
export interface BoqData {
    totalCost: number;
    notes?: string | null;
}
export interface CreatedBoqResponse {
    id: number; projectId: number; totalCost: number; notes: string | null;
    datePrepared: string; preparedById: number;
    preparedBy?: { id: number; name: string | null; email: string; }
}
export interface PnlData {
    oneTimeRevenue: number;
    recurringRevenue: number;
    contractTermMonths: number;
}
export interface CreatedPnlResponse {
    id: number; projectId: number; boqCost: number; oneTimeRevenue: number | null;
    recurringRevenue: number | null; contractTermMonths: number | null; grossProfit: number | null;
    grossMargin: number | null; approvalStatus: string; datePrepared: string; submittedById: number;
    submittedBy?: { id: number; name: string | null; email: string; }
}
export interface InitiateInstallationResponse {
    message: string;
    project: { id: number; status: string; };
}
// Response after assigning PM (matches backend)
export interface AssignPmResponse {
    message: string;
    project: { // Can be more specific based on backend include
        id: number;
        projectManagerId: number | null;
        projectManager?: { // Optional include based on backend response
            id: number;
            name: string | null;
            email: string;
        } | null;
    };
}


// --- Project API Functions ---

export const createProject = async (projectData: CreateProjectData): Promise<CreatedProjectResponse> => {
    console.log("projectApi.ts: createProject function started.");
    try {
        const response = await apiClient.post<CreatedProjectResponse>('/projects', projectData);
        return response.data;
    } catch (error) {
        console.error("projectApi.ts: apiClient.post('/projects') FAILED.", error);
        if (axios.isAxiosError(error)) {
             const axiosError = error as AxiosError;
             console.error("projectApi.ts: Axios error details:", { message: axiosError.message, code: axiosError.code, status: axiosError.response?.status, responseData: axiosError.response?.data });
         }
        throw error;
    }
};

export const getProjects = async () => {
    console.log("projectApi.ts: getProjects function started.");
    try {
        const response = await apiClient.get('/projects');
        if (!Array.isArray(response.data)) {
            console.warn("projectApi.ts: getProjects did not receive an array, returning empty array.", response.data)
            return [];
        }
        return response.data;
    } catch (error) {
        console.error("projectApi.ts: apiClient.get('/projects') FAILED.", error);
         if (axios.isAxiosError(error)) {
             const axiosError = error as AxiosError;
             console.error("projectApi.ts: Axios error details:", { message: axiosError.message, code: axiosError.code, status: axiosError.response?.status, responseData: axiosError.response?.data });
         }
         return [];
    }
};

export const getProjectById = async (projectId: number | string): Promise<ProjectDetail | null> => {
    console.log(`projectApi.ts: getProjectById function started for ID: ${projectId}`);
    try {
        const response = await apiClient.get<ProjectDetail>(`/projects/${projectId}`);
        return response.data;
    } catch (error) {
        console.error(`projectApi.ts: apiClient.get('/projects/${projectId}') FAILED.`, error);
         if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            if (axiosError.response?.status === 404) { return null; }
         }
         return null;
    }
};

export const createBoq = async (projectId: number, boqData: BoqData): Promise<CreatedBoqResponse> => {
    console.log(`projectApi.ts: createBoq function started for Project ID: ${projectId}`);
    try {
        const response = await apiClient.post<CreatedBoqResponse>(`/projects/${projectId}/boq`, boqData);
        return response.data;
    } catch (error) {
        console.error(`projectApi.ts: apiClient.post('/projects/${projectId}/boq') FAILED.`, error);
         if (axios.isAxiosError(error)) { /* log details */ }
        throw error;
    }
};

export const createPnl = async (projectId: number, pnlData: PnlData): Promise<CreatedPnlResponse> => {
    console.log(`projectApi.ts: createPnl function started for Project ID: ${projectId}`);
    try {
        const response = await apiClient.post<CreatedPnlResponse>(`/projects/${projectId}/pnl`, pnlData);
        return response.data;
    } catch (error) {
        console.error(`projectApi.ts: apiClient.post('/projects/${projectId}/pnl') FAILED.`, error);
         if (axios.isAxiosError(error)) { /* log details */ }
        throw error;
    }
};

export const initiateInstallation = async (projectId: number): Promise<InitiateInstallationResponse> => {
    console.log(`projectApi.ts: initiateInstallation function started for Project ID: ${projectId}`);
    try {
        const response = await apiClient.put<InitiateInstallationResponse>(`/projects/${projectId}/initiate-installation`);
        return response.data;
    } catch (error) {
        console.error(`projectApi.ts: apiClient.put('/projects/${projectId}/initiate-installation') FAILED.`, error);
         if (axios.isAxiosError(error)) { /* log details */ }
        throw error;
    }
};

// >>> Function to Assign Project Manager (Ensure 'export' is present) <<<
/**
 * Assigns a Project Manager to a specific project.
 * @param projectId - The ID of the project.
 * @param projectManagerId - The ID of the user to assign as PM.
 * @returns A promise resolving with the success message and updated project info.
 */
export const assignPm = async (projectId: number, projectManagerId: number): Promise<AssignPmResponse> => {
    console.log(`projectApi.ts: assignPm function started for Project ID: ${projectId}, PM ID: ${projectManagerId}`);
    try {
        const payload = { projectManagerId }; // Backend expects this body
        console.log(`projectApi.ts: Attempting apiClient.put('/projects/${projectId}/assign-pm')...`);
        // PUT request to the specific project's assign PM endpoint
        const response = await apiClient.put<AssignPmResponse>(`/projects/${projectId}/assign-pm`, payload);
        console.log(`projectApi.ts: apiClient.put('/projects/${projectId}/assign-pm') SUCCESSFUL.`);
        return response.data; // Return success message and updated project part
    } catch (error) {
        console.error(`projectApi.ts: apiClient.put('/projects/${projectId}/assign-pm') FAILED.`, error);
         if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            console.error("projectApi.ts: Axios error details:", { message: axiosError.message, code: axiosError.code, status: axiosError.response?.status, responseData: axiosError.response?.data });
         }
        throw error; // Re-throw error to be handled by the component
    }
};
// >>> End Function <<<

// Interface for updating project status
export interface UpdateProjectStatusResponse {
    message: string;
    project: {
        id: number;
        status: string;
        projectManager?: {
            id: number;
            name: string | null;
        } | null;
        salesPerson?: {
            id: number;
            name: string | null;
        } | null;
    };
}

/**
 * Update the status of a project
 * @param projectId - The ID of the project
 * @param status - The new status to set
 * @returns Promise with the update response
 */
export const updateProjectStatus = async (projectId: number, status: string): Promise<UpdateProjectStatusResponse> => {
    console.log(`projectApi.ts: updateProjectStatus function started for Project ID: ${projectId}, new status: ${status}`);
    try {
        const response = await apiClient.put<UpdateProjectStatusResponse>(`/projects/${projectId}/status`, { status });
        return response.data;
    } catch (error) {
        console.error(`projectApi.ts: apiClient.put('/projects/${projectId}/status') FAILED.`, error);
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            console.error("projectApi.ts: Axios error details:", {
                message: axiosError.message,
                code: axiosError.code,
                status: axiosError.response?.status,
                responseData: axiosError.response?.data
            });
        }
        throw error;
    }
};

// Interface for acceptance form data
export interface AcceptanceFormData {
    acceptanceDate: string;
    billingStartDate: string;
    customerSignatureUrl: string;
    serviceId?: string;
    commissionedDate?: string;
    signedByName?: string;
    signedByTitle?: string;
    ispRepresentative?: string;
    notes?: string;
}

// Interface for acceptance form response
export interface AcceptanceFormResponse {
    message: string;
    acceptanceForm: {
        id: number;
        acceptanceDate: string;
        billingStartDate: string;
        serviceId: string | null;
        commissionedDate: string | null;
        customerSignature: string;
        signedByName: string | null;
        signedByTitle: string | null;
        ispRepresentative: string | null;
        notes: string | null;
        loggedById: number;
        projectId: number;
    };
    projectStatus: string;
}

/**
 * Submit an acceptance form for a project
 * @param projectId - The ID of the project
 * @param data - The acceptance form data
 * @returns Promise with the acceptance form response
 */
export const submitAcceptanceForm = async (projectId: number, data: AcceptanceFormData): Promise<AcceptanceFormResponse> => {
    console.log(`projectApi.ts: submitAcceptanceForm function started for Project ID: ${projectId}`);
    try {
        const response = await apiClient.post<AcceptanceFormResponse>(`/projects/${projectId}/acceptance`, data);
        return response.data;
    } catch (error) {
        console.error(`projectApi.ts: apiClient.post('/projects/${projectId}/acceptance') FAILED.`, error);
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            console.error("projectApi.ts: Axios error details:", {
                message: axiosError.message,
                code: axiosError.code,
                status: axiosError.response?.status,
                responseData: axiosError.response?.data
            });
        }
        throw error;
    }
};

// Interfaces for deletion requests
export interface DeletionRequestData {
    projectId: number;
    reason: string;
}

export interface DeletionRequestResponse {
    message: string;
    deletionRequest?: {
        id: number;
        projectId: number;
        status: string;
        reason: string;
        requestDate: string;
        project: {
            projectName: string;
        };
    };
}

/**
 * Request deletion of a project
 * @param data - Object containing projectId and reason
 * @returns Promise with the deletion request response
 */
export const requestProjectDeletion = async (data: DeletionRequestData): Promise<DeletionRequestResponse> => {
    console.log(`projectApi.ts: requestProjectDeletion function started for Project ID: ${data.projectId}`);
    try {
        const response = await apiClient.post<DeletionRequestResponse>('/deletion-requests', data);
        return response.data;
    } catch (error) {
        console.error(`projectApi.ts: apiClient.post('/deletion-requests') FAILED.`, error);
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            console.error("projectApi.ts: Axios error details:", {
                message: axiosError.message,
                code: axiosError.code,
                status: axiosError.response?.status,
                responseData: axiosError.response?.data
            });
        }
        throw error;
    }
};

/**
 * Get all pending deletion requests (Admin only)
 * @returns Promise with the list of deletion requests
 */
export const getDeletionRequests = async () => {
    console.log("projectApi.ts: getDeletionRequests function started.");
    try {
        const response = await apiClient.get('/deletion-requests');
        return response.data;
    } catch (error) {
        console.error("projectApi.ts: apiClient.get('/deletion-requests') FAILED.", error);
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            console.error("projectApi.ts: Axios error details:", {
                message: axiosError.message,
                code: axiosError.code,
                status: axiosError.response?.status,
                responseData: axiosError.response?.data
            });
        }
        throw error;
    }
};

/**
 * Approve a deletion request (Admin only)
 * @param requestId - The ID of the deletion request
 * @param comments - Optional comments
 * @returns Promise with the approval response
 */
export const approveDeletionRequest = async (requestId: number, comments?: string) => {
    console.log(`projectApi.ts: approveDeletionRequest function started for Request ID: ${requestId}`);
    try {
        const response = await apiClient.put(`/deletion-requests/${requestId}/approve`, { comments });
        return response.data;
    } catch (error) {
        console.error(`projectApi.ts: apiClient.put('/deletion-requests/${requestId}/approve') FAILED.`, error);
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            console.error("projectApi.ts: Axios error details:", {
                message: axiosError.message,
                code: axiosError.code,
                status: axiosError.response?.status,
                responseData: axiosError.response?.data
            });
        }
        throw error;
    }
};

/**
 * Reject a deletion request (Admin only)
 * @param requestId - The ID of the deletion request
 * @param comments - Required comments explaining the rejection
 * @returns Promise with the rejection response
 */
export const rejectDeletionRequest = async (requestId: number, comments: string) => {
    console.log(`projectApi.ts: rejectDeletionRequest function started for Request ID: ${requestId}`);
    try {
        const response = await apiClient.put(`/deletion-requests/${requestId}/reject`, { comments });
        return response.data;
    } catch (error) {
        console.error(`projectApi.ts: apiClient.put('/deletion-requests/${requestId}/reject') FAILED.`, error);
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            console.error("projectApi.ts: Axios error details:", {
                message: axiosError.message,
                code: axiosError.code,
                status: axiosError.response?.status,
                responseData: axiosError.response?.data
            });
        }
        throw error;
    }
};

// Interfaces for billing operations
export interface BillingInitiateResponse {
    message: string;
    project: {
        id: number;
        projectName: string;
        billingStatus: string;
        billingStartDate?: string;
    };
}

export interface BillingCompleteResponse {
    message: string;
    project: {
        id: number;
        projectName: string;
        billingStatus: string;
    };
}

/**
 * Initiate billing for a completed project
 * @param projectId - The ID of the project
 * @param billingNotes - Optional notes for the billing team
 * @returns Promise with the billing initiation response
 */
export const initiateBilling = async (projectId: number, billingNotes?: string): Promise<BillingInitiateResponse> => {
    console.log(`projectApi.ts: initiateBilling function started for Project ID: ${projectId}`);
    try {
        const response = await apiClient.put<BillingInitiateResponse>(`/billing/${projectId}/initiate`, { billingNotes });
        return response.data;
    } catch (error) {
        console.error(`projectApi.ts: apiClient.put('/billing/${projectId}/initiate') FAILED.`, error);
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            console.error("projectApi.ts: Axios error details:", {
                message: axiosError.message,
                code: axiosError.code,
                status: axiosError.response?.status,
                responseData: axiosError.response?.data
            });
        }
        throw error;
    }
};

/**
 * Mark billing as completed for a project (Finance/Admin only)
 * @param projectId - The ID of the project
 * @param billingReference - Optional reference number for the billing
 * @returns Promise with the billing completion response
 */
export const completeBilling = async (projectId: number, billingReference?: string): Promise<BillingCompleteResponse> => {
    console.log(`projectApi.ts: completeBilling function started for Project ID: ${projectId}`);
    try {
        const response = await apiClient.put<BillingCompleteResponse>(`/billing/${projectId}/complete`, { billingReference });
        return response.data;
    } catch (error) {
        console.error(`projectApi.ts: apiClient.put('/billing/${projectId}/complete') FAILED.`, error);
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            console.error("projectApi.ts: Axios error details:", {
                message: axiosError.message,
                code: axiosError.code,
                status: axiosError.response?.status,
                responseData: axiosError.response?.data
            });
        }
        throw error;
    }
};
