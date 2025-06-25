// src/routes/pnlRoutes.ts
import { Router, Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { UserPayload } from '../middleware/authMiddleware'; // Need user payload type
import { authMiddleware } from '../middleware/authMiddleware'; // Apply auth middleware here
import { createPnlNotification } from '../utils/notificationService'; // Import notification function

const router = Router();
const prisma = new PrismaClient();

// Middleware applied to all routes in this file
router.use(authMiddleware); // Ensures user is logged in for all PnL actions

// GET /api/pnl/pending - List P&Ls awaiting approval
router.get('/pending', async (req: Request, res: Response) => {
    const loggedInUser = req.user as UserPayload;

    // Authorization: Only Admin users can see pending PnLs
    if (loggedInUser.role !== Role.ADMIN) {
        return res.status(403).json({ error: 'Forbidden: Only ADMIN users can view pending P&Ls.' });
    }

    try {
        const pendingPnls = await prisma.pnl.findMany({
            where: {
                approvalStatus: 'Pending'
            },
            include: {
                project: { // Include basic project info for context
                    select: {
                        id: true,
                        projectName: true,
                        salesPerson: { select: { id: true, name: true } }
                    }
                },
                submittedBy: { // Include who submitted it
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: {
                datePrepared: 'asc' // Show oldest first
            }
        });
        res.status(200).json(pendingPnls);
    } catch (error) {
        console.error("Failed to retrieve pending P&Ls:", error);
        res.status(500).json({ error: 'Failed to retrieve pending P&Ls due to server error.' });
    }
});


// PUT /api/pnl/:pnlId/approve - Approve a P&L
router.put('/:pnlId/approve', async (req: Request, res: Response) => {
    const loggedInUser = req.user as UserPayload;
    const pnlId = parseInt(req.params.pnlId, 10);
    const { adminComments } = req.body; // Optional comments

    // Authorization: Only Admin users can approve
    if (loggedInUser.role !== Role.ADMIN) {
        return res.status(403).json({ error: 'Forbidden: Only ADMIN users can approve P&Ls.' });
    }

    if (isNaN(pnlId)) {
        return res.status(400).json({ error: 'Invalid P&L ID.' });
    }

    try {
        // Use transaction to update PnL and Project status atomically
        const updatedPnl = await prisma.$transaction(async (tx) => {
            // 1. Find the PnL and ensure it's pending
            const pnl = await tx.pnl.findUnique({
                where: { id: pnlId },
            });

            if (!pnl) {
                // Throw error to rollback transaction
                throw new Error('P&L not found.');
            }
            if (pnl.approvalStatus !== 'Pending') {
                 // Throw error to rollback transaction
                 throw new Error(`P&L status is already ${pnl.approvalStatus}, cannot approve.`);
            }

            // 2. Update the PnL record
            const approvedPnl = await tx.pnl.update({
                where: { id: pnlId },
                data: {
                    approvalStatus: 'Approved',
                    approverId: loggedInUser.userId,
                    approvalDate: new Date(),
                    adminComments: adminComments || null, // Store comments or null
                },
                include: { // Include details in the response
                    submittedBy: { select: { id: true, name: true, email: true } },
                    approver: { select: { id: true, name: true, email: true } }
                }
            });

            // 3. Update the associated Project's status
            await tx.project.update({
                where: { id: pnl.projectId },
                data: {
                    status: 'Approved' // Or 'Installation Pending' etc. - Define your status flow
                }
            });

            // Create notification for the submitter
            if (approvedPnl.submittedBy) {
                try {
                    // Get project name for the notification
                    const project = await tx.project.findUnique({
                        where: { id: approvedPnl.projectId },
                        select: { projectName: true }
                    });

                    if (project) {
                        await createPnlNotification(
                            approvedPnl.submittedBy.id,
                            approvedPnl.projectId,
                            project.projectName,
                            'Approved',
                            'success',
                            loggedInUser.userId
                        );
                    }
                } catch (notifError) {
                    console.error('Failed to create notification:', notifError);
                    // Continue with the process even if notification fails
                }
            }

            return approvedPnl;
        }); // End Transaction

        res.status(200).json(updatedPnl);

    } catch (error: any) {
        console.error(`Failed to approve P&L ${pnlId}:`, error);
        // Check for specific errors thrown in transaction
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: 'P&L not found.' });
        }
         if (error.message.includes('cannot approve')) {
            return res.status(409).json({ error: error.message }); // 409 Conflict
        }
        res.status(500).json({ error: 'Failed to approve P&L due to server error.' });
    }
});


