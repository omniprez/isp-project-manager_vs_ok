// src/components/UpdateProjectStatusDialog.tsx
import React, { useState } from 'react';

// MUI Components
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import TextField from '@mui/material/TextField';

// API
import { updateProjectStatus } from '../services/projectApi';
import { ProjectStatus } from '../types';

interface UpdateProjectStatusDialogProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  projectId: number;
  currentStatus: string;
}

// Define the valid status transitions based on the current status
const getValidNextStatuses = (currentStatus: string): string[] => {
  switch (currentStatus) {
    case 'Installation Pending':
      return ['In Progress'];
    case 'In Progress':
      return ['Physical Installation Complete'];
    case 'Physical Installation Complete':
      return ['Provisioning Complete'];
    case 'Provisioning Complete':
      return ['Commissioning Complete'];
    case 'Commissioning Complete':
      return ['UAT Pending'];
    case 'UAT Pending':
      return ['UAT Failed', 'Soak Period'];
    case 'UAT Failed':
      return ['UAT Pending', 'In Progress']; // Can retry UAT or go back to implementation
    case 'Soak Period':
      return ['Completed']; // Final step before completion
    default:
      return [];
  }
};

// Installation phase steps for the stepper
const installationSteps = [
  'Installation Pending',
  'In Progress',
  'Physical Installation Complete',
  'Provisioning Complete',
  'Commissioning Complete',
  'UAT Pending',
  'Soak Period',
  'Completed'
];

// Get active step index for the stepper
const getActiveStepIndex = (status: string): number => {
  const index = installationSteps.indexOf(status);
  return index >= 0 ? index : 0;
};

const UpdateProjectStatusDialog: React.FC<UpdateProjectStatusDialogProps> = ({
  open,
  onClose,
  projectId,
  currentStatus
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>('');

  const validNextStatuses = getValidNextStatuses(currentStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStatus) {
      setError('Please select a status.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await updateProjectStatus(projectId, selectedStatus);
      setSuccess(`Project status updated to ${selectedStatus} successfully.`);
      setTimeout(() => {
        onClose(true);
      }, 1500);
    } catch (err: any) {
      console.error('Error updating project status:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to update project status. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedStatus('');
      setNotes('');
      setError('');
      setSuccess('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
        Update Project Status
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Update the project status to track progress through the installation and testing phases.
          </DialogContentText>
          
          {/* Current Status */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Current Status:
            </Typography>
            <Box sx={{ 
              p: 1.5, 
              bgcolor: 'primary.light', 
              color: 'white', 
              borderRadius: 1,
              display: 'inline-block',
              fontWeight: 'bold'
            }}>
              {currentStatus}
            </Box>
          </Box>
          
          {/* Installation Progress Stepper */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom>
              Installation Progress:
            </Typography>
            <Stepper activeStep={getActiveStepIndex(currentStatus)} alternativeLabel>
              {installationSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          {/* Status Selection */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="status-select-label">New Status</InputLabel>
            <Select
              labelId="status-select-label"
              id="status-select"
              value={selectedStatus}
              label="New Status"
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={isSubmitting || !!success || validNextStatuses.length === 0}
            >
              {validNextStatuses.map((status) => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Notes Field */}
          <TextField
            margin="dense"
            id="notes"
            label="Notes (Optional)"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting || !!success}
          />
          
          {validNextStatuses.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No valid status transitions available from the current status.
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleClose} 
            color="inherit" 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            color="primary" 
            variant="contained" 
            disabled={isSubmitting || !selectedStatus || !!success}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            Update Status
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UpdateProjectStatusDialog;
