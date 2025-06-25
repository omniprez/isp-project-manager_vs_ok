// src/components/CreatePnlForm.tsx (With API Call)
import React, { useState, useEffect } from 'react';

// MUI Imports
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

// Import API function
import { createPnl } from '../services/projectApi'; // <<< Import createPnl

// Define props expected by this component
interface CreatePnlFormProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  projectId: number;
  boqCost: number; // BOQ cost passed from parent for display
}

const CreatePnlForm: React.FC<CreatePnlFormProps> = ({ open, projectId, boqCost, onClose }) => {

  // --- State for form fields ---
  const [oneTimeRevenue, setOneTimeRevenue] = useState<string>('');
  const [recurringRevenue, setRecurringRevenue] = useState<string>('');
  const [contractTermMonths, setContractTermMonths] = useState<string>('');
  // --------------------------

  // --- State for handling loading/error within the form ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setOneTimeRevenue('');
      setRecurringRevenue('');
      setContractTermMonths('');
      setError('');
      setLoading(false);
    }
  }, [open]);

  const handleInternalClose = () => {
     if (!loading) { onClose(false); } // Close without refreshing
  };

  // --- Updated Submit Handler ---
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true); // Set loading true

    // --- Validation ---
    const otRevenue = parseFloat(oneTimeRevenue);
    const recRevenue = parseFloat(recurringRevenue);
    const term = parseInt(contractTermMonths, 10);

    if (isNaN(otRevenue) || otRevenue < 0 || isNaN(recRevenue) || recRevenue < 0 || isNaN(term) || term <= 0) {
      setError('Please enter valid positive numbers for revenue fields and a positive integer (>0) for contract term.');
      setLoading(false);
      return;
    }
    // -----------------

    // Prepare data for API
    const pnlData = {
      oneTimeRevenue: otRevenue,
      recurringRevenue: recRevenue,
      contractTermMonths: term,
    };

    // --- Actual API Call Logic ---
    try {
      console.log(`CreatePnlForm: Submitting P&L for Project ID ${projectId}:`, pnlData);
      // Call the createPnl API function from projectApi.ts
      await createPnl(projectId, pnlData); // Pass projectId and data
      console.log("CreatePnlForm: API call successful");
      // Signal success and refresh when closing
      onClose(true); // <<< Close dialog and signal refresh to parent

    } catch (err: any) {
      console.error("CreatePnlForm: P&L submission failed:", err);
      // Extract error message from backend response or use generic message
      const message = err.response?.data?.error || err.message || 'Failed to submit P&L.';
      setError(message); // Set error state to display in Alert
    } finally {
      setLoading(false); // Set loading false regardless of outcome
    }
    // ------------------------
  };

  return (
    <Dialog
      open={open}
      onClose={handleInternalClose}
      disableEscapeKeyDown={loading} // Prevent closing while loading
      PaperProps={{ component: 'form', onSubmit: handleFormSubmit }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Submit P&L for Approval</DialogTitle>
      <DialogContent>
         {/* Display form-specific error here */}
         {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

         {/* Display BOQ Cost for reference */}
         <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
             Reference BOQ Cost: ${boqCost?.toFixed(2) ?? 'N/A'}
         </Typography>

         {/* Form Fields Grid */}
         <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
                 <TextField
                    required fullWidth type="number" label="One-Time Revenue" value={oneTimeRevenue}
                    onChange={(e) => setOneTimeRevenue(e.target.value)} disabled={loading}
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, inputProps: { step: "0.01", min: "0" } }}
                    autoFocus
                 />
             </Grid>
             <Grid item xs={12} sm={6}>
                 <TextField
                    required fullWidth type="number" label="Recurring Revenue (MRR)" value={recurringRevenue}
                    onChange={(e) => setRecurringRevenue(e.target.value)} disabled={loading}
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, inputProps: { step: "0.01", min: "0" } }}
                 />
             </Grid>
             <Grid item xs={12}>
                 <TextField
                    required fullWidth type="number" label="Contract Term (Months)" value={contractTermMonths}
                    onChange={(e) => setContractTermMonths(e.target.value)} disabled={loading}
                    inputProps={{ step: "1", min: "1" }}
                 />
             </Grid>
         </Grid>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={handleInternalClose} color="inherit" disabled={loading}> Cancel </Button>
        <Button type="submit" variant="contained" disabled={loading} >
          {loading ? <CircularProgress size={24} /> : 'Submit P&L'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePnlForm;
