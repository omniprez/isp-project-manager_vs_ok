// src/services/api.ts (Minimal version for testing getUsers export)
import axios, { AxiosError } from 'axios';

// Interface for User data returned by GET /api/users
// Needs to be exported so AssignPmDialog can import it
export interface UserSummary {
    id: number;
    email: string;
    name: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
}

console.log("api.ts: Minimal script loaded. (Test after #175)");

// Create an Axios instance (Exported for projectApi.ts)
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json', },
});
console.log("api.ts: Axios instance created with baseURL:", apiClient.defaults.baseURL);

// --- Request Interceptor ---
apiClient.interceptors.request.use(
  (config) => {
    console.log("api.ts: Request Interceptor running for URL:", config.url);
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("api.ts: Request Interceptor ERROR:", error);
    return Promise.reject(error);
  }
);
// --- End Interceptor ---


// --- Auth API Functions ---
interface LoginCredentials { email: string; password: string; }

// Response interfaces for auth functions
interface LoginResponse {
    message: string;
    token: string;
    user: {
        id: number;
        email: string;
        name: string | null;
        role: string;
    };
}

/**
 * Authenticates a user with email and password
 * @param credentials - Object containing email and password
 * @returns Promise with token and user data
 */
export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    console.log("api.ts: loginUser function started.");
    try {
        const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
        console.log("api.ts: Login successful.");
        return response.data;
    } catch (error) {
        console.error("api.ts: Login failed.", error);
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            console.error("api.ts: Axios error details:", {
                message: axiosError.message,
                code: axiosError.code,
                status: axiosError.response?.status,
                responseData: axiosError.response?.data
            });
        }
        throw error;
    }
};

interface RegistrationData { email: string; password: string; name?: string; role: string; }
interface RegisteredUser { id: number; email: string; name: string | null; role: string; isActive: boolean; createdAt: string; }

/**
 * Registers a new user
 * @param userData - User registration data
 * @returns Promise with the registered user data
 */
export const registerUser = async (userData: RegistrationData): Promise<RegisteredUser> => {
    console.log("api.ts: registerUser function started.");
    try {
        const response = await apiClient.post<RegisteredUser>('/auth/register', userData);
        console.log("api.ts: Registration successful.");
        return response.data;
    } catch (error) {
        console.error("api.ts: Registration failed.", error);
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            console.error("api.ts: Axios error details:", {
                message: axiosError.message,
                code: axiosError.code,
                status: axiosError.response?.status,
                responseData: axiosError.response?.data
            });
        }
        throw error;
    }
};
// --- End Auth Functions ---


// >>> Function to Get Users <<<
/**
 * Fetches a list of users, optionally filtering by role(s).
 * @param roles - Optional array of role strings to filter by.
 * @returns A promise that resolves with an array of UserSummary objects.
 */
export const getUsers = async (roles?: string[]): Promise<UserSummary[]> => {
    console.log("api.ts: getUsers function started. Roles filter:", roles);
    let queryString = '';
    if (roles && roles.length > 0) {
        const params = new URLSearchParams();
        roles.forEach(role => params.append('role', role));
        queryString = `?${params.toString()}`;
    }
    const url = `/users${queryString}`;
    console.log(`api.ts: Attempting apiClient.get('${url}')...`);
    try {
        const response = await apiClient.get<UserSummary[]>(url);
        console.log(`api.ts: apiClient.get('${url}') SUCCESSFUL. Found ${response.data.length} users.`);
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error(`api.ts: apiClient.get('${url}') FAILED.`, error);
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            console.error("api.ts: Axios error details:", {
                message: axiosError.message,
                code: axiosError.code,
                status: axiosError.response?.status,
                responseData: axiosError.response?.data
            });
        }
        return []; // Return empty array on failure
    }
};
// >>> End Function <<<

// *** No default export needed ***
