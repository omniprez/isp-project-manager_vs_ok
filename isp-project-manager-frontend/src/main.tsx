// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import theme from './theme';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <AuthProvider> {/* Manages Login State */}
      <NotificationProvider> {/* Manages Notifications */}
        <ThemeProvider theme={theme}> {/* Provides MUI Theme */}
          <CssBaseline /> {/* Applies Base Styles */}
          <BrowserRouter> {/* Handles Routing */}
            <App /> {/* Main App Component */}
          </BrowserRouter>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  </StrictMode>,
)