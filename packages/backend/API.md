# Backend API Documentation

## Overview

The AI Agent REST API provides endpoints to interact with the AI agent system, query databases through natural language, and manage conversation context.

**Base URL:** `http://localhost:3001`

## Getting Started

### Prerequisites

1. PostgreSQL database running (via Docker Compose)
2. Environment variables configured in `.env`
3. LLM endpoint available (if using external LLM)

### Starting the API Server

```bash
# From project root
npm run dev:api

# Or from backend directory
cd packages/backend
npm run dev:api

# Production mode (after building)
npm run start:api
```

### Environment Variables

Add these to your `.env` file in the project root:

```bash
# API Server Configuration
API_PORT=3001
API_HOST=localhost
CORS_ORIGIN=http://localhost:5173

# LLM Configuration (required)
OPENAI_BASE_URL=http://localhost:1234/v1
OPENAI_API_KEY=not-needed
OPENAI_MODEL=your-model-name

# PostgreSQL Configuration (required)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=testdb
POSTGRES_USER=testuser
POSTGRES_PASSWORD=testpass

# Agent Configuration
AGENT_MAX_ITERATIONS=8
AGENT_DEBUG=false
```

## API Endpoints

### 1. Chat Endpoint

Process natural language queries through the AI agent.

**Endpoint:** `POST /api/chat`

**Request Body:**
```json
{
  "query": "How many orders does john have?",
  "sessionId": "optional-session-id",
  "options": {
    "debug": false,
    "maxIterations": 8
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "response": "John has 3 orders.",
  "sessionId": "generated-or-provided-id",
  "data": {
    "iterations": 2,
    "completed": true,
    "toolCalls": [
      {
        "tool": "context_tool",
        "input": { "query": "..." },
        "result": {}
      },
      {
        "tool": "postgres_query",
        "input": { "query": "SELECT COUNT(*) FROM orders WHERE user_name = 'john'" },
        "result": {}
      }
    ],
    "reasoning": ["Step 1...", "Step 2..."]  // Only if debug: true
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Query is required",
  "sessionId": "optional-session-id",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How many orders does john have?",
    "sessionId": "user-123"
  }'
```

---

### 2. List Tools Endpoint

Get a list of all available tools the agent can use.

**Endpoint:** `GET /api/tools`

**Success Response (200):**
```json
{
  "tools": [
    {
      "name": "postgres_query",
      "description": "Execute SELECT queries on PostgreSQL database",
      "enabled": true
    },
    {
      "name": "postgres_schema",
      "description": "Get database schema information",
      "enabled": true
    },
    {
      "name": "calculator",
      "description": "Perform mathematical calculations",
      "enabled": true
    },
    {
      "name": "context_tool",
      "description": "Analyze query context and references",
      "enabled": true
    }
  ],
  "count": 4
}
```

**cURL Example:**
```bash
curl http://localhost:3001/api/tools
```

---

### 3. Get Context Endpoint

Retrieve the current conversation context summary.

**Endpoint:** `GET /api/context`

**Query Parameters:**
- `sessionId` (optional): Session identifier

**Success Response (200):**
```json
{
  "sessionId": "user-123",
  "context": {
    "totalContexts": 3,
    "recentContexts": [
      "User 'john' mentioned in query",
      "Orders table queried",
      "Result: 3 orders"
    ],
    "entities": {
      "users": ["john"],
      "tables": ["orders"],
      "lastQuery": "SELECT COUNT(*) FROM orders WHERE user_name = 'john'"
    }
  }
}
```

**cURL Example:**
```bash
curl "http://localhost:3001/api/context?sessionId=user-123"
```

---

### 4. Clear Context Endpoint

Clear the conversation context for a session.

**Endpoint:** `DELETE /api/context`

**Query Parameters:**
- `sessionId` (optional): Session identifier

**Success Response (200):**
```json
{
  "success": true,
  "message": "Context cleared for session user-123"
}
```

