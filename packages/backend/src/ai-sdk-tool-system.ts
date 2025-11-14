import { z } from 'zod';
import { CoreTool } from 'ai';
import { Tool, ToolResult, ToolCall, ToolError } from './types';

/**
 * AI SDK Tool Registry - converts our existing tools to AI SDK format
 */
export class AISdkToolRegistry {
    private tools: Map<string, Tool> = new Map();

    /**
     * Register a tool
     */
    registerTool(tool: Tool): void {
        if (this.tools.has(tool.name)) {
            throw new ToolError(`Tool with name "${tool.name}" already exists`, tool.name);
        }
        this.tools.set(tool.name, tool);
    }

    /**
     * Get a tool by name
     */
    getTool(name: string): Tool | undefined {
        return this.tools.get(name);
    }

    /**
     * Get all tools
     */
    getAllTools(): Tool[] {
        return Array.from(this.tools.values());
    }

    /**
     * Get tools formatted for AI SDK
     */
    getToolsForAiSdk(): Record<string, CoreTool> {
        const aiSdkTools: Record<string, CoreTool> = {};

        for (const tool of this.tools.values()) {
            aiSdkTools[tool.name] = {
                description: tool.description,
                parameters: tool.inputSchema,
                execute: async (args: any) => {
                    try {
                        // Validate input with Zod schema
                        const validatedArgs = tool.inputSchema.parse(args);

                        // Execute the tool
                        const result = await tool.handler(validatedArgs);

                        // Return the result - AI SDK expects any type
                        return result;
                    } catch (error) {
                        if (error instanceof z.ZodError) {
                            throw new ToolError(
                                `Validation error for tool "${tool.name}": ${error.message}`,
                                tool.name,
                            );
                        }

                        if (error instanceof Error) {
                            throw new ToolError(`Tool execution error for "${tool.name}": ${error.message}`, tool.name);
                        }

                        throw new ToolError(`Unknown error in tool "${tool.name}"`, tool.name);
                    }
                },
            };
        }

        return aiSdkTools;
    }

    /**
     * Execute a tool call (for compatibility with existing code)
     */
    async executeTool(toolCall: ToolCall): Promise<ToolResult> {
        const tool = this.tools.get(toolCall.function.name);
        if (!tool) {
            return {
                success: false,
                error: `Tool "${toolCall.function.name}" not found`,
                toolCall,
            };
        }

        try {
            let args: any = {};

            // Parse arguments if they exist
            if (toolCall.function.arguments) {
                try {
                    args = JSON.parse(toolCall.function.arguments);
                } catch (error) {
                    return {
                        success: false,
                        error: `Invalid JSON in tool arguments: ${error}`,
                        toolCall,
                    };
                }
            }

            // Validate input
            const validatedArgs = tool.inputSchema.parse(args);

            // Execute tool
            const result = await tool.handler(validatedArgs);

            return {
                success: true,
                data: result,
                toolCall,
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    success: false,
                    error: `Validation error: ${error.message}`,
                    toolCall,
                };
            }

            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                success: false,
                error: errorMessage,
                toolCall,
            };
        }
    }

    /**
     * Execute multiple tool calls
     */
    async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
        const promises = toolCalls.map((toolCall) => this.executeTool(toolCall));
        return Promise.all(promises);
    }

    /**
     * Check if a tool exists
     */
    hasTool(name: string): boolean {
        return this.tools.has(name);
    }

    /**
     * Remove a tool
     */
    removeTool(name: string): boolean {
        return this.tools.delete(name);
    }

    /**
     * Clear all tools
     */
    clearTools(): void {
        this.tools.clear();
    }

    /**
     * Get tool names
     */
    getToolNames(): string[] {
        return Array.from(this.tools.keys());
    }
}

/**
 * Create a tool with input validation
 */
export function createAiSdkTool<T = any>(
    name: string,
    description: string,
    inputSchema: z.ZodSchema<any>,
    handler: (input: any) => Promise<any>,
): Tool {
    return {
        name,
        description,
        inputSchema,
        handler,
    };
}

/**
 * Create a simple tool without parameters
 */
export function createSimpleAiSdkTool(name: string, description: string, handler: () => Promise<any>): Tool {
    return createAiSdkTool(name, description, z.object({}), handler);
}
