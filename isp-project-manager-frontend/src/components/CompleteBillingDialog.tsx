// src/components/CompleteBillingDialog.tsx
import React, { useState } from 'react';

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

// API
import { completeBilling } from '../services/projectApi';

interface CompleteBillingDialogProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  projectId: number;
  projectName: string;
}

const CompleteBillingDialog: React.FC<CompleteBillingDialogProps> = ({
  open,
  onClose,
  projectId,
  projectName
}) => {
  const [billingReference, setBillingReference] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await completeBilling(projectId, billingReference);
      setSuccess('Billing marked as completed successfully.');
      setTimeout(() => {
        onClose(true);
      }, 1500);
    } catch (err: any) {
      console.error('Error completing billing:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to complete billing. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setBillingReference('');
      setError('');
      setSuccess('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: 'success.main', color: 'white', fontWeight: 'bold' }}>
        Complete Billing
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            You are about to mark billing as completed for project <strong>{projectName}</strong>.
            This will update the project's billing status to "Billed".
          </DialogContentText>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <TextField
            autoFocus
            margin="dense"
            id="billingReference"
            label="Billing Reference Number (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={billingReference}
            onChange={(e) => setBillingReference(e.target.value)}
            disabled={isSubmitting || !!success}
          />
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
            color="success"
            variant="contained"
            disabled={isSubmitting || !!success}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            Complete Billing
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CompleteBillingDialog;