// PUT /api/pnl/:pnlId/reject - Reject a P&L
router.put('/:pnlId/reject', async (req: Request, res: Response) => {
    const loggedInUser = req.user as UserPayload;
    const pnlId = parseInt(req.params.pnlId, 10);
    const { adminComments } = req.body; // Mandatory comments for rejection

    // Authorization: Only Admin users can reject
    if (loggedInUser.role !== Role.ADMIN) {
        return res.status(403).json({ error: 'Forbidden: Only ADMIN users can reject P&Ls.' });
    }

    if (isNaN(pnlId)) {
        return res.status(400).json({ error: 'Invalid P&L ID.' });
    }

    // Validation: Rejection comments are mandatory
    if (!adminComments || typeof adminComments !== 'string' || adminComments.trim() === '') {
        return res.status(400).json({ error: 'Rejection comments are required.' });
    }

    try {
        // Use transaction to update PnL and Project status atomically
        const updatedPnl = await prisma.$transaction(async (tx) => {
            // 1. Find the PnL and ensure it's pending
            const pnl = await tx.pnl.findUnique({
                where: { id: pnlId },
            });

            if (!pnl) {
                throw new Error('P&L not found.');
            }
            if (pnl.approvalStatus !== 'Pending') {
                 throw new Error(`P&L status is already ${pnl.approvalStatus}, cannot reject.`);
            }

            // 2. Update the PnL record
            const rejectedPnl = await tx.pnl.update({
                where: { id: pnlId },
                data: {
                    approvalStatus: 'Rejected',
                    approverId: loggedInUser.userId,
                    approvalDate: new Date(),
                    adminComments: adminComments,
                },
                 include: { // Include details in the response
                    submittedBy: { select: { id: true, name: true, email: true } },
                    approver: { select: { id: true, name: true, email: true } }
                }
            });

            // 3. Update the associated Project's status
            await tx.project.update({
                where: { id: pnl.projectId },
                data: {
                    status: 'P&L Rejected' // Define a specific status
                }
            });

            // Create notification for the submitter
            if (rejectedPnl.submittedBy) {
                try {
                    // Get project name for the notification
                    const project = await tx.project.findUnique({
                        where: { id: rejectedPnl.projectId },
                        select: { projectName: true }
                    });

                    if (project) {
                        await createPnlNotification(
                            rejectedPnl.submittedBy.id,
                            rejectedPnl.projectId,
                            project.projectName,
                            'Rejected',
                            'error',
                            loggedInUser.userId
                        );
                    }
                } catch (notifError) {
                    console.error('Failed to create notification:', notifError);
                    // Continue with the process even if notification fails
                }
            }

            return rejectedPnl;
        }); // End Transaction

        res.status(200).json(updatedPnl);

    } catch (error: any) {
         console.error(`Failed to reject P&L ${pnlId}:`, error);
        // Check for specific errors thrown in transaction
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: 'P&L not found.' });
        }
         if (error.message.includes('cannot reject')) {
            return res.status(409).json({ error: error.message }); // 409 Conflict
        }
        res.status(500).json({ error: 'Failed to reject P&L due to server error.' });
    }
});


// PUT /api/pnl/:pnlId/review - Mark a rejected P&L for review
router.put('/:pnlId/review', async (req: Request, res: Response) => {
    const loggedInUser = req.user as UserPayload;
    const pnlId = parseInt(req.params.pnlId, 10);
    const { comments } = req.body; // Optional comments

    // Authorization: Only SALES or ADMIN users can request review
    if (loggedInUser.role !== Role.SALES && loggedInUser.role !== Role.ADMIN) {
        return res.status(403).json({ error: 'Forbidden: Only SALES or ADMIN users can request P&L review.' });
    }

    if (isNaN(pnlId)) {
        return res.status(400).json({ error: 'Invalid P&L ID.' });
    }

    try {
        // Use transaction to update PnL and Project status atomically
        const updatedPnl = await prisma.$transaction(async (tx) => {
            // 1. Find the PnL and ensure it's rejected
            const pnl = await tx.pnl.findUnique({
                where: { id: pnlId },
                include: {
                    project: true,
                    submittedBy: { select: { id: true } }
                }
            });

            if (!pnl) {
                throw new Error('P&L not found.');
            }

            // Check if user is ADMIN or the original submitter
            const isAdmin = loggedInUser.role === Role.ADMIN;
            const isSubmitter = pnl.submittedBy.id === loggedInUser.userId;

            if (!isAdmin && !isSubmitter) {
                throw new Error('You can only review P&Ls that you submitted.');
            }

            if (pnl.approvalStatus !== 'Rejected') {
                throw new Error(`P&L status is ${pnl.approvalStatus}, only rejected P&Ls can be reviewed.`);
            }

            // 2. Update the PnL record
            const reviewPnl = await tx.pnl.update({
                where: { id: pnlId },
                data: {
                    approvalStatus: 'Under Review',
                    adminComments: comments || pnl.adminComments, // Keep existing comments if none provided
                },
                include: { // Include details in the response
                    submittedBy: { select: { id: true, name: true, email: true } },
                    approver: { select: { id: true, name: true, email: true } }
                }
            });

            // 3. Update the associated Project's status
            await tx.project.update({
                where: { id: pnl.projectId },
                data: {
                    status: 'P&L Under Review'
                }
            });

            return reviewPnl;
        }); // End Transaction

        res.status(200).json({
            message: 'P&L marked for review successfully.',
            pnl: updatedPnl
        });

    } catch (error: any) {
        console.error(`Failed to mark P&L ${pnlId} for review:`, error);
        // Check for specific errors thrown in transaction
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: 'P&L not found.' });
        }
        if (error.message.includes('only rejected P&Ls')) {
            return res.status(409).json({ error: error.message }); // 409 Conflict
        }
        if (error.message.includes('you submitted')) {
            return res.status(403).json({ error: error.message }); // 403 Forbidden
        }
        res.status(500).json({ error: 'Failed to mark P&L for review due to server error.' });
    }
});

