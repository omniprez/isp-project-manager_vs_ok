// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    // This check should ideally be done at server startup, but included here for safety
    console.error("FATAL ERROR: JWT_SECRET is not defined.");
    process.exit(1);
}

// Define a type for the decoded user payload from JWT
export interface UserPayload {
    userId: number;
    email: string;
    role: string; // Or import the Role enum if needed for stricter typing here
    iat?: number; // Issued at timestamp (added automatically by jwt.sign)
    exp?: number; // Expiration timestamp (added automatically by jwt.sign)
}

// Extend the Express Request interface to include our 'user' property
declare global {
    namespace Express {
        interface Request {
            user?: UserPayload; // Make user optional on the Request type
        }
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // 1. Get token from header
    const authHeader = req.headers.authorization;

    // 2. Check if token exists and is in the correct format (Bearer <token>)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided or invalid format.' });
    }

    const token = authHeader.split(' ')[1]; // Extract token part

    // 3. Verify the token
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;

        // 4. Attach decoded user payload to the request object
        req.user = decoded; // Now subsequent handlers can access req.user

        // 5. Call next middleware or route handler
        next();

    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'Unauthorized: Token has expired.' });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
        }
        // Handle other potential errors
        console.error("Auth Middleware Error:", error);
        return res.status(500).json({ message: 'Internal server error during authentication.' });
    }
};