import fetch from 'node-fetch';
import { LLMConfig, ChatMessage, LLMResponse, ToolCall, LLMError } from './types';

export class LLMClient {
    private config: LLMConfig;

    constructor(config: LLMConfig) {
        this.config = {
            maxTokens: 4096,
            temperature: 0.7,
            timeout: 30000,
            ...config,
        };
    }

    async chat(messages: ChatMessage[], tools?: any[]): Promise<LLMResponse> {
        const requestBody = {
            model: this.config.model,
            messages: messages,
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            ...(tools && tools.length > 0 && { tools, tool_choice: 'auto' }),
        };

        try {
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

            const response = await fetch(`${this.config.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.config.apiKey}`,
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new LLMError(`HTTP ${response.status}: ${response.statusText}`, response.status);
            }

            const data = (await response.json()) as any;

            if (data.error) {
                throw new LLMError(data.error.message || 'Unknown API error');
            }

            const choice = data.choices?.[0];
            if (!choice) {
                throw new LLMError('No choices returned from API');
            }

            const message = choice.message;

            return {
                content: message.content,
                tool_calls: message.tool_calls,
                finish_reason: choice.finish_reason,
            };
        } catch (error) {
            if (error instanceof LLMError) {
                throw error;
            }

            if (error instanceof Error) {
                throw new LLMError(`Request failed: ${error.message}`);
            }

            throw new LLMError('Unknown error occurred');
        }
    }

    async generateToolCall(messages: ChatMessage[], tools: any[]): Promise<ToolCall[]> {
        const response = await this.chat(messages, tools);

        if (!response.tool_calls || response.tool_calls.length === 0) {
            return [];
        }

        return response.tool_calls;
    }

    async generateResponse(messages: ChatMessage[], tools?: any[]): Promise<string> {
        const response = await this.chat(messages, tools);

        if (response.tool_calls && response.tool_calls.length > 0) {
            // If the model wants to use tools, we need to handle this at a higher level
            throw new LLMError('Model requested tool calls but response generation was expected');
        }

        return response.content || '';
    }

    // Helper method to format tools for OpenAI API
    static formatToolsForAPI(tools: Array<{ name: string; description: string; inputSchema: any }>): any[] {
        return tools.map((tool) => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema,
            },
        }));
    }

    // Helper method to create a system message
    static createSystemMessage(content: string): ChatMessage {
        return {
            role: 'system',
            content,
        };
    }

    // Helper method to create a user message
    static createUserMessage(content: string): ChatMessage {
        return {
            role: 'user',
            content,
        };
    }

    // Helper method to create an assistant message
    static createAssistantMessage(content: string, toolCalls?: ToolCall[]): ChatMessage {
        return {
            role: 'assistant',
            content,
            tool_calls: toolCalls,
        };
    }

    // Helper method to create a tool message
    static createToolMessage(content: string, toolCallId: string, toolName: string): ChatMessage {
        return {
            role: 'tool',
            content,
            tool_call_id: toolCallId,
            name: toolName,
        };
    }
}
