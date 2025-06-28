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
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

// API
import { initiateBilling } from '../services/projectApi';

interface SiteBillingInfo {
  siteName: string;
  bandwidth: string;
  installationCost: string;
  monthlyBilling: string;
  contractTerms: string;
}

interface InitiateBillingDialogProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  projectId: number;
  projectName: string;
  crdData: any; // Should be typed
  pnlData: any; // Should be typed
  sites: SiteBillingInfo[];
}

const InitiateBillingDialog: React.FC<InitiateBillingDialogProps> = ({
  open,
  onClose,
  projectId,
  projectName,
  crdData,
  pnlData,
  sites
}) => {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [billingStartDate, setBillingStartDate] = useState('');
  const [billingNotes, setBillingNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Defensive: always use an array for sites
  const safeSites = Array.isArray(sites) ? sites : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Validation
    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim() || !billingStartDate) {
      setError('Please fill all compulsory fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      // Send all data to backend (update API as needed)
      const payload = {
        contactName,
        contactEmail,
        contactPhone,
        billingStartDate,
        billingNotes,
        sites
      };
      await initiateBilling(projectId, { billingData: payload }); // Wrap payload for backend compatibility
      setSuccess('Billing initiated successfully. The finance team has been notified.');
      setTimeout(() => {
        onClose(true);
      }, 1500);
    } catch (err: any) {
      setError('Failed to initiate billing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setBillingStartDate('');
      setBillingNotes('');
      setError('');
      setSuccess('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
        Initiate Billing
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            You are about to initiate billing for project <strong>{projectName}</strong>.<br />
            Please fill in the required billing contact and site information below.
          </DialogContentText>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <TextField
              required
              label="Accounts Contact Person Name"
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              fullWidth
              sx={{ flex: 1, minWidth: 220 }}
              disabled={isSubmitting || !!success}
            />
            <TextField
              required
              label="Email"
              type="email"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              fullWidth
              sx={{ flex: 1, minWidth: 220 }}
              disabled={isSubmitting || !!success}
            />
            <TextField
              required
              label="Phone Number"
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)}
              fullWidth
              sx={{ flex: 1, minWidth: 180 }}
              disabled={isSubmitting || !!success}
            />
            <TextField
              required
              label="Billing Start Date"
              type="date"
              value={billingStartDate}
              onChange={e => setBillingStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ flex: 1, minWidth: 180 }}
              disabled={isSubmitting || !!success}
            />
          </Box>
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
            Billing Information
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Site Name</TableCell>
                  <TableCell>Bandwidth</TableCell>
                  <TableCell>Installation Cost</TableCell>
                  <TableCell>Monthly Billing</TableCell>
                  <TableCell>Contract Terms</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {safeSites.map((site, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{site.siteName}</TableCell>
                    <TableCell>{site.bandwidth}</TableCell>
                    <TableCell>{site.installationCost}</TableCell>
                    <TableCell>{site.monthlyBilling}</TableCell>
                    <TableCell>{site.contractTerms}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TextField
            margin="dense"
            id="billingNotes"
            label="Notes for Finance Team (Optional)"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={billingNotes}
            onChange={e => setBillingNotes(e.target.value)}
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
