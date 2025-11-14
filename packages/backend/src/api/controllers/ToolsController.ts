import { Request, Response } from 'express';
import { AISdkAgent } from '../../ai-sdk-agent';
import { ToolsResponse, ToolInfo } from '../types';

/**
 * Tools Controller
 * Handles tool-related API endpoints
 */
export class ToolsController {
    private agent: AISdkAgent;

    constructor(agent: AISdkAgent) {
        this.agent = agent;
    }

    /**
     * GET /api/tools
     * Get list of available tools
     */
    async getTools(req: Request, res: Response): Promise<void> {
        try {
            const tools = this.agent.getTools();

            const toolInfos: ToolInfo[] = tools.map((tool) => ({
                name: tool.name,
                description: tool.description,
                enabled: true, // All registered tools are enabled
            }));

            const response: ToolsResponse = {
                tools: toolInfos,
                count: toolInfos.length,
            };

            res.json(response);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.name : 'Unknown Error',
                message: error instanceof Error ? error.message : 'Failed to retrieve tools',
            });
        }
    }
}

