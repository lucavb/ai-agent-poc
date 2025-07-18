import { z } from 'zod';
import { createAiSdkTool } from '../ai-sdk-tool-system';
import { contextManager } from '../context-manager';

// Schema for context analysis requests
const contextAnalysisSchema = z.object({
    query: z.string().describe('User query to analyze for context and references'),
    storeContext: z.boolean().default(false).describe('Whether to store this analysis as context for future reference')
});

// Function to analyze query context and provide guidance for tool selection
async function analyzeQueryContext(params: z.infer<typeof contextAnalysisSchema>) {
    const query = params.query.toLowerCase();
    
    // Analyze context references
    const contextResolution = contextManager.analyzeContextReferences(params.query);
    
    // Determine query intent and required tools
    const intentAnalysis = analyzeQueryIntent(params.query, contextResolution);
    
    // Get relevant context from conversation history
    const recentContexts = contextManager.getRecentContexts(5);
    const relevantContexts = recentContexts.filter(ctx => 
        isContextRelevant(ctx, params.query, contextResolution)
    );
    
    // Store this analysis as context if requested
    let contextId: string | undefined;
    if (params.storeContext) {
        contextId = contextManager.addContext({
            originalQuery: params.query,
            queryType: 'other',
            results: {
                intent: intentAnalysis.primaryIntent,
                confidence: intentAnalysis.confidence
            },
            metadata: {
                rowCount: 0,
                keyFindings: [`Analysis performed at ${new Date().toISOString()}`]
            }
        });
    }
    
    return {
        success: true,
        original_query: params.query,
        resolved_query: contextResolution.resolvedQuery || params.query,
        context_id: contextId,
        
        // Context resolution details
        has_references: contextResolution.hasContextReferences,
        referenced_entities: contextResolution.entities,
        enhancement_suggestions: contextResolution.enhancementSuggestions,
        
        // Intent analysis for tool selection
        primary_intent: intentAnalysis.primaryIntent,
        confidence: intentAnalysis.confidence,
        recommended_tools: intentAnalysis.recommendedTools,
        tool_selection_guidance: intentAnalysis.toolSelectionGuidance,
        
        // Relevant conversation context
        relevant_contexts: relevantContexts.map(ctx => ({
            id: ctx.id,
            query: ctx.originalQuery,
            type: ctx.queryType,
            entities: ctx.entities,
            key_findings: ctx.metadata?.keyFindings || []
        })),
        
        // Enhanced query suggestions
        enhanced_query_suggestions: generateEnhancedQueries(params.query, contextResolution, intentAnalysis),
        
        // Context summary for the AI agent
        context_summary: generateContextSummary(relevantContexts, contextResolution)
    };
}

// Analyze what the user intends to do with their query
function analyzeQueryIntent(query: string, contextResolution: any) {
    const lowerQuery = query.toLowerCase();
    
    // Database-related patterns
    const databasePatterns = [
        /\b(select|query|find|show|get|fetch|retrieve|list|search)\b/i,
        /\b(users?|orders?|products?|customers?|data|table|database|schema)\b/i,
        /\b(count|sum|average|total|group|join|where)\b/i,
        /\b(how many|summarize|analyze|report)\b/i
    ];
    
    // Calculation patterns  
    const calculationPatterns = [
        /\b(calculate|compute|add|subtract|multiply|divide|math)\b/i,
        /\b(\d+\s*[\+\-\*\/]\s*\d+)\b/i,
        /\b(what is|equals|result)\b/i
    ];
    
    // Reference patterns (context-dependent)
    const referencePatterns = [
        /\b(these|those|them|it|this|that)\b/i,
        /\b(summarize|analyze|describe)\s+(these|those|them|it)\b/i,
        /\b(his|her|their)\b/i
    ];
    
    let primaryIntent = 'unknown';
    let confidence = 0;
    let recommendedTools: string[] = [];
    
    // Score different intents
    const databaseScore = databasePatterns.reduce((score, pattern) => 
        score + (pattern.test(lowerQuery) ? 1 : 0), 0);
    
    const calculationScore = calculationPatterns.reduce((score, pattern) => 
        score + (pattern.test(lowerQuery) ? 1 : 0), 0);
    
    const referenceScore = referencePatterns.reduce((score, pattern) => 
        score + (pattern.test(lowerQuery) ? 1 : 0), 0);
    
    // Determine primary intent
    if (contextResolution.hasContextReferences && referenceScore > 0) {
        // If there are context references, look at what the references point to
        if (contextResolution.entities.orders || contextResolution.entities.users) {
            primaryIntent = 'database_with_context';
            confidence = 0.9;
            recommendedTools = ['postgres_query', 'context'];
        } else {
            primaryIntent = 'context_dependent';
            confidence = 0.7;
            recommendedTools = ['context'];
        }
    } else if (databaseScore >= 2 || (databaseScore >= 1 && lowerQuery.includes('database'))) {
        primaryIntent = 'database_query';
        confidence = Math.min(0.9, 0.5 + (databaseScore * 0.2));
        recommendedTools = ['postgres_schema', 'postgres_query'];
    } else if (calculationScore >= 1) {
        primaryIntent = 'calculation';
        confidence = Math.min(0.9, 0.6 + (calculationScore * 0.2));
        recommendedTools = ['calculator'];
    } else if (lowerQuery.includes('schema') || lowerQuery.includes('tables') || lowerQuery.includes('structure')) {
        primaryIntent = 'schema_exploration';
        confidence = 0.8;
        recommendedTools = ['postgres_schema'];
    }
    
    const toolSelectionGuidance = generateToolSelectionGuidance(primaryIntent, contextResolution, databaseScore, calculationScore);
    
    return {
        primaryIntent,
        confidence,
        recommendedTools,
        toolSelectionGuidance,
        scores: {
            database: databaseScore,
            calculation: calculationScore,
            reference: referenceScore
        }
    };
}

