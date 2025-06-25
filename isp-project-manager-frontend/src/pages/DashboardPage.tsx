// src/pages/DashboardPage.tsx (Imports from projectApi)
import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';

// Import API function and Auth Hook
import { getProjects } from '../services/projectApi'; // <<< Import from projectApi
import { useAuth } from '../context/AuthContext';

// Import Components
import CreateProjectForm from '../components/CreateProjectForm';
import DeletionRequestsDialog from '../components/DeletionRequestsDialog';

// MUI Imports
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';

// Icons
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ConstructionIcon from '@mui/icons-material/Construction';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';


// Define ProjectSummary Interface (can also move to types file)
interface ProjectSummary {
  id: number;
  projectName: string;
  status: string;
  customerName: string;
  createdAt: string;
  updatedAt: string;
  salesPerson: { id: number; name: string | null; } | null;
  projectManager: { id: number; name: string | null; } | null;
  crd: { projectType: string; serviceType: string; } | null;
  boq: { id: number } | null;
  pnl: { id: number; approvalStatus: string } | null;
}


const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDeletionRequestsDialog, setOpenDeletionRequestsDialog] = useState(false);
  const { user } = useAuth();

  const handleOpenCreateDialog = () => { setOpenCreateDialog(true); };
  const handleOpenDeletionRequestsDialog = () => { setOpenDeletionRequestsDialog(true); };
  const handleCloseDeletionRequestsDialog = () => { setOpenDeletionRequestsDialog(false); };

  // Memoize fetchProjects using useCallback
  const fetchProjects = useCallback(async () => {
      setLoading(true);
      setError('');
      try {
        console.log("DashboardPage: Calling getProjects() API...");
        const data = await getProjects(); // Fetches from projectApi
        console.log("DashboardPage: API call finished, raw data received:", data);

        if (Array.isArray(data)) {
            console.log("DashboardPage: Data is an array, setting projects state.");
            setProjects(data);
        } else {
            console.error("DashboardPage: API did not return an array!", data);
            setError("Received invalid data structure from server.");
            setProjects([]);
        }
      } catch (err: any) {
        console.error("DashboardPage: API call failed:", err);
        const message = err.response?.data?.error || err.message || "Failed to load projects.";
        setError(message);
        setProjects([]);
      } finally {
        console.log("DashboardPage: fetchProjects finally block reached.");
        setLoading(false);
      }
    }, []); // Empty dependency array for useCallback as it doesn't depend on props/state here

  // Close dialog handler also uses fetchProjects
  const handleCloseCreateDialog = useCallback((refresh: boolean = false) => {
    setOpenCreateDialog(false);
    if (refresh) {
      console.log("DashboardPage: Refreshing projects after creation...");
      fetchProjects(); // Re-call memoized fetchProjects
    }
  }, [fetchProjects]); // Depend on fetchProjects

  // Fetch projects when the component mounts
  useEffect(() => {
     console.log("DashboardPage: useEffect hook triggered.");
    fetchProjects();
  }, [fetchProjects]); // Depend on memoized fetchProjects


  const handleCreateProjectClick = () => { handleOpenCreateDialog(); };

  console.log("DashboardPage: Rendering UI. Loading:", loading, "Error:", error, "Projects:", projects);

  // Calculate project statistics
  const getProjectStats = () => {
    if (!Array.isArray(projects)) return { total: 0, pending: 0, inProgress: 0, completed: 0, rejected: 0 };

    const total = projects.length;
    const pending = projects.filter(p => ['CRD Submitted', 'Feasibility', 'BOQ Ready', 'Pending Approval', 'Approved'].includes(p.status)).length;
    const inProgress = projects.filter(p => ['Installation Pending', 'In Progress', 'Provisioning Complete', 'Physical Installation Complete', 'Commissioning Complete', 'UAT Pending', 'Soak Period'].includes(p.status)).length;
    const completed = projects.filter(p => p.status === 'Completed').length;
    const rejected = projects.filter(p => p.pnl?.approvalStatus === 'Rejected').length;

    return { total, pending, inProgress, completed, rejected };
  };

  // Get status chip color and icon
  const getStatusChip = (status: string) => {
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    let icon = null;

    if (['CRD Submitted', 'Feasibility', 'BOQ Ready', 'Pending Approval'].includes(status)) {
      color = 'warning';
      icon = <PendingActionsIcon fontSize="small" />;
    } else if (status === 'Approved') {
      color = 'info';
      icon = <CheckCircleIcon fontSize="small" />;
    } else if (['Installation Pending', 'In Progress', 'Provisioning Complete', 'Physical Installation Complete', 'Commissioning Complete', 'UAT Pending', 'Soak Period'].includes(status)) {
      color = 'primary';
      icon = <ConstructionIcon fontSize="small" />;
    } else if (status === 'Completed') {
      color = 'success';
      icon = <CheckCircleIcon fontSize="small" />;
    }

    return (
      <Chip
        icon={icon}
        label={status}
        color={color}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 500 }}
      />
    );
  };

  // Get P&L status chip
  const getPnlStatusChip = (project: ProjectSummary) => {
    if (project.pnl) {
      if (project.pnl.approvalStatus === 'Approved') {
        return <Chip label="Approved" color="success" size="small" variant="outlined" />;
      } else if (project.pnl.approvalStatus === 'Rejected') {
        return <Chip label="Rejected" color="error" size="small" variant="outlined" />;
      } else {
        return <Chip label="Pending" color="warning" size="small" variant="outlined" />;
      }
    } else if (project.boq) {
      return <Chip label="BOQ Ready" color="info" size="small" variant="outlined" />;
    } else {
      return <Chip label="Not Started" color="default" size="small" variant="outlined" />;
    }
  };

  const stats = getProjectStats();

  return (
    <>
      <Box sx={{ my: 2 }}>
        {/* Dashboard Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 1.5
        }}>
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600, color: 'primary.dark' }}>
              Project Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Overview of all ISP projects and their current status
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Tooltip title="Refresh Projects">
              <IconButton
                onClick={() => fetchProjects()}
                color="primary"
                disabled={loading}
                size="small"
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {user?.role === 'ADMIN' && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleOpenDeletionRequestsDialog}
                  sx={{
                    borderRadius: 1.5
                  }}
                >
                  Deletion Requests
                </Button>
              )}

              {(user?.role === 'SALES' || user?.role === 'ADMIN') && (
                <Button
                  variant="contained"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={handleCreateProjectClick}
                  size="small"
                  sx={{
                    px: 2,
                    borderRadius: 1.5,
                    boxShadow: 1
                  }}
                >
                  Create Project
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        {/* Loading and Error States */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 4 }}>
            <CircularProgress size={24} sx={{ mr: 1.5 }} />
            <Typography variant="body1" color="text.secondary">Loading Projects...</Typography>
          </Box>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{ my: 2, boxShadow: 1 }}
            variant="outlined"
          >
            {error}
          </Alert>
        )}

        {/* Dashboard Content */}
        {!loading && !error && (
          <>
            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3, justifyContent: 'center' }}>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{
                  height: '100%',
                  boxShadow: 1,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
                  borderLeft: '3px solid',
                  borderColor: 'primary.main'
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                      Total Projects
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'primary.main', my: 0.5 }}>
                      {stats.total}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <AssignmentIcon color="primary" sx={{ mr: 1, fontSize: 18 }} />
                      <Typography variant="body2" color="text.secondary">
                        All projects in system
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{
                  height: '100%',
                  boxShadow: 1,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
                  borderLeft: '3px solid',
                  borderColor: 'warning.main'
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                      Pending Approval
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'warning.main', my: 0.5 }}>
                      {stats.pending}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <PendingActionsIcon color="warning" sx={{ mr: 1, fontSize: 18 }} />
                      <Typography variant="body2" color="text.secondary">
                        Awaiting next steps
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{
                  height: '100%',
                  boxShadow: 1,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
                  borderLeft: '3px solid',
                  borderColor: 'primary.dark'
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                      In Progress
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'primary.dark', my: 0.5 }}>
                      {stats.inProgress}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <ConstructionIcon color="primary" sx={{ mr: 1, fontSize: 18 }} />
                      <Typography variant="body2" color="text.secondary">
                        Active implementation
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{
                  height: '100%',
                  boxShadow: 1,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
                  borderLeft: '3px solid',
                  borderColor: 'success.main'
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                      Completed
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'success.main', my: 0.5 }}>
                      {stats.completed}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 18 }} />
                      <Typography variant="body2" color="text.secondary">
                        Successfully delivered
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{
                  height: '100%',
                  boxShadow: 1,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
                  borderLeft: '3px solid',
                  borderColor: 'error.main'
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                      Rejected
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'error.main', my: 0.5 }}>
                      {stats.rejected}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <ThumbDownIcon color="error" sx={{ mr: 1, fontSize: 18 }} />
                      <Typography variant="body2" color="text.secondary">
                        P&L rejected projects
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Projects Table */}
            <Card sx={{ boxShadow: 2, borderRadius: 1.5, overflow: 'hidden' }}>
              <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Project List
                </Typography>
              </Box>

              <TableContainer>
                <Table sx={{ minWidth: 650 }} aria-label="projects table" size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'background.paper' }}>
                      <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Project Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Sales Person</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Project Manager</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>P&L Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Last Updated</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {!Array.isArray(projects) || projects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Typography variant="subtitle1" color="text.secondary">
                            No projects found.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      projects.map((project) => (
                        <TableRow
                          key={project.id}
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <TableCell component="th" scope="row" sx={{ py: 1.5 }}>
                            <Link
                              component={RouterLink}
                              to={`/projects/${project.id}`}
                              underline="hover"
                              sx={{
                                fontWeight: 500,
                                color: 'primary.main',
                                '&:hover': { color: 'primary.dark' },
                                fontSize: '0.875rem'
                              }}
                            >
                              {project.projectName}
                            </Link>
                          </TableCell>
                          <TableCell sx={{ py: 1.5, fontSize: '0.875rem' }}>{project.customerName || 'N/A'}</TableCell>
                          <TableCell sx={{ py: 1.5 }}>{getStatusChip(project.status)}</TableCell>
                          <TableCell sx={{ py: 1.5, fontSize: '0.875rem' }}>{project.salesPerson?.name || 'N/A'}</TableCell>
                          <TableCell sx={{ py: 1.5 }}>
                            {project.projectManager?.name ||
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>Not Assigned</Typography>
                            }
                          </TableCell>
                          <TableCell sx={{ py: 1.5 }}>{getPnlStatusChip(project)}</TableCell>
                          <TableCell sx={{ py: 1.5, fontSize: '0.875rem' }}>{new Date(project.updatedAt).toLocaleDateString()}</TableCell>
                          <TableCell sx={{ py: 1.5 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                component={RouterLink}
                                to={`/projects/${project.id}`}
                                size="small"
                                color="primary"
                              >
                                <VisibilityIcon sx={{ fontSize: '1rem' }} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </>
        )}

        {/* Dialogs */}
        <CreateProjectForm open={openCreateDialog} onClose={handleCloseCreateDialog} />
        <DeletionRequestsDialog open={openDeletionRequestsDialog} onClose={handleCloseDeletionRequestsDialog} />
      </Box>
    </>
  );
};

export default DashboardPage;
