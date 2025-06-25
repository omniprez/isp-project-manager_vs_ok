// isp-project-manager-backend/src/routes/deletionRequestRoutes.ts
import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { UserPayload } from '../middleware/authMiddleware';
import { createNotification, createProjectNotification } from '../utils/notificationService';

const router = Router();
const prisma = new PrismaClient();

// GET /api/deletion-requests - Get all deletion requests (Admin only)
router.get('/', async (req: Request, res: Response) => {
    console.log(`>>> ${new Date().toISOString()} - GET /api/deletion-requests handler started`);
    const loggedInUser = req.user as UserPayload;

    // Only ADMIN can view all deletion requests
    if (!loggedInUser || loggedInUser.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Only ADMIN can view all deletion requests.' });
    }

    try {
        const deletionRequests = await prisma.deletionRequest.findMany({
            include: {
                project: {
                    select: {
                        id: true,
                        projectName: true,
                        customerName: true,
                        status: true,
                        salesPerson: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                },
                requestedBy: {
                    select: { id: true, name: true, email: true, role: true }
                },
                respondedBy: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { requestDate: 'desc' }
        });

        res.status(200).json(deletionRequests);
    } catch (error) {
        console.error(`>>> GET /api/deletion-requests handler FAILED:`, error);
        res.status(500).json({ error: 'Failed to fetch deletion requests due to server error.' });
    }
});

// POST /api/deletion-requests - Create a new deletion request
router.post('/', async (req: Request, res: Response) => {
    console.log(`>>> ${new Date().toISOString()} - POST /api/deletion-requests handler started`);
    const loggedInUser = req.user as UserPayload;
    const { projectId, reason } = req.body;

    if (!projectId || !reason) {
        return res.status(400).json({ error: 'Missing required fields: projectId and reason are required.' });
    }

    try {
        // Check if project exists
        const project = await prisma.project.findUnique({
            where: { id: Number(projectId) },
            include: {
                deletionRequest: true,
                salesPerson: { select: { id: true } }
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found.' });
        }

        // Check if user is ADMIN or the sales person who created the project
        const isAdmin = loggedInUser.role === 'ADMIN';
        const isSalesPerson = project.salesPerson.id === loggedInUser.userId;

        if (!isAdmin && !isSalesPerson) {
            return res.status(403).json({
                error: 'Forbidden: Only ADMIN or the sales person who created the project can request deletion.'
            });
        }

        // Check if a deletion request already exists
        if (project.deletionRequest) {
            return res.status(409).json({
                error: 'A deletion request already exists for this project.',
                status: project.deletionRequest.status
            });
        }

        // If user is ADMIN, directly delete the project
        if (isAdmin) {
            try {
                // Get full project details with all relations
                const fullProject = await prisma.project.findUnique({
                    where: { id: Number(projectId) },
                    include: {
                        crd: true,
                        boq: true,
                        pnl: true,
                        acceptanceForm: true,
                        deletionRequest: true
                    }
                });

                if (!fullProject) {
                    return res.status(404).json({ error: 'Project not found.' });
                }

                // Delete the project and all related records
                await prisma.$transaction(async (tx) => {
                    // Delete related records first (due to foreign key constraints)

                    // Delete notifications related to this project
                    await tx.notification.deleteMany({
                        where: { projectId: Number(projectId) }
                    });

                    // Delete CRD if exists
                    if (fullProject.crd) {
                        await tx.crd.delete({ where: { projectId: Number(projectId) } });
                    }

                    // Delete BOQ if exists
                    if (fullProject.boq) {
                        await tx.boq.delete({ where: { projectId: Number(projectId) } });
                    }

                    // Delete P&L if exists
                    if (fullProject.pnl) {
                        await tx.pnl.delete({ where: { projectId: Number(projectId) } });
                    }

                    // Delete Acceptance Form if exists
                    if (fullProject.acceptanceForm) {
                        await tx.acceptanceForm.delete({ where: { projectId: Number(projectId) } });
                    }

                    // Delete Deletion Request if exists
                    if (fullProject.deletionRequest) {
                        await tx.deletionRequest.delete({ where: { projectId: Number(projectId) } });
                    }

                    // Finally delete the project
                    await tx.project.delete({ where: { id: Number(projectId) } });
                });
            } catch (txError) {
                console.error(`>>> Transaction error when deleting project:`, txError);
                return res.status(500).json({ error: 'Failed to delete project due to database constraints. Please contact support.' });
            }

            return res.status(200).json({
                message: 'Project deleted successfully by ADMIN.'
            });
        }

        // For non-admin users, create a deletion request
        const deletionRequest = await prisma.deletionRequest.create({
            data: {
                projectId: Number(projectId),
                reason,
                requestedById: loggedInUser.userId,
                status: 'Pending'
            },
            include: {
                project: {
                    select: { projectName: true }
                },
                requestedBy: {
                    select: { name: true, email: true }
                }
            }
        });

        // Notify admins about the deletion request
        try {
            // Get all admin users
            const adminUsers = await prisma.user.findMany({
                where: { role: 'ADMIN' }
            });

            // Send notification to each admin
            for (const admin of adminUsers) {
                await createNotification(
                    admin.id,
                    'Deletion Request Submitted',
                    `A deletion request has been submitted for project "${project.projectName}" by ${loggedInUser.name || loggedInUser.email}.`,
                    'info',
                    loggedInUser.userId,
                    '/deletion-requests',
                    Number(projectId)
                );
            }
        } catch (notifError) {
            console.error('Failed to create admin notifications:', notifError);
            // Continue with the process even if notification fails
        }

        res.status(201).json({
            message: 'Deletion request submitted successfully. Awaiting ADMIN approval.',
            deletionRequest
        });
    } catch (error) {
        console.error(`>>> POST /api/deletion-requests handler FAILED:`, error);
        res.status(500).json({ error: 'Failed to create deletion request due to server error.' });
    }
});

// PUT /api/deletion-requests/:id/approve - Approve a deletion request (Admin only)
router.put('/:id/approve', async (req: Request, res: Response) => {
    console.log(`>>> ${new Date().toISOString()} - PUT /api/deletion-requests/:id/approve handler started`);
    const loggedInUser = req.user as UserPayload;
    const requestId = parseInt(req.params.id, 10);
    const { comments } = req.body;

    // Only ADMIN can approve deletion requests
    if (!loggedInUser || loggedInUser.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Only ADMIN can approve deletion requests.' });
    }

    if (isNaN(requestId)) {
        return res.status(400).json({ error: 'Invalid deletion request ID.' });
    }

    try {
        // Get the deletion request
        const deletionRequest = await prisma.deletionRequest.findUnique({
            where: { id: requestId },
            include: { project: true }
        });

        if (!deletionRequest) {
            return res.status(404).json({ error: 'Deletion request not found.' });
        }

        if (deletionRequest.status !== 'Pending') {
            return res.status(400).json({
                error: `This deletion request has already been ${deletionRequest.status.toLowerCase()}.`
            });
        }

        // Get project details for notifications
        const projectDetails = await prisma.project.findUnique({
            where: { id: deletionRequest.projectId },
            include: {
                salesPerson: { select: { id: true, name: true, email: true } }
            }
        });

        // Get full project details with all relations
        const fullProject = await prisma.project.findUnique({
            where: { id: deletionRequest.projectId },
            include: {
                crd: true,
                boq: true,
                pnl: true,
                acceptanceForm: true
            }
        });

        if (!fullProject) {
            return res.status(404).json({ error: 'Project not found.' });
        }

        try {
            // Update the deletion request status and delete the project
            await prisma.$transaction(async (tx) => {
                // Update the deletion request
                await tx.deletionRequest.update({
                    where: { id: requestId },
                    data: {
                        status: 'Approved',
                        responseDate: new Date(),
                        responseComments: comments || null,
                        respondedById: loggedInUser.userId
                    }
                });

                // Delete related records first (due to foreign key constraints)

                // Delete notifications related to this project
                await tx.notification.deleteMany({
                    where: { projectId: deletionRequest.projectId }
                });

                // Delete CRD if exists
                if (fullProject.crd) {
                    await tx.crd.delete({ where: { projectId: deletionRequest.projectId } });
                }

                // Delete BOQ if exists
                if (fullProject.boq) {
                    await tx.boq.delete({ where: { projectId: deletionRequest.projectId } });
                }

                // Delete P&L if exists
                if (fullProject.pnl) {
                    await tx.pnl.delete({ where: { projectId: deletionRequest.projectId } });
                }

                // Delete Acceptance Form if exists
                if (fullProject.acceptanceForm) {
                    await tx.acceptanceForm.delete({ where: { projectId: deletionRequest.projectId } });
                }

                // Delete the deletion request itself
                await tx.deletionRequest.delete({ where: { id: requestId } });

                // Finally delete the project
                await tx.project.delete({ where: { id: deletionRequest.projectId } });
            });
        } catch (txError) {
            console.error(`>>> Transaction error when deleting project:`, txError);
            return res.status(500).json({ error: 'Failed to delete project due to database constraints. Please contact support.' });
        }

        // Notify the requester about the approval
        try {
            if (projectDetails && projectDetails.salesPerson) {
                await createNotification(
                    deletionRequest.requestedById,
                    'Deletion Request Approved',
                    `Your request to delete project "${deletionRequest.project.projectName}" has been approved.`,
                    'success',
                    loggedInUser.userId
                );
            }
        } catch (notifError) {
            console.error('Failed to create notification for requester:', notifError);
            // Continue with the process even if notification fails
        }

        res.status(200).json({
            message: 'Deletion request approved and project deleted successfully.'
        });
    } catch (error) {
        console.error(`>>> PUT /api/deletion-requests/:id/approve handler FAILED:`, error);
        res.status(500).json({ error: 'Failed to approve deletion request due to server error.' });
    }
});

// PUT /api/deletion-requests/:id/reject - Reject a deletion request (Admin only)
router.put('/:id/reject', async (req: Request, res: Response) => {
    console.log(`>>> ${new Date().toISOString()} - PUT /api/deletion-requests/:id/reject handler started`);
    const loggedInUser = req.user as UserPayload;
    const requestId = parseInt(req.params.id, 10);
    const { comments } = req.body;

    // Only ADMIN can reject deletion requests
    if (!loggedInUser || loggedInUser.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Only ADMIN can reject deletion requests.' });
    }

    if (isNaN(requestId)) {
        return res.status(400).json({ error: 'Invalid deletion request ID.' });
    }

    if (!comments) {
        return res.status(400).json({ error: 'Comments are required when rejecting a deletion request.' });
    }

    try {
        // Get the deletion request
        const deletionRequest = await prisma.deletionRequest.findUnique({
            where: { id: requestId }
        });

        if (!deletionRequest) {
            return res.status(404).json({ error: 'Deletion request not found.' });
        }

        if (deletionRequest.status !== 'Pending') {
            return res.status(400).json({
                error: `This deletion request has already been ${deletionRequest.status.toLowerCase()}.`
            });
        }

        // Update the deletion request status
        const updatedRequest = await prisma.deletionRequest.update({
            where: { id: requestId },
            data: {
                status: 'Rejected',
                responseDate: new Date(),
                responseComments: comments,
                respondedById: loggedInUser.userId
            },
            include: {
                project: {
                    select: { projectName: true, id: true }
                },
                requestedBy: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        // Notify the requester about the rejection
        try {
            await createNotification(
                updatedRequest.requestedBy.id,
                'Deletion Request Rejected',
                `Your request to delete project "${updatedRequest.project.projectName}" has been rejected. Reason: ${comments}`,
                'error',
                loggedInUser.userId,
                `/projects/${updatedRequest.project.id}`,
                updatedRequest.project.id
            );
        } catch (notifError) {
            console.error('Failed to create notification for requester:', notifError);
            // Continue with the process even if notification fails
        }

        res.status(200).json({
            message: 'Deletion request rejected successfully.',
            deletionRequest: updatedRequest
        });
    } catch (error) {
        console.error(`>>> PUT /api/deletion-requests/:id/reject handler FAILED:`, error);
        res.status(500).json({ error: 'Failed to reject deletion request due to server error.' });
    }
});

export default router;
