import { z } from 'zod';
import { Client } from 'pg';
import { createAiSdkTool } from '../ai-sdk-tool-system';
import { getDatabaseConfig, getAvailableDatabaseNames } from '../config';
import { contextManager } from '../context-manager';

// Dynamically create schema based on available databases
function createPostgresConnectionSchema() {
    const availableDatabases = getAvailableDatabaseNames();
    if (availableDatabases.length === 0) {
        throw new Error('No databases are configured. Please configure at least one database in environment variables.');
    }
    
    // Ensure enum has at least one element for TypeScript
    const enumValues: [string, ...string[]] = availableDatabases.length > 0
        ? availableDatabases as [string, ...string[]]
        : ['core-service'];
    
    return z.object({
        database_source: z.enum(enumValues).optional().default('core-service').describe(
            `Which database to use. Available databases: ${availableDatabases.join(', ')}. Defaults to 'core-service'. All databases are equivalent.`
        ),
        host: z.string().optional().describe('PostgreSQL server hostname or IP address (overrides environment variable)'),
        port: z.number().optional().describe('PostgreSQL server port (overrides environment variable)'),
        database: z.string().optional().describe('Database name to connect to (overrides environment variable)'),
        username: z.string().optional().describe('Username for database authentication (overrides environment variable)'),
        password: z.string().optional().describe('Password for database authentication (overrides environment variable)'),
        ssl: z.boolean().optional().describe('Whether to use SSL connection (overrides environment variable)')
    });
}

// Create schema instance
const postgresConnectionSchema = createPostgresConnectionSchema();

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
    // Get configuration for the specified database source
    const envConfig = getDatabaseConfig(params.database_source);
    
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

        // Print query if verbose mode is enabled
        if ((global as any).__POSTGRES_VERBOSE__) {
            console.log('🐘 [POSTGRES VERBOSE] Executing schema query:');
            console.log(schemaQuery.trim());
            console.log('');
        }

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
        
        // Store schema context for future reference
        const contextId = contextManager.addContext({
            originalQuery: 'Get database schema',
            queryType: 'schema',
            results: {
                tables: tablesList,
                total_tables: tablesList.length
            },
            entities: {
                tables: tablesList.map((table: any) => table.table_name)
            },
            metadata: {
                rowCount: tablesList.length,
                affectedTables: tablesList.map((table: any) => table.table_name),
                keyFindings: [`Found ${tablesList.length} tables in database`]
            }
        });
        
        return {
            success: true,
            database: config.database,
            database_source: params.database_source,
            host: config.host,
            context_id: contextId,
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
    `Connect to PostgreSQL database and fetch complete schema information including all tables and their columns. Use database_source parameter to specify which database to query. Available databases are dynamically discovered from environment variables. All databases are equivalent. Uses environment variables for connection if no parameters provided.`,
    postgresConnectionSchema,
    getDatabaseSchema
); 