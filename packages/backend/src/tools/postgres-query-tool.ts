import { z } from 'zod';
import { Client } from 'pg';
import { createAiSdkTool } from '../ai-sdk-tool-system';
import { getDatabaseConfig, getAvailableDatabaseNames, getAllDatabaseConfigs, PostgresConfig } from '../config';
import { contextManager } from '../context-manager';

// Dynamically create schema based on available databases
function createSqlQuerySchema() {
    const availableDatabases = getAvailableDatabaseNames();
    if (availableDatabases.length === 0) {
        throw new Error('No databases are configured. Please configure at least one database in environment variables.');
    }
    
    const dbExamples = availableDatabases.slice(0, 2).join('" or "');
    const dbPrefixExamples = availableDatabases.slice(0, 2).map(db => `${db}:`).join(' and ');
    
    // Create enum values array - ensure it has at least one element for TypeScript
    const enumValues: [string, ...string[]] = (() => {
        if (availableDatabases.length === 0) {
            return ['both'];
        }
        // TypeScript-safe: we know availableDatabases[0] exists
        const first = availableDatabases[0];
        const rest = availableDatabases.slice(1);
        return [first, ...rest, 'both'];
    })();
    
    return z.object({
        query: z.string().describe(
            `SQL SELECT statement to execute. For cross-database queries, prefix table names with database name and colon (e.g., "SELECT * FROM ${dbPrefixExamples}table_name ..."). Available database prefixes: ${availableDatabases.map(db => `"${db}:"`).join(', ')}.`
        ),
        database_source: z.enum(enumValues).describe(
            `Which database to use: "${availableDatabases.join('", "')}", or "both" for cross-database queries. All databases are equivalent. When "both" is used, table names in the query should be prefixed with database names (e.g., "${dbPrefixExamples}table_name").`
        )
    });
}

// Create schema instance
const sqlQuerySchema = createSqlQuerySchema();

// Function to analyze and potentially fix common SQL errors
function analyzeAndFixSqlError(query: string, error: string): { fixedQuery?: string; suggestions: string[] } {
    const suggestions: string[] = [];
    let fixedQuery: string | undefined;

    // Common error patterns and fixes
    if (error.includes('column') && error.includes('does not exist')) {
        suggestions.push('Check column names for typos or case sensitivity');
        suggestions.push('Use the schema tool to verify available columns');
        
        // Try to fix common column name issues
        if (query.includes('user_name')) {
            fixedQuery = query.replace(/user_name/g, 'username');
            suggestions.push('Tried replacing user_name with username');
        }
    }
    
    if (error.includes('relation') && error.includes('does not exist')) {
        suggestions.push('Check table names for typos or case sensitivity');
        suggestions.push('Use the schema tool to verify available tables');
    }
    
    if (error.includes('syntax error')) {
        suggestions.push('Check SQL syntax - common issues: missing commas, quotes, or parentheses');
        suggestions.push('Verify JOIN conditions and WHERE clause syntax');
    }
    
    if (error.includes('ambiguous')) {
        suggestions.push('Use table aliases to resolve ambiguous column references');
        suggestions.push('Prefix column names with table names (e.g., users.id, products.name)');
    }

    return { fixedQuery, suggestions };
}

// Helper function to execute a query on a specific database
async function executeQueryOnDatabase(
    config: PostgresConfig,
    query: string,
    maxRetries: number,
    databaseLabel: string
): Promise<{ rows: any[]; fields: any[]; rowCount: number }> {
    let currentQuery = query;
    let lastError: Error | null = null;
    const attemptHistory: Array<{ query: string; error?: string; attempt: number }> = [];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
            
            if ((global as any).__POSTGRES_VERBOSE__) {
                console.log(`🐘 [POSTGRES VERBOSE] Executing query on ${databaseLabel} (attempt ${attempt + 1}/${maxRetries + 1}):`);
                console.log(currentQuery.trim());
                console.log('');
            }
            
            const result = await client.query(currentQuery);
            await client.end();
            
            return {
                rows: result.rows,
                fields: result.fields || [],
                rowCount: result.rowCount || 0
            };

        } catch (error) {
            lastError = error as Error;
            const errorMessage = lastError.message;
            
            attemptHistory.push({
                query: currentQuery,
                error: errorMessage,
                attempt: attempt + 1
            });

            if (attempt < maxRetries) {
                const analysis = analyzeAndFixSqlError(currentQuery, errorMessage);
                if (analysis.fixedQuery) {
                    currentQuery = analysis.fixedQuery;
                    if ((global as any).__POSTGRES_VERBOSE__) {
                        console.log(`🐘 [POSTGRES VERBOSE] Query auto-fixed for retry on ${databaseLabel}:`);
                        console.log(currentQuery.trim());
                        console.log('');
                    }
                    await client.end();
                    continue;
                }
            }
            await client.end();
        }
    }

    throw new Error(`Failed to execute query on ${databaseLabel} after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`);
}

