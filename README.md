# MCP Agent System

A TypeScript agent system using the Model Context Protocol (MCP) SDK that demonstrates advanced agent architecture with iteration loops, tool integration, and LLM reasoning.

## 🚀 Features

- **Agent with Iteration Loop**: Multi-step reasoning with configurable iteration limits
- **MCP Integration**: Standardized tool registration and execution using MCP SDK
- **LLM Integration**: Compatible with OpenAI-compatible endpoints (local or remote)
- **Tool System**: Flexible tool registration with Zod schema validation
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Error Handling**: Graceful error handling and recovery mechanisms
- **Debugging**: Built-in debug mode with detailed reasoning trails

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd mcp-agent-system

# Install dependencies
npm install

# Copy the example environment file and configure
cp env.example .env
# Edit .env file with your settings

# Build the project
npm run build

# Run the interactive agent
npm start
```

## 🛠️ Core Components

### Environment Configuration

The system uses Zod for environment variable validation and parsing. Create a `.env` file:

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

# Optional LLM Settings
OPENAI_MAX_TOKENS=4096
OPENAI_TEMPERATURE=0.7
OPENAI_TIMEOUT=30000
```

### MCPAgent Class

The main agent class that manages the iteration loop and tool execution:

```typescript
import { getFullAgentConfig } from './config';

// Use environment configuration
const agent = new MCPAgent(getFullAgentConfig());

// Or customize specific values
const customAgent = new MCPAgent({
    ...getFullAgentConfig(),
    maxIterations: 5,
    debug: false,
});
```

### Tool Registration

Tools are registered using Zod schemas for type-safe parameter validation:

```typescript
import { z } from 'zod';
import { createTool } from './tool-system';

const myTool = createTool(
    'tool_name',
    'Tool description',
    z.object({
        param1: z.string(),
        param2: z.number().optional(),
    }),
    async (input) => {
        // Tool implementation
        return { result: 'success' };
    },
);

agent.addTool(myTool);
```

### LLM Client

Handles communication with OpenAI-compatible endpoints:

```typescript
const llmClient = new LLMClient({
    baseURL: 'http://localhost:1234/v1',
    apiKey: 'your-api-key',
    model: 'model-name',
    maxTokens: 4096,
    temperature: 0.7,
});
```

## 🔧 Available Tools

### Calculator Tool

Performs safe mathematical calculations:

```typescript
agent.addTool(calculatorTool);

// Usage: "Calculate 15 * 3 + 27"
```

### PostgreSQL Schema Tool

Connects to PostgreSQL database and fetches complete schema information:

```typescript
agent.addTool(postgresSchemaTool);

// Usage: "Get database schema" (uses .env configuration)
// Or: "Get database schema from PostgreSQL server myhost database mydb with username admin and password secret"
```

### PostgreSQL Query Tool

Executes SELECT statements with automatic retry and error correction:

```typescript
agent.addTool(postgresQueryTool);

// Usage: "Select all users from the database"
// Or: "Query: SELECT * FROM products WHERE price > 100"
```

### Context Analysis Tool

Analyzes queries for context references and provides tool selection guidance:

```typescript
agent.addTool(contextTool);

// Usage: Used automatically for early-stage query analysis
// Helps the AI understand: "summarize these orders" → database query with context
```

## 🧠 Context-Aware Conversations

The system now maintains conversation context to enable natural follow-up questions using a **two-stage approach**:

### Architecture
1. **Context Analysis Tool** - Used first to understand query intent and references
2. **Specialized Tools** - Selected based on context analysis guidance

### Context Features
- **Early Tool Selection**: Context analysis happens BEFORE tool selection
- **Reference Resolution**: Resolves "these orders", "his orders", "summarize them" 
- **Intent Analysis**: Determines if query is database, calculation, or other type
- **Entity Tracking**: Remembers users, tables, and query results from previous interactions
- **Tool Guidance**: Provides recommendations for which tools to use next

