// src/components/ReviewPnlDialog.tsx
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

// API
import { reviewPnl } from '../services/pnlApi';

interface ReviewPnlDialogProps {
  open: boolean;
  onClose: () => void;
  pnlId: number;
  rejectionReason: string | null;
}

const ReviewPnlDialog: React.FC<ReviewPnlDialogProps> = ({ 
  open, 
  onClose, 
  pnlId,
  rejectionReason
}) => {
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');
    setIsSubmitting(true);

    try {
      const response = await reviewPnl(pnlId, comments);
      setSuccess('P&L marked for review successfully. You can now update the BOQ to improve the project financials.');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error marking P&L for review:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to mark P&L for review. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setComments('');
      setError('');
      setSuccess('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: 'warning.light', color: 'white', fontWeight: 'bold' }}>
        Review Rejected P&L
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            You are marking this rejected P&L for review. This will allow you to update the BOQ and resubmit the P&L for approval.
          </DialogContentText>
          
          {rejectionReason && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" color="white">
                Rejection Reason:
              </Typography>
              <Typography variant="body2" color="white">
                {rejectionReason}
              </Typography>
            </Box>
          )}
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <TextField
            autoFocus
            margin="dense"
            id="comments"
            label="Review Comments (Optional)"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
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
            color="warning" 
            variant="contained" 
            disabled={isSubmitting || !!success}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            Mark for Review
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ReviewPnlDialog;
