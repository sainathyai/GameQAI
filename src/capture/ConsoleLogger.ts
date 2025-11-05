/**
 * Console Logger
 * 
 * Captures console logs and errors from the browser
 */

import { BrowserAgent } from '../browser/BrowserAgent.js';
import { ConsoleLog, ErrorLog } from '../core/types.js';
import { log } from '../utils/logger.js';
import { GameQAError, ErrorType } from '../core/types.js';

/**
 * Console Logger class
 */
export class ConsoleLogger {
  private browserAgent: BrowserAgent;
  private consoleLogs: ConsoleLog[] = [];
  private errorLogs: ErrorLog[] = [];
  private isListening: boolean = false;

  constructor(browserAgent: BrowserAgent) {
    this.browserAgent = browserAgent;
  }

  /**
   * Start listening to console logs
   * 
   * @returns Promise that resolves when listener is set up
   */
  async startListening(): Promise<void> {
    if (this.isListening) {
      log.warn('Console logger already listening');
      return;
    }

    try {
      log.info('Starting console log listener');

      // Set up console log interception
      const setupScript = `
        (function() {
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          const originalInfo = console.info;

          window.__gameqai_logs__ = [];
          window.__gameqai_errors__ = [];

          console.log = function(...args) {
            window.__gameqai_logs__.push({
              level: 'log',
              message: args.map(a => String(a)).join(' '),
              timestamp: new Date().toISOString(),
            });
            originalLog.apply(console, args);
          };

          console.info = function(...args) {
            window.__gameqai_logs__.push({
              level: 'info',
              message: args.map(a => String(a)).join(' '),
              timestamp: new Date().toISOString(),
            });
            originalInfo.apply(console, args);
          };

          console.warn = function(...args) {
            window.__gameqai_logs__.push({
              level: 'warn',
              message: args.map(a => String(a)).join(' '),
              timestamp: new Date().toISOString(),
            });
            originalWarn.apply(console, args);
          };

          console.error = function(...args) {
            window.__gameqai_logs__.push({
              level: 'error',
              message: args.map(a => String(a)).join(' '),
              timestamp: new Date().toISOString(),
            });
            originalError.apply(console, args);
          };

          window.onerror = function(message, source, lineno, colno, error) {
            window.__gameqai_errors__.push({
              type: 'error',
              message: String(message),
              source: source || '',
              stack: error?.stack || '',
              timestamp: new Date().toISOString(),
            });
          };

          window.addEventListener('unhandledrejection', function(event) {
            window.__gameqai_errors__.push({
              type: 'unhandledrejection',
              message: String(event.reason),
              stack: event.reason?.stack || '',
              timestamp: new Date().toISOString(),
            });
          });

          return true;
        })();
      `;

      await this.browserAgent.executeScript(setupScript);
      this.isListening = true;

      log.info('Console log listener started');
    } catch (error) {
      log.error('Failed to start console log listener', error);
      throw new GameQAError(
        ErrorType.BROWSER_CRASH,
        `Failed to start console logger: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error }
      );
    }
  }

  /**
   * Collect console logs from the browser
   * 
   * @returns Promise that resolves with collected logs
   */
  async collectLogs(): Promise<{ consoleLogs: ConsoleLog[]; errorLogs: ErrorLog[] }> {
    if (!this.isListening) {
      await this.startListening();
    }

    try {
      const result = await this.browserAgent.executeScript<{
        logs: Array<{
          level: string;
          message: string;
          timestamp: string;
        }>;
        errors: Array<{
          type: string;
          message: string;
          source?: string;
          stack?: string;
          timestamp: string;
        }>;
      }>(`
        (function() {
          const logs = window.__gameqai_logs__ || [];
          const errors = window.__gameqai_errors__ || [];
          
          // Clear logs after collecting
          window.__gameqai_logs__ = [];
          window.__gameqai_errors__ = [];
          
          return { logs, errors };
        })();
      `);

      // Convert to ConsoleLog format
      const consoleLogs: ConsoleLog[] = result.logs.map((log) => ({
        timestamp: log.timestamp,
        level: log.level as 'log' | 'info' | 'warn' | 'error',
        message: log.message,
      }));

      // Convert to ErrorLog format
      const errorLogs: ErrorLog[] = result.errors.map((err) => ({
        timestamp: err.timestamp,
        type: err.type,
        message: err.message,
        stack: err.stack,
        source: err.source,
      }));

      // Store logs
      this.consoleLogs.push(...consoleLogs);
      this.errorLogs.push(...errorLogs);

      log.info('Console logs collected', {
        logs: consoleLogs.length,
        errors: errorLogs.length,
      });

      return { consoleLogs, errorLogs };
    } catch (error) {
      log.error('Failed to collect console logs', error);
      return { consoleLogs: [], errorLogs: [] };
    }
  }

  /**
   * Get all collected console logs
   * 
   * @returns Array of console logs
   */
  getConsoleLogs(): ConsoleLog[] {
    return [...this.consoleLogs];
  }

  /**
   * Get all collected error logs
   * 
   * @returns Array of error logs
   */
  getErrorLogs(): ErrorLog[] {
    return [...this.errorLogs];
  }

  /**
   * Clear log history
   */
  clearLogs(): void {
    this.consoleLogs = [];
    this.errorLogs = [];
  }
}