### Example Multi-Turn Conversation
```
> How many orders does user johndoe have?
→ Step 1: Context Tool analyzes intent (database query) and stores user entity
→ Step 2: AI selects postgres_query tool based on context guidance
→ Step 3: Query executes and stores results in context
→ Result: 3 orders

> Summarize these orders
→ Step 1: Context Tool detects reference, resolves to "orders for user johndoe" 
→ Step 2: Context Tool recommends postgres_query tool with high confidence
→ Step 3: AI understands this is a database query about previous results
→ Step 4: Query executed with context-enhanced understanding
→ Result: Summary of johndoe's specific orders
```

## 🐳 Docker Test Environment

For testing the PostgreSQL tool, a Docker Compose setup is provided with a pre-configured PostgreSQL database containing sample data.

### Starting the Test Database

```bash
# Start PostgreSQL with sample data
docker compose up -d

# Check if database is ready
docker compose logs postgres

# Stop the database
docker compose down

# Stop and remove all data
docker compose down -v
```

### Test Database Connection Details

- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `testdb`
- **Username**: `testuser`
- **Password**: `testpass`
- **Max Retries**: `3` (configurable via `POSTGRES_MAX_RETRIES`)

### Sample Test Queries

Once the database is running, you can test the PostgreSQL tool:

**Schema queries:**
```
> Get database schema
> Show me the PostgreSQL schema
```

**Data queries (with automatic retry on errors):**
```
> Select all users from the database
> Query: SELECT name, price FROM products WHERE price > 100
> SELECT u.username, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.username
```

**Context-aware follow-up queries:**
```
> How many orders does user johndoe have?
> Show me these orders
> Summarize them
> What products did he order?
```

**With custom connection parameters:**
```
> Get database schema from PostgreSQL server localhost port 5432 database testdb with username testuser and password testpass
```

The test database includes:
- 7 tables with realistic e-commerce data
- Various PostgreSQL data types (SERIAL, VARCHAR, TEXT, DECIMAL, BOOLEAN, TIMESTAMP, UUID, INET)
- Foreign key relationships and indexes
- Sample data for users, products, orders, and reviews

See [fixtures/README.md](fixtures/README.md) for detailed information about the test database structure.

## 🎯 Usage

### Interactive Mode

The system runs in interactive mode by default. Simply start it and enter your queries:

```bash
npm start
```

You'll see an interactive prompt where you can:

- Enter natural language queries
- Use special commands (type `/help` for details)
- Get real-time responses from the agent

### Special Commands

- `/help` - Show available commands and example queries
- `/tools` - List all available tools and their descriptions
- `/config` - Display current configuration
- `/clear` - Clear the console
- `/exit` - Exit the application

### Example Queries

```
> Calculate 15 * 3
> What is (25 + 75) / 2?
> Perform the calculation: 100 - 42 + 8
> Get database schema from PostgreSQL server localhost database testdb
> Connect to postgres://localhost:5432/testdb with username testuser and password testpass to get schema
```

### Programmatic Usage

You can also use the agent programmatically:

```typescript
import { MCPAgent } from './src/mcp-agent';
import { calculatorTool, postgresSchemaTool } from './src/tools';
import { getFullAgentConfig } from './src/config';

// Create agent with environment configuration
const agent = new MCPAgent(getFullAgentConfig());

// Register tools
agent.addTool(calculatorTool);
agent.addTool(postgresSchemaTool);

// Process a query
const result = await agent.processQuery("Calculate 25 + 75");
console.log(result.response);

// Get database schema
const schemaResult = await agent.processQuery("Get schema from PostgreSQL server localhost port 5432 database testdb with username testuser and password testpass");
console.log(schemaResult.response);
```

### Multi-step Reasoning

The agent can handle complex queries requiring multiple tool calls. Just enter a complex query and watch it work:

