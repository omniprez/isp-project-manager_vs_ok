// src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

// Import API function
import { registerUser } from '../services/api'; // Import from correct location

// MUI Imports
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';

// Define roles available in the frontend (match backend Role enum)
const availableRoles = [
    "SALES", "PROJECTS_ADMIN", "PROJECTS_SURVEY", "PROJECTS_INSTALL",
    "PROJECTS_COMMISSIONING", "ADMIN", "FINANCE", "READ_ONLY"
];

const RegisterPage: React.FC = () => {
  // State for form inputs
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  // State for handling loading and messages
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const navigate = useNavigate();

  const handleRoleChange = (event: SelectChangeEvent) => {
    setSelectedRole(event.target.value as string);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email || !password || !selectedRole) {
      setError('Email, Password, and Role are required.');
      setLoading(false);
      return;
    }

    try {
      // Call the registerUser API function
      const registeredUserData = await registerUser({
        email,
        password,
        name: name || undefined, // Send name only if provided
        role: selectedRole,
      });

      setSuccess(`User ${registeredUserData.email} registered successfully! You can now log in.`);
      // Clear the form on success
      setName(''); setEmail(''); setPassword(''); setSelectedRole('');
      // Optionally navigate to login after a short delay
      // setTimeout(() => navigate('/login'), 2000);

    } catch (err: any) {
      console.error('Registration failed:', err);
      const message = err.response?.data?.error || err.message || 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <PersonAddIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Register New User
        </Typography>
        {/* Display feedback messages */}
        {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ width: '100%', mt: 2 }}>{success}</Alert>}

        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoComplete="name" name="name" fullWidth id="name"
                label="Full Name (Optional)" autoFocus value={name}
                onChange={(e) => setName(e.target.value)} disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required fullWidth id="email" label="Email Address"
                name="email" autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)} disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required fullWidth name="password" label="Password"
                type="password" id="password" autoComplete="new-password" value={password}
                onChange={(e) => setPassword(e.target.value)} disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
               <FormControl fullWidth required disabled={loading}>
                 <InputLabel id="role-select-label">Role</InputLabel>
                 <Select
                   labelId="role-select-label" id="role-select" value={selectedRole}
                   label="Role" onChange={handleRoleChange}
                 >
                   <MenuItem value="" disabled><em>Select a Role</em></MenuItem>
                   {availableRoles.map((role) => (
                     <MenuItem key={role} value={role}>{role}</MenuItem>
                   ))}
                 </Select>
               </FormControl>
            </Grid>
          </Grid>
          <Button
            type="submit" fullWidth variant="contained"
            sx={{ mt: 3, mb: 2 }} disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Register'}
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterPage;
