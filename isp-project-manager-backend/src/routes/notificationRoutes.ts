// isp-project-manager-backend/src/routes/notificationRoutes.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserPayload } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// GET /api/notifications - Get all notifications for the logged-in user
router.get('/', async (req: Request, res: Response) => {
    console.log(`>>> ${new Date().toISOString()} - GET /api/notifications handler started`);
    const loggedInUser = req.user as UserPayload;

    try {
        const notifications = await prisma.notification.findMany({
            where: {
                recipientId: loggedInUser.userId
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// GET /api/notifications/unread - Get count of unread notifications
router.get('/unread', async (req: Request, res: Response) => {
    console.log(`>>> ${new Date().toISOString()} - GET /api/notifications/unread handler started`);
    const loggedInUser = req.user as UserPayload;

    try {
        const count = await prisma.notification.count({
            where: {
                recipientId: loggedInUser.userId,
                isRead: false
            }
        });

        res.status(200).json({ count });
    } catch (error) {
        console.error('Error counting unread notifications:', error);
        res.status(500).json({ error: 'Failed to count unread notifications' });
    }
});

// PUT /api/notifications/:id/read - Mark a notification as read
router.put('/:id/read', async (req: Request, res: Response) => {
    console.log(`>>> ${new Date().toISOString()} - PUT /api/notifications/:id/read handler started`);
    const loggedInUser = req.user as UserPayload;
    const notificationId = parseInt(req.params.id, 10);

    if (isNaN(notificationId)) {
        return res.status(400).json({ error: 'Invalid notification ID' });
    }

    try {
        // First check if the notification belongs to the user
        const notification = await prisma.notification.findUnique({
            where: {
                id: notificationId
            }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        if (notification.recipientId !== loggedInUser.userId) {
            return res.status(403).json({ error: 'You do not have permission to update this notification' });
        }

        // Update the notification
        const updatedNotification = await prisma.notification.update({
            where: {
                id: notificationId
            },
            data: {
                isRead: true
            }
        });

        res.status(200).json(updatedNotification);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', async (req: Request, res: Response) => {
    console.log(`>>> ${new Date().toISOString()} - PUT /api/notifications/read-all handler started`);
    const loggedInUser = req.user as UserPayload;

    try {
        // Update all unread notifications for the user
        await prisma.notification.updateMany({
            where: {
                recipientId: loggedInUser.userId,
                isRead: false
            },
            data: {
                isRead: true
            }
        });

        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});

// POST /api/notifications - Create a new notification (for testing)
router.post('/', async (req: Request, res: Response) => {
    console.log(`>>> ${new Date().toISOString()} - POST /api/notifications handler started`);
    const loggedInUser = req.user as UserPayload;
    const { recipientId, title, message, type, link, projectId } = req.body;

    if (!recipientId || !title || !message || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const notification = await prisma.notification.create({
            data: {
                title,
                message,
                type,
                link,
                projectId: projectId ? parseInt(projectId, 10) : undefined,
                recipientId: parseInt(recipientId, 10),
                creatorId: loggedInUser.userId
            }
        });

        res.status(201).json(notification);
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
});

// Export the createNotification function from the notification service
export { createNotification, createProjectNotification, createPnlNotification } from '../utils/notificationService';

export default router;
