// src/components/InitiateBillingDialog.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
import { initiateBilling } from '../services/projectApi';

interface InitiateBillingDialogProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  projectId: number;
  projectName: string;
  billingStartDate?: string;
}

const InitiateBillingDialog: React.FC<InitiateBillingDialogProps> = ({
  open,
  onClose,
  projectId,
  projectName,
  billingStartDate
}) => {
  const [billingNotes, setBillingNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await initiateBilling(projectId, billingNotes);
      setSuccess('Billing initiated successfully. The finance team has been notified.');
      setTimeout(() => {
        onClose(true);
      }, 1500);
    } catch (err: any) {
      console.error('Error initiating billing:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to initiate billing. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setBillingNotes('');
      setError('');
      setSuccess('');
      onClose();
    }
  };

  const formattedBillingDate = billingStartDate 
    ? new Date(billingStartDate).toLocaleDateString() 
    : 'Not specified';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
        Initiate Billing
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            You are about to initiate billing for project <strong>{projectName}</strong>.
            This will notify the finance team to start the billing process.
          </DialogContentText>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Billing Start Date: <strong>{formattedBillingDate}</strong>
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <TextField
            autoFocus
            margin="dense"
            id="billingNotes"
            label="Notes for Finance Team (Optional)"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={billingNotes}
            onChange={(e) => setBillingNotes(e.target.value)}
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
            color="primary"
            variant="contained"
            disabled={isSubmitting || !!success}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            Initiate Billing
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default InitiateBillingDialog;
