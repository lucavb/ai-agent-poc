import { Request, Response } from 'express';
import { contextManager } from '../../context-manager';
import { ContextResponse, ContextClearResponse } from '../types';

/**
 * Context Controller
 * Handles conversation context-related API endpoints
 */
export class ContextController {
    /**
     * GET /api/context
     * Get conversation context summary
     */
    async getContext(req: Request, res: Response): Promise<void> {
        try {
            const sessionId = (req.query.sessionId as string) || 'default';
            const summary = contextManager.getContextSummary();

            const response: ContextResponse = {
                sessionId,
                context: {
                    totalContexts: summary.totalContexts,
                    recentContexts: summary.recentContexts,
                    entities: {
                        // Extract entities from context if available
                        users: [],
                        tables: [],
                        lastQuery: undefined,
                    },
                },
            };

            res.json(response);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.name : 'Unknown Error',
                message: error instanceof Error ? error.message : 'Failed to retrieve context',
            });
        }
    }

    /**
     * DELETE /api/context
     * Clear conversation context
     */
    async clearContext(req: Request, res: Response): Promise<void> {
        try {
            const sessionId = (req.query.sessionId as string) || 'default';

            // Clear the context
            contextManager.clearContext();

            const response: ContextClearResponse = {
                success: true,
                message: `Context cleared for session ${sessionId}`,
            };

            res.json(response);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.name : 'Unknown Error',
                message: error instanceof Error ? error.message : 'Failed to clear context',
            });
        }
    }
}

