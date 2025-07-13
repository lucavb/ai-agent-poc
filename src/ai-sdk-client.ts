import { generateText, generateObject, CoreMessage, CoreTool, ToolInvocation, ToolResult } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { LLMConfig, LLMError } from './types';

export class AISdkClient {
    private openai: ReturnType<typeof createOpenAI>;
    private config: LLMConfig;

    constructor(config: LLMConfig) {
        this.config = {
            maxTokens: 4096,
            temperature: 0.7,
            timeout: 30000,
            ...config,
        };

        this.openai = createOpenAI({
            baseURL: this.config.baseURL,
            apiKey: this.config.apiKey,
        });
    }

    async generateWithTools(
        messages: CoreMessage[],
        tools: Record<string, CoreTool>,
        options: {
            maxSteps?: number;
            onStepFinish?: (step: any) => void;
        } = {},
    ): Promise<{
        text: string;
        steps: any[];
        finishReason: string;
        usage?: any;
    }> {
        try {
            const result = await generateText({
                model: this.openai(this.config.model),
                messages,
                tools,
                maxTokens: this.config.maxTokens ?? 4096,
                temperature: this.config.temperature,
                maxSteps: options.maxSteps || 5,
                onStepFinish: options.onStepFinish,
                abortSignal: AbortSignal.timeout(this.config.timeout ?? 30000),
            });

            return {
                text: result.text,
                steps: result.steps || [],
                finishReason: result.finishReason,
                usage: result.usage,
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new LLMError(`AI SDK error: ${error.message}`);
            }
            throw new LLMError('Unknown AI SDK error occurred');
        }
    }

    async generateSimple(messages: CoreMessage[]): Promise<string> {
        try {
            const result = await generateText({
                model: this.openai(this.config.model),
                messages,
                maxTokens: this.config.maxTokens ?? 4096,
                temperature: this.config.temperature,
                abortSignal: AbortSignal.timeout(this.config.timeout ?? 30000),
            });

            return result.text;
        } catch (error) {
            if (error instanceof Error) {
                throw new LLMError(`AI SDK error: ${error.message}`);
            }
            throw new LLMError('Unknown AI SDK error occurred');
        }
    }

    async generateStructured<T>(
        messages: CoreMessage[],
        schema: z.ZodSchema<T>,
        schemaName: string,
        schemaDescription: string,
    ): Promise<T> {
        try {
            const result = await generateObject({
                model: this.openai(this.config.model),
                messages,
                schema,
                schemaName,
                schemaDescription,
                maxTokens: this.config.maxTokens ?? 4096,
                temperature: this.config.temperature,
                abortSignal: AbortSignal.timeout(this.config.timeout ?? 30000),
            });

            return result.object;
        } catch (error) {
            if (error instanceof Error) {
                throw new LLMError(`AI SDK structured generation error: ${error.message}`);
            }
            throw new LLMError('Unknown AI SDK structured generation error occurred');
        }
    }

    // Helper methods to convert between formats
    static createSystemMessage(content: string): CoreMessage {
        return {
            role: 'system',
            content,
        };
    }

    static createUserMessage(content: string): CoreMessage {
        return {
            role: 'user',
            content,
        };
    }

    static createAssistantMessage(content: string): CoreMessage {
        return {
            role: 'assistant',
            content,
        };
    }

    static createToolMessage(content: string, toolCallId: string, toolName: string): CoreMessage {
        return {
            role: 'tool',
            content: [
                {
                    type: 'tool-result',
                    toolCallId,
                    toolName,
                    result: content,
                },
            ],
        };
    }

    getConfig(): LLMConfig {
        return { ...this.config };
    }
}
