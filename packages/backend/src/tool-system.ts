import { z } from 'zod';
import { Tool, ToolRegistration, ToolError, ToolResult, ToolCall } from './types';

/**
 * Converts a Zod schema to JSON Schema format for MCP compatibility
 */
export function zodToJsonSchema(schema: z.ZodSchema<any>): Record<string, any> {
    const convertSchema = (schema: any): any => {
        if (schema instanceof z.ZodString) {
            return { type: 'string' };
        }
        if (schema instanceof z.ZodNumber) {
            return { type: 'number' };
        }
        if (schema instanceof z.ZodBoolean) {
            return { type: 'boolean' };
        }
        if (schema instanceof z.ZodArray) {
            return {
                type: 'array',
                items: convertSchema(schema.element),
            };
        }
        if (schema instanceof z.ZodObject) {
            const shape = schema.shape;
            const properties: Record<string, any> = {};
            const required: string[] = [];

            for (const [key, value] of Object.entries(shape)) {
                properties[key] = convertSchema(value as z.ZodSchema<any>);

                // Check if field is required (not optional)
                if (!(value instanceof z.ZodOptional)) {
                    required.push(key);
                }
            }

            return {
                type: 'object',
                properties,
                required: required.length > 0 ? required : undefined,
            };
        }
        if (schema instanceof z.ZodOptional) {
            return convertSchema(schema.unwrap());
        }
        if (schema instanceof z.ZodEnum) {
            return {
                type: 'string',
                enum: schema.options,
            };
        }
        if (schema instanceof z.ZodLiteral) {
            return {
                type: typeof schema.value,
                const: schema.value,
            };
        }
        if (schema instanceof z.ZodUnion) {
            return {
                anyOf: schema.options.map((option: any) => convertSchema(option)),
            };
        }

        // Default fallback
        return { type: 'string' };
    };

    return convertSchema(schema);
}

/**
 * Tool registry for managing available tools
 */
export class ToolRegistry {
    private tools: Map<string, Tool> = new Map();

    /**
     * Register a new tool
     */
    registerTool(tool: Tool): void {
        if (this.tools.has(tool.name)) {
            throw new ToolError(`Tool '${tool.name}' is already registered`, tool.name);
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
     * Get all registered tools
     */
    getAllTools(): Tool[] {
        return Array.from(this.tools.values());
    }

    /**
     * Get tools formatted for MCP
     */
    getToolsForMCP(): ToolRegistration[] {
        return Array.from(this.tools.values()).map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: zodToJsonSchema(tool.inputSchema),
            handler: tool.handler,
        }));
    }

    /**
     * Get tools formatted for OpenAI API
     */
    getToolsForOpenAI(): any[] {
        return Array.from(this.tools.values()).map((tool) => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: zodToJsonSchema(tool.inputSchema),
            },
        }));
    }

    /**
     * Execute a tool call
     */
    async executeTool(toolCall: ToolCall): Promise<ToolResult> {
        const tool = this.getTool(toolCall.function.name);

        if (!tool) {
            return {
                success: false,
                error: `Tool '${toolCall.function.name}' not found`,
                toolCall,
            };
        }

        try {
            // Parse arguments
            let args: any;
            try {
                args = JSON.parse(toolCall.function.arguments);
            } catch (error) {
                return {
                    success: false,
                    error: `Invalid JSON in tool arguments: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    toolCall,
                };
            }

            // Validate arguments against schema
            const validationResult = tool.inputSchema.safeParse(args);
            if (!validationResult.success) {
                return {
                    success: false,
                    error: `Invalid arguments: ${validationResult.error.message}`,
                    toolCall,
                };
            }

            // Execute tool
            const result = await tool.handler(validationResult.data);

            return {
                success: true,
                data: result,
                toolCall,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                toolCall,
            };
        }
    }

    /**
     * Execute multiple tool calls in parallel
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
 * Helper function to create a tool
 */
export function createTool<T>(
    name: string,
    description: string,
    inputSchema: z.ZodSchema<T>,
    handler: (input: T) => Promise<any>,
): Tool {
    return {
        name,
        description,
        inputSchema,
        handler,
    };
}

/**
 * Helper function to create a simple tool without input validation
 */
export function createSimpleTool(name: string, description: string, handler: () => Promise<any>): Tool {
    return createTool(name, description, z.object({}), handler);
}