// Helper function to parse and execute cross-database queries
async function executeCrossDatabaseQuery(
    query: string
): Promise<{ rows: any[]; fields: any[]; rowCount: number; databases_used: string[] }> {
    // Simple cross-database query implementation
    // This parses queries with database name prefixes (e.g., "core-service:", "external-partner-service:")
    // For complex queries, it executes separate queries on each database and joins results
    
    const allDatabases = getAllDatabaseConfigs();
    const databaseNames = Object.keys(allDatabases);
    
    if (databaseNames.length < 2) {
        throw new Error('Cross-database queries require at least 2 configured databases');
    }
    
    // Find which databases are referenced in the query
    const referencedDatabases: string[] = [];
    for (const dbName of databaseNames) {
        const prefixPattern = new RegExp(`${dbName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\w+`, 'i');
        if (prefixPattern.test(query)) {
            referencedDatabases.push(dbName);
        }
    }
    
    if (referencedDatabases.length === 0) {
        const availablePrefixes = databaseNames.map(db => `"${db}:"`).join(', ');
        throw new Error(`Cross-database query must reference tables with database prefixes. Available prefixes: ${availablePrefixes}`);
    }
    
    // Execute query on each referenced database
    const results: any[] = [];
    const databasesUsed: string[] = [];
    
    for (const dbName of referencedDatabases) {
        const config = allDatabases[dbName];
        // Remove this database's prefix from the query
        const dbQuery = query.replace(new RegExp(`${dbName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:`, 'gi'), '');
        
        try {
            const dbResult = await executeQueryOnDatabase(
                config,
                dbQuery,
                config.maxRetries,
                dbName
            );
            // Add database source to each row
            const rowsWithSource = dbResult.rows.map(row => ({
                ...row,
                _database_source: dbName
            }));
            results.push(...rowsWithSource);
            databasesUsed.push(dbName);
        } catch (error) {
            console.warn(`Warning: Failed to execute query on ${dbName} database: ${error}`);
        }
    }
    
    // Get field names from first result (if any)
    const fields = results.length > 0 ? Object.keys(results[0]).map(name => ({ name })) : [];
    
    return {
        rows: results,
        fields,
        rowCount: results.length,
        databases_used: databasesUsed
    };
}

