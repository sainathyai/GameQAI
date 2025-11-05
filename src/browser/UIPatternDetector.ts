/**
 * UI Pattern Detector
 * 
 * Detects common UI elements in browser games
 * such as buttons, canvas, menus, etc.
 */

import { BrowserAgent } from './BrowserAgent.js';
import { UIDetectionResult, UIElement, UIElementType } from '../core/types.js';
import { log } from '../utils/logger.js';
import { GameQAError, ErrorType } from '../core/types.js';

/**
 * Common button text patterns
 */
const BUTTON_PATTERNS = [
  'start',
  'play',
  'begin',
  'new game',
  'continue',
  'next',
  'go',
  'launch',
  'enter',
  'ok',
  'yes',
];

/**
 * UI Pattern Detector class
 */
export class UIPatternDetector {
  private browserAgent: BrowserAgent;

  constructor(browserAgent: BrowserAgent) {
    this.browserAgent = browserAgent;
  }

  /**
   * Detect all UI elements on the page
   * 
   * @param timeout - Maximum time to wait for detection (default: 10s)
   * @returns Detection result with buttons, canvas, and menus
   */
  async detect(timeout: number = 10000): Promise<UIDetectionResult> {
    try {
      log.info('Starting UI pattern detection', { timeout });

      const detectionScript = `
        (function() {
          const results = {
            buttons: [],
            canvas: [],
            menus: [],
          };

          // Detect buttons
          const buttons = document.querySelectorAll('button, .btn, .button, [class*="button"], [class*="btn"], [role="button"]');
          buttons.forEach((btn, index) => {
            const text = (btn.textContent || '').toLowerCase().trim();
            const hasButtonPattern = ${JSON.stringify(BUTTON_PATTERNS)}.some(pattern => 
              text.includes(pattern)
            );
            
            if (hasButtonPattern || btn.offsetWidth > 0) {
              results.buttons.push({
                selector: \`button:nth-of-type(\${index + 1})\`,
                text: btn.textContent?.trim() || '',
                tagName: btn.tagName.toLowerCase(),
                className: btn.className || '',
                id: btn.id || '',
              });
            }
          });

          // Detect canvas elements
          const canvases = document.querySelectorAll('canvas');
          canvases.forEach((canvas, index) => {
            if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
              results.canvas.push({
                selector: \`canvas:nth-of-type(\${index + 1})\`,
                width: canvas.width,
                height: canvas.height,
                id: canvas.id || '',
              });
            }
          });

          // Detect menus (nav, menu, dropdown)
          const menus = document.querySelectorAll('nav, [class*="menu"], [class*="nav"], [role="menu"]');
          menus.forEach((menu, index) => {
            if (menu.offsetWidth > 0) {
              results.menus.push({
                selector: \`nav:nth-of-type(\${index + 1})\`,
                text: menu.textContent?.trim().substring(0, 100) || '',
                className: menu.className || '',
                id: menu.id || '',
              });
            }
          });

          return results;
        })();
      `;

      const result = await this.browserAgent.executeScript<{
        buttons: Array<{
          selector: string;
          text: string;
          tagName: string;
          className: string;
          id: string;
        }>;
        canvas: Array<{
          selector: string;
          width: number;
          height: number;
          id: string;
        }>;
        menus: Array<{
          selector: string;
          text: string;
          className: string;
          id: string;
        }>;
      }>(detectionScript);

      // Convert to UIElement format
      const buttons: UIElement[] = result.buttons.map((btn) => ({
        type: 'button' as UIElementType,
        selector: btn.selector,
        text: btn.text,
        attributes: {
          tagName: btn.tagName,
          className: btn.className,
          id: btn.id,
        },
      }));

      const canvas: UIElement[] = result.canvas.map((canvas) => ({
        type: 'canvas' as UIElementType,
        selector: canvas.selector,
        attributes: {
          width: String(canvas.width),
          height: String(canvas.height),
          id: canvas.id,
        },
      }));

      const menus: UIElement[] = result.menus.map((menu) => ({
        type: 'menu' as UIElementType,
        selector: menu.selector,
        text: menu.text,
        attributes: {
          className: menu.className,
          id: menu.id,
        },
      }));

      const detectionResult: UIDetectionResult = {
        buttons,
        canvas,
        menus,
        detected_at: new Date().toISOString(),
      };

      log.info('UI detection completed', {
        buttons: buttons.length,
        canvas: canvas.length,
        menus: menus.length,
      });

      return detectionResult;
    } catch (error) {
      log.error('UI detection failed', error);
      throw new GameQAError(
        ErrorType.BROWSER_CRASH,
        `UI detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error }
      );
    }
  }

  /**
   * Find a button by text pattern
   * 
   * @param pattern - Text pattern to search for
   * @returns First matching button or null
   */
  async findButton(pattern: string): Promise<UIElement | null> {
    const result = await this.detect();
    const lowerPattern = pattern.toLowerCase();

    return (
      result.buttons.find(
        (btn) => btn.text?.toLowerCase().includes(lowerPattern) || false
      ) || null
    );
  }

  /**
   * Get first canvas element
   * 
   * @returns First canvas element or null
   */
  async getCanvas(): Promise<UIElement | null> {
    const result = await this.detect();
    return result.canvas[0] || null;
  }
}

