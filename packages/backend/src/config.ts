import * as dotenv from 'dotenv';
import { number, z } from 'zod';
import { LLMConfig, AgentConfig } from './types';
import * as path from 'path';
import { objectify } from 'radashi';

// PostgreSQL configuration type
export interface PostgresConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    maxRetries: number;
}

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const serviceNames = ['CORE', 'EXTERNAL_PARTNER'] as const;
type ServiceName = (typeof serviceNames)[number];

// Zod schema for environment variables
const EnvSchema = z.object({
    // LLM Configuration
    OPENAI_BASE_URL: z.string().url().default('http://localhost:1234/v1'),
    OPENAI_API_KEY: z.string().default('not-needed'),
    OPENAI_MODEL: z.string().default('your-model-name'),
    OPENAI_MAX_TOKENS: z
        .string()
        .default('4096')
        .transform((val) => parseInt(val, 10))
        .refine((val) => val > 0, 'Must be a positive number'),
    OPENAI_TEMPERATURE: z
        .string()
        .default('0.7')
        .transform((val) => parseFloat(val))
        .refine((val) => val >= 0 && val <= 2, 'Must be between 0 and 2'),
    OPENAI_TIMEOUT: z
        .string()
        .default('30000')
        .transform((val) => parseInt(val, 10))
        .refine((val) => val > 0, 'Must be a positive number'),

    // Agent Configuration
    AGENT_NAME: z.string().default('test-agent'),
    AGENT_VERSION: z.string().default('1.0.0'),
    AGENT_MAX_ITERATIONS: z
        .string()
        .default('8')
        .transform((val) => parseInt(val, 10))
        .refine((val) => val > 0, 'Must be a positive number'),
    AGENT_DEBUG: z
        .string()
        .default('false')
        .transform((val) => val.toLowerCase() === 'true'),

    // PostgreSQL Service Database Configurations
    ...objectify(
        serviceNames,
        (serviceName) => `POSTGRES_${serviceName}_SERVICE_HOST`,
        () => z.string().optional(),
    ),
    ...objectify(
        serviceNames,
        (serviceName) => `POSTGRES_${serviceName}_SERVICE_PORT`,
        () =>
            z
                .string()
                .optional()
                .transform((val) => (val ? parseInt(val, 10) : undefined))
                .refine((val) => val === undefined || (val > 0 && val <= 65535), 'Must be a valid port number'),
    ),
    ...objectify(
        serviceNames,
        (serviceName) => `POSTGRES_${serviceName}_SERVICE_DB`,
        () => z.string().optional(),
    ),
    ...objectify(
        serviceNames,
        (serviceName) => `POSTGRES_${serviceName}_SERVICE_USER`,
        () => z.string().optional(),
    ),
    ...objectify(
        serviceNames,
        (serviceName) => `POSTGRES_${serviceName}_SERVICE_PASSWORD`,
        () => z.string().optional(),
    ),
    ...objectify(
        serviceNames,
        (serviceName) => `POSTGRES_${serviceName}_SERVICE_SSL`,
        () =>
            z
                .string()
                .optional()
                .transform((val) => (val ? val.toLowerCase() === 'true' : undefined)),
    ),
    ...objectify(
        serviceNames,
        (serviceName) => `POSTGRES_${serviceName}_SERVICE_MAX_RETRIES`,
        () =>
            z
                .string()
                .optional()
                .transform((val) => (val ? parseInt(val, 10) : undefined))
                .refine((val) => val === undefined || (val >= 0 && val <= 10), 'Must be between 0 and 10'),
    ),
});

// Parse and validate environment variables
let envVars: z.infer<typeof EnvSchema>;

