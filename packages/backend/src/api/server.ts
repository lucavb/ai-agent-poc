import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { AISdkAgent } from '../ai-sdk-agent';
import { ChatController } from './controllers/ChatController';
import { ToolsController } from './controllers/ToolsController';
import { ContextController } from './controllers/ContextController';
import { HealthController } from './controllers/HealthController';
import { createChatRoutes } from './routes/chat.routes';
import { createToolsRoutes } from './routes/tools.routes';
import { createContextRoutes } from './routes/context.routes';
import { createHealthRoutes } from './routes/health.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

/**
 * API Server Configuration
 */
export interface ApiServerConfig {
    port: number;
    host: string;
    corsOrigin: string | string[];
}

/**
 * Create and configure Express application
 */
export function createApiServer(agent: AISdkAgent, config: ApiServerConfig): Express {
    const app = express();

    // Security middleware
    app.use(helmet());

    // CORS configuration
    app.use(
        cors({
            origin: config.corsOrigin,
            credentials: true,
            methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        })
    );

    // Body parsing middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Compression middleware
    app.use(compression());

    // Request logging middleware
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });

    // Initialize controllers
    const chatController = new ChatController(agent);
    const toolsController = new ToolsController(agent);
    const contextController = new ContextController();
    const healthController = new HealthController();

    // Register routes
    app.use('/api/chat', createChatRoutes(chatController));
    app.use('/api/tools', createToolsRoutes(toolsController));
    app.use('/api/context', createContextRoutes(contextController));
    app.use('/health', createHealthRoutes(healthController));

    // Root endpoint
    app.get('/', (req, res) => {
        res.json({
            name: 'AI Agent API',
            version: '1.0.0',
            status: 'running',
            endpoints: {
                chat: 'POST /api/chat',
                tools: 'GET /api/tools',
                context: 'GET /api/context, DELETE /api/context',
                health: 'GET /health',
            },
        });
    });

    // 404 handler
    app.use(notFoundHandler);

    // Error handler (must be last)
    app.use(errorHandler);

    return app;
}

/**
 * Start the API server
 */
export function startApiServer(
    agent: AISdkAgent,
    config: ApiServerConfig
): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            const app = createApiServer(agent, config);

            app.listen(config.port, config.host, () => {
                console.log('\n🚀 API Server Started');
                console.log(`   URL: http://${config.host}:${config.port}`);
                console.log('\n📡 Available Endpoints:');
                console.log(`   POST   http://${config.host}:${config.port}/api/chat`);
                console.log(`   GET    http://${config.host}:${config.port}/api/tools`);
                console.log(`   GET    http://${config.host}:${config.port}/api/context`);
                console.log(`   DELETE http://${config.host}:${config.port}/api/context`);
                console.log(`   GET    http://${config.host}:${config.port}/health`);
                console.log('\n✨ Ready to accept requests!\n');
                resolve();
            });
        } catch (error) {
            reject(error);
        }
    });
}

