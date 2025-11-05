/**
 * Error Utilities
 * 
 * Error handling utilities and retry logic
 */

import { GameQAError, ErrorType } from '../core/types.js';
import { log } from './logger.js';

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  delay: number;
  backoff?: 'linear' | 'exponential';
  factor?: number;
}

/**
 * Default retry configurations by error type
 */
const RETRY_CONFIGS: Record<ErrorType, RetryConfig> = {
  [ErrorType.BROWSER_CRASH]: {
    maxRetries: 2,
    delay: 5000,
    backoff: 'linear',
  },
  [ErrorType.API_FAILURE]: {
    maxRetries: 2,
    delay: 2000,
    backoff: 'exponential',
    factor: 2,
  },
  [ErrorType.NETWORK_ERROR]: {
    maxRetries: 3,
    delay: 3000,
    backoff: 'linear',
  },
  [ErrorType.TIMEOUT]: {
    maxRetries: 1,
    delay: 1000,
    backoff: 'linear',
  },
  [ErrorType.VALIDATION_ERROR]: {
    maxRetries: 0,
    delay: 0,
  },
  [ErrorType.SCREENSHOT_FAILURE]: {
    maxRetries: 0,
    delay: 0,
  },
  [ErrorType.LLM_FAILURE]: {
    maxRetries: 2,
    delay: 2000,
    backoff: 'exponential',
    factor: 2,
  },
  [ErrorType.FATAL]: {
    maxRetries: 0,
    delay: 0,
  },
};

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Function to retry
 * @param config - Retry configuration
 * @returns Promise that resolves with function result
 */
export async function retry<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < config.maxRetries) {
        const delay = calculateDelay(config, attempt);
        log.warn(`Retry attempt ${attempt + 1}/${config.maxRetries}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          delay,
        });
        await wait(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Retry with error type detection
 * 
 * @param fn - Function to retry
 * @param errorType - Error type for retry configuration
 * @returns Promise that resolves with function result
 */
export async function retryWithType<T>(
  fn: () => Promise<T>,
  errorType: ErrorType
): Promise<T> {
  const config = RETRY_CONFIGS[errorType];
  return retry(fn, config);
}

/**
 * Calculate delay for retry
 * 
 * @param config - Retry configuration
 * @param attempt - Current attempt number
 * @returns Delay in milliseconds
 */
function calculateDelay(config: RetryConfig, attempt: number): number {
  if (config.backoff === 'exponential') {
    const factor = config.factor || 2;
    return config.delay * Math.pow(factor, attempt);
  }
  return config.delay;
}

/**
 * Wait for specified duration
 * 
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after wait
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Handle error with appropriate retry logic
 * 
 * @param error - Error to handle
 * @param fn - Function to retry
 * @returns Promise that resolves with function result or throws error
 */
export async function handleErrorWithRetry<T>(
  error: unknown,
  fn: () => Promise<T>
): Promise<T> {
  if (error instanceof GameQAError) {
    log.info('Handling error with retry', {
      type: error.type,
      message: error.message,
    });
    return retryWithType(fn, error.type);
  }

  // Unknown error type, throw immediately
  throw error;
}

