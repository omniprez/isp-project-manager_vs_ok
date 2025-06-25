// src/pages/LoginPage.tsx (Includes link to Register)
import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom'; // Import RouterLink

// Import Auth Context hook
import { useAuth } from '../context/AuthContext';

// MUI Imports
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';

const LoginPage: React.FC = () => {
  // Local state for form inputs
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Get auth state and functions from context
  const { login, loading, authError, isLoggedIn } = useAuth();
  const navigate = useNavigate(); // Hook for navigation

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      console.log("LoginPage: Already logged in, redirecting to dashboard.");
      navigate('/dashboard'); // Or '/'
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default browser form submission
    if (!email || !password) {
        console.log("LoginPage: Email or password empty.");
        // Optionally set a local error state here if desired, or rely on context error
        return;
    }
    try {
      console.log("LoginPage: Attempting login via context...");
      await login({ email, password });
      // If login succeeds (doesn't throw), navigate
      console.log("LoginPage: Login successful, navigating to dashboard.");
       navigate('/dashboard');

    } catch (error) {
      // Error handling is managed within AuthContext's login function
      // which sets the authError state displayed by the Alert below.
      console.error("LoginPage: Login attempt failed (error caught from context):", error);
    }
  };

   // Prevent rendering form if already logged in (handles edge case before redirect effect runs)
   if (isLoggedIn) {
     return null; // Or a loading indicator/message
   }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main', width: 56, height: 56 }}>
            <LockOutlinedIcon fontSize="large" />
          </Avatar>
          <Typography component="h1" variant="h4" sx={{ mb: 2, fontWeight: 500 }}>
            Welcome Back
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to access your ISP Project Manager account
          </Typography>

          {/* Display error message FROM CONTEXT if any */}
          {authError && !loading && (
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              {authError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              variant="outlined"
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                mb: 2,
                fontSize: '1rem',
                fontWeight: 500,
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  variant="body2"
                  sx={{ fontWeight: 500 }}
                >
                  Register here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
