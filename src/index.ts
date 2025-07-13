import { MCPAgent } from './mcp-agent';
import { weatherTool, calculatorTool, fileSearchTool, fileReadTool, cwdTool } from './tools';
import { getFullAgentConfig, printConfig } from './config';
import * as readline from 'readline';

// Interactive MCP Agent system
async function main() {
    // Print configuration from environment variables
    printConfig();

    // Create an agent instance using environment configuration
    const agent = new MCPAgent(getFullAgentConfig());

    // Register tools
    agent.addTool(weatherTool);
    agent.addTool(calculatorTool);
    agent.addTool(fileSearchTool);
    agent.addTool(fileReadTool);
    agent.addTool(cwdTool);

    console.log('\n🤖 MCP Agent System initialized');
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
    console.log('  /clear   - Clear the console');
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
async function handleCommand(command: string, agent: MCPAgent, rl: readline.Interface) {
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
            console.log('  "What\'s the weather in New York and calculate 15 * 3?"');
            console.log('  "Find all TypeScript files in the current directory"');
            console.log('  "Get the current working directory and read package.json"');
            console.log('  "Calculate (25 + 75) / 2"');
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

        case '/clear':
            console.clear();
            console.log('🤖 MCP Agent System - Console cleared');
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
export { MCPAgent } from './mcp-agent';
export { LLMClient } from './llm-client';
export { ToolRegistry, createTool, createSimpleTool } from './tool-system';
export { MCPServer } from './mcp-server';
export { getLLMConfig, getAgentConfig, getFullAgentConfig, printConfig, validateEnvironment } from './config';
export * from './types';
export * from './tools';
