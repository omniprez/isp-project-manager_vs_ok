// src/components/AppLayout.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Container,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import LogoutConfirmDialog from './LogoutConfirmDialog';
import NotificationCenter from './NotificationCenter';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogoutClick = () => {
    handleCloseUserMenu();
    setLogoutDialogOpen(true);
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  const handleLogoutConfirm = () => {
    setLogoutDialogOpen(false);
    logout();
    navigate('/login');
  };

  const handleDashboard = () => {
    handleCloseUserMenu();
    navigate('/dashboard');
  };

  // Get first letter of name or email for avatar
  const getAvatarText = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return user?.email.charAt(0).toUpperCase() || '?';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/dashboard')}
          >
            MCS Project Management
          </Typography>

          {/* Notification Center */}
          <NotificationCenter />

          {/* Logout Button */}
          <Button
            color="inherit"
            onClick={handleLogoutClick}
            startIcon={<LogoutIcon />}
            sx={{ mr: 2 }}
          >
            Logout
          </Button>

          {/* User menu */}
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  {getAvatarText()}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={handleCloseUserMenu} disabled>
                <Typography textAlign="center">
                  {user?.name || user?.email}
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleCloseUserMenu} disabled>
                <Typography textAlign="center" color="text.secondary">
                  Role: {user?.role}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleDashboard}>
                <DashboardIcon fontSize="small" sx={{ mr: 1 }} />
                Dashboard
              </MenuItem>
              <MenuItem onClick={handleLogoutClick}>
                <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) => theme.palette.grey[100]
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            MCS Project Management © {new Date().getFullYear()}
          </Typography>
        </Container>
      </Box>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
      />
    </Box>
  );
};

export default AppLayout;
