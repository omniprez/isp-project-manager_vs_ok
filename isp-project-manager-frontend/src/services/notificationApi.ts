// src/services/notificationApi.ts
import { apiClient } from './api';
import axios, { AxiosError } from 'axios';
import { Notification } from '../context/NotificationContext';

// Interface for creating a notification
export interface CreateNotificationData {
  recipientId: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  projectId?: number;
}

/**
 * Get all notifications for the current user
 * @returns Promise with the notifications
 */
export const getNotifications = async (): Promise<Notification[]> => {
  console.log(`notificationApi.ts: getNotifications function started`);
  try {
    const response = await apiClient.get<Notification[]>('/notifications');
    return response.data;
  } catch (error) {
    console.error(`notificationApi.ts: apiClient.get('/notifications') FAILED.`, error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error("notificationApi.ts: Axios error details:", {
        message: axiosError.message,
        code: axiosError.code,
        status: axiosError.response?.status,
        responseData: axiosError.response?.data
      });
    }
    throw error;
  }
};

/**
 * Get count of unread notifications
 * @returns Promise with the count
 */
export const getUnreadCount = async (): Promise<number> => {
  console.log(`notificationApi.ts: getUnreadCount function started`);
  try {
    const response = await apiClient.get<{ count: number }>('/notifications/unread');
    return response.data.count;
  } catch (error) {
    console.error(`notificationApi.ts: apiClient.get('/notifications/unread') FAILED.`, error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error("notificationApi.ts: Axios error details:", {
        message: axiosError.message,
        code: axiosError.code,
        status: axiosError.response?.status,
        responseData: axiosError.response?.data
      });
    }
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param id - The ID of the notification
 * @returns Promise with the updated notification
 */
export const markAsRead = async (id: number): Promise<Notification> => {
  console.log(`notificationApi.ts: markAsRead function started for notification ID: ${id}`);
  try {
    const response = await apiClient.put<Notification>(`/notifications/${id}/read`);
    return response.data;
  } catch (error) {
    console.error(`notificationApi.ts: apiClient.put('/notifications/${id}/read') FAILED.`, error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error("notificationApi.ts: Axios error details:", {
        message: axiosError.message,
        code: axiosError.code,
        status: axiosError.response?.status,
        responseData: axiosError.response?.data
      });
    }
    throw error;
  }
};

/**
 * Mark all notifications as read
 * @returns Promise with a success message
 */
export const markAllAsRead = async (): Promise<{ message: string }> => {
  console.log(`notificationApi.ts: markAllAsRead function started`);
  try {
    const response = await apiClient.put<{ message: string }>('/notifications/read-all');
    return response.data;
  } catch (error) {
    console.error(`notificationApi.ts: apiClient.put('/notifications/read-all') FAILED.`, error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error("notificationApi.ts: Axios error details:", {
        message: axiosError.message,
        code: axiosError.code,
        status: axiosError.response?.status,
        responseData: axiosError.response?.data
      });
    }
    throw error;
  }
};

/**
 * Create a new notification (for testing)
 * @param data - The notification data
 * @returns Promise with the created notification
 */
export const createNotification = async (data: CreateNotificationData): Promise<Notification> => {
  console.log(`notificationApi.ts: createNotification function started`);
  try {
    const response = await apiClient.post<Notification>('/notifications', data);
    return response.data;
  } catch (error) {
    console.error(`notificationApi.ts: apiClient.post('/notifications') FAILED.`, error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error("notificationApi.ts: Axios error details:", {
        message: axiosError.message,
        code: axiosError.code,
        status: axiosError.response?.status,
        responseData: axiosError.response?.data
      });
    }
    throw error;
  }
};
