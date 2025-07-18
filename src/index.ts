import { AISdkAgent } from './ai-sdk-agent';
import { 
    calculatorTool,
    postgresSchemaTool,
    postgresQueryTool,
    contextTool
} from './tools';
import { getFullAgentConfig, printConfig } from './config';
import { contextManager } from './context-manager';
import * as readline from 'readline';

// CLI options interface
interface CliOptions {
    verbose: boolean;
    help: boolean;
}

// Parse command line arguments
function parseArgs(): CliOptions {
    const args = process.argv.slice(2);
    const options: CliOptions = {
        verbose: false,
        help: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
            default:
                console.error(`❌ Unknown option: ${arg}`);
                console.error('Use --help to see available options');
                process.exit(1);
        }
    }

    return options;
}

// Show help message
function showHelp(): void {
    console.log('🤖 AI SDK Agent System');
    console.log('');
    console.log('Usage: npm start [options]');
    console.log('   or: node dist/index.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  -v, --verbose    Enable verbose mode (shows SQL queries before execution)');
    console.log('  -h, --help       Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  npm start');
    console.log('  npm start --verbose');
    console.log('  node dist/index.js --verbose');
}

// Interactive AI SDK Agent system
async function main() {
    // Parse CLI arguments
    const cliOptions = parseArgs();

    // Show help if requested
    if (cliOptions.help) {
        showHelp();
        return;
    }

    // Print configuration from environment variables
    printConfig();

    // Show verbose mode status
    if (cliOptions.verbose) {
        console.log('🔍 Verbose mode: ENABLED (SQL queries will be displayed)');
    }

    // Create an agent instance using environment configuration
    const agent = new AISdkAgent(getFullAgentConfig());

    // Register tools with verbose option
    agent.addTool(contextTool);  // Context tool first for early analysis
    agent.addTool(calculatorTool);
    agent.addTool(postgresSchemaTool);
    agent.addTool(postgresQueryTool);

    // Store verbose option globally for tools to access
    (global as any).__POSTGRES_VERBOSE__ = cliOptions.verbose;

    console.log('\n🤖 AI SDK Agent System initialized');
    console.log(
        '📦 Available tools:',
        agent
            .getTools()
            .map((t) => t.name)
            .join(', '),
    );
    console.log('\n📝 Commands:');
                console.log('  /help    - Show this help message');
            console.log('  /tools   - List available tools');
            console.log('  /config  - Show current configuration');
            console.log('  /context - Show conversation context summary');
            console.log('  /clear   - Clear the console');
            console.log('  /reset   - Clear conversation context');
            console.log('  /exit    - Exit the application');
    console.log('\n💬 Enter your query or command:');

    // Create readline interface
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '> ',
    });

    rl.prompt();

    rl.on('line', async (input) => {
        const query = input.trim();

        if (!query) {
            rl.prompt();
            return;
        }

        // Handle special commands
        if (query.startsWith('/')) {
            await handleCommand(query, agent, rl);
            rl.prompt();
            return;
        }

        // Process user query
        console.log('\n' + '='.repeat(60));
        console.log(`📝 Processing: ${query}`);
        console.log('='.repeat(60));

        try {
            const result = await agent.processQuery(query);

            console.log('\n📊 Results:');
            console.log(`✅ Success: ${result.success}`);
            console.log(`🔄 Iterations: ${result.iterations}`);
            console.log(`✨ Completed: ${result.completed}`);

            if (result.toolCalls.length > 0) {
                console.log(`🔧 Tool calls: ${result.toolCalls.length}`);
                result.toolCalls.forEach((call, i) => {
                    console.log(`  ${i + 1}. ${call.function.name}(${call.function.arguments})`);
                });
            }

            if (agent.getConfig().debug) {
                console.log('\n🤔 Reasoning trail:');
                result.reasoning.forEach((step, i) => {
                    console.log(`  ${i + 1}. ${step}`);
                });
            }

            console.log('\n🎯 Response:');
            console.log(result.response);

            if (result.error) {
                console.log(`\n❌ Error: ${result.error}`);
            }
        } catch (error) {
            console.error(`\n❌ Failed to process query: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        console.log('\n' + '='.repeat(60));
        rl.prompt();
    });

    rl.on('close', () => {
        console.log('\n👋 Goodbye!');
        process.exit(0);
    });
}

// Handle special commands
async function handleCommand(command: string, agent: AISdkAgent, rl: readline.Interface) {
    const cmd = command.toLowerCase();

    switch (cmd) {
        case '/help':
            console.log('\n📝 Available Commands:');
            console.log('  /help    - Show this help message');
            console.log('  /tools   - List available tools and their descriptions');
            console.log('  /config  - Show current configuration');
            console.log('  /clear   - Clear the console');
            console.log('  /exit    - Exit the application');
            console.log('\n💡 Example queries:');
            console.log('  "Calculate 15 * 3"');
            console.log('  "What is (25 + 75) / 2?"');
            console.log('  "Perform the calculation: 100 - 42 + 8"');
            console.log('  "Get database schema"');
            console.log('  "Show me the PostgreSQL schema"');
            console.log('  "Select all users from the database"');
            console.log('  "Query: SELECT * FROM products WHERE price > 100"');
            console.log('  "How many orders does user john have?"');
            console.log('  "Summarize these orders" (uses context analysis first)');
            break;

        case '/tools':
            console.log('\n🔧 Available Tools:');
            agent.getTools().forEach((tool) => {
                console.log(`  • ${tool.name}: ${tool.description}`);
            });
            break;

        case '/config':
            console.log('\n⚙️  Current Configuration:');
            printConfig();
            console.log(`Debug Mode: ${agent.getConfig().debug}`);
            console.log(`Max Iterations: ${agent.getConfig().maxIterations}`);
            break;

        case '/context':
            console.log('\n🧠 Conversation Context:');
            const summary = contextManager.getContextSummary();
            console.log(`Total contexts: ${summary.totalContexts}`);
            console.log('Recent contexts:');
            summary.recentContexts.forEach((ctx, i) => {
                console.log(`  ${i + 1}. ${ctx}`);
            });
            if (summary.totalContexts === 0) {
                console.log('  No conversation context yet. Ask some questions to build context!');
            }
            break;

        case '/clear':
            console.clear();
            console.log('🤖 MCP Agent System - Console cleared');
            break;

        case '/reset':
            contextManager.clearContext();
            console.log('\n🔄 Conversation context cleared');
            break;

        case '/exit':
            console.log('\n👋 Goodbye!');
            rl.close();
            break;

        default:
            console.log(`\n❓ Unknown command: ${command}`);
            console.log('Type /help for available commands');
            break;
    }
}

// Run interactive agent
if (require.main === module) {
    main().catch((error) => {
        console.error('❌ Error starting MCP Agent:', error);
        process.exit(1);
    });
}

// Export main components for use in other modules
export { AISdkAgent } from './ai-sdk-agent';
export { LLMClient } from './llm-client';
export { ToolRegistry, createTool, createSimpleTool } from './tool-system';
export { MCPServer } from './mcp-server';
export { getLLMConfig, getAgentConfig, getFullAgentConfig, printConfig, validateEnvironment } from './config';
export { contextManager, ConversationContextManager } from './context-manager';
export * from './types';
export * from './tools';