// Function to execute SELECT queries with retry logic
async function executeSqlQuery(params: z.infer<typeof sqlQuerySchema>) {
    // Validate that the query is a SELECT statement for security
    const trimmedQuery = params.query.trim().toLowerCase();
    if (!trimmedQuery.startsWith('select')) {
        throw new Error('Only SELECT statements are allowed for security reasons');
    }

    const databaseSource = params.database_source;
    
    // Handle cross-database queries
    if (databaseSource === 'both') {
        const availableDatabases = getAvailableDatabaseNames();
        if (availableDatabases.length < 2) {
            throw new Error('Cross-database queries require at least 2 configured databases. Currently configured: ' + (availableDatabases.length > 0 ? availableDatabases.join(', ') : 'none'));
        }
        
        try {
            const result = await executeCrossDatabaseQuery(params.query);
            
            // Extract entities from results for context storage
            const entities = contextManager.extractEntitiesFromResults(params.query, { rows: result.rows }) || {};
            
            // Store successful query results in context
            const contextId = contextManager.addContext({
                originalQuery: params.query,
                queryType: 'data',
                results: {
                    rows: result.rows,
                    row_count: result.rowCount,
                    column_count: result.fields.length,
                    databases_used: result.databases_used
                },
                entities,
                metadata: {
                    rowCount: result.rowCount,
                    affectedTables: entities?.tables || [],
                    keyFindings: generateKeyFindings(params.query, result.rows)
                }
            });
            
            return {
                success: true,
                database: 'both',
                databases_used: result.databases_used,
                query: params.query,
                context_id: contextId,
                row_count: result.rowCount,
                column_count: result.fields.length,
                columns: result.fields.map(field => field.name),
                rows: result.rows,
                entities_extracted: entities
            };
        } catch (error) {
            return {
                success: false,
                database: 'both',
                query: params.query,
                error: error instanceof Error ? error.message : 'Unknown error',
                error_type: 'CrossDatabaseQueryError',
                recommended_actions: [
                    'Ensure at least 2 databases are configured and accessible',
                    `Verify table names are prefixed with database names (e.g., "${getAvailableDatabaseNames().slice(0, 2).map(db => `${db}:`).join('", "')}")`,
                    'Check that the query syntax is correct for each database'
                ]
            };
        }
    }
    
    // Single database query - both databases are equivalent
    const config = getDatabaseConfig(databaseSource);
    
    const maxRetries = config.maxRetries;
    let currentQuery = params.query;
    let lastError: Error | null = null;
    const attemptHistory: Array<{ query: string; error?: string; attempt: number }> = [];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
            
            // Print query if verbose mode is enabled
            if ((global as any).__POSTGRES_VERBOSE__) {
                console.log(`🐘 [POSTGRES VERBOSE] Executing SQL query (attempt ${attempt + 1}/${maxRetries + 1}):`);
                console.log(currentQuery.trim());
                console.log('');
            }
            
            const result = await client.query(currentQuery);
            
            // Extract entities from results for context storage
            const entities = contextManager.extractEntitiesFromResults(currentQuery, { rows: result.rows }) || {};
            
            // Store successful query results in context
            const contextId = contextManager.addContext({
                originalQuery: params.query,
                processedQuery: currentQuery !== params.query ? currentQuery : undefined,
                queryType: 'data',
                results: {
                    rows: result.rows,
                    row_count: result.rowCount || 0,
                    column_count: result.fields?.length || 0
                },
                entities,
                metadata: {
                    rowCount: result.rowCount || 0,
                    affectedTables: entities?.tables || [],
                    keyFindings: generateKeyFindings(currentQuery, result.rows)
                }
            });

            // Success - return results with attempt history and context info
            return {
                success: true,
                database: config.database,
                database_source: databaseSource,
                query: currentQuery,
                original_query: params.query,
                context_id: contextId,
                attempts: attempt + 1,
                attempt_history: attemptHistory,
                row_count: result.rowCount || 0,
                column_count: result.fields?.length || 0,
                columns: result.fields?.map(field => field.name) || [],
                rows: result.rows,
                entities_extracted: entities
            };

        } catch (error) {
            lastError = error as Error;
            const errorMessage = lastError.message;
            
            // Record this attempt
            attemptHistory.push({
                query: currentQuery,
                error: errorMessage,
                attempt: attempt + 1
            });

            // If this is not the last attempt, try to fix the error
            if (attempt < maxRetries) {
                const analysis = analyzeAndFixSqlError(currentQuery, errorMessage);
                
                if (analysis.fixedQuery) {
                    currentQuery = analysis.fixedQuery;
                    console.log(`Attempt ${attempt + 1} failed, trying fixed query: ${currentQuery}`);
                    if ((global as any).__POSTGRES_VERBOSE__) {
                        console.log(`🐘 [POSTGRES VERBOSE] Query auto-fixed for retry:`);
                        console.log(currentQuery.trim());
                        console.log('');
                    }
                    continue;
                } else {
                    // No automatic fix available, but provide detailed error info
                    break;
                }
            }
        } finally {
            await client.end();
        }
    }

    // All attempts failed - return detailed error information
    const finalAnalysis = analyzeAndFixSqlError(currentQuery, lastError?.message || 'Unknown error');
    
    return {
        success: false,
        database: config.database,
        database_source: databaseSource,
        query: currentQuery,
        original_query: params.query,
        attempts: attemptHistory.length,
        attempt_history: attemptHistory,
        error: lastError?.message || 'Unknown error',
        error_type: lastError?.name || 'Unknown',
        suggestions: finalAnalysis.suggestions,
        recommended_actions: [
            'Use the schema tool to verify table and column names',
            'Check SQL syntax and formatting',
            'Consider simplifying the query or breaking it into parts',
            'Verify JOIN conditions and WHERE clause logic'
        ]
    };
}

// Generate key findings from query results
function generateKeyFindings(query: string, rows: any[]): string[] {
    const findings: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    if (rows.length === 0) {
        findings.push('No results found');
        return findings;
    }
    
    // Count-related findings
    if (lowerQuery.includes('count') || lowerQuery.includes('how many')) {
        const countField = Object.keys(rows[0]).find(key => key.toLowerCase().includes('count'));
        if (countField && rows[0][countField]) {
            findings.push(`Count result: ${rows[0][countField]}`);
        }
    }
    
    // User-related findings
    if (lowerQuery.includes('user') && rows.length > 0) {
        const userFields = ['username', 'user_name', 'email', 'first_name', 'last_name'];
        const userField = userFields.find(field => rows[0][field]);
        if (userField) {
            findings.push(`User query result: ${rows[0][userField]}`);
        }
    }
    
    // Order-related findings
    if (lowerQuery.includes('order') && rows.length > 0) {
        findings.push(`Found ${rows.length} order(s)`);
        if (rows[0].status) {
            findings.push(`Order status(es): ${[...new Set(rows.map(r => r.status))].join(', ')}`);
        }
    }
    
    // Product-related findings
    if (lowerQuery.includes('product') && rows.length > 0) {
        findings.push(`Found ${rows.length} product(s)`);
    }
    
    // General result count
    findings.push(`Total rows: ${rows.length}`);
    
    return findings;
}

export const postgresQueryTool = createAiSdkTool(
    'postgres_query',
    `Execute SELECT statements against PostgreSQL database(s) with automatic retry and error analysis. Supports single database queries and cross-database queries. Available databases are dynamically discovered from environment variables. All databases are equivalent. For cross-database queries, set database_source to "both" and prefix table names with database names (e.g., "SELECT * FROM database1:users JOIN database2:orders ON ..."). Results are automatically stored in conversation context. Only SELECT queries are allowed for security.`,
    sqlQuerySchema,
    executeSqlQuery
); 