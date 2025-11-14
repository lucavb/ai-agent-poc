import { Request, Response, NextFunction } from 'express';
import { ApiErrorResponse } from '../types';

/**
 * Global error handler middleware
 */
export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    console.error('API Error:', err);

    const errorResponse: ApiErrorResponse = {
        success: false,
        error: err.name || 'Internal Server Error',
        message: err.message || 'An unexpected error occurred',
    };

    // Handle specific error types
    if (err.name === 'ValidationError') {
        res.status(400).json(errorResponse);
        return;
    }

    if (err.name === 'UnauthorizedError') {
        res.status(401).json(errorResponse);
        return;
    }

    // Default to 500 for unknown errors
    res.status(500).json(errorResponse);
}

/**
 * 404 handler for unknown routes
 */
export function notFoundHandler(req: Request, res: Response): void {
    const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
    };
    res.status(404).json(errorResponse);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

