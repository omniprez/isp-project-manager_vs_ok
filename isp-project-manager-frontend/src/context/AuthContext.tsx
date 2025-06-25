// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
// Import the specific login function, adjust path if needed
import { loginUser as apiLogin } from '../services/api'; // Assuming loginUser is in api.ts

// Define the shape of the user object we'll store
// Ensure this matches the user object structure returned by your login/register API
interface User {
  id: number;
  email: string;
  name: string | null;
  role: string; // Consider using the Role enum from backend if shared types possible
}

// Define the shape of the context value
interface AuthContextType {
  isLoggedIn: boolean;
  token: string | null;
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<void>; // Make login async
  logout: () => void;
  loading: boolean; // Add loading state for initial check
  authError: string | null; // Add error state
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Start loading initially
  const [authError, setAuthError] = useState<string | null>(null);

  // Effect to check for token in local storage on initial load
  useEffect(() => {
    setLoading(true);
    console.log("AuthProvider: Checking local storage for token/user...");
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    if (storedToken && storedUser) {
      console.log("AuthProvider: Found token and user in storage.");
      setToken(storedToken);
      try {
          setUser(JSON.parse(storedUser));
      } catch (e) {
          console.error("AuthProvider: Failed to parse stored user data", e);
          // Clear invalid storage if parsing fails
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
      }
    } else {
        console.log("AuthProvider: No token/user found in storage.");
    }
    setLoading(false); // Finished initial check
  }, []); // Empty dependency array: runs only once on mount

  // Login function
  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true); // Use context loading state
    setAuthError(null); // Clear previous errors
    console.log("AuthContext: login function called.");
    try {
      // Call the API service login function
      const data = await apiLogin(credentials); // data should contain { token, user }
      console.log("AuthContext: apiLogin returned:", data);

      // Check if response data, token, and user exist
      if (data && data.token && data.user) {
        console.log("AuthContext: Login successful, setting token and user.");
        setToken(data.token);
        setUser(data.user);
        // Store token and user info in local storage for persistence
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('authUser', JSON.stringify(data.user)); // Store user as string
      } else {
         // This case handles if backend response is missing expected fields
         console.error('AuthContext: Login response missing token or user data.', data);
         throw new Error('Login response did not contain token or user data.');
      }
    } catch (error: any) {
      console.error('AuthContext: Login failed:', error);
      // Extract error message from Axios response if possible
      const message = error.response?.data?.error || error.message || 'Login failed. Please try again.';
      setAuthError(message);
      // Ensure token/user are cleared on failure
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      setToken(null);
      setUser(null);
      throw error; // Re-throw so the component knows login failed
    } finally {
      setLoading(false); // Ensure loading is set to false
      console.log("AuthContext: login function finished.");
    }
  };

  // Logout function
  const logout = () => {
    console.log("AuthContext: logout function called.");
    try {
      // Clear state
      setToken(null);
      setUser(null);

      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');

      // Clear any other auth-related data if needed
      // e.g., sessionStorage.clear();

      console.log("AuthContext: User successfully logged out.");
    } catch (error) {
      console.error("AuthContext: Error during logout:", error);
      // Still attempt to clear critical auth data even if there was an error
      setToken(null);
      setUser(null);
    }
  };

  // Determine login status based on token AND user object presence
  const isLoggedIn = !!token && !!user;

  // Provide the context value to children
  const value = {
    isLoggedIn,
    token,
    user,
    login,
    logout,
    loading, // Provide loading state from context
    authError // Provide error state from context
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to easily consume the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
