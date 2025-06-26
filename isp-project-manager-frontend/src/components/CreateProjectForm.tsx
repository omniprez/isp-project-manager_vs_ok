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

const defaultSite = '123 Main St, City';
const defaultOtherSites = ['456 Branch Ave, City'];

const CreateProjectForm: React.FC<CreateProjectFormProps> = ({ open, onClose }) => {
  // --- State for form fields ---
  const [projectName, setProjectName] = useState('Sample Fiber Link');
  const [customerName, setCustomerName] = useState('Acme Corp');
  const [mainSite, setMainSite] = useState(defaultSite);
  const [otherSites, setOtherSites] = useState<string[]>([...defaultOtherSites]);
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('2024-07-01');
  const [customerContact, setCustomerContact] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [crdNotes, setCrdNotes] = useState('Customer requests expedited delivery and 24/7 support.');
  const [serviceDetails, setServiceDetails] = useState<any[]>([]);
  const [techDetails, setTechDetails] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Validation errors
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');

  // Sync service/tech details with sites
  useEffect(() => {
    const allSites = [mainSite, ...otherSites];
    setServiceDetails((prev) => {
      const arr = [...prev];
      while (arr.length < allSites.length) {
        arr.push({
          projectType: 'New Installation',
          billingTrigger: 'Upon Commissioning',
          serviceType: 'Fiber Optic',
          redundancy: true,
        });
      }
      return arr.slice(0, allSites.length);
    });
    setTechDetails((prev) => {
      const arr = [...prev];
      while (arr.length < allSites.length) {
        arr.push({
          bandwidth: '1 Gbps',
          interfaceType: 'Fiber LC',
          slaRequirements: '99.99% uptime',
          ipRequirements: '/29 subnet',
        });
      }
      return arr.slice(0, allSites.length);
    });
    // eslint-disable-next-line
  }, [mainSite, otherSites]);

  // Reset form on open
  useEffect(() => {
    if (open) {
      setProjectName('Sample Fiber Link');
      setCustomerName('Acme Corp');
      setMainSite(defaultSite);
      setOtherSites([...defaultOtherSites]);
      setTargetDeliveryDate('2024-07-01');
      setCustomerContact('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCrdNotes('Customer requests expedited delivery and 24/7 support.');
      setServiceDetails([]);
      setTechDetails([]);
      setPage(1);
      setError('');
      setSuccess('');
      setNameError('');
      setPhoneError('');
      setEmailError('');
    }
  }, [open]);

  // --- Handlers ---
  const handleAddSite = () => {
    setOtherSites([...otherSites, '']);
  };
  const handleDeleteSite = (idx: number) => {
    setOtherSites(otherSites.filter((_, i) => i !== idx));
  };
  const handleOtherSiteChange = (idx: number, value: string) => {
    const arr = [...otherSites];
    arr[idx] = value;
    setOtherSites(arr);
  };
  const handleServiceDetailChange = (idx: number, field: string, value: any) => {
    const arr = [...serviceDetails];
    arr[idx][field] = value;
    setServiceDetails(arr);
  };
  const handleTechDetailChange = (idx: number, field: string, value: any) => {
    const arr = [...techDetails];
    arr[idx][field] = value;
    setTechDetails(arr);
  };

  // --- Validation ---
  function validateContact() {
    let valid = true;
    setNameError(''); setPhoneError(''); setEmailError('');
    if (!customerContact.match(/^[A-Za-z][A-Za-z\s\-\.']{1,}$/)) {
      setNameError('Enter a valid name.');
      valid = false;
    }
    if (!customerPhone.match(/^\+?[0-9\-\s]{7,20}$/)) {
      setPhoneError('Enter a valid phone number.');
      valid = false;
    }
    if (!customerEmail.match(/^\S+@\S+\.\S+$/)) {
      setEmailError('Enter a valid email address.');
      valid = false;
    }
    return valid;
  }

  // --- Submit ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!validateContact()) return;
    if (!projectName || !customerName || !mainSite) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    // Compose data for API
    const allSites = [mainSite, ...otherSites];
    // Extract required top-level fields from the first site (main site)
    const firstService = serviceDetails[0] || {};
    const firstTech = techDetails[0] || {};
    const formData = {
      projectName,
      customerName,
      siteA_address: mainSite,
      siteB_address: otherSites[0] || '',
      targetDeliveryDate,
      customerContact,
      customerPhone,
      customerEmail,
      projectType: firstService.projectType || '',
      billingTrigger: firstService.billingTrigger || '',
      serviceType: firstService.serviceType || '',
      redundancy: !!firstService.redundancy,
      bandwidth: firstTech.bandwidth || '',
      slaRequirements: firstTech.slaRequirements || '',
      interfaceType: firstTech.interfaceType || '',
      ipRequirements: firstTech.ipRequirements || '',
      notes: crdNotes,
    };
    try {
      await createProject(formData);
      setSuccess('Project created successfully!');
      onClose(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---
  const allSites = [mainSite, ...otherSites];

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      PaperProps={{
        component: 'form',
        onSubmit: handleFormSubmit,
        sx: { maxWidth: 1300, width: '100%' }
      }}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1, pt: 2, px: 3 }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600, fontSize: '1.5rem', color: '#1976d2' }}>
          Customer Requirement Document (CRD) New Project
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2, overflowX: 'hidden', minWidth: 1100 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {page === 1 && (
          <>
            <Typography sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>Basic Project Information</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, width: '100%' }}>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label>Project Name *</label>
                <input value={projectName} onChange={e => setProjectName(e.target.value)} required style={{ padding: 8, borderRadius: 6, border: '1px solid #cfd8dc', marginBottom: 0 }} />
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label>Customer Name *</label>
                <input value={customerName} onChange={e => setCustomerName(e.target.value)} required style={{ padding: 8, borderRadius: 6, border: '1px solid #cfd8dc', marginBottom: 0 }} />
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label>Main Site</label>
                <input value={mainSite} onChange={e => setMainSite(e.target.value)} required style={{ padding: 8, borderRadius: 6, border: '1px solid #cfd8dc', marginBottom: 0 }} />
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label>Other Sites</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', marginBottom: 4 }}>
                  {otherSites.map((site, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <input
                        type="text"
                        value={site}
                        placeholder="Enter site address"
                        onChange={e => handleOtherSiteChange(idx, e.target.value)}
                        style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #cfd8dc' }}
                      />
                      <button
                        type="button"
                        title="Delete site"
                        onClick={() => handleDeleteSite(idx)}
                        style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', borderRadius: 4, padding: '0 4px', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
                      >
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 7.5V14.5M10 7.5V14.5M13.5 7.5V14.5M3 5.5H17M8.5 3.5H11.5C12.0523 3.5 12.5 3.94772 12.5 4.5V5.5H7.5V4.5C7.5 3.94772 7.94772 3.5 8.5 3.5Z" stroke="#d32f2f" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                  <Button variant="outlined" color="primary" onClick={handleAddSite} sx={{ fontWeight: 600, borderRadius: 2, px: 2, py: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '1.2em', marginRight: 6 }}>+</span> Add Site
                  </Button>
                </div>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label>Target Delivery Date</label>
                <input type="date" value={targetDeliveryDate} onChange={e => setTargetDeliveryDate(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #cfd8dc', marginBottom: 0 }} />
              </Box>
            </Box>
            <Typography sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>Customer Contact Information</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label>Contact Name *</label>
                <input value={customerContact} onChange={e => setCustomerContact(e.target.value)} required style={{ padding: 8, borderRadius: 6, border: '1px solid #cfd8dc' }} />
                {nameError && <span style={{ color: '#d32f2f', fontSize: '0.98rem' }}>{nameError}</span>}
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label>Contact Phone *</label>
                <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required style={{ padding: 8, borderRadius: 6, border: '1px solid #cfd8dc' }} />
                {phoneError && <span style={{ color: '#d32f2f', fontSize: '0.98rem' }}>{phoneError}</span>}
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label>Contact Email *</label>
                <input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} required style={{ padding: 8, borderRadius: 6, border: '1px solid #cfd8dc' }} />
                {emailError && <span style={{ color: '#d32f2f', fontSize: '0.98rem' }}>{emailError}</span>}
              </Box>
            </Box>
          </>
        )}
        {page === 2 && (
          <>
            <Typography sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>Project & Service Details</Typography>
            {allSites.map((site, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label>Site</label>
                  <input value={site} readOnly style={{ padding: 8, borderRadius: 6, border: '1px solid #cfd8dc', background: '#f9fbfc' }} />
                </Box>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label>Project Type *</label>
                  <select value={serviceDetails[idx]?.projectType || ''} onChange={e => handleServiceDetailChange(idx, 'projectType', e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #cfd8dc' }}>
                    {projectTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </Box>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label>Billing Trigger *</label>
                  <select value={serviceDetails[idx]?.billingTrigger || ''} onChange={e => handleServiceDetailChange(idx, 'billingTrigger', e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #cfd8dc' }}>
                    {billingTriggers.map(trigger => <option key={trigger} value={trigger}>{trigger}</option>)}
                  </select>
                </Box>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label>Service Type *</label>
                  <select value={serviceDetails[idx]?.serviceType || ''} onChange={e => handleServiceDetailChange(idx, 'serviceType', e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #cfd8dc' }}>
                    {serviceTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </Box>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mt: 3 }}>
                  <input type="checkbox" checked={!!serviceDetails[idx]?.redundancy} onChange={e => handleServiceDetailChange(idx, 'redundancy', e.target.checked)} />
                  <label style={{ marginBottom: 0, fontWeight: 500 }}>Redundancy Required</label>
                </Box>
              </Box>
            ))}
            <Typography sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>Technical Requirements</Typography>
            {allSites.map((site, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label>Site</label>
                  <input value={site} readOnly style={{ padding: 8, borderRadius: 6, border: '1px solid #cfd8dc', background: '#f9fbfc' }} />
                </Box>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label>Required Bandwidth</label>
                  <input value={techDetails[idx]?.bandwidth || ''} onChange={e => handleTechDetailChange(idx, 'bandwidth', e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #cfd8dc' }} />
                </Box>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label>Interface Type</label>
                  <input value={techDetails[idx]?.interfaceType || ''} onChange={e => handleTechDetailChange(idx, 'interfaceType', e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #cfd8dc' }} />
                </Box>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label>SLA Requirements</label>
                  <input value={techDetails[idx]?.slaRequirements || ''} onChange={e => handleTechDetailChange(idx, 'slaRequirements', e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #cfd8dc' }} />
                </Box>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label>IP Requirements</label>
                  <input value={techDetails[idx]?.ipRequirements || ''} onChange={e => handleTechDetailChange(idx, 'ipRequirements', e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #cfd8dc' }} />
                </Box>
              </Box>
            ))}
            <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
              <label>Additional Notes</label>
              <textarea value={crdNotes} onChange={e => setCrdNotes(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #cfd8dc', minHeight: 36, maxHeight: 80, resize: 'vertical' }} />
            </Box>
          </>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          {page === 2 && (
            <Button variant="outlined" color="primary" onClick={() => setPage(1)} disabled={loading} sx={{ borderRadius: 2, px: 3, py: 1.5, fontSize: '1rem' }}>
              Previous
            </Button>
          )}
          {page === 1 && (
            <Button variant="contained" color="primary" onClick={() => { if (validateContact()) setPage(2); }} disabled={loading} sx={{ borderRadius: 2, px: 3, py: 1.5, fontSize: '1rem' }}>
              Next
            </Button>
          )}
          {page === 2 && (
            <Button type="submit" variant="contained" color="primary" disabled={loading} sx={{ borderRadius: 2, px: 3, py: 1.5, fontSize: '1rem', minWidth: 120 }}>
              {loading ? <CircularProgress size={24} /> : 'Create Project'}
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectForm;
