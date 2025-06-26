// src/pages/ProjectDetailPage.tsx (Corrected version after fixing syntax errors)
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';

// Import API functions and type
import { getProjectById, initiateInstallation } from '../services/projectApi';
import { approvePnl, rejectPnl, reviewPnl } from '../services/pnlApi';
import { ProjectDetail, PnlApprovalStatus } from '../types';
import { useAuth } from '../context/AuthContext';

// Import Form Components
import CreateBoqForm from '../components/CreateBoqForm';
import CreatePnlForm from '../components/CreatePnlForm';
import RejectPnlDialog from '../components/RejectPnlDialog';
import AssignPmDialog from '../components/AssignPmDialog';
import DeleteProjectDialog from '../components/DeleteProjectDialog';
import ReviewPnlDialog from '../components/ReviewPnlDialog';
import UpdateBoqForReviewDialog from '../components/UpdateBoqForReviewDialog';
import UpdateProjectStatusDialog from '../components/UpdateProjectStatusDialog';
import AcceptanceFormDialog from '../components/AcceptanceFormDialog';
import InitiateBillingDialog from '../components/InitiateBillingDialog';
import CompleteBillingDialog from '../components/CompleteBillingDialog';

// MUI Imports
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import IconButton from '@mui/material/IconButton';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import InfoIcon from '@mui/icons-material/Info';
import DescriptionIcon from '@mui/icons-material/Description';
import ReceiptIcon from '@mui/icons-material/Receipt';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import UpdateIcon from '@mui/icons-material/Update';
import PaymentIcon from '@mui/icons-material/Payment';
import DoneAllIcon from '@mui/icons-material/DoneAll';



// Helper function formatDate
const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) { return 'Invalid Date Format'; }
};

// Helper component DetailItem
function DetailItem({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }): React.ReactElement {
    return (
        <ListItem disablePadding sx={{ py: 0.8, display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '40%', minWidth: '150px', flexShrink: 0, pr: 1 }}>
                {icon && <Box sx={{ mr: 1, color: 'primary.main', display: 'flex', alignItems: 'center' }}>{icon}</Box>}
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{label}:</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, wordBreak: 'break-word' }}>
                {value ?? 'N/A'}
            </Typography>
        </ListItem>
    );
}

// Tab Panel Component
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`project-tabpanel-${index}`}
            aria-labelledby={`project-tab-${index}`}
            {...other}
            style={{ padding: '16px 0' }}
        >
            {value === index && children}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `project-tab-${index}`,
        'aria-controls': `project-tabpanel-${index}`,
    };
}

// Project Status Steps
const projectStatusSteps = [
    'CRD Submitted',
    'Feasibility',
    'BOQ Ready',
    'Pending Approval',
    'P&L Under Review',
    'Approved',
    'Installation Pending',
    'In Progress',
    'Physical Installation Complete',
    'Provisioning Complete',
    'Commissioning Complete',
    'UAT Pending',
    'Soak Period',
    'Completed'
];

// Get active step index
function getActiveStepIndex(status: string): number {
    const index = projectStatusSteps.indexOf(status);
    return index >= 0 ? index : 0;
}


