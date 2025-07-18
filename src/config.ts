import * as dotenv from 'dotenv';
import { z } from 'zod';
import { LLMConfig, AgentConfig } from './types';

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

// Load environment variables
dotenv.config();

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

    // PostgreSQL Configuration
    POSTGRES_HOST: z.string().default('localhost'),
    POSTGRES_PORT: z
        .string()
        .default('5432')
        .transform((val) => parseInt(val, 10))
        .refine((val) => val > 0 && val <= 65535, 'Must be a valid port number'),
    POSTGRES_DB: z.string().default('testdb'),
    POSTGRES_USER: z.string().default('testuser'),
    POSTGRES_PASSWORD: z.string().default('testpass'),
    POSTGRES_SSL: z
        .string()
        .default('false')
        .transform((val) => val.toLowerCase() === 'true'),
    POSTGRES_MAX_RETRIES: z
        .string()
        .default('3')
        .transform((val) => parseInt(val, 10))
        .refine((val) => val >= 0 && val <= 10, 'Must be between 0 and 10'),
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
 * Get PostgreSQL configuration from environment variables
 */
export function getPostgresConfig(): PostgresConfig {
    return {
        host: envVars.POSTGRES_HOST,
        port: envVars.POSTGRES_PORT,
        database: envVars.POSTGRES_DB,
        username: envVars.POSTGRES_USER,
        password: envVars.POSTGRES_PASSWORD,
        ssl: envVars.POSTGRES_SSL,
        maxRetries: envVars.POSTGRES_MAX_RETRIES,
    };
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
    console.log('  PostgreSQL:');
    console.log(`    Host: ${envVars.POSTGRES_HOST}`);
    console.log(`    Port: ${envVars.POSTGRES_PORT}`);
    console.log(`    Database: ${envVars.POSTGRES_DB}`);
    console.log(`    User: ${envVars.POSTGRES_USER}`);
    console.log(`    SSL: ${envVars.POSTGRES_SSL}`);
    console.log(`    Max Retries: ${envVars.POSTGRES_MAX_RETRIES}`);
}
