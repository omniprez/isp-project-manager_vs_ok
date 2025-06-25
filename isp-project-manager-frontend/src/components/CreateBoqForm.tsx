// src/components/CreateBoqForm.tsx (With API Call)
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

// Import API function
import { createBoq } from '../services/projectApi'; // <<< Import createBoq

// Define props expected by this component
interface CreateBoqFormProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  projectId: number; // ID of the project to associate BOQ with
}

const CreateBoqForm: React.FC<CreateBoqFormProps> = ({ open, projectId, onClose }) => {

  // State for form fields
  const [totalCost, setTotalCost] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // State for handling loading and errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTotalCost('');
      setNotes('');
      setError('');
      setLoading(false);
    }
  }, [open]);

  const handleInternalClose = () => {
    onClose(false); // Close without refreshing
  };

  // --- Updated Submit Handler ---
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    const cost = parseFloat(totalCost);
    if (isNaN(cost) || cost < 0) {
      setError('Total Cost must be a valid positive number.');
      setLoading(false);
      return;
    }

    // Prepare data for API
    const boqData = {
      totalCost: cost,
      notes: notes || null, // Send null if notes are empty
    };

    // --- Actual API Call Logic ---
    try {
      console.log(`CreateBoqForm: Submitting BOQ for Project ID ${projectId}:`, boqData);
      // Call the createBoq API function from projectApi.ts
      await createBoq(projectId, boqData); // Pass projectId and data
      console.log("CreateBoqForm: API call successful");
      // Signal success and refresh when closing
      onClose(true); // <<< Close dialog and signal refresh to parent

    } catch (err: any) {
      console.error("CreateBoqForm: BOQ creation failed:", err);
      // Extract error message from backend response or use generic message
      const message = err.response?.data?.error || err.message || 'Failed to create BOQ.';
      setError(message); // Set error state to display in Alert
    } finally {
      setLoading(false); // Set loading false regardless of outcome
    }
    // ------------------------
  };

  return (
    <Dialog
      open={open}
      onClose={handleInternalClose} // Use internal close for backdrop click etc.
      PaperProps={{ component: 'form', onSubmit: handleFormSubmit }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Create Bill of Quantities (BOQ)</DialogTitle>
      <DialogContent>
         {/* Display form-specific error here */}
         {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

         {/* Form Fields Grid */}
         <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
                 <TextField
                    required
                    fullWidth
                    type="number"
                    label="Total Estimated Cost ($)"
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                    disabled={loading}
                    inputProps={{ step: "0.01", min: "0" }}
                    autoFocus // Focus the first field
                 />
             </Grid>
             <Grid item xs={12}>
                 <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="BOQ Notes (Optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={loading}
                 />
             </Grid>
         </Grid>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={handleInternalClose} color="inherit" disabled={loading}> Cancel </Button>
        <Button type="submit" variant="contained" disabled={loading} >
          {loading ? <CircularProgress size={24} /> : 'Create BOQ'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateBoqForm;
