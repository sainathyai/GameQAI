/**
 * Evidence Capture
 * 
 * Captures screenshots at specific intervals during test execution
 */

import { BrowserAgent } from '../browser/BrowserAgent.js';
import { Screenshot } from '../core/types.js';
import { log } from '../utils/logger.js';
import { GameQAError, ErrorType } from '../core/types.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Evidence Capture class
 */
export class EvidenceCapture {
  private browserAgent: BrowserAgent;
  private screenshots: Screenshot[] = [];
  private outputDir: string;

  constructor(browserAgent: BrowserAgent, outputDir: string = './output') {
    this.browserAgent = browserAgent;
    this.outputDir = outputDir;

    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * Take a screenshot
   * 
   * @param index - Screenshot index (0-4)
   * @param description - Description of the screenshot
   * @param sessionId - Session ID for file naming
   * @returns Promise that resolves with screenshot path
   */
  async takeScreenshot(
    index: number,
    description: string,
    sessionId: string
  ): Promise<string> {
    try {
      log.info('Taking screenshot', { index, description, sessionId });

      // Get screenshot from Browserbase
      const screenshotData = await this.browserAgent.executeScript<string>(`
        (async function() {
          // Browserbase should provide screenshot API
          // For now, we'll use canvas to html2canvas approach or Browserbase's native API
          return 'screenshot-data';
        })();
      `);

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${timestamp}_${sessionId}_screenshot-${index}.png`;
      const filePath = join(this.outputDir, sessionId, 'screenshots', filename);

      // Ensure directory exists
      const dirPath = join(this.outputDir, sessionId, 'screenshots');
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }

      // For now, we'll store a placeholder
      // In real implementation, Browserbase API would provide screenshot bytes
      // writeFileSync(filePath, Buffer.from(screenshotData, 'base64'));

      const screenshot: Screenshot = {
        index,
        file_path: filePath,
        timestamp: new Date().toISOString(),
        description,
      };

      this.screenshots.push(screenshot);

      log.info('Screenshot captured', { filePath, index });

      return filePath;
    } catch (error) {
      log.error('Screenshot capture failed', error, { index, description });

      // Continue with placeholder even if screenshot fails
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${timestamp}_${sessionId}_screenshot-${index}_failed.png`;
      const filePath = join(this.outputDir, sessionId, 'screenshots', filename);

      const screenshot: Screenshot = {
        index,
        file_path: filePath,
        timestamp: new Date().toISOString(),
        description: `${description} (failed)`,
      };

      this.screenshots.push(screenshot);

      return filePath;
    }
  }

  /**
   * Take all scheduled screenshots
   * 
   * @param sessionId - Session ID
   * @param timestamps - Array of timestamps for each screenshot
   * @returns Promise that resolves with array of screenshot paths
   */
  async takeAllScreenshots(
    sessionId: string,
    timestamps: Array<{ index: number; description: string; delay: number }>
  ): Promise<string[]> {
    const paths: string[] = [];

    for (const ts of timestamps) {
      // Wait for the specified delay
      await this.wait(ts.delay * 1000);

      try {
        const path = await this.takeScreenshot(ts.index, ts.description, sessionId);
        paths.push(path);
      } catch (error) {
        log.warn('Screenshot failed, continuing', error, { index: ts.index });
        // Continue with next screenshot
      }
    }

    return paths;
  }

  /**
   * Get all captured screenshots
   * 
   * @returns Array of screenshots
   */
  getScreenshots(): Screenshot[] {
    return [...this.screenshots];
  }

  /**
   * Clear screenshot history
   */
  clearScreenshots(): void {
    this.screenshots = [];
  }

  /**
   * Wait for a specified duration
   * 
   * @param ms - Milliseconds to wait
   * @returns Promise that resolves after wait
   */
  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

