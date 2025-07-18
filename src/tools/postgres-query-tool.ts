import { z } from 'zod';
import { Client } from 'pg';
import { createAiSdkTool } from '../ai-sdk-tool-system';
import { getPostgresConfig } from '../config';

// Schema for SQL query execution (SELECT statements only)
const sqlQuerySchema = z.object({
    query: z.string().describe('SQL SELECT statement to execute against the database')
});

// Function to execute SELECT queries safely
async function executeSqlQuery(params: z.infer<typeof sqlQuerySchema>) {
    // Validate that the query is a SELECT statement for security
    const trimmedQuery = params.query.trim().toLowerCase();
    if (!trimmedQuery.startsWith('select')) {
        throw new Error('Only SELECT statements are allowed for security reasons');
    }

    // Use the same database configuration as the schema tool
    const config = getPostgresConfig();
    const client = new Client({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        ssl: config.ssl
    });

    try {
        await client.connect();
        
        const result = await client.query(params.query);
        
        return {
            success: true,
            database: config.database,
            query: params.query,
            row_count: result.rowCount || 0,
            column_count: result.fields?.length || 0,
            columns: result.fields?.map(field => field.name) || [],
            rows: result.rows
        };

    } catch (error) {
        throw new Error(`Query execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        await client.end();
    }
}

export const postgresQueryTool = createAiSdkTool(
    'postgres_query',
    'Execute SELECT statements against the PostgreSQL database and return the results. Only SELECT queries are allowed for security.',
    sqlQuerySchema,
    executeSqlQuery
); 