// src/components/RejectPnlDialog.tsx
import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

interface RejectPnlDialogProps {
  open: boolean;
  onClose: () => void; // Simple close handler from parent
  // Function passed from parent to execute the rejection API call
  onSubmit: (comments: string) => Promise<void>;
}

const RejectPnlDialog: React.FC<RejectPnlDialogProps> = ({ open, onClose, onSubmit }) => {
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Clear state when dialog opens or closes
  useEffect(() => {
    if (!open) {
      // Delay clearing slightly on close to avoid flash if reopening quickly
      setTimeout(() => {
          setComments('');
          setError('');
          setLoading(false);
      }, 150); // Adjust timing if needed
    } else {
      // Reset immediately on open
       setComments('');
       setError('');
       setLoading(false);
    }
  }, [open]);

  const handleRejectSubmit = async () => {
    // Validate comments are not empty
    if (!comments.trim()) {
      setError('Rejection comments are required.');
      return;
    }
    setError(''); // Clear previous validation errors
    setLoading(true);
    try {
      // Call the onSubmit prop function (which contains the API call logic)
      await onSubmit(comments);
      // If onSubmit succeeds, the parent component's onClose(true) should handle closing
      // No need to call onClose here directly on success, parent handles it.
    } catch (err: any) {
      console.error("RejectPnlDialog: onSubmit prop failed", err);
      // Display the error message thrown by the parent's handler
      setError(err.message || 'Failed to reject P&L.');
      setLoading(false); // Stop loading only on error within dialog submission logic
    }
    // setLoading is set back to false by the useEffect when the dialog closes via onClose()
  };

  const handleInternalClose = () => {
      if (!loading) {
          onClose(); // Call parent's close handler
      }
  }

  return (
    // Prevent closing via backdrop click or escape key while submitting
    <Dialog open={open} onClose={handleInternalClose} disableEscapeKeyDown={loading}>
      <DialogTitle>Reject P&L</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Please provide mandatory comments explaining the reason for rejecting this P&L.
        </DialogContentText>
        {/* Display submission errors */}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          autoFocus
          required
          margin="dense"
          id="reject-comments"
          label="Rejection Comments"
          type="text"
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          disabled={loading} // Disable field while submitting
        />
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={handleInternalClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        {/* Submit button calls the internal handler */}
        <Button onClick={handleRejectSubmit} variant="contained" color="error" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Confirm Rejection'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RejectPnlDialog;
