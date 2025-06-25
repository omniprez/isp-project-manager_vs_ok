// src/components/CreateProjectForm.tsx
import React, { useState, useEffect } from 'react';

// Import API function
import { createProject } from '../services/projectApi';

// MUI Imports
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Define props expected by this component
interface CreateProjectFormProps {
  open: boolean; // Controls if the dialog is open
  onClose: (refresh?: boolean) => void; // Function to close the dialog (optional refresh flag)
}

// Define options for Select dropdowns
const projectTypes = ["POC", "New Installation", "Upgrade", "Migration"];
const billingTriggers = ["Upon Commissioning", "Fixed Start Date", "Other"];
const serviceTypes = ["Licensed Microwave", "Unlicensed Microwave", "Fiber Optic", "Other"];

// Define steps for the stepper
const steps = [
  'Project Basics',
  'Customer Information',
  'Service Details',
  'Technical Requirements',
  'Review & Submit'
];

const CreateProjectForm: React.FC<CreateProjectFormProps> = ({ open, onClose }) => {

  // --- State for form fields ---
  const [projectName, setProjectName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [siteA_address, setSiteA_address] = useState('');
  const [siteB_address, setSiteB_address] = useState('');
  const [targetDeliveryDate, setTargetDeliveryDate] = useState(''); // Using text input type='date'
  const [customerContact, setCustomerContact] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [projectType, setProjectType] = useState('');
  const [billingTrigger, setBillingTrigger] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [bandwidth, setBandwidth] = useState('');
  const [slaRequirements, setSlaRequirements] = useState('');
  const [interfaceType, setInterfaceType] = useState('');
  const [redundancy, setRedundancy] = useState(false);
  const [ipRequirements, setIpRequirements] = useState('');
  const [crdNotes, setCrdNotes] = useState(''); // Notes specific to CRD
  // --------------------------

  // --- State for stepper and form control ---
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

   // Function to reset form state
   const resetForm = () => {
        setProjectName(''); setCustomerName(''); setSiteA_address('');
        setSiteB_address(''); setTargetDeliveryDate(''); setCustomerContact('');
        setCustomerPhone(''); setCustomerEmail(''); setProjectType('');
        setBillingTrigger(''); setServiceType(''); setBandwidth('');
        setSlaRequirements(''); setInterfaceType(''); setRedundancy(false);
        setIpRequirements(''); setCrdNotes('');
        setError(''); setLoading(false);
        setActiveStep(0);
   };

   // Reset form fields when dialog opens (triggered by 'open' prop change)
   useEffect(() => {
     if (open) {
       resetForm();
     }
   }, [open]);


  const handleInternalClose = () => {
      // Don't signal refresh on cancel
      onClose(false);
  };

  const handleNext = () => {
    // Validate current step before proceeding
    if (activeStep === 0) {
      if (!projectName || !customerName) {
        setError('Please fill in all required fields in this step');
        return;
      }
    } else if (activeStep === 2) {
      if (!projectType || !billingTrigger || !serviceType) {
        setError('Please select all required service details');
        return;
      }
    }

    setError('');
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setError('');
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError('');
      setLoading(true);

      // Final validation
      if (!projectName || !customerName || !projectType || !billingTrigger || !serviceType) {
         setError('Please fill in all required fields marked with *');
         setLoading(false);
         return;
      }

      // Construct data object for API
      const formData = {
          projectName, customerName, siteA_address, siteB_address,
          targetDeliveryDate: targetDeliveryDate || null,
          customerContact, customerPhone, customerEmail, projectType, billingTrigger,
          serviceType, bandwidth, slaRequirements, interfaceType, redundancy,
          ipRequirements, notes: crdNotes,
      };

      try {
         console.log("Submitting to API:", formData);
         await createProject(formData);
         console.log("API call successful");
         onClose(true);
      } catch (err: any) {
         console.error("Project creation failed:", err);
         const message = err.response?.data?.error || err.message || 'Failed to create project. Please try again.';
         setError(message);
      } finally {
         setLoading(false);
      }
  };

  // Render step content based on active step
  const getStepContent = (step: number) => {
    switch (step) {
      case 0: // Project Basics
        return (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Project Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ p: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Project Name *
                    </Typography>
                    <TextField
                      required
                      fullWidth
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      disabled={loading}
                      autoFocus
                      variant="outlined"
                      placeholder="Enter a unique name for this project"
                      InputProps={{
                        sx: { height: '56px' }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Customer Name *
                    </Typography>
                    <TextField
                      required
                      fullWidth
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      disabled={loading}
                      variant="outlined"
                      placeholder="Enter the customer or organization name"
                      InputProps={{
                        sx: { height: '56px' }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Site A Address
                    </Typography>
                    <TextField
                      fullWidth
                      value={siteA_address}
                      onChange={(e) => setSiteA_address(e.target.value)}
                      disabled={loading}
                      variant="outlined"
                      placeholder="Primary site location"
                      InputProps={{
                        sx: { height: '56px' }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Site B Address
                    </Typography>
                    <TextField
                      fullWidth
                      value={siteB_address}
                      onChange={(e) => setSiteB_address(e.target.value)}
                      disabled={loading}
                      variant="outlined"
                      placeholder="Secondary site location (if applicable)"
                      InputProps={{
                        sx: { height: '56px' }
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        );

      case 1: // Customer Information
        return (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Contact Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Contact Name"
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                    disabled={loading}
                    variant="outlined"
                    helperText="Primary contact person"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Contact Phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    disabled={loading}
                    variant="outlined"
                    helperText="Phone number with country code"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Contact Email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    disabled={loading}
                    variant="outlined"
                    helperText="Email address for project communications"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Target Delivery Date"
                    type="date"
                    value={targetDeliveryDate}
                    onChange={(e) => setTargetDeliveryDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={loading}
                    variant="outlined"
                    helperText="Expected project completion date"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );

      case 2: // Service Details
        return (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Project & Service Details
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ p: 2 }}>
                <Grid container spacing={3}>
                  {/* Project Type */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Project Type *
                    </Typography>
                    <FormControl
                      required
                      disabled={loading}
                      variant="outlined"
                      sx={{
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          height: '56px'
                        }
                      }}
                    >
                      <Select
                        labelId="project-type-label"
                        id="project-type-select"
                        value={projectType}
                        onChange={(e) => setProjectType(e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="" disabled><em>Select Project Type</em></MenuItem>
                        {projectTypes.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Billing Trigger */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Billing Trigger *
                    </Typography>
                    <FormControl
                      required
                      disabled={loading}
                      variant="outlined"
                      sx={{
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          height: '56px'
                        }
                      }}
                    >
                      <Select
                        labelId="billing-trigger-label"
                        id="billing-trigger-select"
                        value={billingTrigger}
                        onChange={(e) => setBillingTrigger(e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="" disabled><em>Select Billing Trigger</em></MenuItem>
                        {billingTriggers.map(trigger => <MenuItem key={trigger} value={trigger}>{trigger}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Service Type */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Service Type *
                    </Typography>
                    <FormControl
                      required
                      disabled={loading}
                      variant="outlined"
                      sx={{
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          height: '56px'
                        }
                      }}
                    >
                      <Select
                        labelId="service-type-label"
                        id="service-type-select"
                        value={serviceType}
                        onChange={(e) => setServiceType(e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="" disabled><em>Select Service Type</em></MenuItem>
                        {serviceTypes.map(service => <MenuItem key={service} value={service}>{service}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Redundancy Checkbox - Below the dropdowns */}
                <Box sx={{ mt: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={redundancy}
                        onChange={(e) => setRedundancy(e.target.checked)}
                        disabled={loading}
                        color="primary"
                        sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                      />
                    }
                    label="Redundancy Required"
                    sx={{ '& .MuiFormControlLabel-label': { fontWeight: 500 } }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        );

      case 3: // Technical Requirements
        return (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Technical Specifications
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ p: 2 }}>
                {/* First row - Single line text fields */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Required Bandwidth
                    </Typography>
                    <TextField
                      fullWidth
                      value={bandwidth}
                      onChange={(e) => setBandwidth(e.target.value)}
                      disabled={loading}
                      variant="outlined"
                      placeholder="e.g., 1 Gbps, 10 Mbps"
                      InputProps={{
                        sx: { height: '56px' }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Interface Type
                    </Typography>
                    <TextField
                      fullWidth
                      value={interfaceType}
                      onChange={(e) => setInterfaceType(e.target.value)}
                      disabled={loading}
                      variant="outlined"
                      placeholder="e.g., Fiber LC, RJ45"
                      InputProps={{
                        sx: { height: '56px' }
                      }}
                    />
                  </Grid>
                </Grid>

                {/* Second row - Multiline text fields */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      SLA Requirements
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={slaRequirements}
                      onChange={(e) => setSlaRequirements(e.target.value)}
                      disabled={loading}
                      variant="outlined"
                      placeholder="Uptime guarantees, response times, etc."
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      IP Requirements
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={ipRequirements}
                      onChange={(e) => setIpRequirements(e.target.value)}
                      disabled={loading}
                      variant="outlined"
                      placeholder="IP addressing needs, subnet requirements"
                    />
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        );

      case 4: // Review & Submit
        return (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Review Project Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ p: 2 }}>
                {/* Additional Notes */}
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Additional Notes
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={crdNotes}
                  onChange={(e) => setCrdNotes(e.target.value)}
                  disabled={loading}
                  variant="outlined"
                  placeholder="Any additional information or special requirements"
                  sx={{ mb: 4 }}
                />

                {/* Project Summary */}
                <Box sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
                    Project Summary
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ '& > *': { mb: 1.5 } }}>
                        <Typography variant="body2"><strong>Project Name:</strong> {projectName || 'Not specified'}</Typography>
                        <Typography variant="body2"><strong>Customer:</strong> {customerName || 'Not specified'}</Typography>
                        <Typography variant="body2"><strong>Project Type:</strong> {projectType || 'Not specified'}</Typography>
                        <Typography variant="body2"><strong>Service Type:</strong> {serviceType || 'Not specified'}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ '& > *': { mb: 1.5 } }}>
                        <Typography variant="body2"><strong>Contact:</strong> {customerContact || 'Not specified'}</Typography>
                        <Typography variant="body2"><strong>Email:</strong> {customerEmail || 'Not specified'}</Typography>
                        <Typography variant="body2"><strong>Target Date:</strong> {targetDeliveryDate || 'Not specified'}</Typography>
                        <Typography variant="body2"><strong>Redundancy:</strong> {redundancy ? 'Yes' : 'No'}</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </CardContent>
          </Card>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleInternalClose}
      PaperProps={{
        component: 'form',
        onSubmit: handleFormSubmit,
      }}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1, pt: 2, px: 3 }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600, fontSize: '1.5rem' }}>
          Create New Project
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        {/* Display error message if any */}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Stepper */}
        <Stepper
          activeStep={activeStep}
          sx={{
            mb: 4,
            mt: 2,
            '& .MuiStepLabel-root': {
              padding: '8px 0'
            },
            '& .MuiStepIcon-root': {
              fontSize: 28,
              '&.Mui-completed': {
                color: '#1976d2'
              },
              '&.Mui-active': {
                color: '#1976d2'
              }
            },
            '& .MuiStepIcon-text': {
              fill: '#fff',
              fontWeight: 'bold'
            },
            '& .MuiStepLabel-label': {
              fontSize: '0.9rem',
              fontWeight: 500,
              '&.Mui-active': {
                fontWeight: 600
              },
              '&.Mui-completed': {
                fontWeight: 600
              }
            }
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step content */}
        {getStepContent(activeStep)}

        {/* Navigation buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            size="large"
            sx={{
              borderRadius: '4px',
              textTransform: 'none',
              px: 3,
              py: 1.5,
              fontSize: '1rem',
              borderColor: '#1976d2',
              color: '#1976d2',
              '&:hover': {
                borderColor: '#1565c0',
                backgroundColor: 'rgba(25, 118, 210, 0.04)'
              }
            }}
          >
            Back
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              sx={{
                borderRadius: '4px',
                textTransform: 'none',
                px: 3,
                py: 1.5,
                fontSize: '1rem',
                minWidth: 120,
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#1565c0'
                }
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Project'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              endIcon={<ArrowForwardIcon />}
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              sx={{
                borderRadius: '4px',
                textTransform: 'none',
                px: 3,
                py: 1.5,
                fontSize: '1rem',
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#1565c0'
                }
              }}
            >
              Next
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectForm;
