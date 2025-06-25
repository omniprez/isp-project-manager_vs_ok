// src/components/ProtectedRoute.tsx
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import AppLayout from './AppLayout';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  console.log(`ProtectedRoute: Rendering for path: ${location.pathname}. Auth Loading: ${loading}, IsLoggedIn: ${isLoggedIn}`);

  if (loading) {
    console.log("ProtectedRoute: Auth context is loading. Rendering spinner.");
    return ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}> <CircularProgress /> </Box> );
  }

  if (!isLoggedIn) {
     console.log(`ProtectedRoute: User not logged in. Redirecting from ${location.pathname} to /login.`);
    return <Navigate to="/login" replace />;
  }

  // If logged in and not loading, wrap children with AppLayout
  console.log(`ProtectedRoute: User is logged in. Returning children with AppLayout for path: ${location.pathname}.`);
  return <AppLayout>{children}</AppLayout>;
};

export default ProtectedRoute;
