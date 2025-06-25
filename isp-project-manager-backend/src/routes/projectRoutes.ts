// isp-project-manager-backend/src/routes/projectRoutes.ts
// Allows ADMIN or assigned SALES to initiate installation

import { Router, Request, Response } from 'express';
import { createProjectNotification } from '../utils/notificationService'; // Import notification function
import { PrismaClient, Prisma, Role } from '@prisma/client';
// Adjust path if your middleware is elsewhere, e.g., '../middleware/authMiddleware'
import { UserPayload } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// --- Define allowed statuses (Helper, adjust as needed) ---
const validExecutionStatuses: string[] = [
    'Installation Pending', 'In Progress', 'Provisioning Complete',
    'Physical Installation Complete', 'Commissioning Complete',
    'UAT Pending', 'UAT Failed', 'Soak Period', 'Completed',
];
const validPreAcceptanceStatuses: string[] = [
    'Commissioning Complete', 'UAT Pending', 'UAT Failed', 'Soak Period', 'In Progress'
];


// POST /api/projects - Create a new Project and its CRD
router.post('/', async (req: Request, res: Response) => {
    console.log(`>>> ${new Date().toISOString()} - POST /api/projects handler started`);
    const loggedInUser = req.user as UserPayload;
    if (!loggedInUser || (loggedInUser.role !== 'SALES' && loggedInUser.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Forbidden: Your role cannot create projects.' });
    }
    const { projectName, customerName, siteA_address, siteB_address, targetDeliveryDate, customerContact, customerPhone, customerEmail, projectType, billingTrigger, serviceType, bandwidth, slaRequirements, interfaceType, redundancy, ipRequirements, notes: crdNotes } = req.body;
    const salesPersonId = loggedInUser.userId;
    if (!projectName || !customerName || !projectType || !billingTrigger || !serviceType) {
        return res.status(400).json({ error: 'Missing required project or CRD fields (projectName, customerName, projectType, billingTrigger, serviceType).' });
    }
    try {
        const newProject = await prisma.project.create({
            data: {
                projectName, customerName, status: 'CRD Submitted', siteA_address: siteA_address || null, siteB_address: siteB_address || null,
                targetDeliveryDate: targetDeliveryDate ? new Date(targetDeliveryDate) : null, salesPersonId: salesPersonId,
                crd: { create: { customerContact: customerContact || null, customerPhone: customerPhone || null, customerEmail: customerEmail || null, projectType: projectType, billingTrigger: billingTrigger, serviceType: serviceType, bandwidth: bandwidth || null, slaRequirements: slaRequirements || null, interfaceType: interfaceType || null, redundancy: redundancy || false, ipRequirements: ipRequirements || null, notes: crdNotes || null, } },
            },
            include: { crd: true, salesPerson: { select: { id: true, name: true, email: true, role: true } } },
        });
        console.log(`>>> POST /api/projects handler finished successfully. Project ID: ${newProject.id}`);
        res.status(201).json(newProject);
    } catch (error) {
        console.error(`>>> POST /api/projects handler FAILED:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') { return res.status(409).json({ error: `A project with this name already exists.` }); }
        res.status(500).json({ error: 'Failed to create project due to server error.' });
    }
});

// GET /api/projects - Get all projects
router.get('/', async (req: Request, res: Response) => {
    console.log(`>>> ${new Date().toISOString()} - GET /api/projects handler started`);
    const loggedInUser = req.user as UserPayload;
    console.log(`User ${loggedInUser.email} requesting projects list.`);
    try {
        const projects = await prisma.project.findMany({
            include: { crd: { select: { projectType: true, serviceType: true } }, salesPerson: { select: { id: true, name: true } }, projectManager: { select: { id: true, name: true } }, boq: { select: { id: true } }, pnl: { select: { id: true, approvalStatus: true } } },
            orderBy: { updatedAt: 'desc' }
        });
        console.log(`>>> GET /api/projects handler finished successfully. Found ${projects.length} projects.`);
        res.status(200).json(projects);
    } catch (error) {
        console.error(`>>> GET /api/projects handler failed:`, error);
        res.status(500).json({ error: 'Failed to retrieve projects due to server error.' });
    }
});


// GET /api/projects/:id - Get a specific project by ID
router.get('/:id', async (req: Request, res: Response) => {
    const loggedInUser = req.user as UserPayload;
    const projectIdStr = req.params.id;
    console.log(`>>> GET /api/projects/${projectIdStr} handler started.`);
    const projectId = parseInt(projectIdStr, 10);
    if (isNaN(projectId)) { return res.status(400).json({ error: 'Invalid project ID format.' }); }
    console.log(`User ${loggedInUser.email} requesting details for project ID: ${projectId}`);
    try {
        console.log(`>>> GET /api/projects/${projectId} - Attempting prisma.project.findUnique...`);
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { crd: true, boq: { include: { preparedBy: { select: { id: true, name: true, email: true } } } }, pnl: { include: { submittedBy: { select: { id: true, name: true, email: true } }, approver: { select: { id: true, name: true, email: true } } } }, acceptanceForm: { include: { loggedBy: { select: { id: true, name: true, email: true } } } }, salesPerson: { select: { id: true, name: true, email: true } }, projectManager: { select: { id: true, name: true, email: true } } }
        });
        console.log(`>>> GET /api/projects/${projectId} - Prisma query finished. Project found: ${!!project}`);
        if (!project) { return res.status(404).json({ error: 'Project not found.' }); }
        console.log(`>>> GET /api/projects/${projectId} - Sending successful response.`);
        res.status(200).json(project);
    } catch (error) {
        console.error(`>>> GET /api/projects/${projectId} - Handler FAILED:`, error);
        res.status(500).json({ error: 'Failed to retrieve project details due to server error.' });
    }
});

// POST /api/projects/:id/boq - Create BOQ
router.post('/:id/boq', async (req: Request, res: Response) => {
    console.log(`>>> POST /api/projects/:id/boq handler started for project ID: ${req.params.id}`);
    const loggedInUser = req.user as UserPayload;
    const projectId = parseInt(req.params.id, 10);
    const { totalCost, notes } = req.body;
    const allowedRoles: string[] = ['PROJECTS_ADMIN', 'PROJECTS_SURVEY', 'ADMIN'];
    if (!loggedInUser || !allowedRoles.includes(loggedInUser.role)) { return res.status(403).json({ error: 'Forbidden: Your role cannot create a BOQ.' }); }
    if (isNaN(projectId)) { return res.status(400).json({ error: 'Invalid project ID.' }); }
    if (totalCost === undefined || typeof totalCost !== 'number' || totalCost < 0) { return res.status(400).json({ error: 'Missing or invalid required field: totalCost (must be a non-negative number).' }); }
    try {
        const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, status: true, boq: true } });
        if (!project) { return res.status(404).json({ error: 'Project not found.' }); }
        if (project.boq) { return res.status(409).json({ error: 'Conflict: A BOQ already exists for this project.' }); }
        const newBoq = await prisma.boq.create({ data: { totalCost: totalCost, notes: notes || null, projectId: projectId, preparedById: loggedInUser.userId }, include: { preparedBy: { select: { id: true, name: true, email: true } } } });
        await prisma.project.update({ where: { id: projectId }, data: { status: 'BOQ Ready' } });
        console.log(`>>> POST /api/projects/${projectId}/boq finished successfully. BOQ ID: ${newBoq.id}`);
        res.status(201).json(newBoq);
    } catch (error) {
        console.error(`>>> POST /api/projects/${projectId}/boq handler FAILED:`, error);
        res.status(500).json({ error: 'Failed to create BOQ due to server error.' });
    }
});

// POST /api/projects/:id/pnl - Create P&L
router.post('/:id/pnl', async (req: Request, res: Response) => {
    console.log(`>>> POST /api/projects/:id/pnl handler started for project ID: ${req.params.id}`);
    const loggedInUser = req.user as UserPayload;
    const projectId = parseInt(req.params.id, 10);
    if (!loggedInUser || (loggedInUser.role !== 'SALES' && loggedInUser.role !== 'ADMIN')) { return res.status(403).json({ error: 'Forbidden: Only SALES or ADMIN roles can submit a P&L.' }); }
    if (isNaN(projectId)) { return res.status(400).json({ error: 'Invalid project ID.' }); }
    const { oneTimeRevenue, recurringRevenue, contractTermMonths } = req.body;
    if (oneTimeRevenue === undefined || recurringRevenue === undefined || contractTermMonths === undefined || typeof oneTimeRevenue !== 'number' || typeof recurringRevenue !== 'number' || typeof contractTermMonths !== 'number' || contractTermMonths <= 0 || oneTimeRevenue < 0 || recurringRevenue < 0) { return res.status(400).json({ error: 'Missing or invalid P&L fields (Revenues must be non-negative numbers, Term must be positive integer).' }); }
    try {
        const project = await prisma.project.findUnique({ where: { id: projectId }, include: { boq: true, pnl: true } });
        if (!project) { return res.status(404).json({ error: 'Project not found.' }); }
        if (!project.boq) { return res.status(400).json({ error: 'Bad Request: Cannot create P&L before a BOQ exists.' }); }
        if (project.pnl) { return res.status(409).json({ error: 'Conflict: A P&L already exists.' }); }
        if (project.status !== 'BOQ Ready') { return res.status(409).json({ error: `Conflict: P&L cannot be submitted when project status is '${project.status}'.` }); }
        const boqCost = project.boq.totalCost;
        const totalContractValue = oneTimeRevenue + (recurringRevenue * contractTermMonths);
        const calculatedGrossProfit = totalContractValue - boqCost;
        const calculatedGrossMargin = totalContractValue > 0 ? (calculatedGrossProfit / totalContractValue) * 100 : 0;
        const newPnl = await prisma.pnl.create({ data: { projectId: projectId, submittedById: loggedInUser.userId, boqCost: boqCost, oneTimeRevenue: oneTimeRevenue, recurringRevenue: recurringRevenue, contractTermMonths: contractTermMonths, grossProfit: calculatedGrossProfit, grossMargin: calculatedGrossMargin, approvalStatus: 'Pending', }, include: { submittedBy: { select: { id: true, name: true, email: true } } } });
        await prisma.project.update({ where: { id: projectId }, data: { status: 'Pending Approval' } });
        console.log(`>>> POST /api/projects/${projectId}/pnl finished successfully. PnL ID: ${newPnl.id}`);
        res.status(201).json(newPnl);
    } catch (error) {
        console.error(`>>> POST /api/projects/${projectId}/pnl handler FAILED:`, error);
        res.status(500).json({ error: 'Failed to create P&L due to server error.' });
    }
});

// PUT /api/projects/:id/initiate-installation - Mark project ready <<<< MODIFIED AUTH CHECK >>>>
router.put('/:id/initiate-installation', async (req: Request, res: Response) => {
    console.log(`>>> PUT /api/projects/:id/initiate-installation handler started for project ID: ${req.params.id}`);
    const loggedInUser = req.user as UserPayload;
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) { return res.status(400).json({ error: 'Invalid project ID.' }); }

    try {
        console.log(`>>> PUT /api/projects/${projectId}/initiate-installation finding project...`);
        const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, status: true, salesPersonId: true } });
        if (!project) { return res.status(404).json({ error: 'Project not found.' }); }

        // --- MODIFIED Authorization Check ---
        // Allow if: User is ADMIN OR (User has SALES role AND is the assigned salesPersonId)
        const isAssignedSales = (loggedInUser.role === 'SALES' && loggedInUser.userId === project.salesPersonId);
        const isAdmin = (loggedInUser.role === 'ADMIN');

        if (!isAdmin && !isAssignedSales) { // If not Admin AND not the assigned Salesperson
            // Updated error message slightly for clarity
            return res.status(403).json({ error: 'Forbidden: Only the assigned salesperson or an Admin can initiate installation.' });
        }
        // --- End Modified Check ---

        // Status Check
        if (project.status !== 'Approved') {
            return res.status(409).json({ error: `Conflict: Project status must be 'Approved' (current: ${project.status}).` });
        }

        console.log(`>>> PUT /api/projects/${projectId}/initiate-installation updating status...`);
        const updatedProject = await prisma.project.update({
            where: { id: projectId }, data: { status: 'Installation Pending' },
            include: { salesPerson: { select: { id: true, name: true, email: true } } } // Include data needed by frontend if any
        });
        console.log(`>>> PUT /api/projects/${projectId}/initiate-installation finished successfully.`);
        res.status(200).json({ message: 'Project installation initiated successfully.', project: updatedProject });
    } catch (error) {
        console.error(`>>> PUT /api/projects/${projectId}/initiate-installation handler FAILED:`, error);
        res.status(500).json({ error: 'Failed to initiate installation due to server error.' });
    }
});

// PUT /api/projects/:id/assign-pm - Assign a Project Manager
router.put('/:id/assign-pm', async (req: Request, res: Response) => {
    console.log(`>>> PUT /api/projects/:id/assign-pm handler started for project ID: ${req.params.id}`);
    const loggedInUser = req.user as UserPayload;
    const projectId = parseInt(req.params.id, 10);
    const { projectManagerId } = req.body;
    const allowedRoles: string[] = ['PROJECTS_ADMIN', 'ADMIN'];
    if (!loggedInUser || !allowedRoles.includes(loggedInUser.role)) { return res.status(403).json({ error: 'Forbidden: Your role cannot assign Project Managers.' }); }
    if (isNaN(projectId)) { return res.status(400).json({ error: 'Invalid project ID.' }); }
    if (!projectManagerId || typeof projectManagerId !== 'number') { return res.status(400).json({ error: 'Missing or invalid required field: projectManagerId (must be a number).' }); }
    try {
        console.log(`>>> PUT /api/projects/${projectId}/assign-pm checking project and user...`);
        const projectExists = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
        if (!projectExists) { return res.status(404).json({ error: 'Project not found.' }); }
        const pmUser = await prisma.user.findUnique({ where: { id: projectManagerId }, select: { id: true } });
        if (!pmUser) { return res.status(400).json({ error: `User with ID ${projectManagerId} not found to assign as Project Manager.` }); }
        console.log(`>>> PUT /api/projects/${projectId}/assign-pm updating project...`);
        const updatedProject = await prisma.project.update({
            where: { id: projectId }, data: { projectManagerId: projectManagerId },
            include: { projectManager: { select: { id: true, name: true, email: true } }, salesPerson: { select: { id: true, name: true } } }
        });
        console.log(`>>> PUT /api/projects/${projectId}/assign-pm finished successfully.`);
        res.status(200).json({ message: 'Project Manager assigned successfully.', project: updatedProject });
    } catch (error) {
         console.error(`>>> PUT /api/projects/${projectId}/assign-pm handler FAILED:`, error);
        res.status(500).json({ error: 'Failed to assign Project Manager due to server error.' });
    }
});

// PUT /api/projects/:id/status - Update Project Status
router.put('/:id/status', async (req: Request, res: Response) => {
    console.log(`>>> PUT /api/projects/:id/status handler started for project ID: ${req.params.id}`);
    const loggedInUser = req.user as UserPayload;
    const projectId = parseInt(req.params.id, 10);
    const { status } = req.body;
    const allowedRoles: string[] = ['PROJECTS_ADMIN', 'ADMIN'];
    if (!loggedInUser || !allowedRoles.includes(loggedInUser.role)) { return res.status(403).json({ error: 'Forbidden: Your role cannot update project status.' }); }
     if (isNaN(projectId)) { return res.status(400).json({ error: 'Invalid project ID.' }); }
    if (!status || typeof status !== 'string' || status.trim() === '') { return res.status(400).json({ error: 'Missing or invalid required field: status (must be a non-empty string).' }); }
    // Optional: Validate status against allowedExecutionStatuses if needed
    // if (!validExecutionStatuses.includes(status)) { return res.status(400).json({ error: `Invalid status value: ${status}`}); }
    try {
        console.log(`>>> PUT /api/projects/${projectId}/status checking project...`);
        const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
        if (!project) { return res.status(404).json({ error: 'Project not found.' }); }
        console.log(`>>> PUT /api/projects/${projectId}/status updating status to '${status}'...`);
         const updatedProject = await prisma.project.update({
            where: { id: projectId }, data: { status: status },
             include: {
                projectManager: { select: { id: true, name: true } },
                salesPerson: { select: { id: true, name: true } }
             }
        });

        // Get project name for notifications
        const projectDetails = await prisma.project.findUnique({
            where: { id: projectId },
            select: { projectName: true }
        });

        // Send notifications to relevant users
        try {
            // Notify project manager if assigned
            if (updatedProject.projectManager) {
                await createProjectNotification(
                    updatedProject.projectManager.id,
                    projectId,
                    projectDetails?.projectName || 'Unknown Project',
                    `Status Updated to '${status}'`,
                    'info',
                    loggedInUser.userId
                );
            }

            // Notify sales person
            if (updatedProject.salesPerson) {
                await createProjectNotification(
                    updatedProject.salesPerson.id,
                    projectId,
                    projectDetails?.projectName || 'Unknown Project',
                    `Status Updated to '${status}'`,
                    'info',
                    loggedInUser.userId
                );
            }
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
            // Continue with the process even if notification fails
        }

        console.log(`>>> PUT /api/projects/${projectId}/status finished successfully.`);
         res.status(200).json({ message: `Project status updated to '${status}'.`, project: updatedProject });
    } catch (error) {
        console.error(`>>> PUT /api/projects/${projectId}/status handler FAILED:`, error);
        res.status(500).json({ error: 'Failed to update project status due to server error.' });
    }
});

// POST /api/projects/:id/acceptance - Log Customer Acceptance
router.post('/:id/acceptance', async (req: Request, res: Response) => {
    console.log(`>>> POST /api/projects/:id/acceptance handler started for project ID: ${req.params.id}`);
    const loggedInUser = req.user as UserPayload;
    const projectId = parseInt(req.params.id, 10);
    const allowedRoles: string[] = ['PROJECTS_ADMIN', 'ADMIN'];
    if (!loggedInUser || !allowedRoles.includes(loggedInUser.role)) { return res.status(403).json({ error: 'Forbidden: Your role cannot log customer acceptance.' }); }
    if (isNaN(projectId)) { return res.status(400).json({ error: 'Invalid project ID.' }); }
    const { acceptanceDate, billingStartDate, customerSignatureUrl, serviceId, commissionedDate, signedByName, signedByTitle, ispRepresentative, notes } = req.body;
    if (!acceptanceDate || !billingStartDate || !customerSignatureUrl) { return res.status(400).json({ error: 'Missing required fields: acceptanceDate, billingStartDate, customerSignatureUrl are required.' }); }
    try {
        console.log(`>>> POST /api/projects/${projectId}/acceptance starting transaction...`);
        const result = await prisma.$transaction(async (tx) => {
            console.log(`>>> POST /api/projects/${projectId}/acceptance checking project/existing form...`);
            const project = await tx.project.findUnique({ where: { id: projectId }, select: { id: true, status: true, acceptanceForm: true } });
            if (!project) { throw new Error('Project not found.'); }
            if (project.acceptanceForm) { throw new Error('Conflict: An acceptance form already exists.'); }
            // Optional: Add check for valid project status
            // if (!validPreAcceptanceStatuses.includes(project.status)) { throw new Error(`Conflict: Project cannot be accepted from current status '${project.status}'.`); }
            console.log(`>>> POST /api/projects/${projectId}/acceptance creating form...`);
            const newAcceptanceForm = await tx.acceptanceForm.create({
                data: { projectId: projectId, acceptanceDate: new Date(acceptanceDate), billingStartDate: new Date(billingStartDate), customerSignature: customerSignatureUrl, loggedById: loggedInUser.userId, serviceId: serviceId || null, commissionedDate: commissionedDate ? new Date(commissionedDate) : null, signedByName: signedByName || null, signedByTitle: signedByTitle || null, ispRepresentative: ispRepresentative || null, notes: notes || null, },
                 include: { loggedBy: { select: { id: true, name: true, email: true } } }
            });
            console.log(`>>> POST /api/projects/${projectId}/acceptance updating project status...`);
            // First ensure the project has a valid billing status
            const existingProject = await tx.project.findUnique({
                where: { id: projectId },
                select: { billingStatus: true }
            });

            const updatedProject = await tx.project.update({
                where: { id: projectId },
                data: {
                    status: 'Completed',
                    // Always set billing status to Pending when project is completed
                    // regardless of its previous value
                    billingStatus: 'Pending'
                },
                include: {
                    salesPerson: { select: { id: true, name: true } },
                    projectManager: { select: { id: true, name: true } }
                }
            });

            // Create notifications for project completion
            try {
                // Notify sales person with billing information
                if (updatedProject.salesPerson) {
                    await createProjectNotification(
                        updatedProject.salesPerson.id,
                        projectId,
                        updatedProject.projectName || 'Unknown Project',
                        'Completed',
                        'success',
                        loggedInUser.userId
                    );

                    // Additional notification about billing
                    await createProjectNotification(
                        updatedProject.salesPerson.id,
                        projectId,
                        updatedProject.projectName || 'Unknown Project',
                        'Ready for Billing',
                        'info',
                        loggedInUser.userId
                    );
                }

                // Notify project manager
                if (updatedProject.projectManager) {
                    await createProjectNotification(
                        updatedProject.projectManager.id,
                        projectId,
                        updatedProject.projectName || 'Unknown Project',
                        'Completed',
                        'success',
                        loggedInUser.userId
                    );
                }
            } catch (notifError) {
                console.error('Failed to create notification:', notifError);
                // Continue with the process even if notification fails
            }

            console.log(`>>> POST /api/projects/${projectId}/acceptance transaction finished. Triggering Finance.`);
            return { newAcceptanceForm, updatedProjectStatus: updatedProject.status };
        });
        res.status(201).json({ message: "Customer acceptance logged successfully.", acceptanceForm: result.newAcceptanceForm, projectStatus: result.updatedProjectStatus });
    } catch (error: any) {
        console.error(`>>> POST /api/projects/${projectId}/acceptance handler FAILED:`, error);
        if (error.message.includes('not found')) { return res.status(404).json({ error: 'Project not found.' }); }
        if (error.message.includes('Conflict:')) { return res.status(409).json({ error: error.message }); }
        res.status(500).json({ error: 'Failed to log customer acceptance due to server error.' });
    }
});


export default router;
