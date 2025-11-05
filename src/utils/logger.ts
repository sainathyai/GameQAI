/**
 * Logger Utility
 * 
 * Provides structured logging using Winston
 * Supports multiple log levels and JSON output format
 */

import { existsSync, mkdirSync } from 'fs';
import winston from 'winston';
import { LogLevel, AppConfig } from '../core/types.js';
import { getConfig } from '../core/ConfigManager.js';

// Ensure logs directory exists
if (!existsSync('logs')) {
  mkdirSync('logs', { recursive: true });
}

/**
 * Logger instance
 */
let loggerInstance: winston.Logger | null = null;

/**
 * Creates and configures Winston logger
 * 
 * @param config - Application configuration (optional, uses getConfig if not provided)
 * @returns Configured Winston logger instance
 */
export function createLogger(config?: AppConfig): winston.Logger {
  const appConfig = config || getConfig();

  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );

  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length
        ? ` ${JSON.stringify(meta)}`
        : '';
      return `${timestamp} [${level}]: ${message}${metaStr}`;
    })
  );

  return winston.createLogger({
    level: appConfig.logging.level,
    format: logFormat,
    defaultMeta: { service: 'gameqai' },
    transports: [
      // Console output with colorized format
      new winston.transports.Console({
        format: consoleFormat,
      }),
      // File output with JSON format
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: logFormat,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: logFormat,
      }),
    ],
  });
}

/**
 * Gets logger instance (singleton pattern)
 * 
 * @returns Logger instance
 */
export function getLogger(): winston.Logger {
  if (!loggerInstance) {
    loggerInstance = createLogger();
  }
  return loggerInstance;
}

/**
 * Resets logger instance (useful for testing)
 */
export function resetLogger(): void {
  loggerInstance = null;
}

/**
 * Logging helper functions
 */
export const log = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    getLogger().debug(message, meta);
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    getLogger().info(message, meta);
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    getLogger().warn(message, meta);
  },
  error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
    if (error instanceof Error) {
      getLogger().error(message, { error: error.message, stack: error.stack, ...meta });
    } else {
      getLogger().error(message, { error, ...meta });
    }
  },
};

// Export logger instance getter for advanced usage
export { getLogger as logger };

