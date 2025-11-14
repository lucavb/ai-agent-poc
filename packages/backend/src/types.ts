import { z } from 'zod';

// LLM Configuration
export interface LLMConfig {
    baseURL: string;
    apiKey: string;
    model: string;
    maxTokens?: number;
    temperature?: number;
    timeout?: number;
}

// Agent Configuration
export interface AgentConfig {
    name: string;
    version: string;
    llmConfig: LLMConfig;
    maxIterations?: number;
    debug?: boolean;
}

// Tool Definition
export interface Tool {
    name: string;
    description: string;
    inputSchema: z.ZodSchema<any>;
    handler: (input: any) => Promise<any>;
}

// Agent State
export interface AgentState {
    iterations: number;
    completed: boolean;
    reasoning: string[];
    messages: ChatMessage[];
    toolCalls: ToolCall[];
    error?: string;
}

// Chat Message Types
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    name?: string;
    tool_call_id?: string;
    tool_calls?: ToolCall[];
}

export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

// LLM Response
export interface LLMResponse {
    content: string | null;
    tool_calls?: ToolCall[];
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
}

// Tool Execution Result
export interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
    toolCall: ToolCall;
}

// Agent Result
export interface AgentResult {
    success: boolean;
    completed: boolean;
    iterations: number;
    response: string;
    reasoning: string[];
    toolCalls: ToolCall[];
    error?: string;
}

// MCP Server Info
export interface ServerInfo {
    name: string;
    version: string;
    tools: Tool[];
}

// Tool Registration
export interface ToolRegistration {
    name: string;
    description: string;
    inputSchema: Record<string, any>; // JSON Schema format
    handler: (input: any) => Promise<any>;
}

// Error Types
export class AgentError extends Error {
    constructor(
        message: string,
        public code?: string,
    ) {
        super(message);
        this.name = 'AgentError';
    }
}

export class ToolError extends Error {
    constructor(
        message: string,
        public toolName?: string,
    ) {
        super(message);
        this.name = 'ToolError';
    }
}

export class LLMError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
    ) {
        super(message);
        this.name = 'LLMError';
    }
}
