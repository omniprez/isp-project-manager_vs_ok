// isp-project-manager-backend/src/server.ts
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // <<< Import cors package
import { PrismaClient } from '@prisma/client';

// Import Middleware
import { authMiddleware } from './middleware/authMiddleware';

// Import Routers
import projectRoutes from './routes/projectRoutes';
import authRoutes from './routes/authRoutes';
import pnlRoutes from './routes/pnlRoutes';
import userRoutes from './routes/userRoutes';
import deletionRequestRoutes from './routes/deletionRequestRoutes';
import notificationRoutes from './routes/notificationRoutes';
import billingRoutes from './routes/billingRoutes';

// Load environment variables from .env file
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

// Create Express app instance
const app: Express = express();
const PORT = process.env.PORT || 3001;

// --- Global Middleware ---
// Enable CORS for all origins (simplest setup for development)
// For production, configure allowed origins more strictly: app.use(cors({ origin: 'YOUR_FRONTEND_URL' }));
app.use(cors()); // <<< Use cors middleware

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Basic Routes ---
app.get('/', (req: Request, res: Response) => {
  res.send('ISP Project Management API is running!');
});

// --- API Routes ---
// Public auth routes
app.use('/api/auth', authRoutes);

// Apply auth middleware globally FOR ALL SUBSEQUENT ROUTES
app.use(authMiddleware);

// Protected routes
app.use('/api/projects', projectRoutes);
app.use('/api/pnl', pnlRoutes);
app.use('/api/users', userRoutes);
app.use('/api/deletion-requests', deletionRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/billing', billingRoutes);


// --- Start Server ---
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown for Prisma
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Prisma Client disconnected. Server shutting down.');
  process.exit(0);
});

export default app;