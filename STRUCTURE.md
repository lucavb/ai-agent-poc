# Project Structure Overview

## 📁 Monorepo Layout

```
ai-agent-poc/
│
├── 📄 package.json                    # Root workspace config
├── 📄 package-lock.json               # Locked dependencies
├── 📄 README.md                       # Main documentation
├── 📄 NEXT_STEPS.md                   # Implementation roadmap
├── 📄 STRUCTURE.md                    # This file
├── 📄 .env.example                    # Environment template
├── 📄 docker-compose.yml              # PostgreSQL test database
│
├── 📁 fixtures/                       # Database fixtures
│   ├── init/
│   │   ├── 01-schema.sql             # Database schema
│   │   └── 02-data.sql               # Sample data
│   └── README.md
│
├── 📁 node_modules/                   # Root dependencies (hoisted)
│
└── 📁 packages/                       # Workspace packages
    │
    ├── 📁 backend/                    # AI Agent Backend
    │   ├── 📄 package.json            # Backend dependencies
    │   ├── 📄 tsconfig.json           # TypeScript config
    │   ├── 📁 src/                    # TypeScript source
    │   │   ├── index.ts              # CLI entry point
    │   │   ├── config.ts             # Environment config
    │   │   ├── ai-sdk-agent.ts       # Main agent class
    │   │   ├── ai-sdk-client.ts      # AI SDK client
    │   │   ├── llm-client.ts         # LLM communication
    │   │   ├── tool-system.ts        # Tool registry
    │   │   ├── context-manager.ts    # Context tracking
    │   │   ├── types.ts              # Type definitions
    │   │   └── tools/                # Tool implementations
    │   │       ├── calculator-tool.ts
    │   │       ├── context-tool.ts
    │   │       ├── postgres-tool.ts
    │   │       ├── postgres-query-tool.ts
    │   │       └── index.ts
    │   └── 📁 dist/                   # Compiled JavaScript
    │
    └── 📁 frontend/                   # React UI
        ├── 📄 package.json            # Frontend dependencies
        ├── 📄 tsconfig.json           # TypeScript config
        ├── 📄 vite.config.ts          # Vite configuration
        ├── 📄 index.html              # HTML entry point
        ├── 📁 public/                 # Static assets
        │   └── vite.svg
        ├── 📁 src/                    # React source
        │   ├── main.tsx              # React entry point
        │   ├── App.tsx               # Main App component
        │   ├── App.css
        │   ├── index.css
        │   └── assets/               # Images, etc.
        └── 📁 dist/                   # Production build
```

## 🔄 Workspace Management

This project uses **npm workspaces** for monorepo management:

### Benefits:
- ✅ Shared dependencies hoisted to root
- ✅ Cross-package linking
- ✅ Single `npm install` for everything
- ✅ Run scripts from root or individually
- ✅ Consistent versioning

### Commands:
```bash
# Install all dependencies
npm install

# Run scripts from root
npm run dev                  # Run frontend
npm run dev:backend          # Run backend CLI
npm run build                # Build both packages
npm run build:backend        # Build backend only
npm run build:frontend       # Build frontend only

# Or run from package directory
cd packages/backend && npm run dev
cd packages/frontend && npm run dev
```

## 🎯 Package Details

### Backend (`@ai-agent-poc/backend`)

**Purpose:** AI agent system with database query capabilities

**Key Features:**
- Model Context Protocol (MCP) integration
- AI SDK with OpenAI-compatible endpoints
- PostgreSQL query tools with retry logic
- Context-aware conversations
- CLI interface (currently)
- TypeScript with full type safety

**Dependencies:**
- `@ai-sdk/openai` - AI SDK integration
- `@modelcontextprotocol/sdk` - MCP protocol
- `ai` - Vercel AI SDK
- `pg` - PostgreSQL client
- `zod` - Schema validation
- `dotenv` - Environment variables

**Development:**
```bash
npm run dev --workspace=packages/backend
# or
cd packages/backend && npm run dev
```

### Frontend (`@ai-agent-poc/frontend`)

**Purpose:** React UI for interacting with the AI agent

**Key Features:**
- React 19 with TypeScript
- Vite for fast development
- Modern ESLint configuration
- Hot module replacement (HMR)
- Production-ready builds

**Dependencies:**
- `react` 19.2.0 - UI library
- `react-dom` 19.2.0 - DOM rendering
- `vite` 7.2.2 - Build tool
- `typescript` 5.9.3 - Type checking
- `@vitejs/plugin-react` - React support

**Development:**
```bash
npm run dev --workspace=packages/frontend
# or
cd packages/frontend && npm run dev
```

**Dev Server:** http://localhost:5173

## 🔧 Configuration

### Environment Variables

Create `.env` in the project root:

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

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=testdb
POSTGRES_USER=testuser
POSTGRES_PASSWORD=testpass
POSTGRES_SSL=false
POSTGRES_MAX_RETRIES=3
```

### TypeScript Configuration

Each package has its own `tsconfig.json`:
- **Backend:** CommonJS modules, Node.js target
- **Frontend:** ES modules, modern browser target

## 🐳 Docker Setup

PostgreSQL test database with sample e-commerce data:

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Reset
docker compose down -v && docker compose up -d
```

## 📦 Dependency Management

### Adding Dependencies

```bash
# Backend dependency
npm install <package> --workspace=packages/backend

# Frontend dependency
npm install <package> --workspace=packages/frontend

# Dev dependency for backend
npm install -D <package> --workspace=packages/backend

# Root dev dependency
npm install -D <package> -w root
```

### Updating Dependencies

```bash
# Update all
npm update

# Update specific package
npm update <package> --workspace=packages/backend
```

## 🚀 Build Process

### Backend Build
1. TypeScript compilation (`tsc`)
2. Outputs to `dist/` directory
3. Generates `.d.ts` type definitions
4. Creates source maps

### Frontend Build
1. TypeScript compilation
2. Vite production build
3. Asset optimization
4. Output to `dist/` directory
5. Ready for deployment

## 📊 Current State

### ✅ Complete
- [x] Monorepo structure created
- [x] Backend moved to packages/backend
- [x] Frontend initialized with Vite + React + TypeScript
- [x] Workspace configuration
- [x] Dependencies installed
- [x] Both packages build successfully
- [x] Environment configuration updated
- [x] Documentation created

### 🚧 To Do (See NEXT_STEPS.md)
- [ ] Backend REST API or WebSocket server
- [ ] Frontend chat UI components
- [ ] API integration
- [ ] State management
- [ ] Styling and UX
- [ ] Advanced features

## 🔗 Important Files

| File | Purpose |
|------|---------|
| `package.json` | Root workspace configuration |
| `.env` | Environment variables (create from `.env.example`) |
| `docker-compose.yml` | PostgreSQL test database |
| `packages/backend/src/index.ts` | Backend CLI entry point |
| `packages/backend/src/config.ts` | Environment configuration |
| `packages/frontend/src/main.tsx` | Frontend entry point |
| `packages/frontend/src/App.tsx` | Main React component |
| `NEXT_STEPS.md` | Implementation roadmap |

## 🎓 Learning Resources

- [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [Vite documentation](https://vite.dev/guide/)
- [React documentation](https://react.dev/)
- [TypeScript handbook](https://www.typescriptlang.org/docs/)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

