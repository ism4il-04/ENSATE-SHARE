import app from './app';
import { logger } from './utils/logger';
import connectDB from './config/database';

// Connect to MongoDB
connectDB();

// Start server (local development only — on Vercel, app.ts is imported directly by serverless handler)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    logger.success(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
