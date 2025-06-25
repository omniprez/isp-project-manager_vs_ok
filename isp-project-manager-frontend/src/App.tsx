// src/App.tsx (Includes all routes including Project Detail)
import { Routes, Route } from 'react-router-dom';

// Import Page Components
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RegisterPage from './pages/RegisterPage';
import ProjectDetailPage from './pages/ProjectDetailPage'; // Import Detail Page

// Import ProtectedRoute component
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Routes */}
      <Route
        path="/" // Root path
        element={
          <ProtectedRoute> {/* Wrap DashboardPage */}
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute> {/* Wrap DashboardPage */}
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      {/* Route for Project Detail */}
      <Route
        path="/projects/:id" // Route parameter ':id'
        element={
          <ProtectedRoute> {/* Wrap ProjectDetailPage */}
            <ProjectDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all for Not Found (implement later properly) */}
      {/* For now, fallback to dashboard if logged in */}
      <Route
         path="*"
         element={
           <ProtectedRoute>
             <DashboardPage />
           </ProtectedRoute>
         }
       />

    </Routes>
  );
}

export default App;
