import { Request, Response, NextFunction } from 'express';

interface ErrorWithStatus extends Error {
    statusCode?: number;
    errors?: any[];
}

const errorHandler = (
    err: ErrorWithStatus,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Server Error';

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        message = 'Resource not found';
        statusCode = 404;
    }

    // Mongoose duplicate key
    if ((err as any).code === 11000) {
        message = 'Duplicate field value entered';
        statusCode = 400;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        message = Object.values((err as any).errors)
            .map((val: any) => val.message)
            .join(', ');
        statusCode = 400;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        message = 'Invalid token';
        statusCode = 401;
    }

    if (err.name === 'TokenExpiredError') {
        message = 'Token expired';
        statusCode = 401;
    }

    // Multer errors
    if (err.name === 'MulterError') {
        if ((err as any).code === 'LIMIT_FILE_SIZE') {
            message = 'File size exceeds the maximum limit';
        }
        statusCode = 400;
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

export default errorHandler;
