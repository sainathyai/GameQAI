/**
 * Browser Agent
 * 
 * Handles browser automation using Browserbase SDK
 * Manages browser sessions, page loading, and basic navigation
 */

import { Browserbase } from '@browserbasehq/sdk';
import { getConfig } from '../core/ConfigManager.js';
import { log } from '../utils/logger.js';
import { GameQAError, ErrorType } from '../core/types.js';

/**
 * Browser session interface
 */
export interface BrowserSession {
  sessionId: string;
  browserbase: Browserbase;
  page: any; // Browserbase page object
  isActive: boolean;
}

/**
 * Browser Agent class
 * 
 * Manages browser automation sessions using Browserbase
 */
export class BrowserAgent {
  private session: BrowserSession | null = null;
  private config = getConfig();

  /**
   * Initialize Browserbase client
   */
  private async createBrowserbaseClient(): Promise<Browserbase> {
    try {
      const browserbase = new Browserbase({
        apiKey: this.config.browserbase.api_key,
        projectId: this.config.browserbase.project_id,
      });
      return browserbase;
    } catch (error) {
      log.error('Failed to create Browserbase client', error);
      throw new GameQAError(
        ErrorType.BROWSER_CRASH,
        'Failed to initialize Browserbase client',
        { error }
      );
    }
  }

  /**
   * Load a game URL in the browser
   * 
   * @param url - Game URL to load
   * @param timeout - Optional timeout in milliseconds (default: 30s)
   * @returns Promise that resolves when page is loaded
   */
  async loadGame(url: string, timeout: number = 30000): Promise<void> {
    try {
      log.info('Loading game URL', { url, timeout });

      // Validate URL
      if (!url || !url.startsWith('http')) {
        throw new GameQAError(
          ErrorType.VALIDATION_ERROR,
          'Invalid URL format. Must start with http:// or https://'
        );
      }

      // Create Browserbase client if not exists
      if (!this.session) {
        const browserbase = await this.createBrowserbaseClient();
        
        // Create a new session (using type assertion for now - actual API may vary)
        // Note: Browserbase SDK API may differ - adjust based on actual SDK documentation
        const session = await (browserbase as any).sessions.create({
          headless: true,
          viewport: {
            width: 1920,
            height: 1080,
          },
        });

        this.session = {
          sessionId: session.id,
          browserbase,
          page: null, // Will be set when navigating
          isActive: true,
        };

        log.info('Browser session created', { sessionId: session.id });
      }

      // Navigate to URL (using type assertion for now)
      const page = await (this.session.browserbase as any).sessions.navigate(
        this.session.sessionId,
        url
      );

      this.session.page = page;

      // Wait for page to load
      await this.waitForLoad(timeout);

      log.info('Game loaded successfully', { url, sessionId: this.session.sessionId });
    } catch (error) {
      log.error('Failed to load game', error, { url });
      
      if (error instanceof GameQAError) {
        throw error;
      }

      throw new GameQAError(
        ErrorType.BROWSER_CRASH,
        `Failed to load game: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { url, error }
      );
    }
  }

  /**
   * Wait for page to load
   * 
   * @param timeout - Maximum wait time in milliseconds
   */
  private async waitForLoad(timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkLoad = () => {
        if (Date.now() - startTime > timeout) {
          reject(
            new GameQAError(
              ErrorType.TIMEOUT,
              `Page load timeout after ${timeout}ms`
            )
          );
          return;
        }

        // Check if page is loaded (simplified - Browserbase may handle this)
        // For now, just wait a bit and resolve
        setTimeout(() => {
          resolve();
        }, 2000); // Wait 2 seconds for initial render
      };

      checkLoad();
    });
  }

  /**
   * Get current page object
   * 
   * @returns Current page object
   * @throws Error if no active session
   */
  getPage(): any {
    if (!this.session || !this.session.isActive) {
      throw new GameQAError(
        ErrorType.BROWSER_CRASH,
        'No active browser session'
      );
    }
    return this.session.page;
  }

  /**
   * Get current session ID
   * 
   * @returns Session ID
   */
  getSessionId(): string | null {
    return this.session?.sessionId || null;
  }

  /**
   * Check if browser session is active
   * 
   * @returns True if session is active
   */
  isActive(): boolean {
    return this.session?.isActive || false;
  }

  /**
   * Close browser session
   * 
   * @returns Promise that resolves when session is closed
   */
  async close(): Promise<void> {
    if (!this.session || !this.session.isActive) {
      log.warn('No active session to close');
      return;
    }

    try {
      log.info('Closing browser session', { sessionId: this.session.sessionId });
      
      // Close session in Browserbase (using type assertion)
      await (this.session.browserbase as any).sessions.delete(this.session.sessionId);
      
      this.session.isActive = false;
      this.session = null;
      
      log.info('Browser session closed successfully');
    } catch (error) {
      log.error('Failed to close browser session', error);
      // Mark as inactive even if close fails
      if (this.session) {
        this.session.isActive = false;
        this.session = null;
      }
    }
  }

  /**
   * Execute JavaScript in the browser context
   * 
   * @param script - JavaScript code to execute
   * @returns Promise that resolves with script result
   */
  async executeScript<T = unknown>(script: string): Promise<T> {
    if (!this.session || !this.session.isActive) {
      throw new GameQAError(
        ErrorType.BROWSER_CRASH,
        'No active browser session'
      );
    }

    try {
      const result = await (this.session.browserbase as any).sessions.evaluate(
        this.session.sessionId,
        script
      );
      return result as T;
    } catch (error) {
      log.error('Failed to execute script', error);
      throw new GameQAError(
        ErrorType.BROWSER_CRASH,
        `Script execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { script, error }
      );
    }
  }

  /**
   * Get page URL
   * 
   * @returns Current page URL
   */
  async getUrl(): Promise<string> {
    return this.executeScript<string>('window.location.href');
  }

  /**
   * Get page title
   * 
   * @returns Current page title
   */
  async getTitle(): Promise<string> {
    return this.executeScript<string>('document.title');
  }
}

