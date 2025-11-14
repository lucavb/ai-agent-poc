import { Request, Response } from 'express';
import { AISdkAgent } from '../../ai-sdk-agent';
import { ChatRequest, ChatResponse, ChatErrorResponse, ToolCallInfo } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Chat Controller
 * Handles chat-related API endpoints
 */
export class ChatController {
    private agent: AISdkAgent;

    constructor(agent: AISdkAgent) {
        this.agent = agent;
    }

    /**
     * POST /api/chat
     * Process a user query through the agent
     */
    async chat(req: Request, res: Response): Promise<void> {
        try {
            const { query, sessionId, options }: ChatRequest = req.body;

            // Generate session ID if not provided
            const actualSessionId = sessionId || uuidv4();

            // Apply options if provided
            if (options?.debug !== undefined) {
                // Temporarily set debug mode (you might want to handle this differently)
                const config = this.agent.getConfig();
                config.debug = options.debug;
            }

            if (options?.maxIterations !== undefined) {
                const config = this.agent.getConfig();
                config.maxIterations = options.maxIterations;
            }

            // Process the query
            const result = await this.agent.processQuery(query);

            // Format tool calls
            const toolCalls: ToolCallInfo[] = result.toolCalls.map((call) => ({
                tool: call.function.name,
                input: JSON.parse(call.function.arguments || '{}'),
                result: {}, // Tool results are included in the agent's response
            }));

            // Build response
            const response: ChatResponse = {
                success: result.success,
                response: result.response,
                sessionId: actualSessionId,
                data: {
                    iterations: result.iterations,
                    completed: result.completed,
                    toolCalls,
                    reasoning: this.agent.getConfig().debug ? result.reasoning : undefined,
                },
                timestamp: new Date().toISOString(),
            };

            res.json(response);
        } catch (error) {
            const errorResponse: ChatErrorResponse = {
                success: false,
                error: error instanceof Error ? error.name : 'Unknown Error',
                message: error instanceof Error ? error.message : 'An unexpected error occurred',
                sessionId: req.body.sessionId,
                timestamp: new Date().toISOString(),
            };

            res.status(500).json(errorResponse);
        }
    }
}