const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user info for role checks

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Page loading
  const [error, setError] = useState<string>(''); // Page loading/fetch error
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [tabValue, setTabValue] = useState(0); // For tab navigation

  // --- Dialog States ---
  const [openBoqDialog, setOpenBoqDialog] = useState(false);
  const [openPnlDialog, setOpenPnlDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [openAssignPmDialog, setOpenAssignPmDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openReviewPnlDialog, setOpenReviewPnlDialog] = useState(false);
  const [openUpdateBoqDialog, setOpenUpdateBoqDialog] = useState(false);
  const [openUpdateStatusDialog, setOpenUpdateStatusDialog] = useState(false);
  const [openAcceptanceFormDialog, setOpenAcceptanceFormDialog] = useState(false);
  const [openInitiateBillingDialog, setOpenInitiateBillingDialog] = useState(false);
  const [openCompleteBillingDialog, setOpenCompleteBillingDialog] = useState(false);
  // ---------------------

  // State for action submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');


  // Fetch project data logic
  const fetchProject = useCallback(async () => {
    console.log("ProjectDetailPage: fetchProject triggered for ID:", id);
    if (!id || isNaN(Number(id))) { setError("Invalid Project ID provided in URL."); setLoading(false); return; }
    const projectId = Number(id);
    setLoading(true); setError(''); setSubmitError(''); // Clear action errors on fetch
    try {
        const data = await getProjectById(projectId);
        console.log("ProjectDetailPage: Data received:", data);
        if (data && typeof data === 'object') { setProject(data); }
        else {
             if (data === null && !error) { setError('Project not found.'); }
             else if (!error) { setError('Project data not found or invalid format.'); }
             setProject(null);
        }
    } catch (err: any) {
        console.error(`ProjectDetailPage: Failed to fetch project ${projectId}:`, err);
        const message = err.response?.status === 404 ? 'Project not found.' : err.response?.data?.error || err.message || `Failed to load project ${projectId}.`;
        setError(message);
        setProject(null);
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [id, refetchTrigger, fetchProject]);


  // --- Dialog Handlers ---
  const handleOpenBoqDialog = () => { setOpenBoqDialog(true); };
  const handleCloseBoqDialog = useCallback((refresh: boolean = false) => {
    setOpenBoqDialog(false);
    if (refresh) { setRefetchTrigger(prev => prev + 1); }
  }, []);

  const handleOpenPnlDialog = () => { setOpenPnlDialog(true); };
  const handleClosePnlDialog = useCallback((refresh: boolean = false) => {
    setOpenPnlDialog(false);
    if (refresh) { setRefetchTrigger(prev => prev + 1); }
  }, []);

  const handleOpenRejectDialog = () => { setOpenRejectDialog(true); setSubmitError(''); };
  const handleCloseRejectDialog = () => { setOpenRejectDialog(false); };

  // Handlers for Assign PM Dialog
  const handleOpenAssignPmDialog = () => { setOpenAssignPmDialog(true); setSubmitError(''); };
  const handleCloseAssignPmDialog = useCallback((refresh: boolean = false) => {
    setOpenAssignPmDialog(false);
    if (refresh) {
      console.log("ProjectDetailPage: Refreshing project details after PM assignment...");
      setRefetchTrigger(prev => prev + 1); // Trigger refetch
    }
  }, []);

  // Handlers for Delete Project Dialog
  const handleOpenDeleteDialog = () => { setOpenDeleteDialog(true); setSubmitError(''); };
  const handleCloseDeleteDialog = () => { setOpenDeleteDialog(false); };

  // Handlers for Review P&L Dialog
  const handleOpenReviewPnlDialog = () => { setOpenReviewPnlDialog(true); setSubmitError(''); };
  const handleCloseReviewPnlDialog = useCallback((refresh: boolean = false) => {
    setOpenReviewPnlDialog(false);
    if (refresh) {
      console.log("ProjectDetailPage: Refreshing project details after P&L review...");
      setRefetchTrigger(prev => prev + 1); // Trigger refetch
    }
  }, []);

  // Handlers for Update BOQ Dialog
  const handleOpenUpdateBoqDialog = () => { setOpenUpdateBoqDialog(true); setSubmitError(''); };
  const handleCloseUpdateBoqDialog = useCallback((refresh: boolean = false) => {
    setOpenUpdateBoqDialog(false);
    if (refresh) {
      console.log("ProjectDetailPage: Refreshing project details after BOQ update...");
      setRefetchTrigger(prev => prev + 1); // Trigger refetch
    }
  }, []);

  // Handlers for Update Status Dialog
  const handleOpenUpdateStatusDialog = () => { setOpenUpdateStatusDialog(true); setSubmitError(''); };
  const handleCloseUpdateStatusDialog = useCallback((refresh: boolean = false) => {
    setOpenUpdateStatusDialog(false);
    if (refresh) {
      console.log("ProjectDetailPage: Refreshing project details after status update...");
      setRefetchTrigger(prev => prev + 1); // Trigger refetch
    }
  }, []);

  // Handlers for Acceptance Form Dialog
  const handleOpenAcceptanceFormDialog = () => { setOpenAcceptanceFormDialog(true); setSubmitError(''); };
  const handleCloseAcceptanceFormDialog = useCallback((refresh: boolean = false) => {
    setOpenAcceptanceFormDialog(false);
    if (refresh) {
      console.log("ProjectDetailPage: Refreshing project details after acceptance form submission...");
      setRefetchTrigger(prev => prev + 1); // Trigger refetch
    }
  }, []);

  // Handlers for Initiate Billing Dialog
  const handleOpenInitiateBillingDialog = () => { setOpenInitiateBillingDialog(true); setSubmitError(''); };
  const handleCloseInitiateBillingDialog = useCallback((refresh: boolean = false) => {
    setOpenInitiateBillingDialog(false);
    if (refresh) {
      console.log("ProjectDetailPage: Refreshing project details after initiating billing...");
      setRefetchTrigger(prev => prev + 1); // Trigger refetch
    }
  }, []);

  // Handlers for Complete Billing Dialog
  const handleOpenCompleteBillingDialog = () => { setOpenCompleteBillingDialog(true); setSubmitError(''); };
  const handleCloseCompleteBillingDialog = useCallback((refresh: boolean = false) => {
    setOpenCompleteBillingDialog(false);
    if (refresh) {
      console.log("ProjectDetailPage: Refreshing project details after completing billing...");
      setRefetchTrigger(prev => prev + 1); // Trigger refetch
    }
  }, []);
  // -------------------------


  // --- Action Handlers ---
  const handleApprovePnl = async () => {
      if (!project?.pnl?.id) return;
      setIsSubmitting(true); setSubmitError('');
      try {
          await approvePnl(project.pnl.id);
          setRefetchTrigger(prev => prev + 1);
      } catch (err: any) {
          const message = err.response?.data?.error || err.message || 'Failed to approve P&L.';
          setSubmitError(message);
      } finally { setIsSubmitting(false); }
  };

  // Passed to RejectPnlDialog to handle actual submission
  const handleRejectSubmit = async (comments: string) => {
      if (!project?.pnl?.id) { throw new Error("Cannot reject P&L: Project or P&L ID is missing."); }
      setSubmitError(''); // Clear page-level errors
      // Dialog handles its own loading/error display during submission attempt
      try {
          await rejectPnl(project.pnl.id, comments);
          handleCloseRejectDialog(); // Close dialog on success
          setRefetchTrigger(prev => prev + 1); // Trigger refresh
      } catch (err: any) {
          // Re-throw error for the dialog to catch and display
          const message = err.response?.data?.error || err.message || 'Failed to reject P&L.';
          throw new Error(message);
      }
  };

  const handleInitiateInstallation = async () => {
      if (!project) return;
      const proceed = window.confirm("Are you sure you want to initiate installation? This assumes customer confirmation (PO/Contract) has been received.");
      if (!proceed) { return; }
      setIsSubmitting(true); setSubmitError('');
      try {
          await initiateInstallation(project.id);
          setRefetchTrigger(prev => prev + 1);
      } catch (err: any) {
          const message = err.response?.data?.error || err.message || 'Failed to initiate installation.';
          setSubmitError(message);
      } finally { setIsSubmitting(false); }
  };

  // Handler for reviewing rejected P&L
  const handleReviewPnl = async () => {
      if (!project?.pnl?.id) return;
      handleOpenReviewPnlDialog();
  };
  // ------------------------


  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Refresh project data
  const handleRefresh = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  // Get status chip color
  const getStatusChip = (status: string) => {
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';

    if (['CRD Submitted', 'Feasibility', 'BOQ Ready'].includes(status)) {
      color = 'info';
    } else if (['Pending Approval'].includes(status)) {
      color = 'warning';
    } else if (status === 'P&L Under Review') {
      color = 'warning';
    } else if (status === 'Approved') {
      color = 'primary';
    } else if (['Installation Pending', 'In Progress', 'Provisioning Complete', 'Physical Installation Complete', 'Commissioning Complete', 'UAT Pending', 'Soak Period'].includes(status)) {
      color = 'secondary';
    } else if (status === 'Completed') {
      color = 'success';
    }

    return (
      <Chip
        label={status}
        color={color}
        size="medium"
        sx={{ fontWeight: 500, fontSize: '0.9rem' }}
      />
    );
  };

  // --- Render Logic ---
  if (loading && !project) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !project) {
    return (
      <Box sx={{ mt: 4, maxWidth: 800, mx: 'auto' }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          variant="outlined"
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ mt: 4, maxWidth: 800, mx: 'auto' }}>
        <Alert severity="warning">Project data is unavailable.</Alert>
      </Box>
    );
  }

  // --- Determine Action Button Visibility ---
  const allowedBoqCreatorRoles: string[] = ['PROJECTS_ADMIN', 'PROJECTS_SURVEY', 'ADMIN'];
  const allowedBoqCreateStatuses: string[] = ['CRD Submitted', 'Feasibility'];
  const canCreateBoq = user && allowedBoqCreatorRoles.includes(user.role) && allowedBoqCreateStatuses.includes(project.status) && !project.boq;

  const allowedPnlSubmitterRoles: string[] = ['SALES', 'ADMIN'];
  const allowedPnlCreateStatuses: string[] = ['BOQ Ready'];
  const canSubmitPnl = user && allowedPnlSubmitterRoles.includes(user.role) && allowedPnlCreateStatuses.includes(project.status) && !!project.boq && !project.pnl;

  const canApproveRejectPnl = user && user.role === 'ADMIN' && project.status === 'Pending Approval' && !!project.pnl && project.pnl.approvalStatus === 'Pending';

  // Allow ADMIN OR assigned SALES to initiate
  const canInitiateInstallation = user &&
                                  project.status === 'Approved' &&
                                  (user.role === 'ADMIN' || (user.role === 'SALES' && project.salesPerson?.id === user.id));

  const allowedPmAssignerRoles: string[] = ['ADMIN', 'PROJECTS_ADMIN'];
  const allowedAssignPmStatuses: string[] = ['Installation Pending', 'In Progress', 'Provisioning Complete', 'Physical Installation Complete', 'Commissioning Complete', 'UAT Pending', 'Soak Period'];
  const canAssignPm = user &&
                      allowedPmAssignerRoles.includes(user.role) &&
                      allowedAssignPmStatuses.includes(project.status) &&
                      !project.projectManager;

  // Allow ADMIN to delete any project, or SALES to request deletion of their own projects
  const canDeleteProject = user &&
                          (user.role === 'ADMIN' ||
                          (user.role === 'SALES' && project.salesPerson?.id === user.id));

  // Allow SALES who submitted the P&L or ADMIN to review rejected P&Ls
  const canReviewRejectedPnl = user &&
                              !!project.pnl &&
                              project.pnl.approvalStatus === 'Rejected' &&
                              (user.role === 'ADMIN' ||
                              (user.role === 'SALES' && project.pnl.submittedBy?.id === user.id));

  // Allow PROJECTS_SURVEY, PROJECTS_ADMIN, or ADMIN to update BOQ for P&Ls under review
  const canUpdateBoqForReview = user &&
                               !!project.pnl &&
                               project.pnl.approvalStatus === 'Under Review' &&
                               !!project.boq &&
                               ['PROJECTS_SURVEY', 'PROJECTS_ADMIN', 'ADMIN'].includes(user.role);

  // Allow PROJECTS_ADMIN or ADMIN to update project status during installation
  const canUpdateProjectStatus = user &&
                                ['PROJECTS_ADMIN', 'ADMIN'].includes(user.role) &&
                                ['Installation Pending', 'In Progress', 'Provisioning Complete',
                                 'Physical Installation Complete', 'Commissioning Complete',
                                 'UAT Pending', 'UAT Failed', 'Soak Period'].includes(project.status);

  // Allow PROJECTS_ADMIN or ADMIN to submit acceptance form when project is in Soak Period
  const canSubmitAcceptanceForm = user &&
                                 ['PROJECTS_ADMIN', 'ADMIN'].includes(user.role) &&
                                 project.status === 'Soak Period' &&
                                 !project.acceptanceForm;

  // Allow SALES or ADMIN to initiate billing for completed projects
  const canInitiateBilling = user &&
                            (user.role === 'SALES' || user.role === 'ADMIN') &&
                            project.status === 'Completed' &&
                            (project.billingStatus === 'Pending' || project.billingStatus === null || project.billingStatus === 'Not Ready') &&
                            project.acceptanceForm;

  // Allow FINANCE or ADMIN to mark billing as completed
  const canCompleteBilling = user &&
                            (user.role === 'FINANCE' || user.role === 'ADMIN') &&
                            project.billingStatus === 'Initiated';
  // -----------------------------------------


  // --- Render Project Details UI ---
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2 }}>
      {/* Header with back button and refresh */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        mt: 1
      }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          variant="outlined"
          size="small"
        >
          Back to Dashboard
        </Button>

        <Tooltip title="Refresh Project Data">
          <IconButton onClick={handleRefresh} color="primary" disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Project Header Card */}
      <Card sx={{ mb: 3, boxShadow: 2, borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, color: 'primary.dark' }}>
                {project.projectName}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Project ID: {project.id} | Customer: {project.customerName || 'N/A'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="body1" sx={{ mr: 1 }}>Status:</Typography>
                {getStatusChip(project.status)}
              </Box>
            </Box>

            <Box sx={{ mt: { xs: 2, md: 0 } }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Typography variant="body2" color="text.secondary">
                  Created: {formatDate(project.createdAt)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last Updated: {formatDate(project.updatedAt)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Target Delivery: {formatDate(project.targetDeliveryDate)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Loading/Error indicators */}
      {loading && <CircularProgress size={20} sx={{ position: 'absolute', top: '80px', right: '60px' }} />}
      {error && !loading && project && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

      {/* Project Status Stepper */}
      <Card sx={{ mb: 3, boxShadow: 2, borderRadius: 2, overflow: 'hidden' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>Project Progress</Typography>
          <Stepper activeStep={getActiveStepIndex(project.status)} alternativeLabel>
            {projectStatusSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="project details tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" icon={<InfoIcon />} iconPosition="start" {...a11yProps(0)} />
          <Tab label="Requirements" icon={<DescriptionIcon />} iconPosition="start" {...a11yProps(1)} />
          <Tab label="BOQ" icon={<ReceiptIcon />} iconPosition="start" {...a11yProps(2)} />
          <Tab label="P&L" icon={<MonetizationOnIcon />} iconPosition="start" {...a11yProps(3)} />
          <Tab label="Acceptance" icon={<CheckCircleIcon />} iconPosition="start" {...a11yProps(4)} />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Core Details */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}>
              <CardHeader
                title="Core Details"
                sx={{
                  backgroundColor: 'primary.light',
                  color: 'white',
                  p: 2
                }}
              />
              <CardContent sx={{ p: 2 }}>
                <List disablePadding>
                  <DetailItem
                    label="Customer"
                    value={project.customerName}
                    icon={<BusinessIcon fontSize="small" />}
                  />
                  <DetailItem
                    label="Sales Person"
                    value={project.salesPerson?.name}
                    icon={<PersonIcon fontSize="small" />}
                  />
                  <DetailItem
                    label="Project Manager"
                    value={project.projectManager?.name ?? 'Not Assigned'}
                    icon={<PersonIcon fontSize="small" />}
                  />
                  <DetailItem
                    label="Site A Address"
                    value={project.siteA_address}
                    icon={<LocationOnIcon fontSize="small" />}
                  />
                  <DetailItem
                    label="Site B Address"
                    value={project.siteB_address}
                    icon={<LocationOnIcon fontSize="small" />}
                  />
                  <DetailItem
                    label="Target Delivery"
                    value={formatDate(project.targetDeliveryDate)}
                    icon={<CalendarTodayIcon fontSize="small" />}
                  />
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Project Actions */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}>
              <CardHeader
                title="Project Actions"
                sx={{
                  backgroundColor: 'secondary.light',
                  color: 'white',
                  p: 2
                }}
              />
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Action Buttons */}
                  {canCreateBoq && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddShoppingCartIcon />}
                      onClick={handleOpenBoqDialog}
                      disabled={loading || isSubmitting}
                      fullWidth
                    >
                      Create BOQ
                    </Button>
                  )}

                  {canSubmitPnl && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<RequestQuoteIcon />}
                      onClick={handleOpenPnlDialog}
                      disabled={loading || isSubmitting}
                      fullWidth
                    >
                      Submit P&L for Approval
                    </Button>
                  )}

                  {canApproveRejectPnl && (
                    <Box sx={{ display: 'flex', gap: 2, mt: 1, borderTop: '1px solid #eee', pt: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<ThumbUpIcon />}
                        onClick={handleApprovePnl}
                        disabled={isSubmitting || loading}
                        sx={{ flex: 1 }}
                      >
                        Approve P&L
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<ThumbDownIcon />}
                        onClick={handleOpenRejectDialog}
                        disabled={isSubmitting || loading}
                        sx={{ flex: 1 }}
                      >
                        Reject P&L
                      </Button>
                    </Box>
                  )}

                  {canInitiateInstallation && (
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<PlayCircleOutlineIcon />}
                      onClick={handleInitiateInstallation}
                      disabled={isSubmitting || loading}
                      fullWidth
                    >
                      Initiate Installation
                    </Button>
                  )}

                  {canAssignPm && (
                    <Button
                      variant="contained"
                      color="info"
                      startIcon={<PersonAddAltIcon />}
                      onClick={handleOpenAssignPmDialog}
                      disabled={loading || isSubmitting}
                      fullWidth
                    >
                      Assign Project Manager
                    </Button>
                  )}

                  {canReviewRejectedPnl && (
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<RefreshIcon />}
                      onClick={handleReviewPnl}
                      disabled={loading || isSubmitting}
                      fullWidth
                    >
                      Review Rejected P&L
                    </Button>
                  )}

                  {canUpdateBoqForReview && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddShoppingCartIcon />}
                      onClick={handleOpenUpdateBoqDialog}
                      disabled={loading || isSubmitting}
                      fullWidth
                    >
                      Update BOQ for Review
                    </Button>
                  )}

                  {canUpdateProjectStatus && (
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<UpdateIcon />}
                      onClick={handleOpenUpdateStatusDialog}
                      disabled={loading || isSubmitting}
                      fullWidth
                    >
                      Update Project Status
                    </Button>
                  )}

                  {canSubmitAcceptanceForm && (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={handleOpenAcceptanceFormDialog}
                      disabled={loading || isSubmitting}
                      fullWidth
                    >
                      Submit Acceptance Form
                    </Button>
                  )}

                  {canInitiateBilling && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<PaymentIcon />}
                      onClick={handleOpenInitiateBillingDialog}
                      disabled={loading || isSubmitting}
                      fullWidth
                    >
                      Initiate Billing
                    </Button>
                  )}

                  {canCompleteBilling && (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<DoneAllIcon />}
                      onClick={handleOpenCompleteBillingDialog}
                      disabled={loading || isSubmitting}
                      fullWidth
                    >
                      Complete Billing
                    </Button>
                  )}

                  {canDeleteProject && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleOpenDeleteDialog}
                      disabled={loading || isSubmitting}
                      fullWidth
                      sx={{ mt: 2, borderWidth: '2px' }}
                    >
                      {user?.role === 'ADMIN' ? 'Delete Project' : 'Request Deletion'}
                    </Button>
                  )}

                  {/* Informational Text */}
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    {project.status === 'Completed' && project.acceptanceForm && !canInitiateBilling && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Project is completed but billing cannot be initiated. Billing status: {project.billingStatus || 'Not set'}
                      </Typography>
                    )}
                    {!canCreateBoq && !project.boq && allowedBoqCreateStatuses.includes(project.status) && user && !allowedBoqCreatorRoles.includes(user.role) && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Your role cannot create BOQ.
                      </Typography>
                    )}

                    {!canSubmitPnl && project.status === 'BOQ Ready' && !project.pnl && user && !allowedPnlSubmitterRoles.includes(user.role) && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Your role cannot submit P&L.
                      </Typography>
                    )}

                    {project.boq && !project.pnl && project.status !== 'BOQ Ready' && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        P&L cannot be submitted until BOQ is ready.
                      </Typography>
                    )}

                    {project.pnl && project.pnl.approvalStatus === 'Approved' && project.status === 'Approved' && !canInitiateInstallation && (
                      <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
                        P&L Approved. Waiting for Sales ({project.salesPerson?.name || 'N/A'}) or Admin to initiate installation.
                      </Typography>
                    )}

                    {project.pnl && project.pnl.approvalStatus === 'Rejected' && (
                      <Typography variant="body2" color="error.main" sx={{ mb: 1 }}>
                        P&L Rejected.
                      </Typography>
                    )}

                    {project.status === 'Pending Approval' && user?.role !== 'ADMIN' && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Waiting for Admin P&L Approval.
                      </Typography>
                    )}

                    {project.status === 'Approved' && !canInitiateInstallation && user && !(user.role === 'ADMIN' || (user.role === 'SALES' && project.salesPerson?.id === user.id)) && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Only assigned Salesperson ({project.salesPerson?.name || 'N/A'}) or Admin can initiate installation.
                      </Typography>
                    )}

                    {project.projectManager && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Project Manager already assigned: {project.projectManager.name || project.projectManager.email}
                      </Typography>
                    )}

                    {allowedAssignPmStatuses.includes(project.status) && !project.projectManager && canAssignPm && (
                      <Typography variant="body2" color="info.main" sx={{ mb: 1 }}>
                        Installation initiated. Please assign a Project Manager.
                      </Typography>
                    )}

                    {!project.projectManager && !canAssignPm && allowedAssignPmStatuses.includes(project.status) && user && !allowedPmAssignerRoles.includes(user.role) && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Waiting for Admin or Projects Admin to assign a Project Manager.
                      </Typography>
                    )}

                    {!project.projectManager && !allowedAssignPmStatuses.includes(project.status) && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Project Manager cannot be assigned at current status ({project.status}).
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
          <CardHeader
            title="Customer Requirements (CRD)"
            sx={{
              backgroundColor: 'info.light',
              color: 'white',
              p: 2
            }}
          />
          <CardContent sx={{ p: 2 }}>
            {project.crd ? (
              <List disablePadding>
                <DetailItem label="Project Type" value={project.crd.projectType} />
                <DetailItem label="Service Type" value={project.crd.serviceType} />
                <DetailItem label="Bandwidth" value={project.crd.bandwidth} />
                <DetailItem label="Billing Trigger" value={project.crd.billingTrigger} />
                <DetailItem label="Redundancy" value={project.crd.redundancy ? 'Yes' : 'No'} />
                <DetailItem label="Interface Type" value={project.crd.interfaceType} />

                <Box sx={{ my: 2, borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Customer Contact Information</Typography>
                </Box>

                <DetailItem label="Contact Name" value={project.crd.customerContact} />
                <DetailItem label="Contact Phone" value={project.crd.customerPhone} />
                <DetailItem label="Contact Email" value={project.crd.customerEmail} />

                <Box sx={{ my: 2, borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Technical Requirements</Typography>
                </Box>

                <DetailItem label="SLA Requirements" value={project.crd.slaRequirements} />
                <DetailItem label="IP Requirements" value={project.crd.ipRequirements} />
                <DetailItem label="CRD Notes" value={project.crd.notes} />
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
                No CRD data found for this project.
              </Typography>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
          <CardHeader
            title="Bill of Quantities (BOQ)"
            sx={{
              backgroundColor: 'warning.light',
              color: 'white',
              p: 2
            }}
          />
          <CardContent sx={{ p: 2 }}>
            {project.boq ? (
              <List disablePadding>
                <DetailItem
                  label="Total Cost"
                  value={<Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.dark' }}>${project.boq.totalCost.toFixed(2)}</Typography>}
                />
                <DetailItem label="Prepared By" value={project.boq.preparedBy?.name} />
                <DetailItem label="Date Prepared" value={formatDate(project.boq.datePrepared)} />
                <DetailItem label="BOQ Notes" value={project.boq.notes} />
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
                BOQ has not yet been created for this project.
              </Typography>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
          <CardHeader
            title="Profit & Loss (P&L)"
            sx={{
              backgroundColor: 'success.light',
              color: 'white',
              p: 2
            }}
          />
          <CardContent sx={{ p: 2 }}>
            {project.pnl ? (
              <>
                <List disablePadding>
                  <DetailItem
                    label="Approval Status"
                    value={
                      <Chip
                        label={project.pnl.approvalStatus}
                        color={
                          project.pnl.approvalStatus === 'Approved' ? 'success' :
                          project.pnl.approvalStatus === 'Rejected' ? 'error' : 'warning'
                        }
                        size="small"
                      />
                    }
                  />
                  <DetailItem label="BOQ Cost Ref." value={`$${project.pnl.boqCost.toFixed(2)}`} />
                  <DetailItem label="One-Time Revenue" value={project.pnl.oneTimeRevenue ? `$${project.pnl.oneTimeRevenue.toFixed(2)}` : 'N/A'} />
                  <DetailItem label="Recurring Revenue (MRR)" value={project.pnl.recurringRevenue ? `$${project.pnl.recurringRevenue.toFixed(2)}` : 'N/A'} />
                  <DetailItem label="Term (Months)" value={project.pnl.contractTermMonths} />
                  <DetailItem
                    label="Gross Profit (Est.)"
                    value={
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.dark' }}>
                        {project.pnl.grossProfit ? `$${project.pnl.grossProfit.toFixed(2)}` : 'N/A'}
                      </Typography>
                    }
                  />
                  <DetailItem
                    label="Gross Margin (Est.)"
                    value={
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.dark' }}>
                        {project.pnl.grossMargin ? `${project.pnl.grossMargin.toFixed(1)}%` : 'N/A'}
                      </Typography>
                    }
                  />

                  <Box sx={{ my: 2, borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Approval Information</Typography>
                  </Box>

                  <DetailItem label="Submitted By" value={project.pnl.submittedBy?.name} />
                  <DetailItem label="Approver" value={project.pnl.approver?.name} />
                  <DetailItem label="Approval Date" value={formatDate(project.pnl.approvalDate)} />
                  <DetailItem label="Admin Comments" value={project.pnl.adminComments} />
                </List>
                {/* Approve/Reject Buttons for Admins in Pending Approval */}
                {canApproveRejectPnl && (
                  <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<ThumbUpIcon />}
                      onClick={handleApprovePnl}
                      disabled={isSubmitting || loading}
                      sx={{ flex: 1, maxWidth: 220 }}
                    >
                      Approve P&L
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<ThumbDownIcon />}
                      onClick={handleOpenRejectDialog}
                      disabled={isSubmitting || loading}
                      sx={{ flex: 1, maxWidth: 220 }}
                    >
                      Reject P&L
                    </Button>
                  </Box>
                )}
              </>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
                P&L has not yet been submitted for this project.
              </Typography>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
          <CardHeader
            title="Acceptance Details"
            sx={{
              backgroundColor: 'primary.dark',
              color: 'white',
              p: 2
            }}
          />
          <CardContent sx={{ p: 2 }}>
            {project.acceptanceForm ? (
              <List disablePadding>
                <DetailItem label="Service/Circuit ID" value={project.acceptanceForm.serviceId} />
                <DetailItem label="Commissioned Date" value={formatDate(project.acceptanceForm.commissionedDate)} />
                <DetailItem label="Acceptance Date" value={formatDate(project.acceptanceForm.acceptanceDate)} />
                <DetailItem label="Billing Start Date" value={formatDate(project.acceptanceForm.billingStartDate)} />
                <DetailItem
                  label="Billing Status"
                  value={
                    <Chip
                      label={project.billingStatus || 'Not Ready'}
                      color={
                        project.billingStatus === 'Billed' ? 'success' :
                        project.billingStatus === 'Initiated' ? 'primary' :
                        project.billingStatus === 'Pending' ? 'warning' : 'default'
                      }
                      size="small"
                    />
                  }
                />

                <Box sx={{ my: 2, borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Signature Information</Typography>
                </Box>

                <DetailItem label="Signed By" value={project.acceptanceForm.signedByName} />
                <DetailItem label="Signee Title" value={project.acceptanceForm.signedByTitle} />
                <DetailItem
                  label="Signed Form URL"
                  value={
                    project.acceptanceForm.customerSignature ?
                    <Link href={project.acceptanceForm.customerSignature} target="_blank" rel="noopener" sx={{ color: 'primary.main' }}>
                      View Document
                    </Link> : 'N/A'
                  }
                />
                <DetailItem label="ISP Representative" value={project.acceptanceForm.ispRepresentative} />
                <DetailItem label="Logged By" value={project.acceptanceForm.loggedBy?.name} />
                <DetailItem label="Acceptance Notes" value={project.acceptanceForm.notes} />
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
                Service has not yet been accepted for this project.
              </Typography>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Dialogs */}
      {project && <CreateBoqForm open={openBoqDialog} onClose={handleCloseBoqDialog} projectId={project.id} />}
      {project && project.boq && ( <CreatePnlForm open={openPnlDialog} onClose={handleClosePnlDialog} projectId={project.id} boqCost={project.boq.totalCost} /> )}
      {project && project.pnl && ( <RejectPnlDialog open={openRejectDialog} onClose={handleCloseRejectDialog} onSubmit={handleRejectSubmit} /> )}
      {project && ( <AssignPmDialog open={openAssignPmDialog} onClose={handleCloseAssignPmDialog} projectId={project.id} /> )}
      {project && ( <DeleteProjectDialog open={openDeleteDialog} onClose={handleCloseDeleteDialog} projectId={project.id} projectName={project.projectName} /> )}
      {project && project.acceptanceForm && ( <InitiateBillingDialog open={openInitiateBillingDialog} onClose={handleCloseInitiateBillingDialog} projectId={project.id} projectName={project.projectName} billingStartDate={project.acceptanceForm.billingStartDate} /> )}
      {project && ( <CompleteBillingDialog open={openCompleteBillingDialog} onClose={handleCloseCompleteBillingDialog} projectId={project.id} projectName={project.projectName} /> )}
      {project && project.pnl && ( <ReviewPnlDialog open={openReviewPnlDialog} onClose={handleCloseReviewPnlDialog} pnlId={project.pnl.id} rejectionReason={project.pnl.adminComments} /> )}
      {project && project.pnl && project.boq && ( <UpdateBoqForReviewDialog open={openUpdateBoqDialog} onClose={handleCloseUpdateBoqDialog} pnlId={project.pnl.id} currentBoqCost={project.boq.totalCost} currentBoqNotes={project.boq.notes} /> )}
      {project && ( <UpdateProjectStatusDialog open={openUpdateStatusDialog} onClose={handleCloseUpdateStatusDialog} projectId={project.id} currentStatus={project.status} /> )}
      {project && ( <AcceptanceFormDialog open={openAcceptanceFormDialog} onClose={handleCloseAcceptanceFormDialog} projectId={project.id} projectName={project.projectName} /> )}

    </Box>
  );
};

export default ProjectDetailPage;