// PUT /api/pnl/:pnlId/update-boq - Update BOQ for a P&L under review
router.put('/:pnlId/update-boq', async (req: Request, res: Response) => {
    const loggedInUser = req.user as UserPayload;
    const pnlId = parseInt(req.params.pnlId, 10);
    const { totalCost, notes } = req.body;

    // Authorization: Only PROJECTS_SURVEY, PROJECTS_ADMIN or ADMIN users can update BOQ
    const allowedRoles = [Role.PROJECTS_SURVEY, Role.PROJECTS_ADMIN, Role.ADMIN];
    if (!allowedRoles.includes(loggedInUser.role as Role)) {
        return res.status(403).json({
            error: 'Forbidden: Only PROJECTS_SURVEY, PROJECTS_ADMIN or ADMIN users can update BOQ.'
        });
    }

    if (isNaN(pnlId)) {
        return res.status(400).json({ error: 'Invalid P&L ID.' });
    }

    if (typeof totalCost !== 'number' || totalCost <= 0) {
        return res.status(400).json({ error: 'Total cost must be a positive number.' });
    }

    try {
        // Use transaction to update BOQ, PnL and Project status atomically
        const result = await prisma.$transaction(async (tx) => {
            // 1. Find the PnL and ensure it's under review
            const pnl = await tx.pnl.findUnique({
                where: { id: pnlId },
                include: {
                    project: {
                        include: {
                            boq: true
                        }
                    }
                }
            });

            if (!pnl) {
                throw new Error('P&L not found.');
            }

            if (pnl.approvalStatus !== 'Under Review') {
                throw new Error(`P&L status is ${pnl.approvalStatus}, only P&Ls under review can have BOQ updated.`);
            }

            if (!pnl.project.boq) {
                throw new Error('Project does not have a BOQ to update.');
            }

            // 2. Update the BOQ
            const updatedBoq = await tx.boq.update({
                where: { id: pnl.project.boq.id },
                data: {
                    totalCost,
                    notes: notes || pnl.project.boq.notes,
                    preparedById: loggedInUser.userId, // Update the preparer
                    datePrepared: new Date() // Update the preparation date
                }
            });

            // 3. Recalculate P&L values based on new BOQ cost
            const oneTimeRevenue = pnl.oneTimeRevenue || 0;
            const recurringRevenue = pnl.recurringRevenue || 0;
            const contractTermMonths = pnl.contractTermMonths || 0;

            // Calculate total revenue over contract term
            const totalRevenue = oneTimeRevenue + (recurringRevenue * contractTermMonths);

            // Calculate gross profit and margin
            const grossProfit = totalRevenue - totalCost;
            const grossMargin = totalCost > 0 ? (grossProfit / totalRevenue) * 100 : 0;

            // 4. Update the PnL with new BOQ cost and recalculated values
            const updatedPnl = await tx.pnl.update({
                where: { id: pnlId },
                data: {
                    boqCost: totalCost,
                    grossProfit,
                    grossMargin,
                    approvalStatus: 'Pending', // Reset to pending for re-approval
                    approvalDate: null, // Clear previous approval date
                    approverId: null // Clear previous approver
                }
            });

            // 5. Update the project status
            await tx.project.update({
                where: { id: pnl.project.id },
                data: {
                    status: 'Pending Approval' // Reset to pending approval
                }
            });

            return { boq: updatedBoq, pnl: updatedPnl };
        }); // End Transaction

        res.status(200).json({
            message: 'BOQ updated and P&L recalculated successfully. P&L is now pending approval again.',
            result
        });

    } catch (error: any) {
        console.error(`Failed to update BOQ for P&L ${pnlId}:`, error);
        // Check for specific errors thrown in transaction
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: 'P&L not found.' });
        }
        if (error.message.includes('only P&Ls under review')) {
            return res.status(409).json({ error: error.message }); // 409 Conflict
        }
        if (error.message.includes('does not have a BOQ')) {
            return res.status(400).json({ error: error.message }); // 400 Bad Request
        }
        res.status(500).json({ error: 'Failed to update BOQ due to server error.' });
    }
});

export default router;