try {
    envVars = EnvSchema.parse(process.env);
} catch (error) {
    console.error('❌ Environment variable validation failed:');
    if (error instanceof z.ZodError) {
        error.issues.forEach((err) => {
            console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
    }
    process.exit(1);
}

/**
 * Get LLM configuration from environment variables
 */
export function getLLMConfig(): LLMConfig {
    return {
        baseURL: envVars.OPENAI_BASE_URL,
        apiKey: envVars.OPENAI_API_KEY,
        model: envVars.OPENAI_MODEL,
        maxTokens: envVars.OPENAI_MAX_TOKENS,
        temperature: envVars.OPENAI_TEMPERATURE,
        timeout: envVars.OPENAI_TIMEOUT,
    };
}

/**
 * Get agent configuration from environment variables
 */
export function getAgentConfig(): Omit<AgentConfig, 'llmConfig'> {
    return {
        name: envVars.AGENT_NAME,
        version: envVars.AGENT_VERSION,
        maxIterations: envVars.AGENT_MAX_ITERATIONS,
        debug: envVars.AGENT_DEBUG,
    };
}

/**
 * Get complete agent configuration
 */
export function getFullAgentConfig(): AgentConfig {
    return {
        ...getAgentConfig(),
        llmConfig: getLLMConfig(),
    };
}

/**
 * Validate environment variables using Zod schema
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
    try {
        EnvSchema.parse(process.env);
        return { valid: true, errors: [] };
    } catch (error) {
        const errors: string[] = [];
        if (error instanceof z.ZodError) {
            error.issues.forEach((err) => {
                errors.push(`${err.path.join('.')}: ${err.message}`);
            });
        }
        return { valid: false, errors };
    }
}

/**
 * Database registry - stores all configured databases
 */
type DatabaseRegistry = Map<string, PostgresConfig>;

/**
 * Build database registry from environment variables
 * Discovers databases from POSTGRES_<NAME>_* patterns
 * Supports both new naming (POSTGRES_CORE_SERVICE_*) and legacy naming (POSTGRES_*, POSTGRES2_*)
 */
function buildDatabaseRegistry(): DatabaseRegistry {
    const registry = new Map<string, PostgresConfig>();

    // Helper function to get config with fallback to legacy variables
    const getServiceConfig = (serviceName: ServiceName) => {
        // Try new naming first, fall back to legacy
        const host = envVars[`POSTGRES_${serviceName}_SERVICE_HOST`] ?? 'localhost';
        const port = envVars[`POSTGRES_${serviceName}_SERVICE_PORT`] ?? 5432;
        const database = envVars[`POSTGRES_${serviceName}_SERVICE_DB`] ?? 'testdb';
        const username = envVars[`POSTGRES_${serviceName}_SERVICE_USER`] ?? 'testuser';
        const password = envVars[`POSTGRES_${serviceName}_SERVICE_PASSWORD`] ?? 'testpass';
        const ssl = envVars[`POSTGRES_${serviceName}_SERVICE_SSL`] ?? false;
        const maxRetries = envVars[`POSTGRES_${serviceName}_SERVICE_MAX_RETRIES`] ?? 3;
        return { host, port, database, username, password, ssl, maxRetries };
    };

    serviceNames.forEach((serviceName) => {
        if (envVars[`POSTGRES_${serviceName}_SERVICE_HOST`]) {
            registry.set(`${serviceName.toLowerCase()}-service`, getServiceConfig(serviceName));
        }
    });

    return registry;
}

// Cache the database registry
let databaseRegistry: DatabaseRegistry | null = null;

/**
 * Get the database registry (cached)
 */
function getDatabaseRegistry(): DatabaseRegistry {
    if (!databaseRegistry) {
        databaseRegistry = buildDatabaseRegistry();
    }
    return databaseRegistry;
}

/**
 * Get all available database names
 */
export function getAvailableDatabaseNames(): string[] {
    return Array.from(getDatabaseRegistry().keys());
}

/**
 * Get all database configurations
 */
export function getAllDatabaseConfigs(): Record<string, PostgresConfig> {
    const registry = getDatabaseRegistry();
    const result: Record<string, PostgresConfig> = {};
    for (const [name, config] of registry.entries()) {
        result[name] = config;
    }
    return result;
}

/**
 * Get PostgreSQL configuration by database source name
 * @param databaseSource - name of the database (e.g., 'core-service', 'external-partner-service')
 */
export function getDatabaseConfig(databaseSource: string): PostgresConfig {
    const registry = getDatabaseRegistry();
    const config = registry.get(databaseSource);
    if (!config) {
        const available = getAvailableDatabaseNames().join(', ');
        throw new Error(`Database "${databaseSource}" is not configured. Available databases: ${available || 'none'}`);
    }
    return config;
}

/**
 * Get PostgreSQL Core Service database configuration from environment variables
 * @deprecated Use getDatabaseConfig('core-service') instead
 */
export function getCoreServiceConfig(): PostgresConfig {
    return getDatabaseConfig('core-service');
}

/**
 * Get PostgreSQL External Partner Service database configuration from environment variables
 * Returns null if external partner service database is not configured
 * @deprecated Use getDatabaseConfig('external-partner-service') instead
 */
export function getExternalPartnerServiceConfig(): PostgresConfig | null {
    const registry = getDatabaseRegistry();
    return registry.get('external-partner-service') || null;
}

/**
 * Print current configuration (without sensitive data)
 */
export function printConfig(): void {
    console.log('🔧 Configuration:');
    console.log('  LLM:');
    console.log(`    Base URL: ${envVars.OPENAI_BASE_URL}`);
    console.log(`    Model: ${envVars.OPENAI_MODEL}`);
    console.log(`    Max Tokens: ${envVars.OPENAI_MAX_TOKENS}`);
    console.log(`    Temperature: ${envVars.OPENAI_TEMPERATURE}`);
    console.log(`    Timeout: ${envVars.OPENAI_TIMEOUT}ms`);
    console.log('  Agent:');
    console.log(`    Name: ${envVars.AGENT_NAME}`);
    console.log(`    Version: ${envVars.AGENT_VERSION}`);
    console.log(`    Max Iterations: ${envVars.AGENT_MAX_ITERATIONS}`);
    console.log(`    Debug: ${envVars.AGENT_DEBUG}`);
    const allDatabases = getAllDatabaseConfigs();
    const dbNames = Object.keys(allDatabases);

    if (dbNames.length === 0) {
        console.log('  PostgreSQL: No databases configured');
    } else {
        console.log(`  PostgreSQL (${dbNames.length} database${dbNames.length > 1 ? 's' : ''} configured):`);
        for (const [name, config] of Object.entries(allDatabases)) {
            console.log(`    ${name}:`);
            console.log(`      Host: ${config.host}`);
            console.log(`      Port: ${config.port}`);
            console.log(`      Database: ${config.database}`);
            console.log(`      User: ${config.username}`);
            console.log(`      SSL: ${config.ssl}`);
            console.log(`      Max Retries: ${config.maxRetries}`);
        }
    }
}
