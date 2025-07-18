// Context management system for maintaining conversation state and resolving references

export interface QueryContext {
    id: string;
    timestamp: Date;
    originalQuery: string;
    processedQuery?: string;
    queryType: 'schema' | 'data' | 'calculation' | 'other';
    results?: any;
    entities?: {
        users?: string[];
        tables?: string[];
        columns?: string[];
        values?: any[];
    };
    metadata?: {
        rowCount?: number;
        affectedTables?: string[];
        keyFindings?: string[];
    };
}

export interface ContextResolution {
    hasContextReferences: boolean;
    resolvedQuery?: string;
    referencedContexts: string[];
    entities: {
        users?: string[];
        tables?: string[];
        orders?: any[];
        products?: any[];
    };
    enhancementSuggestions: string[];
}

export class ConversationContextManager {
    private contexts: Map<string, QueryContext> = new Map();
    private chronologicalOrder: string[] = [];
    private maxContexts: number = 50; // Keep last 50 contexts

    // Add a new context entry
    addContext(context: Omit<QueryContext, 'id' | 'timestamp'>): string {
        const id = `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fullContext: QueryContext = {
            ...context,
            id,
            timestamp: new Date()
        };

        this.contexts.set(id, fullContext);
        this.chronologicalOrder.push(id);

        // Maintain max contexts limit
        if (this.chronologicalOrder.length > this.maxContexts) {
            const oldestId = this.chronologicalOrder.shift()!;
            this.contexts.delete(oldestId);
        }

        return id;
    }

    // Get recent contexts (default: last 5)
    getRecentContexts(count: number = 5): QueryContext[] {
        const recentIds = this.chronologicalOrder.slice(-count);
        return recentIds.map(id => this.contexts.get(id)!).filter(Boolean);
    }

    // Analyze query for context references
    analyzeContextReferences(query: string): ContextResolution {
        const lowerQuery = query.toLowerCase();
        const resolution: ContextResolution = {
            hasContextReferences: false,
            referencedContexts: [],
            entities: {},
            enhancementSuggestions: []
        };

        // Check for reference words
        const referencePatterns = [
            /\b(these|those|them|it|this|that)\b/i,
            /\b(the same|same)\b/i,
            /\b(previous|last|recent)\b/i,
            /\b(his|her|their)\b/i
        ];

        const hasReferences = referencePatterns.some(pattern => pattern.test(query));
        
        if (hasReferences) {
            resolution.hasContextReferences = true;
            resolution.resolvedQuery = this.resolveQueryReferences(query);
        }

        // Extract and resolve entities from recent contexts
        const recentContexts = this.getRecentContexts(3);
        for (const context of recentContexts) {
            if (context.entities) {
                // Merge entities from recent contexts
                if (context.entities.users) {
                    resolution.entities.users = [...(resolution.entities.users || []), ...context.entities.users];
                }
            }
            
            // If context has order-related results, track them
            if (context.results && context.results.rows && context.originalQuery.toLowerCase().includes('order')) {
                resolution.entities.orders = context.results.rows;
                resolution.referencedContexts.push(context.id);
            }
        }

        // Generate enhancement suggestions
        if (resolution.hasContextReferences) {
            resolution.enhancementSuggestions = this.generateEnhancementSuggestions(query, recentContexts);
        }

        return resolution;
    }

    // Resolve references in queries based on context
    private resolveQueryReferences(query: string): string {
        let resolvedQuery = query;
        const recentContexts = this.getRecentContexts(3);

        // Find the most recent user-related query
        const lastUserContext = recentContexts.reverse().find(ctx => 
            ctx.entities?.users && ctx.entities.users.length > 0
        );

        const lastOrderContext = recentContexts.find(ctx =>
            ctx.originalQuery.toLowerCase().includes('order') && ctx.results?.rows
        );

        // Resolve "these orders" or "this order" references
        if (/\b(these|those|this|that)\s+(orders?)\b/i.test(query)) {
            if (lastUserContext?.entities?.users) {
                const userName = lastUserContext.entities.users[0];
                resolvedQuery = resolvedQuery.replace(
                    /\b(these|those|this|that)\s+(orders?)\b/i,
                    `orders for user ${userName}`
                );
            } else if (lastOrderContext?.results?.rows) {
                // If no user context but we have order results, reference them
                resolvedQuery = resolvedQuery.replace(
                    /\b(these|those|this|that)\s+(orders?)\b/i,
                    `the orders from the previous query`
                );
            }
        }

        // Resolve general "this" references when asking about order properties
        if (/\b(this|that)\s+(order)\b/i.test(query) && /\b(status|total|amount|date|details)\b/i.test(query)) {
            if (lastUserContext?.entities?.users) {
                const userName = lastUserContext.entities.users[0];
                resolvedQuery = resolvedQuery.replace(
                    /\b(this|that)\s+(order)\b/i,
                    `the order for user ${userName}`
                );
            }
        }

        // Resolve "his/her orders" references
        if (/\b(his|her|their)\s+(orders?)\b/i.test(query)) {
            if (lastUserContext?.entities?.users) {
                const userName = lastUserContext.entities.users[0];
                resolvedQuery = resolvedQuery.replace(
                    /\b(his|her|their)\s+(orders?)\b/i,
                    `${userName}'s orders`
                );
            }
        }

        // Resolve "summarize these" or "summarize them"
        if (/\bsummarize\s+(these|them|it|this)\b/i.test(query)) {
            if (lastOrderContext) {
                resolvedQuery = `summarize the orders from the previous query`;
            }
        }

        return resolvedQuery;
    }

    // Generate enhancement suggestions based on context
    private generateEnhancementSuggestions(query: string, contexts: QueryContext[]): string[] {
        const suggestions: string[] = [];

        const lastUserContext = contexts.find(ctx => ctx.entities?.users);
        const lastOrderContext = contexts.find(ctx => 
            ctx.originalQuery.toLowerCase().includes('order') && ctx.results?.rows
        );

        if (lastUserContext && query.toLowerCase().includes('these')) {
            suggestions.push(`Reference detected: Consider adding "for user ${lastUserContext.entities?.users?.[0]}" to clarify context`);
        }

        if (lastOrderContext && query.toLowerCase().includes('summarize')) {
            suggestions.push(`Previous order query found with ${lastOrderContext.results?.row_count || 0} results`);
        }

        return suggestions;
    }

    // Extract entities from query results
    extractEntitiesFromResults(query: string, results: any): QueryContext['entities'] {
        const entities: QueryContext['entities'] = {};

        if (!results || !results.rows) return entities;

        // Extract user entities
        if (query.toLowerCase().includes('user') && results.rows.length > 0) {
            const userFields = ['username', 'user_name', 'email', 'first_name', 'last_name'];
            const userValues: string[] = [];
            
            results.rows.forEach((row: any) => {
                userFields.forEach(field => {
                    if (row[field]) {
                        userValues.push(row[field].toString());
                    }
                });
            });
            
            if (userValues.length > 0) {
                entities.users = [...new Set(userValues)]; // Remove duplicates
            }
        }

        // Extract table references from query
        const tablePattern = /\bfrom\s+(\w+)/gi;
        const tableMatches = [...query.matchAll(tablePattern)];
        if (tableMatches.length > 0) {
            entities.tables = tableMatches.map(match => match[1]);
        }

        return entities;
    }

    // Get context summary for debugging
    getContextSummary(): { totalContexts: number; recentContexts: string[] } {
        return {
            totalContexts: this.contexts.size,
            recentContexts: this.getRecentContexts(5).map(ctx => 
                `${ctx.id}: ${ctx.originalQuery.substring(0, 50)}...`
            )
        };
    }

    // Clear all contexts
    clearContext(): void {
        this.contexts.clear();
        this.chronologicalOrder = [];
    }
}

// Global context manager instance
export const contextManager = new ConversationContextManager(); 