// src/components/AcceptanceFormDialog.tsx
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
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// API
import { submitAcceptanceForm, AcceptanceFormData } from '../services/projectApi';

interface AcceptanceFormDialogProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  projectId: number;
  projectName: string;
}

const AcceptanceFormDialog: React.FC<AcceptanceFormDialogProps> = ({
  open,
  onClose,
  projectId,
  projectName
}) => {
  const [formData, setFormData] = useState<AcceptanceFormData>({
    acceptanceDate: new Date().toISOString().split('T')[0],
    billingStartDate: new Date().toISOString().split('T')[0],
    customerSignatureUrl: 'signature-placeholder.jpg', // In a real app, this would be uploaded
    serviceId: '',
    commissionedDate: '',
    signedByName: '',
    signedByTitle: '',
    ispRepresentative: '',
    notes: ''
  });
  
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.acceptanceDate || !formData.billingStartDate) {
      setError('Acceptance date and billing start date are required.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await submitAcceptanceForm(projectId, formData);
      setSuccess('Customer acceptance form submitted successfully. Project is now marked as completed.');
      setTimeout(() => {
        onClose(true);
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting acceptance form:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to submit acceptance form. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError('');
      setSuccess('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: 'success.main', color: 'white', fontWeight: 'bold' }}>
        Customer Acceptance Form
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Complete this form to record customer acceptance for project <strong>{projectName}</strong>. 
            This will mark the project as completed and trigger billing.
          </DialogContentText>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && (
            <Alert 
              severity="success" 
              sx={{ mb: 2 }}
              icon={<CheckCircleIcon fontSize="inherit" />}
            >
              {success}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            {/* Left Column */}
            <Grid item xs={12} md={6}>
              <TextField
                margin="dense"
                id="serviceId"
                name="serviceId"
                label="Service ID"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.serviceId}
                onChange={handleChange}
                disabled={isSubmitting || !!success}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Unique identifier for this service in the billing system">
                        <IconButton edge="end" size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                margin="dense"
                id="commissionedDate"
                name="commissionedDate"
                label="Commissioned Date"
                type="date"
                fullWidth
                variant="outlined"
                value={formData.commissionedDate}
                onChange={handleChange}
                disabled={isSubmitting || !!success}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
              
              <TextField
                margin="dense"
                id="acceptanceDate"
                name="acceptanceDate"
                label="Acceptance Date"
                type="date"
                fullWidth
                variant="outlined"
                value={formData.acceptanceDate}
                onChange={handleChange}
                disabled={isSubmitting || !!success}
                required
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
              
              <TextField
                margin="dense"
                id="billingStartDate"
                name="billingStartDate"
                label="Billing Start Date"
                type="date"
                fullWidth
                variant="outlined"
                value={formData.billingStartDate}
                onChange={handleChange}
                disabled={isSubmitting || !!success}
                required
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            {/* Right Column */}
            <Grid item xs={12} md={6}>
              <TextField
                margin="dense"
                id="signedByName"
                name="signedByName"
                label="Customer Name"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.signedByName}
                onChange={handleChange}
                disabled={isSubmitting || !!success}
                sx={{ mb: 2 }}
              />
              
              <TextField
                margin="dense"
                id="signedByTitle"
                name="signedByTitle"
                label="Customer Title/Position"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.signedByTitle}
                onChange={handleChange}
                disabled={isSubmitting || !!success}
                sx={{ mb: 2 }}
              />
              
              <TextField
                margin="dense"
                id="ispRepresentative"
                name="ispRepresentative"
                label="ISP Representative"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.ispRepresentative}
                onChange={handleChange}
                disabled={isSubmitting || !!success}
                sx={{ mb: 2 }}
              />
              
              <Box 
                sx={{ 
                  border: '1px dashed', 
                  borderColor: 'divider', 
                  p: 2, 
                  textAlign: 'center',
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  mb: 2
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Customer Signature
                </Typography>
                <Box 
                  sx={{ 
                    height: '80px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    [Signature Placeholder]
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  In a real app, this would be a signature upload or drawing component
                </Typography>
              </Box>
            </Grid>
            
            {/* Full Width Notes */}
            <Grid item xs={12}>
              <TextField
                margin="dense"
                id="notes"
                name="notes"
                label="Additional Notes"
                type="text"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={formData.notes}
                onChange={handleChange}
                disabled={isSubmitting || !!success}
              />
            </Grid>
          </Grid>
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
            disabled={isSubmitting || !formData.acceptanceDate || !formData.billingStartDate || !!success}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            Submit Acceptance Form
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AcceptanceFormDialog;
