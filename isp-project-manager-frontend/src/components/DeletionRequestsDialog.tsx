// src/components/DeletionRequestsDialog.tsx
import React, { useState, useEffect } from 'react';

// MUI Components
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import RefreshIcon from '@mui/icons-material/Refresh';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Link as RouterLink } from 'react-router-dom';

// API and Types
import { getDeletionRequests, approveDeletionRequest, rejectDeletionRequest } from '../services/projectApi';
import { DeletionRequest } from '../types';

interface DeletionRequestsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ActionDialogState {
  open: boolean;
  type: 'approve' | 'reject' | null;
  requestId: number | null;
  projectName: string;
}

const DeletionRequestsDialog: React.FC<DeletionRequestsDialogProps> = ({ open, onClose }) => {
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionDialog, setActionDialog] = useState<ActionDialogState>({
    open: false,
    type: null,
    requestId: null,
    projectName: ''
  });
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchDeletionRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDeletionRequests();
      setDeletionRequests(data);
    } catch (err: any) {
      console.error('Error fetching deletion requests:', err);
      setError('Failed to load deletion requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDeletionRequests();
    }
  }, [open]);

  const handleRefresh = () => {
    fetchDeletionRequests();
  };

  const handleOpenActionDialog = (type: 'approve' | 'reject', requestId: number, projectName: string) => {
    setActionDialog({
      open: true,
      type,
      requestId,
      projectName
    });
    setComments('');
    setActionError('');
    setActionSuccess('');
  };

  const handleCloseActionDialog = () => {
    if (!actionLoading) {
      setActionDialog({
        open: false,
        type: null,
        requestId: null,
        projectName: ''
      });
    }
  };

  const handleAction = async () => {
    if (!actionDialog.requestId || !actionDialog.type) return;
    
    if (actionDialog.type === 'reject' && !comments.trim()) {
      setActionError('Comments are required when rejecting a deletion request.');
      return;
    }

    setActionLoading(true);
    setActionError('');

    try {
      if (actionDialog.type === 'approve') {
        await approveDeletionRequest(actionDialog.requestId, comments);
        setActionSuccess(`Project "${actionDialog.projectName}" has been deleted successfully.`);
      } else {
        await rejectDeletionRequest(actionDialog.requestId, comments);
        setActionSuccess(`Deletion request for "${actionDialog.projectName}" has been rejected.`);
      }
      
      // Refresh the list after a short delay
      setTimeout(() => {
        handleCloseActionDialog();
        fetchDeletionRequests();
      }, 1500);
    } catch (err: any) {
      console.error(`Error ${actionDialog.type}ing deletion request:`, err);
      if (err.response?.data?.error) {
        setActionError(err.response.data.error);
      } else {
        setActionError(`Failed to ${actionDialog.type} deletion request. Please try again.`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusChip = (status: string) => {
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    
    if (status === 'Pending') {
      color = 'warning';
    } else if (status === 'Approved') {
      color = 'success';
    } else if (status === 'Rejected') {
      color = 'error';
    }
    
    return (
      <Chip 
        label={status} 
        color={color} 
        size="small" 
        sx={{ fontWeight: 500 }}
      />
    );
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'error.light', color: 'white', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Project Deletion Requests</span>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} color="inherit" size="small" disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </DialogTitle>
        
        <DialogContent sx={{ p: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : deletionRequests.length === 0 ? (
            <Alert severity="info">No deletion requests found.</Alert>
          ) : (
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {deletionRequests.map((request) => (
                <Paper key={request.id} elevation={1} sx={{ mb: 2, overflow: 'hidden' }}>
                  <ListItem 
                    sx={{ 
                      bgcolor: request.status === 'Pending' ? 'warning.light' : 'background.paper',
                      py: 1
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {request.project.projectName}
                          </Typography>
                          {getStatusChip(request.status)}
                        </Box>
                      }
                      secondary={`Requested by: ${request.requestedBy.name || request.requestedBy.email} (${request.requestedBy.role}) on ${formatDate(request.requestDate)}`}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Project">
                        <IconButton 
                          component={RouterLink} 
                          to={`/projects/${request.projectId}`} 
                          size="small" 
                          color="primary"
                          onClick={onClose}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {request.status === 'Pending' && (
                        <>
                          <Tooltip title="Approve Deletion">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleOpenActionDialog('approve', request.id, request.project.projectName)}
                            >
                              <ThumbUpIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject Deletion">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleOpenActionDialog('reject', request.id, request.project.projectName)}
                            >
                              <ThumbDownIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </ListItem>
                  
                  <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Reason for deletion:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {request.reason}
                    </Typography>
                    
                    {request.status !== 'Pending' && (
                      <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                        <Typography variant="subtitle2">
                          {request.status === 'Approved' ? 'Approved' : 'Rejected'} by: {request.respondedBy?.name || 'N/A'} on {request.responseDate ? formatDate(request.responseDate) : 'N/A'}
                        </Typography>
                        {request.responseComments && (
                          <>
                            <Typography variant="subtitle2" sx={{ mt: 1 }}>
                              Comments:
                            </Typography>
                            <Typography variant="body2">
                              {request.responseComments}
                            </Typography>
                          </>
                        )}
                      </Box>
                    )}
                  </Box>
                </Paper>
              ))}
            </List>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog (Approve/Reject) */}
      <Dialog open={actionDialog.open} onClose={handleCloseActionDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          bgcolor: actionDialog.type === 'approve' ? 'success.light' : 'error.light', 
          color: 'white', 
          fontWeight: 'bold' 
        }}>
          {actionDialog.type === 'approve' ? 'Approve' : 'Reject'} Deletion Request
        </DialogTitle>
        
        <DialogContent sx={{ p: 2, mt: 1 }}>
          {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
          {actionSuccess && <Alert severity="success" sx={{ mb: 2 }}>{actionSuccess}</Alert>}
          
          <Typography variant="body1" gutterBottom>
            {actionDialog.type === 'approve' 
              ? `Are you sure you want to approve the deletion of project "${actionDialog.projectName}"? This action cannot be undone.`
              : `Are you sure you want to reject the deletion request for project "${actionDialog.projectName}"?`
            }
          </Typography>
          
          <TextField
            margin="dense"
            id="comments"
            label={actionDialog.type === 'approve' ? "Comments (Optional)" : "Rejection Reason (Required)"}
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            disabled={actionLoading || !!actionSuccess}
            required={actionDialog.type === 'reject'}
            error={actionDialog.type === 'reject' && !comments.trim()}
            helperText={actionDialog.type === 'reject' && !comments.trim() ? "Please provide a reason for rejection" : ""}
            sx={{ mt: 2 }}
          />
          
          {actionDialog.type === 'approve' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This will permanently delete the project and all associated data.
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCloseActionDialog} 
            color="inherit" 
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAction} 
            color={actionDialog.type === 'approve' ? "success" : "error"} 
            variant="contained" 
            disabled={actionLoading || (actionDialog.type === 'reject' && !comments.trim()) || !!actionSuccess}
            startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {actionDialog.type === 'approve' ? 'Approve & Delete' : 'Reject Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeletionRequestsDialog;
