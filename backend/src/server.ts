import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import connectDB from './config/database';
import errorHandler from './middleware/errorHandler.middleware';
import { logger } from './utils/logger';

// Import routes
import authRoutes from './routes/auth.routes';
import fileRoutes from './routes/file.routes';
import userRoutes from './routes/user.routes';
import structureRoutes from './routes/structure.routes';
import statsRoutes from './routes/stats.routes';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    })
);
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/structure', structureRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
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

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    logger.success(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