```
> Get the current directory, find all TypeScript files, read the package.json, and get the weather in London

📝 Processing: Get the current directory, find all TypeScript files, read the package.json, and get the weather in London
============================================================

📊 Results:
✅ Success: true
🔄 Iterations: 3
✨ Completed: true
🔧 Tool calls: 4
  1. get_cwd({})
  2. search_files({"pattern":"*.ts"})
  3. read_file({"filePath":"package.json"})
  4. get_weather({"city":"London"})

🎯 Response:
I've gathered all the requested information:

**Current Directory:** /Users/username/mcp-agent-system

**TypeScript Files Found:** 8 files including src/types.ts, src/mcp-agent.ts, src/llm-client.ts...

**Package.json Info:** This is an MCP Agent System v1.0.0 with dependencies including @modelcontextprotocol/sdk...

**London Weather:** Currently 15°C, rainy conditions with 80% humidity...
```

## 🔍 Agent State and Debugging

The agent maintains detailed state information:

```typescript
const state = agent.getState();
console.log({
    iterations: state.iterations,
    completed: state.completed,
    reasoning: state.reasoning,
    toolCalls: state.toolCalls,
});
```

Enable debug mode for detailed logging:

```typescript
const agent = new MCPAgent({
    // ... other config
    debug: true,
});
```

## 🌐 MCP Server Integration

The system includes MCP server capabilities:

```typescript
// Initialize MCP server
await agent.initializeMCPServer();

// Get MCP server instance
const mcpServer = agent.getMCPServer();
```

## 📊 Agent Results

The agent returns comprehensive results:

```typescript
interface AgentResult {
    success: boolean;
    completed: boolean;
    iterations: number;
    response: string;
    reasoning: string[];
    toolCalls: ToolCall[];
    error?: string;
}
```

## 🔒 Error Handling

The system includes robust error handling:

- **Tool Errors**: Individual tool failures don't stop the agent
- **LLM Errors**: Network and API errors are handled gracefully
- **Validation Errors**: Zod schema validation provides clear error messages
- **Iteration Limits**: Prevents infinite loops with configurable limits

## 🎨 Creating Custom Tools

```typescript
import { z } from 'zod';
import { createTool } from './src/tool-system';

// Define input schema
const MyToolSchema = z.object({
    text: z.string().min(1),
    count: z.number().positive().optional().default(1),
});

// Create tool
const myCustomTool = createTool('my_custom_tool', 'Description of what this tool does', MyToolSchema, async (input) => {
    // Tool implementation
    const { text, count } = input;
    return {
        result: text.repeat(count),
        processed: true,
    };
});

// Register with agent
agent.addTool(myCustomTool);
```

## 🔧 Configuration Options

### Agent Configuration

```typescript
interface AgentConfig {
    name: string;
    version: string;
    llmConfig: LLMConfig;
    maxIterations?: number; // Default: 8
    debug?: boolean; // Default: false
}
```

### LLM Configuration

```typescript
interface LLMConfig {
    baseURL: string;
    apiKey: string;
    model: string;
    maxTokens?: number; // Default: 4096
    temperature?: number; // Default: 0.7
    timeout?: number; // Default: 30000ms
}
```

## 📈 Performance Considerations

- **Tool Execution**: Tools run in parallel when possible
- **Memory Management**: Conversation history is maintained efficiently
- **Error Recovery**: Failed tools don't prevent other tools from executing
- **Timeout Handling**: Configurable timeouts prevent hanging requests

## 🧪 Testing

```bash
# Run tests
npm test

# Run with custom environment variables
OPENAI_BASE_URL=http://localhost:1234/v1 OPENAI_MODEL=your-model npm start

# Or modify your .env file and run normally
npm start
```

## 📝 Development

### Project Structure

```
src/
├── types.ts           # TypeScript type definitions
├── llm-client.ts      # LLM communication
├── tool-system.ts     # Tool registration and execution
├── mcp-server.ts      # MCP server implementation
├── mcp-agent.ts       # Main agent class
├── config.ts          # Environment configuration with Zod
├── tools/             # Example tools
│   ├── weather-tool.ts
│   ├── calculator-tool.ts
│   ├── file-search-tool.ts
│   ├── file-read-tool.ts
│   ├── cwd-tool.ts
│   └── index.ts
└── index.ts           # Usage examples
```

### Building and Running

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Run built version
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- Uses [Zod](https://github.com/colinhacks/zod) for schema validation
- Compatible with OpenAI-compatible LLM endpoints
