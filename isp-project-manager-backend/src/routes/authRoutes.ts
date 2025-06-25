// src/routes/authRoutes.ts
import { Router, Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables (to access JWT_SECRET)
dotenv.config();

const router = Router();
const prisma = new PrismaClient();
const saltRounds = 10; // Cost factor for bcrypt hashing

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env file");
    process.exit(1);
}

// POST /api/auth/register - User Registration
router.post('/register', async (req: Request, res: Response) => {
    const { email, password, name, role } = req.body;

    // Basic Validation
    if (!email || !password || !role) {
        return res.status(400).json({ error: 'Email, password, and role are required.' });
    }

    // Validate Role (ensure it's a valid enum value)
    if (!Object.values(Role).includes(role)) {
         return res.status(400).json({ error: `Invalid role specified. Valid roles are: ${Object.values(Role).join(', ')}` });
    }

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({ error: 'User with this email already exists.' }); // 409 Conflict
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user in database
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || email, // Default name to email if not provided
                role: role as Role, // Cast role to the enum type after validation
                // isActive defaults to true based on schema
            },
            // Selectively return user data (exclude password)
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        });

        res.status(201).json(newUser); // 201 Created

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: 'Failed to register user due to server error.' });
    }
});

// POST /api/auth/login - User Login
router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Check if user exists and is active
        if (!user || !user.isActive) {
             return res.status(401).json({ error: 'Invalid email or password, or user inactive.' }); // 401 Unauthorized
        }

        // Compare submitted password with stored hash
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
             return res.status(401).json({ error: 'Invalid email or password.' }); // 401 Unauthorized
        }

        // Passwords match - Generate JWT
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign(
            tokenPayload,
            JWT_SECRET, // Use the secret from .env
            { expiresIn: '7d' } // Token expires in 7 days (adjust as needed, e.g., '1h', '30d')
        );

        // Return the token and minimal user info (optional)
        res.status(200).json({
            message: 'Login successful',
            token: token,
            user: { // Optionally return some non-sensitive user info
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: 'Failed to login due to server error.' });
    }
});

export default router;