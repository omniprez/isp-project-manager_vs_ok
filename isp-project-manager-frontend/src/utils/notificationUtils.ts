// src/utils/notificationUtils.ts
import { createNotification, CreateNotificationData } from '../services/notificationApi';

/**
 * Send a notification to a user
 * @param recipientId - The ID of the recipient
 * @param title - The notification title
 * @param message - The notification message
 * @param type - The notification type (info, success, warning, error)
 * @param link - Optional link to navigate to
 * @param projectId - Optional related project ID
 * @returns Promise with the created notification
 */
export const sendNotification = async (
  recipientId: number,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error',
  link?: string,
  projectId?: number
) => {
  const data: CreateNotificationData = {
    recipientId,
    title,
    message,
    type,
    link,
    projectId
  };
  
  try {
    return await createNotification(data);
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

/**
 * Send a notification about a project to a user
 * @param recipientId - The ID of the recipient
 * @param projectId - The ID of the project
 * @param projectName - The name of the project
 * @param action - The action performed (e.g., "created", "updated", "approved")
 * @param type - The notification type (info, success, warning, error)
 * @returns Promise with the created notification
 */
export const sendProjectNotification = async (
  recipientId: number,
  projectId: number,
  projectName: string,
  action: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) => {
  const title = `Project ${action}`;
  const message = `Project "${projectName}" has been ${action}.`;
  const link = `/projects/${projectId}`;
  
  return sendNotification(recipientId, title, message, type, link, projectId);
};

/**
 * Send a notification about a P&L to a user
 * @param recipientId - The ID of the recipient
 * @param projectId - The ID of the project
 * @param projectName - The name of the project
 * @param action - The action performed (e.g., "submitted", "approved", "rejected")
 * @param type - The notification type (info, success, warning, error)
 * @returns Promise with the created notification
 */
export const sendPnlNotification = async (
  recipientId: number,
  projectId: number,
  projectName: string,
  action: string,
  type: 'info' | 'success' | 'warning' | 'error'
) => {
  const title = `P&L ${action}`;
  const message = `P&L for project "${projectName}" has been ${action}.`;
  const link = `/projects/${projectId}`;
  
  return sendNotification(recipientId, title, message, type, link, projectId);
};
