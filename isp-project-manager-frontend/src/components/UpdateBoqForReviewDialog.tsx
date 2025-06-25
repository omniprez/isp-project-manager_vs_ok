// src/components/UpdateBoqForReviewDialog.tsx
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
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

// API
import { updateBoqForReview, UpdateBoqForReviewData } from '../services/pnlApi';

interface UpdateBoqForReviewDialogProps {
  open: boolean;
  onClose: () => void;
  pnlId: number;
  currentBoqCost: number;
  currentBoqNotes: string | null;
}

const UpdateBoqForReviewDialog: React.FC<UpdateBoqForReviewDialogProps> = ({ 
  open, 
  onClose, 
  pnlId,
  currentBoqCost,
  currentBoqNotes
}) => {
  const [totalCost, setTotalCost] = useState(currentBoqCost.toString());
  const [notes, setNotes] = useState(currentBoqNotes || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const costValue = parseFloat(totalCost);
    if (isNaN(costValue) || costValue <= 0) {
      setError('Please enter a valid positive number for total cost.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const data: UpdateBoqForReviewData = {
        totalCost: costValue,
        notes: notes.trim() || undefined
      };
      
      const response = await updateBoqForReview(pnlId, data);
      setSuccess('BOQ updated successfully. P&L has been recalculated and is now pending approval again.');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error updating BOQ for review:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to update BOQ. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setTotalCost(currentBoqCost.toString());
      setNotes(currentBoqNotes || '');
      setError('');
      setSuccess('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: 'primary.light', color: 'white', fontWeight: 'bold' }}>
        Update BOQ for Review
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Update the BOQ cost and notes to improve the project financials. This will recalculate the P&L and resubmit it for approval.
          </DialogContentText>
          
          <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1, color: 'white' }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Current BOQ Cost: ${currentBoqCost.toFixed(2)}
            </Typography>
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <TextField
            autoFocus
            margin="dense"
            id="totalCost"
            label="New Total Cost"
            type="number"
            fullWidth
            variant="outlined"
            value={totalCost}
            onChange={(e) => setTotalCost(e.target.value)}
            disabled={isSubmitting || !!success}
            required
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            id="notes"
            label="BOQ Notes"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting || !!success}
            placeholder="Explain the changes made to the BOQ"
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
            disabled={isSubmitting || !!success || !totalCost.trim()}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            Update BOQ
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UpdateBoqForReviewDialog;
