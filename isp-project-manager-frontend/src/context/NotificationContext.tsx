// src/context/NotificationContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { apiClient } from '../services/api';
import { useAuth } from './AuthContext';

// Define the shape of a notification
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  link?: string;
  projectId?: number;
  creator: {
    id: number;
    name: string | null;
    email: string;
  };
}

// Define the shape of the context
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

// Create the context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Create a provider component
interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<Notification[]>('/notifications');
      setNotifications(response.data);
      
      // Count unread notifications
      const unreadCount = response.data.filter(notification => !notification.isRead).length;
      setUnreadCount(unreadCount);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.error || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const response = await apiClient.get<{ count: number }>('/notifications/unread');
      setUnreadCount(response.data.count);
    } catch (err: any) {
      console.error('Error fetching unread count:', err);
    }
  };

  // Mark a notification as read
  const markAsRead = async (id: number) => {
    if (!user) return;
    
    try {
      await apiClient.put(`/notifications/${id}/read`);
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      setError(err.response?.data?.error || 'Failed to mark notification as read');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await apiClient.put('/notifications/read-all');
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, isRead: true }))
      );
      
      // Update unread count
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      setError(err.response?.data?.error || 'Failed to mark all notifications as read');
    }
  };

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Set up polling for unread count (every 30 seconds)
      const intervalId = setInterval(fetchUnreadCount, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [user]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Create a hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};
