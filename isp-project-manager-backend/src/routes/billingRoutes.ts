// src/routes/billingRoutes.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserPayload } from '../middleware/authMiddleware';
import { createNotification } from '../utils/notificationService';

const router = Router();
const prisma = new PrismaClient();

// PUT /api/billing/:projectId/initiate - Initiate billing for a completed project
router.put('/:projectId/initiate', async (req: Request, res: Response) => {
    console.log(`>>> ${new Date().toISOString()} - PUT /api/billing/:projectId/initiate handler started`);
    const loggedInUser = req.user as UserPayload;
    const projectId = parseInt(req.params.projectId, 10);
    const { billingNotes } = req.body;

    if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID.' });
    }

    try {
        // Get the project with its acceptance form
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                acceptanceForm: true,
                salesPerson: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found.' });
        }

        // Check if the project is completed
        if (project.status !== 'Completed') {
            return res.status(400).json({ 
                error: 'Only completed projects can be sent for billing.' 
            });
        }

        // Check if the project has an acceptance form
        if (!project.acceptanceForm) {
            return res.status(400).json({ 
                error: 'Project must have an acceptance form before initiating billing.' 
            });
        }

        // Check if the user is the sales person or an admin
        const isSalesPerson = project.salesPerson.id === loggedInUser.userId;
        const isAdmin = loggedInUser.role === 'ADMIN' || loggedInUser.role === 'FINANCE';
        
        if (!isSalesPerson && !isAdmin) {
            return res.status(403).json({ 
                error: 'Only the sales person, admin, or finance users can initiate billing.' 
            });
        }

        // Update the project's billing status
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                billingStatus: 'Initiated'
            },
            include: {
                acceptanceForm: true,
                salesPerson: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        // Notify finance team members
        try {
            // Get all finance users
            const financeUsers = await prisma.user.findMany({
                where: { role: 'FINANCE' }
            });
            
            // Send notification to each finance user
            for (const financeUser of financeUsers) {
                await createNotification(
                    financeUser.id,
                    'Billing Request',
                    `Project "${project.projectName}" is ready for billing. Billing start date: ${new Date(project.acceptanceForm.billingStartDate).toLocaleDateString()}`,
                    'info',
                    loggedInUser.userId,
                    `/projects/${projectId}`,
                    projectId
                );
            }

            // Also notify the sales person if they're not the one who initiated it
            if (!isSalesPerson && project.salesPerson) {
                await createNotification(
                    project.salesPerson.id,
                    'Billing Initiated',
                    `Billing has been initiated for project "${project.projectName}".`,
                    'info',
                    loggedInUser.userId,
                    `/projects/${projectId}`,
                    projectId
                );
            }
        } catch (notifError) {
            console.error('Failed to create billing notifications:', notifError);
            // Continue with the process even if notification fails
        }

        res.status(200).json({
            message: 'Billing initiated successfully.',
            project: {
                id: updatedProject.id,
                projectName: updatedProject.projectName,
                billingStatus: updatedProject.billingStatus,
                billingStartDate: updatedProject.acceptanceForm?.billingStartDate
            }
        });
    } catch (error) {
        console.error(`>>> PUT /api/billing/:projectId/initiate handler FAILED:`, error);
        res.status(500).json({ error: 'Failed to initiate billing due to server error.' });
    }
});

// PUT /api/billing/:projectId/complete - Mark billing as completed
router.put('/:projectId/complete', async (req: Request, res: Response) => {
    console.log(`>>> ${new Date().toISOString()} - PUT /api/billing/:projectId/complete handler started`);
    const loggedInUser = req.user as UserPayload;
    const projectId = parseInt(req.params.projectId, 10);
    const { billingReference } = req.body;

    if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID.' });
    }

    // Only finance or admin users can mark billing as completed
    if (loggedInUser.role !== 'FINANCE' && loggedInUser.role !== 'ADMIN') {
        return res.status(403).json({ 
            error: 'Only finance or admin users can mark billing as completed.' 
        });
    }

    try {
        // Get the project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                salesPerson: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found.' });
        }

        // Check if billing has been initiated
        if (project.billingStatus !== 'Initiated') {
            return res.status(400).json({ 
                error: 'Billing must be initiated before it can be marked as completed.' 
            });
        }

        // Update the project's billing status
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                billingStatus: 'Billed'
            }
        });

        // Notify the sales person
        try {
            if (project.salesPerson) {
                await createNotification(
                    project.salesPerson.id,
                    'Billing Completed',
                    `Billing has been completed for project "${project.projectName}".`,
                    'success',
                    loggedInUser.userId,
                    `/projects/${projectId}`,
                    projectId
                );
            }
        } catch (notifError) {
            console.error('Failed to create billing completion notification:', notifError);
            // Continue with the process even if notification fails
        }

        res.status(200).json({
            message: 'Billing marked as completed successfully.',
            project: {
                id: updatedProject.id,
                projectName: updatedProject.projectName,
                billingStatus: updatedProject.billingStatus
            }
        });
    } catch (error) {
        console.error(`>>> PUT /api/billing/:projectId/complete handler FAILED:`, error);
        res.status(500).json({ error: 'Failed to mark billing as completed due to server error.' });
    }
});

export default router;
