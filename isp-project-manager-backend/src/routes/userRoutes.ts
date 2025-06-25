// src/routes/userRoutes.ts
import { Router, Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { UserPayload } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// GET /api/users - Get all users, optionally filtered by role
router.get('/', async (req: Request, res: Response) => {
    console.log(`>>> ${new Date().toISOString()} - GET /api/users handler started`);
    const loggedInUser = req.user as UserPayload;
    
    // Extract role filter from query parameters
    const roleFilters = req.query.role as string | string[] | undefined;
    
    console.log(`User ${loggedInUser.email} requesting users list with role filters:`, roleFilters);
    
    try {
        // Build the where clause for filtering
        let whereClause: any = {};
        
        // If role filter is provided, add it to the where clause
        if (roleFilters) {
            // Convert to array if it's a single string
            const roles = Array.isArray(roleFilters) ? roleFilters : [roleFilters];
            
            // Only include valid roles
            const validRoles = roles.filter(role => Object.values(Role).includes(role as Role));
            
            if (validRoles.length > 0) {
                whereClause.role = { in: validRoles as Role[] };
            }
        }
        
        // Fetch users with the filter
        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true
            },
            orderBy: { name: 'asc' }
        });
        
        console.log(`>>> GET /api/users handler finished successfully. Found ${users.length} users.`);
        res.status(200).json(users);
    } catch (error) {
        console.error(`>>> GET /api/users handler failed:`, error);
        res.status(500).json({ error: 'Failed to retrieve users due to server error.' });
    }
});

export default router;
