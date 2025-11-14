import { Router } from 'express';
import { ContextController } from '../controllers/ContextController';
import { asyncHandler } from '../middleware/errorHandler';
import { contextValidationRules, validate } from '../middleware/validation';

/**
 * Create context routes
 */
export function createContextRoutes(contextController: ContextController): Router {
    const router = Router();

    // GET /api/context - Get conversation context
    router.get(
        '/',
        contextValidationRules,
        validate,
        asyncHandler(contextController.getContext.bind(contextController))
    );

    // DELETE /api/context - Clear conversation context
    router.delete(
        '/',
        contextValidationRules,
        validate,
        asyncHandler(contextController.clearContext.bind(contextController))
    );

    return router;
}

