import { CoreMessage } from 'ai';
import { AgentConfig, AgentState, AgentResult, Tool, AgentError } from './types';
import { AISdkClient } from './ai-sdk-client';
import { AISdkToolRegistry } from './ai-sdk-tool-system';

export class AISdkAgent {
    private config: AgentConfig;
    private llmClient: AISdkClient;
    private toolRegistry: AISdkToolRegistry;
    private state: AgentState;
    private systemPrompt: string;

    constructor(config: AgentConfig) {
        this.config = {
            maxIterations: 8,
            debug: false,
            ...config,
        };

        this.llmClient = new AISdkClient(this.config.llmConfig);
        this.toolRegistry = new AISdkToolRegistry();

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
    }

    /**
     * Get all tools
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
     * Process a query using AI SDK's built-in multi-step capabilities
     */
    async processQuery(query: string): Promise<AgentResult> {
        this.resetState();

        // Build messages
        const messages: CoreMessage[] = [
            AISdkClient.createSystemMessage(this.systemPrompt),
            AISdkClient.createUserMessage(query),
        ];

        this.state.reasoning.push('Starting query processing with AI SDK');

        try {
            // Get tools in AI SDK format
            const tools = this.toolRegistry.getToolsForAiSdk();

            if (this.config.debug) {
                console.log(`\n=== AI SDK Agent Processing ===`);
                console.log(`Query: ${query}`);
                console.log(`Available tools: ${Object.keys(tools).join(', ')}`);
            }

            // Use AI SDK's built-in multi-step capabilities
            const result = await this.llmClient.generateWithTools(messages, tools, {
                maxSteps: this.config.maxIterations,
                onStepFinish: (step) => {
                    this.state.iterations++;

                    if (this.config.debug) {
                        console.log(`\n--- Step ${this.state.iterations} ---`);
                        console.log('Step:', step);
                    }

                    this.state.reasoning.push(`Step ${this.state.iterations}: ${step.stepType || 'processing'}`);

                    // Track tool calls if any
                    if (step.toolCalls && step.toolCalls.length > 0) {
                        this.state.reasoning.push(
                            `Step ${this.state.iterations}: Called ${step.toolCalls.length} tool(s)`,
                        );
                    }
                },
            });

            // Update state with final results
            this.state.completed = result.finishReason === 'stop';
            this.state.iterations = result.steps.length;

            if (this.config.debug) {
                console.log(`\n=== Final Results ===`);
                console.log(`Finish reason: ${result.finishReason}`);
                console.log(`Steps: ${result.steps.length}`);
                console.log(`Response: ${result.text.slice(0, 200)}...`);
            }

            this.state.reasoning.push(`Processing completed with ${result.steps.length} steps`);
            this.state.reasoning.push(`Finish reason: ${result.finishReason}`);

            return {
                success: true,
                completed: this.state.completed,
                iterations: this.state.iterations,
                response: result.text,
                reasoning: this.state.reasoning,
                toolCalls: this.state.toolCalls,
                error: undefined,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            this.state.error = errorMessage;

            this.state.reasoning.push(`Error: ${errorMessage}`);

            if (this.config.debug) {
                console.error('Agent error:', error);
            }

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
     * Generate a simple response without tools
     */
    async generateSimpleResponse(query: string): Promise<string> {
        const messages: CoreMessage[] = [
            AISdkClient.createSystemMessage(this.systemPrompt),
            AISdkClient.createUserMessage(query),
        ];

        try {
            return await this.llmClient.generateSimple(messages);
        } catch (error) {
            if (error instanceof Error) {
                throw new AgentError(`Failed to generate response: ${error.message}`);
            }
            throw new AgentError('Unknown error occurred while generating response');
        }
    }

    /**
     * Generate structured output
     */
    async generateStructured<T>(query: string, schema: any, schemaName: string, schemaDescription: string): Promise<T> {
        const messages: CoreMessage[] = [
            AISdkClient.createSystemMessage(this.systemPrompt),
            AISdkClient.createUserMessage(query),
        ];

        try {
            return await this.llmClient.generateStructured(messages, schema, schemaName, schemaDescription);
        } catch (error) {
            if (error instanceof Error) {
                throw new AgentError(`Failed to generate structured output: ${error.message}`);
            }
            throw new AgentError('Unknown error occurred while generating structured output');
        }
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
     * Get conversation history (simplified for AI SDK)
     */
    getConversationHistory(): any[] {
        return this.state.reasoning;
    }
}
