import { Request, Response } from 'express';
import { HealthResponse } from '../types';
import { Pool } from 'pg';
import { getPostgresConfig } from '../../config';

/**
 * Health Controller
 * Handles health check endpoints
 */
export class HealthController {
    private startTime: number;

    constructor() {
        this.startTime = Date.now();
    }

    /**
     * GET /api/health
     * Get system health status
     */
    async getHealth(req: Request, res: Response): Promise<void> {
        try {
            // Check database connection
            let databaseStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
            
            try {
                const pgConfig = getPostgresConfig();
                const pool = new Pool({
                    host: pgConfig.host,
                    port: pgConfig.port,
                    database: pgConfig.database,
                    user: pgConfig.username,
                    password: pgConfig.password,
                    ssl: pgConfig.ssl ? { rejectUnauthorized: false } : false,
                    connectionTimeoutMillis: 3000,
                });

                const client = await pool.connect();
                await client.query('SELECT 1');
                client.release();
                await pool.end();
                
                databaseStatus = 'connected';
            } catch (error) {
                console.error('Database health check failed:', error);
                databaseStatus = 'error';
            }

            // Check LLM availability (basic check)
            const llmStatus: 'available' | 'unavailable' = 'available'; // Assume available for now

            // Calculate uptime
            const uptime = Math.floor((Date.now() - this.startTime) / 1000);

            const response: HealthResponse = {
                status: databaseStatus === 'connected' ? 'healthy' : 'unhealthy',
                services: {
                    database: databaseStatus,
                    llm: llmStatus,
                },
                uptime,
                timestamp: new Date().toISOString(),
            };

            const statusCode = response.status === 'healthy' ? 200 : 503;
            res.status(statusCode).json(response);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.name : 'Unknown Error',
                message: error instanceof Error ? error.message : 'Health check failed',
            });
        }
    }
}

