// src/utils/notificationService.ts
import { PrismaClient } from '@prisma/client';
import { sendNotificationEmail, sendProjectEmail, sendPnlEmail } from './emailService';

const prisma = new PrismaClient();

// Check if email notifications are enabled
const isEmailEnabled = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true';

/**
 * Create a notification and optionally send an email
 * @param recipientId - The ID of the recipient
 * @param title - The notification title
 * @param message - The notification message
 * @param type - The notification type (info, success, warning, error)
 * @param creatorId - The ID of the creator
 * @param link - Optional link to navigate to
 * @param projectId - Optional related project ID
 * @returns Promise with the created notification
 */
export const createNotification = async (
  recipientId: number,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error',
  creatorId: number,
  link?: string,
  projectId?: number
) => {
  try {
    // Create in-app notification
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        link,
        projectId,
        recipientId,
        creatorId
      },
      include: {
        recipient: true
      }
    });
    
    // Send email notification if enabled
    if (isEmailEnabled && notification.recipient.email) {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
      const fullLink = link ? `${baseUrl}${link}` : undefined;
      
      await sendNotificationEmail(
        notification.recipient.email,
        title,
        message,
        type as 'info' | 'success' | 'warning' | 'error',
        fullLink
      );
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create a project notification and optionally send an email
 * @param recipientId - The ID of the recipient
 * @param projectId - The ID of the project
 * @param projectName - The name of the project
 * @param action - The action performed (e.g., "created", "updated", "approved")
 * @param type - The notification type (info, success, warning, error)
 * @param creatorId - The ID of the creator
 * @returns Promise with the created notification
 */
export const createProjectNotification = async (
  recipientId: number,
  projectId: number,
  projectName: string,
  action: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  creatorId: number
) => {
  const title = `Project ${action}`;
  const message = `Project "${projectName}" has been ${action}.`;
  const link = `/projects/${projectId}`;
  
  const notification = await createNotification(
    recipientId,
    title,
    message,
    type,
    creatorId,
    link,
    projectId
  );
  
  // Send project-specific email if enabled
  if (isEmailEnabled && notification.recipient.email) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    const fullLink = `${baseUrl}${link}`;
    
    await sendProjectEmail(
      notification.recipient.email,
      projectName,
      action,
      type,
      fullLink
    );
  }
  
  return notification;
};

/**
 * Create a P&L notification and optionally send an email
 * @param recipientId - The ID of the recipient
 * @param projectId - The ID of the project
 * @param projectName - The name of the project
 * @param action - The action performed (e.g., "submitted", "approved", "rejected")
 * @param type - The notification type (info, success, warning, error)
 * @param creatorId - The ID of the creator
 * @returns Promise with the created notification
 */
export const createPnlNotification = async (
  recipientId: number,
  projectId: number,
  projectName: string,
  action: string,
  type: 'info' | 'success' | 'warning' | 'error',
  creatorId: number
) => {
  const title = `P&L ${action}`;
  const message = `P&L for project "${projectName}" has been ${action}.`;
  const link = `/projects/${projectId}`;
  
  const notification = await createNotification(
    recipientId,
    title,
    message,
    type,
    creatorId,
    link,
    projectId
  );
  
  // Send P&L-specific email if enabled
  if (isEmailEnabled && notification.recipient.email) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    const fullLink = `${baseUrl}${link}`;
    
    await sendPnlEmail(
      notification.recipient.email,
      projectName,
      action,
      type,
      fullLink
    );
  }
  
  return notification;
};
