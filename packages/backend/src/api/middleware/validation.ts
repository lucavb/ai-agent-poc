import { Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';

/**
 * Validation middleware to check for validation errors
 */
export function validate(req: Request, res: Response, next: NextFunction): void {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: 'Invalid request data',
            details: errors.array(),
        });
        return;
    }
    next();
}

/**
 * Validation rules for chat endpoint
 */
export const chatValidationRules = [
    body('query')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Query is required and must be a non-empty string'),
    body('sessionId')
        .optional()
        .isString()
        .trim()
        .withMessage('Session ID must be a string'),
    body('options')
        .optional()
        .isObject()
        .withMessage('Options must be an object'),
    body('options.debug')
        .optional()
        .isBoolean()
        .withMessage('Debug option must be a boolean'),
    body('options.maxIterations')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('Max iterations must be between 1 and 20'),
];

/**
 * Validation rules for context endpoints
 */
export const contextValidationRules = [
    query('sessionId')
        .optional()
        .isString()
        .trim()
        .withMessage('Session ID must be a string'),
];