**cURL Example:**
```bash
curl -X DELETE "http://localhost:3001/api/context?sessionId=user-123"
```

---

### 5. Health Check Endpoint

Check the health status of the API and its dependencies.

**Endpoint:** `GET /health`

**Success Response (200):**
```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "llm": "available"
  },
  "uptime": 3600,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Unhealthy Response (503):**
```json
{
  "status": "unhealthy",
  "services": {
    "database": "error",
    "llm": "available"
  },
  "uptime": 3600,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**cURL Example:**
```bash
curl http://localhost:3001/health
```

---

## Request/Response Types

### TypeScript Types

All TypeScript types are available in `src/api/types.ts`:

```typescript
interface ChatRequest {
    query: string;
    sessionId?: string;
    options?: {
        debug?: boolean;
        maxIterations?: number;
    };
}

interface ChatResponse {
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
```

## Error Handling

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (if auth is implemented)
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable (health check failed)

### Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": "ErrorName",
  "message": "Human-readable error message",
  "details": {}  // Optional additional details
}
```

## CORS Configuration

The API is configured to accept requests from:
- Default: `http://localhost:5173` (Vite dev server)
- Configure via `CORS_ORIGIN` environment variable

Allowed methods: `GET`, `POST`, `DELETE`, `OPTIONS`

## Testing with Postman

### Import Collection

1. Create a new Postman collection
2. Add the following requests:

**1. Chat Query**
- Method: POST
- URL: `http://localhost:3001/api/chat`
- Body (JSON):
```json
{
  "query": "How many orders does john have?",
  "sessionId": "test-session"
}
```

**2. List Tools**
- Method: GET
- URL: `http://localhost:3001/api/tools`

**3. Get Context**
- Method: GET
- URL: `http://localhost:3001/api/context?sessionId=test-session`

**4. Clear Context**
- Method: DELETE
- URL: `http://localhost:3001/api/context?sessionId=test-session`

**5. Health Check**
- Method: GET
- URL: `http://localhost:3001/health`

## Example Usage Flow

### 1. Start with Health Check
```bash
curl http://localhost:3001/health
```

### 2. List Available Tools
```bash
curl http://localhost:3001/api/tools
```

### 3. Send Your First Query
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Get database schema", "sessionId": "demo"}'
```

### 4. Ask a Follow-up Question
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "How many users are there?", "sessionId": "demo"}'
```

### 5. Check Context
```bash
curl "http://localhost:3001/api/context?sessionId=demo"
```

### 6. Clear Context When Done
```bash
curl -X DELETE "http://localhost:3001/api/context?sessionId=demo"
```

## Troubleshooting

### API Won't Start

1. Check if port 3001 is already in use:
```bash
lsof -i :3001
```

2. Verify environment variables are set:
```bash
cat .env | grep API
```

3. Check logs for errors

### Database Connection Fails

1. Ensure PostgreSQL is running:
```bash
docker compose ps
```

2. Test database connection:
```bash
psql -h localhost -U testuser -d testdb
```

3. Verify `POSTGRES_*` environment variables

### CORS Errors in Browser

1. Check `CORS_ORIGIN` matches your frontend URL
2. Ensure frontend is running on the configured port
3. Check browser console for specific CORS error

## Performance Considerations

- Queries with multiple tool calls may take 5-30 seconds
- Database queries are retried up to 3 times
- HTTP timeouts are set to 30 seconds by default
- Context is stored in memory (consider Redis for production)

## Security Notes

⚠️ **This is a POC - Not production-ready!**

For production, consider:
- Authentication/Authorization
- Rate limiting
- Input sanitization (currently basic)
- HTTPS/TLS
- API key management
- Request logging
- Monitoring and alerting

## Next Steps

1. Test all endpoints with Postman or cURL
2. Integrate with frontend React app
3. Add authentication if needed
4. Deploy to production environment

