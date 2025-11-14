# AI Agent POC - Monorepo

A full-stack AI agent system with a React frontend and Node.js backend, demonstrating database querying through natural language.

## 🏗️ Project Structure

```
ai-agent-poc/
├── packages/
│   ├── backend/          # AI Agent backend (Node.js + TypeScript)
│   │   ├── src/          # Source code (agents, tools, LLM clients)
│   │   ├── dist/         # Compiled JavaScript
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/         # React UI (Vite + TypeScript)
│       ├── src/          # React components and pages
│       ├── public/       # Static assets
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
├── fixtures/             # Database fixtures and test data
├── docker-compose.yml    # PostgreSQL test database
├── package.json          # Root workspace configuration
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm 7+ (for workspace support)
- Docker & Docker Compose (for test database)

### Installation

```bash
# Install all dependencies (backend + frontend)
npm install
```

### Running the Application

#### 1. Start the test database
```bash
docker compose up -d
```

#### 2. Configure environment variables

Create a `.env` file in the project root (copy from `env.example` and update values):

```bash
# Add these API configuration lines
API_PORT=3001
API_HOST=localhost
CORS_ORIGIN=http://localhost:5173
```

See [API_QUICKSTART.md](API_QUICKSTART.md) for complete `.env` configuration.

#### 3. Start the Backend API Server
```bash
# Run API server in development mode
npm run dev:api

# API will be available at http://localhost:3001
```

**Alternative: Terminal Interface (CLI)**
```bash
# Run backend CLI in development mode
npm run dev:backend
```

#### 4. Start the Frontend (React UI)
```bash
# In a separate terminal
npm run dev:frontend

# Frontend will be available at http://localhost:5173
```

#### Quick Development Setup (Full Stack)

```bash
# Terminal 1: Database
docker compose up -d

# Terminal 2: API Server
npm run dev:api
# Wait for: "✨ Ready to accept requests!"

# Terminal 3: Frontend
npm run dev:frontend
# Opens at http://localhost:5173
```

**Then:**
1. Open browser to **http://localhost:5173**
2. See the chat interface
3. Click an example query or type your own
4. Chat with your database! 🎉

**See:** [Chat UI Quick Start Guide](CHAT_UI_QUICKSTART.md) for detailed walkthrough

## 📦 Packages

### Backend (`@ai-agent-poc/backend`)

TypeScript agent system using Model Context Protocol (MCP) SDK with:
- **AI SDK Integration**: Using Vercel's AI SDK with OpenAI-compatible endpoints
- **REST API Server**: Express-based API with 5 core endpoints
- **Tool System**: PostgreSQL query tools, calculator, context analysis
- **LLM Client**: Flexible LLM communication with local or remote endpoints
- **Context Management**: Multi-turn conversations with reference resolution

**Available APIs:**
- `POST /api/chat` - Send queries to the AI agent
- `GET /api/tools` - List available tools
- `GET /api/context` - Get conversation context
- `DELETE /api/context` - Clear conversation context
- `GET /health` - Health check

**Documentation:**
- [API Quick Start Guide](API_QUICKSTART.md) - Get started in 5 minutes
- [Full API Documentation](packages/backend/API.md) - Complete reference
- [Backend README](packages/backend/README.md) - Detailed agent documentation

### Frontend (`@ai-agent-poc/frontend`)

React + TypeScript + Vite + Stitches application:
- **Modern Chat UI**: Clean, professional design
- **Multi-Conversation Support**: Create and manage multiple conversations
- **Sidebar Navigation**: Easy switching between conversations
- **Persistent Storage**: Conversations saved in localStorage
- **Real-time Messaging**: Send queries, see AI responses
- **Loading Indicators**: Animated "Thinking..." with bouncing dots
- **Context Awareness**: Each conversation maintains its own context
- **Auto-Generated Titles**: Smart titles from first message
- **Delete Conversations**: Remove conversations you don't need
- **Empty State**: Welcome screen with example queries
- **Responsive Design**: Mobile-friendly sidebar (slide-out on mobile)
- **Type Safety**: Full TypeScript support

**Quick Start:**
```bash
npm run dev:frontend
# Opens at http://localhost:5173
```

**Documentation:**
- [Chat UI Quick Start](CHAT_UI_QUICKSTART.md) - Get started in 5 minutes
- [Multi-Conversation Guide](MULTI_CONVERSATION_GUIDE.md) - Managing multiple conversations
- [Frontend Implementation Summary](FRONTEND_IMPLEMENTATION_SUMMARY.md) - Technical details
- [UI Bugs Fixed](UI_BUGS_FIXED.md) - Recent bug fixes and improvements

## 🛠️ Development Scripts

### Root Level
```bash
npm run dev              # Start frontend dev server
npm run dev:api          # Start backend REST API server (recommended)
npm run dev:backend      # Start backend CLI (terminal interface)
npm run dev:frontend     # Start frontend in dev mode
npm run build            # Build both packages
npm run build:backend    # Build backend only
npm run build:frontend   # Build frontend only
npm run start:api        # Start production API server
```

### Backend Only
```bash
cd packages/backend
npm run dev:api         # API server in dev mode (recommended)
npm run dev             # CLI interface in dev mode
npm run build           # Compile TypeScript
npm run start:api       # Run compiled API server
npm start               # Run compiled CLI
```

### Frontend Only
```bash
cd packages/frontend
npm run dev             # Start Vite dev server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint
```

## 🔧 Configuration

### Backend Environment Variables

Create a `.env` file in the root directory:

```bash
# LLM Configuration
OPENAI_BASE_URL=http://localhost:1234/v1
OPENAI_API_KEY=not-needed
OPENAI_MODEL=your-model-name

# Agent Configuration
AGENT_NAME=test-agent
AGENT_VERSION=1.0.0
AGENT_MAX_ITERATIONS=8
AGENT_DEBUG=true

# PostgreSQL Test Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=testdb
POSTGRES_USER=testuser
POSTGRES_PASSWORD=testpass
POSTGRES_MAX_RETRIES=3

# Optional LLM Settings
OPENAI_MAX_TOKENS=4096
OPENAI_TEMPERATURE=0.7
OPENAI_TIMEOUT=30000
```

## 🐳 Docker Test Environment

Start the PostgreSQL test database:

```bash
# Start database
docker compose up -d

# View logs
docker compose logs postgres

# Stop database
docker compose down

# Stop and remove data
docker compose down -v
```

Test database includes:
- 7 tables with e-commerce sample data
- Users, products, orders, reviews
- Foreign key relationships and indexes

## 🧪 Example Usage

### Backend Terminal
```
> How many orders does user johndoe have?
> Summarize these orders
> What products did he order?
```

### Frontend UI (Coming Soon)
- Chat interface for natural language queries
- Visual display of query results
- Conversation history and context tracking

## 📝 Workspace Management

This is a monorepo using npm workspaces. Benefits:
- Shared dependencies hoisted to root
- Cross-package linking
- Consistent tooling and scripts
- Simplified dependency management

## 🎯 Next Steps

See [Next Steps](#next-steps-for-development) below for implementation roadmap.

## 📄 License

MIT License - see LICENSE file for details
