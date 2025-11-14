import { Router } from 'express';
import { ToolsController } from '../controllers/ToolsController';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Create tools routes
 */
export function createToolsRoutes(toolsController: ToolsController): Router {
    const router = Router();

    // GET /api/tools - Get list of available tools
    router.get('/', asyncHandler(toolsController.getTools.bind(toolsController)));

    return router;
}

