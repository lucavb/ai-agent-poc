# API Quick Start Guide

## 🚀 Get the API Running in 5 Minutes

### Step 1: Ensure Prerequisites

```bash
# 1. Start PostgreSQL database
docker compose up -d

# 2. Verify .env file exists in project root
# If not, copy from env.example and update values
```

### Step 2: Add API Configuration to .env

Add these lines to your `.env` file (in project root):

```bash
# API Server Configuration
API_PORT=3001
API_HOST=localhost
CORS_ORIGIN=http://localhost:5173
```

Your complete `.env` should look like:

```bash
# LLM Configuration
OPENAI_BASE_URL=http://localhost:1234/v1
OPENAI_API_KEY=not-needed
OPENAI_MODEL=your-model-name

# Agent Configuration
AGENT_NAME=test-agent
AGENT_VERSION=1.0.0
AGENT_MAX_ITERATIONS=8
AGENT_DEBUG=false

# PostgreSQL Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=testdb
POSTGRES_USER=testuser
POSTGRES_PASSWORD=testpass
POSTGRES_SSL=false
POSTGRES_MAX_RETRIES=3

# API Server Configuration
API_PORT=3001
API_HOST=localhost
CORS_ORIGIN=http://localhost:5173

# Optional LLM Settings
OPENAI_MAX_TOKENS=4096
OPENAI_TEMPERATURE=0.7
OPENAI_TIMEOUT=30000
```

### Step 3: Start the API Server

```bash
# From project root
npm run dev:api
```

You should see:

```
🚀 API Server Started
   URL: http://localhost:3001

📡 Available Endpoints:
   POST   http://localhost:3001/api/chat
   GET    http://localhost:3001/api/tools
   GET    http://localhost:3001/api/context
   DELETE http://localhost:3001/api/context
   GET    http://localhost:3001/health

✨ Ready to accept requests!
```

### Step 4: Test the API

#### Test 1: Health Check

```bash
curl http://localhost:3001/health
```

Expected output:
```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "llm": "available"
  },
  "uptime": 10,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Test 2: List Available Tools

```bash
curl http://localhost:3001/api/tools
```

Expected output:
```json
{
  "tools": [
    {
      "name": "context_tool",
      "description": "Analyze query context and references",
      "enabled": true
    },
    {
      "name": "calculator",
      "description": "Perform safe mathematical calculations",
      "enabled": true
    },
    {
      "name": "postgres_schema",
      "description": "Get PostgreSQL database schema",
      "enabled": true
    },
    {
      "name": "postgres_query",
      "description": "Execute SELECT queries on PostgreSQL",
      "enabled": true
    }
  ],
  "count": 4
}
```

#### Test 3: Send a Query

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How many users are in the database?",
    "sessionId": "quickstart"
  }'
```

Expected output:
```json
{
  "success": true,
  "response": "There are X users in the database.",
  "sessionId": "quickstart",
  "data": {
    "iterations": 2,
    "completed": true,
    "toolCalls": [
      {
        "tool": "context_tool",
        "input": {...},
        "result": {}
      },
      {
        "tool": "postgres_query",
        "input": {...},
        "result": {}
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Test 4: Ask a Follow-up Question

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are their usernames?",
    "sessionId": "quickstart"
  }'
```

#### Test 5: Check Context

```bash
curl "http://localhost:3001/api/context?sessionId=quickstart"
```

#### Test 6: Clear Context

```bash
curl -X DELETE "http://localhost:3001/api/context?sessionId=quickstart"
```

## 🎯 Next Steps

### Option 1: Use Postman

1. Open Postman
2. Create a new request
3. Set method to POST
4. URL: `http://localhost:3001/api/chat`
5. Body → raw → JSON:
```json
{
  "query": "Your question here",
  "sessionId": "my-session"
}
```
6. Click Send

### Option 2: Connect Frontend

Now that the API is running, you can:

1. Start the frontend:
```bash
npm run dev:frontend
```

2. The frontend (http://localhost:5173) can now make requests to the API

3. Example fetch call:
```javascript
const response = await fetch('http://localhost:3001/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'How many orders does john have?',
    sessionId: 'user-123'
  })
});
const data = await response.json();
console.log(data.response);
```

### Option 3: Test More Queries

Try these example queries:

```bash
# Database schema
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me the database schema"}'

# Calculate something
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Calculate 15 * 23 + 42"}'

# Complex database query
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Which user has the most orders?"}'

# With debug mode
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How many products cost more than $100?",
    "options": {"debug": true}
  }'
```

## 🐛 Troubleshooting

### "Cannot connect to database"

```bash
# Check if PostgreSQL is running
docker compose ps

# If not, start it
docker compose up -d

# Check logs
docker compose logs postgres
```

### "Port 3001 already in use"

```bash
# Find what's using the port
lsof -i :3001

# Kill it or change API_PORT in .env
API_PORT=3002
```

### "Module not found" errors

```bash
# Reinstall dependencies
npm install

# Rebuild backend
npm run build:backend
```

### API returns 500 errors

```bash
# Check if .env file exists and has all required variables
cat .env

# Look at the API server logs in the terminal where it's running
# They will show detailed error messages
```

## 📚 Full Documentation

For complete API documentation, see:
- [packages/backend/API.md](packages/backend/API.md) - Full API reference
- [NEXT_STEPS.md](NEXT_STEPS.md) - Frontend integration guide

## ✅ Success Checklist

- [ ] Database running (docker compose up -d)
- [ ] .env file configured with API settings
- [ ] API server started (npm run dev:api)
- [ ] Health check returns "healthy"
- [ ] Can list tools
- [ ] Can send queries and get responses
- [ ] Ready to build frontend UI!

## 🎉 You're Done!

Your AI Agent API is now running and ready to use. You can:
- Send queries via curl or Postman
- Integrate with the React frontend
- Build custom clients
- Test database queries through natural language

Need help? Check the full documentation or ask questions!

