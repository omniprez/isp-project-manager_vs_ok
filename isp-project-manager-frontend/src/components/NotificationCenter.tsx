// src/components/NotificationCenter.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, Notification } from '../context/NotificationContext';

// MUI Components
import {
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Divider,
  Button,
  CircularProgress,
  Tooltip,
  ListItemIcon,
  Paper
} from '@mui/material';

// MUI Icons
import NotificationsIcon from '@mui/icons-material/Notifications';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import MarkChatReadIcon from '@mui/icons-material/MarkChatRead';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';

const NotificationCenter: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
  const navigate = useNavigate();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications(); // Refresh notifications when opening
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Navigate to link if provided
    if (notification.link) {
      navigate(notification.link);
    }
    
    handleClose();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <InfoIcon color="info" />;
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          aria-describedby={id}
          onClick={handleClick}
          color="inherit"
          size="large"
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 500,
            overflow: 'auto',
            mt: 1,
            boxShadow: 3,
            borderRadius: 2
          }
        }}
      >
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <NotificationsActiveIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="div">
              Notifications
            </Typography>
          </Box>
          
          {unreadCount > 0 && (
            <Tooltip title="Mark all as read">
              <IconButton
                size="small"
                color="inherit"
                onClick={handleMarkAllAsRead}
                sx={{ ml: 1 }}
              >
                <MarkChatReadIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        <Divider />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={30} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsOffIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography color="text.secondary">No notifications</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    bgcolor: notification.isRead ? 'inherit' : 'action.hover',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                    py: 1.5
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" sx={{ fontWeight: notification.isRead ? 400 : 600 }}>
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(notification.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
        
        <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Button
            size="small"
            onClick={handleClose}
            sx={{ width: '100%' }}
          >
            Close
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default NotificationCenter;
