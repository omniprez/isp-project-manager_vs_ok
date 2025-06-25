// src/utils/emailService.ts
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// Email sender address
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@ispprojectmanager.com';

/**
 * Send a simple email
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param text - Plain text content
 * @param html - HTML content (optional)
 * @returns Promise with SendGrid response
 */
export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<boolean> => {
  try {
    const msg = {
      to,
      from: FROM_EMAIL,
      subject,
      text,
      html: html || text,
    };
    
    await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

/**
 * Send a notification email
 * @param to - Recipient email address
 * @param title - Notification title
 * @param message - Notification message
 * @param type - Notification type (info, success, warning, error)
 * @param link - Optional link to include in the email
 * @returns Promise with SendGrid response
 */
export const sendNotificationEmail = async (
  to: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error',
  link?: string
): Promise<boolean> => {
  // Set color based on notification type
  let color = '#2196f3'; // info (blue)
  if (type === 'success') color = '#4caf50'; // green
  if (type === 'warning') color = '#ff9800'; // orange
  if (type === 'error') color = '#f44336'; // red
  
  // Create HTML content
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: ${color};
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 5px 5px;
        }
        .button {
          display: inline-block;
          background-color: ${color};
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          margin-top: 20px;
          border-radius: 5px;
          font-weight: bold;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          <p>${message}</p>
          ${link ? `<a href="${link}" class="button">View Details</a>` : ''}
        </div>
        <div class="footer">
          <p>This is an automated message from ISP Project Manager. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(to, title, message, html);
};

/**
 * Send a project notification email
 * @param to - Recipient email address
 * @param projectName - Name of the project
 * @param action - Action performed on the project
 * @param type - Notification type
 * @param link - Optional link to the project
 * @returns Promise with SendGrid response
 */
export const sendProjectEmail = async (
  to: string,
  projectName: string,
  action: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  link?: string
): Promise<boolean> => {
  const title = `Project ${action}`;
  const message = `Project "${projectName}" has been ${action}.`;
  
  return sendNotificationEmail(to, title, message, type, link);
};

/**
 * Send a P&L notification email
 * @param to - Recipient email address
 * @param projectName - Name of the project
 * @param action - Action performed on the P&L
 * @param type - Notification type
 * @param link - Optional link to the project
 * @returns Promise with SendGrid response
 */
export const sendPnlEmail = async (
  to: string,
  projectName: string,
  action: string,
  type: 'info' | 'success' | 'warning' | 'error',
  link?: string
): Promise<boolean> => {
  const title = `P&L ${action}`;
  const message = `P&L for project "${projectName}" has been ${action}.`;
  
  return sendNotificationEmail(to, title, message, type, link);
};
