// src/components/AssignPmDialog.tsx
import React, { useState, useEffect } from 'react';

// MUI Imports
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';

// Import API functions and types
import { getUsers, UserSummary } from '../services/api'; // Fetch users from api.ts
import { assignPm } from '../services/projectApi'; // Assign PM action from projectApi.ts

// Define props expected by this component
interface AssignPmDialogProps {
  open: boolean;
  onClose: (refresh?: boolean) => void; // To close dialog & signal refresh
  projectId: number; // Project to assign PM to
}

// Define roles suitable for being a Project Manager
// Adjust this list based on your actual roles that can manage projects
const projectManagerRoles: string[] = [
    'PROJECTS_ADMIN', 'PROJECTS_INSTALL', 'PROJECTS_SURVEY', 'PROJECTS_COMMISSIONING', 'ADMIN'
];

const AssignPmDialog: React.FC<AssignPmDialogProps> = ({ open, projectId, onClose }) => {

  // State for assignable users list and selection
  const [assignableUsers, setAssignableUsers] = useState<UserSummary[]>([]);
  const [selectedPmId, setSelectedPmId] = useState<string>(''); // Store ID as string for Select value

  // State for loading/error within the dialog
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // For assignment submission
  const [error, setError] = useState(''); // For displaying errors

  // Fetch assignable users when dialog opens
  useEffect(() => {
    // Only fetch if dialog is open
    if (open) {
      // Reset state when opening
      setAssignableUsers([]);
      setSelectedPmId('');
      setError('');
      setIsSubmitting(false);
      setLoadingUsers(true);

      console.log("AssignPmDialog: Fetching assignable users with roles:", projectManagerRoles);
      getUsers(projectManagerRoles) // Call API to get users with specific roles
        .then(users => {
          console.log("AssignPmDialog: Users fetched successfully:", users);
          // Filter out inactive users if necessary (optional but good practice)
          const activeUsers = users.filter(u => u.isActive);
          setAssignableUsers(activeUsers);
          // Set error message if no suitable users found
          if (activeUsers.length === 0 && users.length > 0) {
              setError("No *active* users found with suitable roles.");
          } else if (users.length === 0) {
               setError("No users found with suitable roles.");
          }
        })
        .catch(err => {
          console.error("AssignPmDialog: Failed to fetch users:", err);
          setError('Failed to load list of potential Project Managers.');
        })
        .finally(() => {
          setLoadingUsers(false);
        });
    }
  }, [open]); // Re-run only when dialog opens

  const handleInternalClose = () => {
    if (!isSubmitting) { onClose(false); } // Close without refreshing
  };

  const handlePmSelectionChange = (event: SelectChangeEvent) => {
    setSelectedPmId(event.target.value as string);
  };

  // --- Submit Handler ---
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!selectedPmId) {
      setError('Please select a Project Manager to assign.');
      return;
    }

    const pmId = parseInt(selectedPmId, 10);
    if (isNaN(pmId)) {
        setError('Invalid Project Manager selection.');
        return;
    }

    setIsSubmitting(true);
    console.log(`AssignPmDialog: Submitting assignment for Project ID ${projectId}, PM ID: ${pmId}`);

    // --- Actual API call logic ---
    try {
        await assignPm(projectId, pmId); // Call the assignPm API function
        console.log("AssignPmDialog: PM assigned successfully via API.");
        onClose(true); // Close dialog and signal refresh on success
    } catch (err: any) {
        console.error("AssignPmDialog: Failed to assign PM:", err);
        const message = err.response?.data?.error || err.message || 'Failed to assign Project Manager.';
        setError(message); // Set error state to display in Alert
        setIsSubmitting(false); // Stop submitting state only on error
    }
    // No finally block needed for setIsSubmitting(false) on success, as component resets on close/reopen
    // -------------------------
  };

  return (
    <Dialog
      open={open}
      onClose={handleInternalClose}
      disableEscapeKeyDown={isSubmitting || loadingUsers} // Prevent close while loading/submitting
      PaperProps={{ component: 'form', onSubmit: handleFormSubmit }}
      maxWidth="xs" // Smaller dialog for simple selection
      fullWidth
    >
      <DialogTitle>Assign Project Manager</DialogTitle>
      <DialogContent>
         {/* Display errors */}
         {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

         {/* Loading indicator for user list */}
         {loadingUsers && (
             <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 3 }}>
                 <CircularProgress size={30} />
                 <Typography sx={{ ml: 2 }}>Loading potential PMs...</Typography>
             </Box>
         )}

         {/* User Selection Dropdown - only show if not loading users and no fetch error */}
         {!loadingUsers && !error && (
             <FormControl fullWidth required margin="normal" disabled={isSubmitting}>
                 <InputLabel id="pm-select-label">Project Manager</InputLabel>
                 <Select
                   labelId="pm-select-label"
                   id="pm-select"
                   value={selectedPmId}
                   label="Project Manager"
                   onChange={handlePmSelectionChange}
                   autoFocus
                 >
                   <MenuItem value="" disabled><em>Select a user...</em></MenuItem>
                   {/* Show message if no users found */}
                   {assignableUsers.length === 0 && (
                       <MenuItem value="" disabled>No suitable active users found.</MenuItem>
                   )}
                   {/* Map over fetched users */}
                   {assignableUsers.map((user) => (
                     // Use user.id as value, display name (or email)
                     <MenuItem key={user.id} value={user.id.toString()}>
                       {user.name ? `${user.name} (${user.email})` : user.email}
                     </MenuItem>
                   ))}
                 </Select>
               </FormControl>
         )}
         {/* Show message if users finished loading but list is empty and no error occurred */}
         {!loadingUsers && !error && assignableUsers.length === 0 && (
             <Typography variant="caption" color="text.secondary" sx={{mt: 1}}>
                 No active users found with roles: {projectManagerRoles.join(', ')}.
             </Typography>
         )}

      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={handleInternalClose} color="inherit" disabled={isSubmitting}> Cancel </Button>
        <Button
            type="submit"
            variant="contained"
            // Disable if submitting, loading users, or no PM selected, or if user list is empty
            disabled={isSubmitting || loadingUsers || !selectedPmId || assignableUsers.length === 0}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Assign PM'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignPmDialog;

