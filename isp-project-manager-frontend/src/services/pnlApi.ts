    // src/services/pnlApi.ts
    import axios, { AxiosError } from 'axios';
    // Import the shared Axios instance configured with interceptor
    import { apiClient } from './api'; // Ensure apiClient is exported from api.ts

    // Define expected response type after approve/reject (adjust based on backend)
    interface UpdatedPnlResponse {
        id: number;
        projectId: number;
        approvalStatus: string; // 'Approved' or 'Rejected'
        approverId: number | null;
        approvalDate: string | null;
        adminComments: string | null;
        // Include other relevant PnL fields returned by the backend PUT endpoints
        boqCost?: number;
        oneTimeRevenue?: number | null;
        recurringRevenue?: number | null;
        contractTermMonths?: number | null;
        grossProfit?: number | null;
        grossMargin?: number | null;
        submittedById?: number;
    }

    /**
     * Approves a P&L statement.
     * @param pnlId - The ID of the PnL record to approve.
     * @param comments - Optional comments from the approver.
     * @returns A promise that resolves with the updated PnL details.
     */
    export const approvePnl = async (pnlId: number, comments?: string): Promise<UpdatedPnlResponse> => {
        console.log(`pnlApi.ts: approvePnl function started for PnL ID: ${pnlId}`);
        try {
            const payload = comments ? { adminComments: comments } : {};
            console.log(`pnlApi.ts: Attempting apiClient.put('/pnl/${pnlId}/approve')...`);
            const response = await apiClient.put<UpdatedPnlResponse>(`/pnl/${pnlId}/approve`, payload);
            console.log(`pnlApi.ts: apiClient.put('/pnl/${pnlId}/approve') SUCCESSFUL.`);
            return response.data;
        } catch (error) {
            console.error(`pnlApi.ts: apiClient.put('/pnl/${pnlId}/approve') FAILED.`, error);
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                console.error("pnlApi.ts: Axios error details:", { message: axiosError.message, code: axiosError.code, status: axiosError.response?.status, responseData: axiosError.response?.data });
            }
            throw error; // Re-throw error
        }
    };

    /**
     * Rejects a P&L statement.
     * @param pnlId - The ID of the PnL record to reject.
     * @param comments - Mandatory comments explaining the rejection.
     * @returns A promise that resolves with the updated PnL details.
     */
    export const rejectPnl = async (pnlId: number, comments: string): Promise<UpdatedPnlResponse> => {
        console.log(`pnlApi.ts: rejectPnl function started for PnL ID: ${pnlId}`);
        if (!comments || comments.trim() === '') {
            throw new Error("Rejection comments are required.");
        }
        try {
            const payload = { adminComments: comments };
            console.log(`pnlApi.ts: Attempting apiClient.put('/pnl/${pnlId}/reject')...`);
            const response = await apiClient.put<UpdatedPnlResponse>(`/pnl/${pnlId}/reject`, payload);
            console.log(`pnlApi.ts: apiClient.put('/pnl/${pnlId}/reject') SUCCESSFUL.`);
            return response.data;
        } catch (error) {
            console.error(`pnlApi.ts: apiClient.put('/pnl/${pnlId}/reject') FAILED.`, error);
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                console.error("pnlApi.ts: Axios error details:", { message: axiosError.message, code: axiosError.code, status: axiosError.response?.status, responseData: axiosError.response?.data });
            }
            throw error; // Re-throw error
        }
    };

    /**
     * Interface for the response when marking a P&L for review
     */
    export interface ReviewPnlResponse {
        message: string;
        pnl: {
            id: number;
            approvalStatus: string;
            submittedBy?: {
                id: number;
                name: string | null;
                email: string;
            };
        };
    }

    /**
     * Mark a rejected P&L for review
     * @param pnlId - The ID of the P&L to mark for review
     * @param comments - Optional comments about the review
     * @returns Promise with the review response
     */
    export const reviewPnl = async (pnlId: number, comments?: string): Promise<ReviewPnlResponse> => {
        console.log(`pnlApi.ts: reviewPnl function started for PnL ID: ${pnlId}`);
        try {
            const response = await apiClient.put<ReviewPnlResponse>(`/pnl/${pnlId}/review`, { comments });
            return response.data;
        } catch (error) {
            console.error(`pnlApi.ts: apiClient.put('/pnl/${pnlId}/review') FAILED.`, error);
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                console.error("pnlApi.ts: Axios error details:", { message: axiosError.message, code: axiosError.code, status: axiosError.response?.status, responseData: axiosError.response?.data });
            }
            throw error;
        }
    };

    /**
     * Interface for updating BOQ for a P&L under review
     */
    export interface UpdateBoqForReviewData {
        totalCost: number;
        notes?: string;
    }

    /**
     * Interface for the response when updating BOQ for a P&L under review
     */
    export interface UpdateBoqForReviewResponse {
        message: string;
        result: {
            boq: {
                id: number;
                totalCost: number;
                notes: string | null;
                datePrepared: string;
            };
            pnl: {
                id: number;
                boqCost: number;
                grossProfit: number | null;
                grossMargin: number | null;
                approvalStatus: string;
            };
        };
    }

    /**
     * Update BOQ for a P&L under review
     * @param pnlId - The ID of the P&L
     * @param data - The updated BOQ data
     * @returns Promise with the update response
     */
    export const updateBoqForReview = async (pnlId: number, data: UpdateBoqForReviewData): Promise<UpdateBoqForReviewResponse> => {
        console.log(`pnlApi.ts: updateBoqForReview function started for PnL ID: ${pnlId}`);
        try {
            const response = await apiClient.put<UpdateBoqForReviewResponse>(`/pnl/${pnlId}/update-boq`, data);
            return response.data;
        } catch (error) {
            console.error(`pnlApi.ts: apiClient.put('/pnl/${pnlId}/update-boq') FAILED.`, error);
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                console.error("pnlApi.ts: Axios error details:", { message: axiosError.message, code: axiosError.code, status: axiosError.response?.status, responseData: axiosError.response?.data });
            }
            throw error;
        }
    };
