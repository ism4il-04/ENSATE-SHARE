import express, { Application } from 'express';
import dotenv from 'dotenv';
// Load environment variables (locally reads from backend/.env; on Vercel injected by platform)
dotenv.config();

import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import connectDB from './config/database';
import errorHandler from './middleware/errorHandler.middleware';
import sanitizeRequest from './middleware/sanitize.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import fileRoutes from './routes/file.routes';
import userRoutes from './routes/user.routes';
import structureRoutes from './routes/structure.routes';
import statsRoutes from './routes/stats.routes';

// Create Express app
const app: Application = express();

// Behind Vercel/Render's proxy: take the client IP from X-Forwarded-For (used by login rate limiting)
app.set('trust proxy', 1);
// Flat query strings only: ?year[$ne]=x stays a literal key instead of becoming a MongoDB operator
app.set('query parser', 'simple');

// Middleware
app.use(helmet()); // Security headers
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    })
);
app.use(express.json({ limit: '100kb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: false, limit: '100kb' })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(sanitizeRequest); // Strip $-operators and prototype keys from body/params

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/structure', structureRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
