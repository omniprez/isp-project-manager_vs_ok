// src/components/DeleteProjectDialog.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// MUI Components
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// API
import { requestProjectDeletion } from '../services/projectApi';

interface DeleteProjectDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
}

const DeleteProjectDialog: React.FC<DeleteProjectDialogProps> = ({
  open,
  onClose,
  projectId,
  projectName
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'ADMIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError('Please provide a reason for deletion.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await requestProjectDeletion({ projectId, reason });

      if (isAdmin) {
        setSuccess('Project deleted successfully.');
        setTimeout(() => {
          onClose();
          navigate('/dashboard');
        }, 1500);
      } else {
        setSuccess('Deletion request submitted successfully. Awaiting admin approval.');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error requesting project deletion:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to process deletion request. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      setError('');
      setSuccess('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: 'error.light', color: 'white', fontWeight: 'bold' }}>
        {isAdmin ? 'Delete Project' : 'Request Project Deletion'}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {isAdmin ? (
              <>
                You are about to permanently delete the project <strong>{projectName}</strong>.
                This action cannot be undone.
              </>
            ) : (
              <>
                You are requesting to delete the project <strong>{projectName}</strong>.
                This request will need to be approved by an administrator.
              </>
            )}
          </DialogContentText>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <TextField
            autoFocus
            margin="dense"
            id="reason"
            label={isAdmin ? "Reason for deletion" : "Reason for deletion request"}
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSubmitting || !!success}
            required
          />

          {isAdmin && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="error.main" fontWeight="bold">
                Warning: This will permanently delete all project data including CRD, BOQ, P&L, and acceptance forms.
              </Typography>
            </Box>
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
            color="error"
            variant="contained"
            disabled={isSubmitting || !reason.trim() || !!success}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isAdmin ? 'Delete Project' : 'Submit Request'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DeleteProjectDialog;
