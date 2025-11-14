import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Create health routes
 */
export function createHealthRoutes(healthController: HealthController): Router {
    const router = Router();

    // GET /health - Health check
    router.get('/', asyncHandler(healthController.getHealth.bind(healthController)));

    return router;
}

