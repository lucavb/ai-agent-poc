import { AgentConfig, AgentState, AgentResult, ChatMessage, ToolCall, ToolResult, Tool, AgentError } from './types';
import { LLMClient } from './llm-client';
import { ToolRegistry } from './tool-system';
import { MCPServer } from './mcp-server';

export class MCPAgent {
    private config: AgentConfig;
    private llmClient: LLMClient;
    private toolRegistry: ToolRegistry;
    private mcpServer?: MCPServer;
    private state: AgentState;
    private systemPrompt: string;

    constructor(config: AgentConfig) {
        this.config = {
            maxIterations: 8,
            debug: false,
            ...config,
        };

        this.llmClient = new LLMClient(this.config.llmConfig);
        this.toolRegistry = new ToolRegistry();

        this.state = {
            iterations: 0,
            completed: false,
            reasoning: [],
            messages: [],
            toolCalls: [],
            error: undefined,
        };

        this.systemPrompt = this.createSystemPrompt();
    }

    private createSystemPrompt(): string {
        return `You are a helpful AI assistant with access to tools. Your task is to help users by:

1. Understanding their requests clearly
2. Using available tools when needed to gather information or perform actions
3. Providing clear, helpful responses based on the results
4. Breaking down complex requests into manageable steps
5. Being transparent about your reasoning process

Available tools will be provided to you. Use them as needed to complete tasks.

When you believe you have completed the user's request, clearly indicate that you're done.
If you encounter errors or cannot proceed, explain what went wrong and what limitations you're facing.

Always be helpful, accurate, and honest about your capabilities and limitations.`;
    }

    /**
     * Add a tool to the agent
     */
    addTool(tool: Tool): void {
        this.toolRegistry.registerTool(tool);
        if (this.mcpServer) {
            this.mcpServer.addTool(tool);
        }
    }

    /**
     * Get all available tools
     */
    getTools(): Tool[] {
        return this.toolRegistry.getAllTools();
    }

    /**
     * Get current agent state
     */
    getState(): AgentState {
        return { ...this.state };
    }

    /**
     * Reset agent state
     */
    resetState(): void {
        this.state = {
            iterations: 0,
            completed: false,
            reasoning: [],
            messages: [],
            toolCalls: [],
            error: undefined,
        };
    }

    /**
     * Process a query with the iteration loop
     */
    async processQuery(query: string): Promise<AgentResult> {
        this.resetState();

        // Add system message and user query
        this.state.messages.push(LLMClient.createSystemMessage(this.systemPrompt));
        this.state.messages.push(LLMClient.createUserMessage(query));

        try {
            while (this.state.iterations < this.config.maxIterations! && !this.state.completed) {
                await this.performIteration();
            }

            // Final response
            const response = this.state.messages
                .filter((m) => m.role === 'assistant')
                .map((m) => m.content)
                .join('\n\n');

            return {
                success: !this.state.error,
                completed: this.state.completed,
                iterations: this.state.iterations,
                response: response || 'No response generated',
                reasoning: this.state.reasoning,
                toolCalls: this.state.toolCalls,
                error: this.state.error,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            this.state.error = errorMessage;

            return {
                success: false,
                completed: false,
                iterations: this.state.iterations,
                response: 'Agent encountered an error during processing',
                reasoning: this.state.reasoning,
                toolCalls: this.state.toolCalls,
                error: errorMessage,
            };
        }
    }

    /**
     * Perform a single iteration of the agent loop
     */
    private async performIteration(): Promise<void> {
        this.state.iterations++;

        if (this.config.debug) {
            console.log(`\n=== Iteration ${this.state.iterations} ===`);
        }

        try {
            // Get available tools for the LLM
            const tools = this.toolRegistry.getToolsForOpenAI();

            // Get response from LLM
            const response = await this.llmClient.chat(this.state.messages, tools);

            // Add reasoning
            this.state.reasoning.push(`Iteration ${this.state.iterations}: Generated response`);

            if (this.config.debug) {
                console.log('LLM Response:', response);
            }

            // Handle tool calls
            if (response.tool_calls && response.tool_calls.length > 0) {
                await this.handleToolCalls(response.tool_calls);
            } else {
                // No tool calls, add assistant response and mark as completed
                this.state.messages.push(LLMClient.createAssistantMessage(response.content || ''));
                this.state.completed = true;
                this.state.reasoning.push(`Iteration ${this.state.iterations}: Task completed`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.state.error = errorMessage;
            this.state.reasoning.push(`Iteration ${this.state.iterations}: Error - ${errorMessage}`);
            throw error;
        }
    }

    /**
     * Handle tool calls from the LLM
     */
    private async handleToolCalls(toolCalls: ToolCall[]): Promise<void> {
        if (this.config.debug) {
            console.log('Processing tool calls:', toolCalls);
        }

        // Add assistant message with tool calls
        this.state.messages.push(LLMClient.createAssistantMessage('', toolCalls));

        // Execute tools
        const toolResults = await this.toolRegistry.executeToolCalls(toolCalls);

        // Add tool results to state
        this.state.toolCalls.push(...toolCalls);

        // Add tool result messages
        for (const result of toolResults) {
            const toolCall = result.toolCall;
            const resultContent = result.success
                ? typeof result.data === 'string'
                    ? result.data
                    : JSON.stringify(result.data, null, 2)
                : `Error: ${result.error}`;

            this.state.messages.push(LLMClient.createToolMessage(resultContent, toolCall.id, toolCall.function.name));

            this.state.reasoning.push(
                `Iteration ${this.state.iterations}: Executed tool ${toolCall.function.name} - ${result.success ? 'Success' : 'Failed'}`,
            );
        }

        // Check if any tools failed critically
        const criticalFailures = toolResults.filter((r) => !r.success && r.error?.includes('not found'));
        if (criticalFailures.length > 0) {
            this.state.reasoning.push(`Iteration ${this.state.iterations}: Critical tool failures detected`);
        }
    }

    /**
     * Initialize MCP server for this agent
     */
    async initializeMCPServer(): Promise<void> {
        const serverInfo = {
            name: this.config.name,
            version: this.config.version,
            tools: this.toolRegistry.getAllTools(),
        };

        this.mcpServer = new MCPServer(serverInfo, this.toolRegistry);
        await this.mcpServer.start();
    }

    /**
     * Get the MCP server instance
     */
    getMCPServer(): MCPServer | undefined {
        return this.mcpServer;
    }

    /**
     * Add reasoning to the current state
     */
    addReasoning(reasoning: string): void {
        this.state.reasoning.push(reasoning);
    }

    /**
     * Check if the agent has completed its task
     */
    isCompleted(): boolean {
        return this.state.completed;
    }

    /**
     * Check if the agent has an error
     */
    hasError(): boolean {
        return !!this.state.error;
    }

    /**
     * Get the agent's configuration
     */
    getConfig(): AgentConfig {
        return { ...this.config };
    }

    /**
     * Update the system prompt
     */
    updateSystemPrompt(prompt: string): void {
        this.systemPrompt = prompt;
    }

    /**
     * Get current conversation history
     */
    getConversationHistory(): ChatMessage[] {
        return [...this.state.messages];
    }
}
