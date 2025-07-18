import { z } from 'zod';
import { Client } from 'pg';
import { createAiSdkTool } from '../ai-sdk-tool-system';
import { getPostgresConfig } from '../config';
import { contextManager } from '../context-manager';

// Schema for SQL query execution (SELECT statements only)
const sqlQuerySchema = z.object({
    query: z.string().describe('SQL SELECT statement to execute against the database')
});

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

// Function to execute SELECT queries with retry logic
async function executeSqlQuery(params: z.infer<typeof sqlQuerySchema>) {
    // Validate that the query is a SELECT statement for security
    const trimmedQuery = params.query.trim().toLowerCase();
    if (!trimmedQuery.startsWith('select')) {
        throw new Error('Only SELECT statements are allowed for security reasons');
    }

    // Use the same database configuration as the schema tool
    const config = getPostgresConfig();
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
    'Execute SELECT statements against the PostgreSQL database with automatic retry and error analysis. Results are automatically stored in conversation context for follow-up queries. Only SELECT queries are allowed for security.',
    sqlQuerySchema,
    executeSqlQuery
); 