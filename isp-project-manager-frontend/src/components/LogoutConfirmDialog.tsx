// src/components/LogoutConfirmDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button
} from '@mui/material';

interface LogoutConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-description"
    >
      <DialogTitle id="logout-dialog-title">
        Confirm Logout
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="logout-dialog-description">
          Are you sure you want to log out? Any unsaved changes will be lost.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="primary" variant="contained" autoFocus>
          Logout
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogoutConfirmDialog;
