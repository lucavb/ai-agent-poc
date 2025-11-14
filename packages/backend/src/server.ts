import { AISdkAgent } from './ai-sdk-agent';
import {
    calculatorTool,
    postgresSchemaTool,
    postgresQueryTool,
    contextTool,
} from './tools';
import { getFullAgentConfig, printConfig } from './config';
import { startApiServer } from './api/server';

/**
 * API Server Entry Point
 * Starts the REST API server for the AI Agent
 */
async function main() {
    console.log('🤖 Starting AI Agent API Server...\n');

    // Print configuration
    printConfig();

    // Create agent instance
    const agent = new AISdkAgent(getFullAgentConfig());

    // Register tools
    console.log('\n🔧 Registering tools...');
    agent.addTool(contextTool); // Context tool first for early analysis
    agent.addTool(calculatorTool);
    agent.addTool(postgresSchemaTool);
    agent.addTool(postgresQueryTool);

    console.log(
        '✅ Registered tools:',
        agent
            .getTools()
            .map((t) => t.name)
            .join(', ')
    );

    // Get API configuration from environment or use defaults
    const apiConfig = {
        port: parseInt(process.env.API_PORT || '3001', 10),
        host: process.env.API_HOST || 'localhost',
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    };

    // Start the API server
    try {
        await startApiServer(agent, apiConfig);
    } catch (error) {
        console.error('❌ Failed to start API server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down API server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n👋 Shutting down API server...');
    process.exit(0);
});

// Run the server
if (require.main === module) {
    main().catch((error) => {
        console.error('❌ Error starting API server:', error);
        process.exit(1);
    });
}

// Export for programmatic use
export { main as startServer };

