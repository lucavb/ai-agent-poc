/**
 * API Client for AI Agent Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

export interface ApiError {
  success: false;
  error: string;
  message: string;
}

/**
 * Send a chat query to the AI agent
 */
export async function sendChatMessage(
  query: string,
  sessionId: string = 'default'
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      sessionId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send message');
  }

  return response.json();
}

/**
 * Clear conversation context
 */
export async function clearContext(sessionId: string = 'default'): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/context?sessionId=${sessionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to clear context');
  }
}

/**
 * Get available tools
 */
export async function getTools(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/tools`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch tools');
  }

  return response.json();
}

/**
 * Health check
 */
export async function checkHealth(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/health`);
  
  if (!response.ok) {
    throw new Error('Health check failed');
  }

  return response.json();
}

