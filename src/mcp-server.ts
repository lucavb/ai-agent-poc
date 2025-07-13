import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    CallToolResult,
    Tool as MCPTool,
    TextContent,
    ImageContent,
    EmbeddedResource,
} from '@modelcontextprotocol/sdk/types.js';
import { ToolRegistry } from './tool-system';
import { ServerInfo } from './types';

export class MCPServer {
    private server: Server;
    private toolRegistry: ToolRegistry;
    private serverInfo: ServerInfo;

    constructor(serverInfo: ServerInfo, toolRegistry: ToolRegistry) {
        this.serverInfo = serverInfo;
        this.toolRegistry = toolRegistry;
        this.server = new Server(
            {
                name: serverInfo.name,
                version: serverInfo.version,
            },
            {
                capabilities: {
                    tools: {},
                },
            },
        );

        this.setupHandlers();
    }

    private setupHandlers(): void {
        // Handle tool listing
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            const tools = this.toolRegistry.getToolsForMCP();
            return {
                tools: tools.map((tool) => ({
                    name: tool.name,
                    description: tool.description,
                    inputSchema: tool.inputSchema,
                })),
            };
        });

        // Handle tool execution
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            // Create a mock tool call for the registry
            const toolCall = {
                id: 'mcp-call',
                type: 'function' as const,
                function: {
                    name,
                    arguments: JSON.stringify(args || {}),
                },
            };

            const result = await this.toolRegistry.executeTool(toolCall);

            if (!result.success) {
                throw new Error(result.error || 'Tool execution failed');
            }

            // Convert result to MCP format
            const content: TextContent = {
                type: 'text',
                text: typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2),
            };

            return {
                content: [content],
                isError: false,
            };
        });
    }

    /**
     * Start the MCP server with stdio transport
     */
    async start(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
    }

    /**
     * Add a tool to the server
     */
    addTool(tool: any): void {
        this.toolRegistry.registerTool(tool);
    }

    /**
     * Get server info
     */
    getServerInfo(): ServerInfo {
        return this.serverInfo;
    }

    /**
     * Get the underlying server instance
     */
    getServer(): Server {
        return this.server;
    }

    /**
     * Get the tool registry
     */
    getToolRegistry(): ToolRegistry {
        return this.toolRegistry;
    }
}

/**
 * Helper function to create and start an MCP server
 */
export async function createMCPServer(serverInfo: ServerInfo, toolRegistry: ToolRegistry): Promise<MCPServer> {
    const server = new MCPServer(serverInfo, toolRegistry);
    await server.start();
    return server;
}

/**
 * Helper function to format tool result for MCP
 */
export function formatToolResultForMCP(result: any): CallToolResult {
    const content: TextContent = {
        type: 'text',
        text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
    };

    return {
        content: [content],
        isError: false,
    };
}

/**
 * Helper function to format error for MCP
 */
export function formatErrorForMCP(error: string): CallToolResult {
    const content: TextContent = {
        type: 'text',
        text: error,
    };

    return {
        content: [content],
        isError: true,
    };
}
