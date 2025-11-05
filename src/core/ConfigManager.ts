/**
 * Configuration Manager
 * 
 * Handles loading and validation of application configuration
 * from environment variables and default values.
 */

import { z } from 'zod';
import { AppConfig, LogLevel } from './types.js';

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

type ConfigInput = z.infer<typeof ConfigSchema>;

/**
 * Loads and validates configuration from environment variables
 * 
 * @returns Validated configuration object
 * @throws Error if required configuration is missing or invalid
 */
export function loadConfig(): AppConfig {
  // Load environment variables
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
 */
let configInstance: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}

/**
 * Resets configuration instance (useful for testing)
 */
export function resetConfig(): void {
  configInstance = null;
}