// Generate guidance for tool selection
function generateToolSelectionGuidance(intent: string, contextResolution: any, dbScore: number, calcScore: number): string[] {
    const guidance: string[] = [];
    
    switch (intent) {
        case 'database_with_context':
            guidance.push('This query references previous database results - use postgres_query with context');
            guidance.push('The context provides entity information that should be incorporated into the SQL');
            break;
            
        case 'database_query':
            guidance.push('This appears to be a database query - use postgres_query or postgres_schema');
            if (dbScore >= 2) {
                guidance.push('High confidence database query - proceed with postgres tools');
            }
            break;
            
        case 'calculation':
            guidance.push('This appears to be a mathematical calculation - use calculator tool');
            break;
            
        case 'schema_exploration':
            guidance.push('User wants to explore database structure - use postgres_schema tool');
            break;
            
        case 'context_dependent':
            guidance.push('Query heavily relies on context - analyze previous interactions first');
            guidance.push('May need to combine context analysis with other tools');
            break;
            
        default:
            guidance.push('Intent unclear - consider using context tool to gather more information');
    }
    
    if (contextResolution.hasContextReferences) {
        guidance.push('Query contains references to previous context - resolve these first');
    }
    
    return guidance;
}

// Check if a context entry is relevant to the current query
function isContextRelevant(context: any, query: string, contextResolution: any): boolean {
    const lowerQuery = query.toLowerCase();
    
    // Always relevant if query has references and context has entities
    if (contextResolution.hasContextReferences && context.entities) {
        return true;
    }
    
    // Relevant if query mentions same entities
    if (context.entities?.users) {
        for (const user of context.entities.users) {
            if (lowerQuery.includes(user.toLowerCase())) {
                return true;
            }
        }
    }
    
    // Relevant if query has references and context has orders/products
    if (contextResolution.hasContextReferences) {
        if (context.queryType === 'data' && context.results?.rows) {
            return true;
        }
    }
    
    // Relevant if query is about same domain (orders, products, etc.)
    if (context.queryType === 'data' && context.originalQuery) {
        const contextTerms = ['order', 'product', 'user', 'customer'];
        const hasCommonTerms = contextTerms.some(term => 
            lowerQuery.includes(term) && context.originalQuery.toLowerCase().includes(term)
        );
        if (hasCommonTerms) return true;
    }
    
    return false;
}

// Generate enhanced query suggestions
function generateEnhancedQueries(originalQuery: string, contextResolution: any, intentAnalysis: any): string[] {
    const suggestions: string[] = [];
    
    if (contextResolution.resolvedQuery && contextResolution.resolvedQuery !== originalQuery) {
        suggestions.push(`Resolved query: "${contextResolution.resolvedQuery}"`);
    }
    
    if (intentAnalysis.primaryIntent === 'database_with_context' && contextResolution.entities.users) {
        const user = contextResolution.entities.users[0];
        suggestions.push(`Specify user context: "for user ${user}"`);
    }
    
    if (intentAnalysis.scores.database > 0 && intentAnalysis.scores.database < 2) {
        suggestions.push('Consider making the database request more specific');
    }
    
    return suggestions;
}

// Generate a summary of relevant context for the AI agent
function generateContextSummary(relevantContexts: any[], contextResolution: any): string {
    if (relevantContexts.length === 0 && !contextResolution.hasContextReferences) {
        return 'No relevant conversation context found.';
    }
    
    const summaryParts: string[] = [];
    
    if (contextResolution.hasContextReferences) {
        summaryParts.push(`Query contains references: ${contextResolution.enhancementSuggestions.join(', ')}`);
    }
    
    if (relevantContexts.length > 0) {
        const contextTypes = relevantContexts.map(ctx => ctx.type);
        const uniqueTypes = [...new Set(contextTypes)];
        summaryParts.push(`Found ${relevantContexts.length} relevant context(s) of type: ${uniqueTypes.join(', ')}`);
        
        // Mention key entities from context
        const allEntities = relevantContexts.flatMap(ctx => 
            Object.entries(ctx.entities || {}).flatMap(([type, values]) => 
                Array.isArray(values) ? values.map((v: any) => `${type}:${v}`) : []
            )
        );
        if (allEntities.length > 0) {
            summaryParts.push(`Key entities: ${allEntities.slice(0, 5).join(', ')}`);
        }
    }
    
    return summaryParts.join('. ');
}

export const contextTool = createAiSdkTool(
    'analyze_context',
    'Analyze user query for context references, intent, and provide guidance for tool selection. Use this tool early in the analysis to understand what the user is asking for and which tools should be used next.',
    contextAnalysisSchema,
    analyzeQueryContext
); 