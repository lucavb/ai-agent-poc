import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { asyncHandler } from '../middleware/errorHandler';
import { chatValidationRules, validate } from '../middleware/validation';

/**
 * Create chat routes
 */
export function createChatRoutes(chatController: ChatController): Router {
    const router = Router();

    // POST /api/chat - Process a query
    router.post(
        '/',
        chatValidationRules,
        validate,
        asyncHandler(chatController.chat.bind(chatController))
    );

    return router;
}

