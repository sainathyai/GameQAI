/**
 * Configuration Manager
 * 
 * Handles loading and validation of application configuration
 * from environment variables, AWS Secrets Manager, and default values.
 */

import { z } from 'zod';
import { AppConfig, LogLevel } from './types.js';
import { getSecretsManager } from '../utils/SecretsManager.js';

// Zod schema for configuration validation
const ConfigSchema = z.object({
  browserbase: z.object({
    api_key: z.string().min(1, 'BROWSERBASE_API_KEY is required'),
    project_id: z.string().optional(),
  }),
  openai: z.object({
    api_key: z.string().min(1, 'OPENAI_API_KEY is required'),
    model: z.string().default('gpt-4o'),
  }),
  test: z.object({
    default_timeout: z.number().int().positive().default(300000),
    max_retries: z.number().int().min(0).max(10).default(3),
    screenshot_resolution: z.string().default('1920x1080'),
  }),
  output: z.object({
    dir: z.string().default('./output'),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  }),
});

// Type inference not needed - using direct validation

/**
 * Loads and validates configuration from environment variables and AWS Secrets Manager
 * 
 * @returns Validated configuration object
 * @throws Error if required configuration is missing or invalid
 */
export async function loadConfig(): Promise<AppConfig> {
  // Determine if we should use AWS Secrets Manager
  // Use AWS Secrets Manager only if:
  // 1. Explicitly enabled via USE_AWS_SECRETS=true, OR
  // 2. Running in Lambda environment (AWS_LAMBDA_FUNCTION_NAME is set), OR
  // 3. AWS_SECRET_OPENAI_KEY is explicitly set
  // Otherwise, use .env file for local development
  const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  const useAWSSecrets = 
    process.env.USE_AWS_SECRETS === 'true' || 
    isLambda ||
    (!!process.env.AWS_SECRET_OPENAI_KEY && process.env.USE_AWS_SECRETS !== 'false');

  let openaiApiKey = process.env.OPENAI_API_KEY || '';

  // Fetch OpenAI API key from AWS Secrets Manager if configured
  if (useAWSSecrets && !openaiApiKey) {
    try {
      const secretsManager = getSecretsManager();
      const secretName = process.env.AWS_SECRET_OPENAI_KEY || 'sainathyai';
      
      console.log(`[INFO] Fetching OpenAI API key from AWS Secrets Manager: ${secretName}`);
      // Try key1 first, will fallback to key2, key3 automatically
      const keyNumber = process.env.AWS_SECRET_OPENAI_KEY_NUMBER 
        ? parseInt(process.env.AWS_SECRET_OPENAI_KEY_NUMBER, 10) 
        : undefined;
      openaiApiKey = await secretsManager.getOpenAIKey(secretName, keyNumber, true);
      console.log(`[INFO] OpenAI API key retrieved from AWS Secrets Manager${keyNumber ? ` (key${keyNumber})` : ''}`);
    } catch (error) {
      console.warn('[WARN] Failed to fetch OpenAI key from AWS Secrets Manager, falling back to environment variable', error);
      // Fallback to environment variable if AWS fetch fails
      openaiApiKey = process.env.OPENAI_API_KEY || '';
    }
  } else {
    // Use .env file for local development
    console.log('[INFO] Using OpenAI API key from .env file (local development)');
    openaiApiKey = process.env.OPENAI_API_KEY || '';
  }

  // Load environment variables
  const env = {
    browserbase: {
      api_key: process.env.BROWSERBASE_API_KEY || '',
      project_id: process.env.BROWSERBASE_PROJECT_ID,
    },
    openai: {
      api_key: openaiApiKey,
      model: process.env.LLM_MODEL || process.env.OPENAI_MODEL || 'gpt-4o',
    },
    test: {
      default_timeout: parseInt(
        process.env.DEFAULT_TIMEOUT || '300000',
        10
      ),
      max_retries: parseInt(process.env.MAX_RETRIES || '3', 10),
      screenshot_resolution:
        process.env.SCREENSHOT_RESOLUTION || '1920x1080',
    },
    output: {
      dir: process.env.OUTPUT_DIR || './output',
    },
    logging: {
      level: (process.env.LOG_LEVEL || 'info') as LogLevel,
    },
  };

  // Validate configuration
  try {
    const validated = ConfigSchema.parse(env);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      throw new Error(`Configuration validation failed: ${errors}`);
    }
    throw error;
  }
}

/**
 * Gets configuration instance (singleton pattern)
 * 
 * @returns Configuration object
 * @throws Error if configuration loading fails
 */
let configInstance: AppConfig | null = null;
let configPromise: Promise<AppConfig> | null = null;

export async function getConfig(): Promise<AppConfig> {
  if (!configInstance && !configPromise) {
    configPromise = loadConfig();
    configInstance = await configPromise;
    configPromise = null;
  } else if (configPromise) {
    configInstance = await configPromise;
    configPromise = null;
  }
  if (!configInstance) {
    throw new Error('Configuration not loaded');
  }
  return configInstance;
}

/**
 * Synchronous config getter (for backward compatibility)
 * Note: This will throw if AWS Secrets Manager is enabled, use getConfig() instead
 * 
 * @returns Configuration object
 * @throws Error if AWS Secrets Manager is enabled or configuration loading fails
 */
export function getConfigSync(): AppConfig {
  if (process.env.USE_AWS_SECRETS === 'true' || process.env.AWS_SECRET_OPENAI_KEY) {
    throw new Error(
      'Cannot use getConfigSync() when AWS Secrets Manager is enabled. Use getConfig() instead.'
    );
  }
  if (!configInstance) {
    // For sync version, we can't use async, so we'll use environment variables only
    const env = {
      browserbase: {
        api_key: process.env.BROWSERBASE_API_KEY || '',
        project_id: process.env.BROWSERBASE_PROJECT_ID,
      },
      openai: {
        api_key: process.env.OPENAI_API_KEY || '',
        model: process.env.LLM_MODEL || process.env.OPENAI_MODEL || 'gpt-4o',
      },
      test: {
        default_timeout: parseInt(process.env.DEFAULT_TIMEOUT || '300000', 10),
        max_retries: parseInt(process.env.MAX_RETRIES || '3', 10),
        screenshot_resolution: process.env.SCREENSHOT_RESOLUTION || '1920x1080',
      },
      output: {
        dir: process.env.OUTPUT_DIR || './output',
      },
      logging: {
        level: (process.env.LOG_LEVEL || 'info') as LogLevel,
      },
    };
    try {
      configInstance = ConfigSchema.parse(env);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        throw new Error(`Configuration validation failed: ${errors}`);
      }
      throw error;
    }
  }
  return configInstance;
}

/**
 * Resets configuration instance (useful for testing)
 */
export function resetConfig(): void {
  configInstance = null;
}

