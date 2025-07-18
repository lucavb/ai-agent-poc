import { z } from 'zod';
import { Client } from 'pg';
import { createAiSdkTool } from '../ai-sdk-tool-system';
import { getPostgresConfig } from '../config';

// Schema for PostgreSQL connection parameters (all optional, will use env vars as defaults)
const postgresConnectionSchema = z.object({
    host: z.string().optional().describe('PostgreSQL server hostname or IP address (uses POSTGRES_HOST from env)'),
    port: z.number().optional().describe('PostgreSQL server port (uses POSTGRES_PORT from env)'),
    database: z.string().optional().describe('Database name to connect to (uses POSTGRES_DB from env)'),
    username: z.string().optional().describe('Username for database authentication (uses POSTGRES_USER from env)'),
    password: z.string().optional().describe('Password for database authentication (uses POSTGRES_PASSWORD from env)'),
    ssl: z.boolean().optional().describe('Whether to use SSL connection (uses POSTGRES_SSL from env)')
});

// Schema for table information
const tableInfoSchema = z.object({
    table_name: z.string(),
    table_schema: z.string(),
    table_type: z.string(),
    columns: z.array(z.object({
        column_name: z.string(),
        data_type: z.string(),
        is_nullable: z.string(),
        column_default: z.string().nullable(),
        character_maximum_length: z.number().nullable(),
        numeric_precision: z.number().nullable(),
        numeric_scale: z.number().nullable()
    }))
});

// Main function to get database schema
async function getDatabaseSchema(params: z.infer<typeof postgresConnectionSchema>) {
    // Get configuration from environment variables
    const envConfig = getPostgresConfig();
    
    // Use provided parameters or fall back to environment configuration
    const config = {
        host: params.host ?? envConfig.host,
        port: params.port ?? envConfig.port,
        database: params.database ?? envConfig.database,
        user: params.username ?? envConfig.username,
        password: params.password ?? envConfig.password,
        ssl: params.ssl ?? envConfig.ssl
    };

    const client = new Client(config);

    try {
        await client.connect();
        
        // Query to get all tables and their columns
        const schemaQuery = `
            SELECT 
                t.table_name,
                t.table_schema,
                t.table_type,
                c.column_name,
                c.data_type,
                c.is_nullable,
                c.column_default,
                c.character_maximum_length,
                c.numeric_precision,
                c.numeric_scale
            FROM information_schema.tables t
            LEFT JOIN information_schema.columns c ON t.table_name = c.table_name 
                AND t.table_schema = c.table_schema
            WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
            ORDER BY t.table_schema, t.table_name, c.ordinal_position;
        `;

        const result = await client.query(schemaQuery);
        
        // Group results by table
        const tables: Record<string, any> = {};
        
        for (const row of result.rows) {
            const tableKey = `${row.table_schema}.${row.table_name}`;
            
            if (!tables[tableKey]) {
                tables[tableKey] = {
                    table_name: row.table_name,
                    table_schema: row.table_schema,
                    table_type: row.table_type,
                    columns: []
                };
            }
            
            if (row.column_name) {
                tables[tableKey].columns.push({
                    column_name: row.column_name,
                    data_type: row.data_type,
                    is_nullable: row.is_nullable,
                    column_default: row.column_default,
                    character_maximum_length: row.character_maximum_length,
                    numeric_precision: row.numeric_precision,
                    numeric_scale: row.numeric_scale
                });
            }
        }

        const tablesList = Object.values(tables);
        
        return {
            success: true,
            database: config.database,
            host: config.host,
            total_tables: tablesList.length,
            tables: tablesList
        };

    } catch (error) {
        throw new Error(`Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        await client.end();
    }
}

export const postgresSchemaTool = createAiSdkTool(
    'postgres_schema',
    'Connect to PostgreSQL database and fetch complete schema information including all tables and their columns. Uses environment variables for connection if no parameters provided.',
    postgresConnectionSchema,
    getDatabaseSchema
); 