/**
 * API Request and Response Types
 */

// Chat Request/Response
export interface ChatRequest {
    query: string;
    sessionId?: string;
    options?: {
        debug?: boolean;
        maxIterations?: number;
    };
}

export interface ToolCallInfo {
    tool: string;
    input: Record<string, any>;
    result: any;
}

export interface ChatResponse {
    success: boolean;
    response: string;
    sessionId: string;
    data: {
        iterations: number;
        completed: boolean;
        toolCalls: ToolCallInfo[];
        reasoning?: string[];
    };
    timestamp: string;
}

export interface ChatErrorResponse {
    success: false;
    error: string;
    message: string;
    sessionId?: string;
    timestamp: string;
}

// Tools Response
export interface ToolInfo {
    name: string;
    description: string;
    enabled: boolean;
}

export interface ToolsResponse {
    tools: ToolInfo[];
    count: number;
}

// Context Response
export interface ContextEntity {
    users?: string[];
    tables?: string[];
    lastQuery?: string;
}

export interface ContextResponse {
    sessionId: string;
    context: {
        totalContexts: number;
        recentContexts: string[];
        entities: ContextEntity;
    };
}

export interface ContextClearResponse {
    success: boolean;
    message: string;
}

// Health Response
export interface HealthResponse {
    status: 'healthy' | 'unhealthy';
    services: {
        database: 'connected' | 'disconnected' | 'error';
        llm: 'available' | 'unavailable';
    };
    uptime: number;
    timestamp: string;
}

// Error Response
export interface ApiErrorResponse {
    success: false;
    error: string;
    message?: string;
    details?: any;
}

