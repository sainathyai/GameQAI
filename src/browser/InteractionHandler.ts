/**
 * Interaction Handler
 * 
 * Handles game interactions: clicks, keyboard input, mouse movements
 */

import { BrowserAgent } from './BrowserAgent.js';
import { Interaction, InteractionType } from '../core/types.js';
import { log } from '../utils/logger.js';
import { GameQAError, ErrorType, UIElement } from '../core/types.js';

/**
 * Interaction Handler class
 */
export class InteractionHandler {
  private browserAgent: BrowserAgent;
  private interactions: Interaction[] = [];

  constructor(browserAgent: BrowserAgent) {
    this.browserAgent = browserAgent;
  }

  /**
   * Click on an element
   * 
   * @param element - UI element to click
   * @returns Promise that resolves when click is complete
   */
  async click(element: UIElement): Promise<void> {
    try {
      log.info('Clicking element', { selector: element.selector, text: element.text });

      const clickScript = `
        (function() {
          const element = document.querySelector('${element.selector}');
          if (!element) {
            throw new Error('Element not found: ${element.selector}');
          }
          element.click();
          return true;
        })();
      `;

      await this.browserAgent.executeScript(clickScript);

      this.interactions.push({
        type: 'click' as InteractionType,
        timestamp: new Date().toISOString(),
        target: element.selector,
        action: 'click',
        success: true,
      });

      // Wait for interaction to complete
      await this.wait(500);
    } catch (error) {
      log.error('Click failed', error, { element: element.selector });

      this.interactions.push({
        type: 'click' as InteractionType,
        timestamp: new Date().toISOString(),
        target: element.selector,
        action: 'click',
        success: false,
      });

      throw new GameQAError(
        ErrorType.BROWSER_CRASH,
        `Click failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { element, error }
      );
    }
  }

  /**
   * Simulate keyboard input
   * 
   * @param key - Key to press (e.g., 'ArrowUp', 'Space', 'Enter')
   * @returns Promise that resolves when key is pressed
   */
  async pressKey(key: string): Promise<void> {
    try {
      log.info('Pressing key', { key });

      const keyScript = `
        (function() {
          const event = new KeyboardEvent('keydown', {
            key: '${key}',
            code: '${key}',
            bubbles: true,
            cancelable: true,
          });
          document.dispatchEvent(event);
          
          const keyupEvent = new KeyboardEvent('keyup', {
            key: '${key}',
            code: '${key}',
            bubbles: true,
            cancelable: true,
          });
          document.dispatchEvent(keyupEvent);
          return true;
        })();
      `;

      await this.browserAgent.executeScript(keyScript);

      this.interactions.push({
        type: 'keyboard' as InteractionType,
        timestamp: new Date().toISOString(),
        action: key,
        success: true,
      });

      // Wait for key press to register
      await this.wait(300);
    } catch (error) {
      log.error('Key press failed', error, { key });

      this.interactions.push({
        type: 'keyboard' as InteractionType,
        timestamp: new Date().toISOString(),
        action: key,
        success: false,
      });

      throw new GameQAError(
        ErrorType.BROWSER_CRASH,
        `Key press failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { key, error }
      );
    }
  }

  /**
   * Click on canvas at coordinates
   * 
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns Promise that resolves when click is complete
   */
  async clickCanvas(x: number, y: number): Promise<void> {
    try {
      log.info('Clicking canvas', { x, y });

      const clickScript = `
        (function() {
          const canvas = document.querySelector('canvas');
          if (!canvas) {
            throw new Error('Canvas not found');
          }
          
          const rect = canvas.getBoundingClientRect();
          const clickX = ${x} + rect.left;
          const clickY = ${y} + rect.top;
          
          const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: clickX,
            clientY: clickY,
          });
          
          canvas.dispatchEvent(event);
          return true;
        })();
      `;

      await this.browserAgent.executeScript(clickScript);

      this.interactions.push({
        type: 'click' as InteractionType,
        timestamp: new Date().toISOString(),
        target: `canvas(${x},${y})`,
        action: 'click',
        success: true,
      });

      await this.wait(500);
    } catch (error) {
      log.error('Canvas click failed', error, { x, y });

      this.interactions.push({
        type: 'click' as InteractionType,
        timestamp: new Date().toISOString(),
        target: `canvas(${x},${y})`,
        action: 'click',
        success: false,
      });

      throw new GameQAError(
        ErrorType.BROWSER_CRASH,
        `Canvas click failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { x, y, error }
      );
    }
  }

  /**
   * Execute a sequence of interactions
   * 
   * @param actions - Array of interaction actions
   * @param delay - Delay between actions in milliseconds (default: 2000ms)
   * @returns Promise that resolves when all interactions are complete
   */
  async executeSequence(
    actions: Array<{
      type: 'click' | 'keyboard' | 'wait';
      target?: UIElement | string;
      key?: string;
      x?: number;
      y?: number;
      duration?: number;
    }>,
    delay: number = 2000
  ): Promise<void> {
    log.info('Executing interaction sequence', {
      actionCount: actions.length,
      delay,
    });

    for (const action of actions) {
      try {
        if (action.type === 'click' && action.target) {
          if (typeof action.target === 'string') {
            // Click by selector
            const element: UIElement = {
              type: 'button',
              selector: action.target,
            };
            await this.click(element);
          } else {
            await this.click(action.target);
          }
        } else if (action.type === 'keyboard' && action.key) {
          await this.pressKey(action.key);
        } else if (action.type === 'click' && action.x !== undefined && action.y !== undefined) {
          await this.clickCanvas(action.x, action.y);
        } else if (action.type === 'wait') {
          await this.wait(action.duration || delay);
        }

        // Wait between actions
        if (delay > 0) {
          await this.wait(delay);
        }
      } catch (error) {
        log.warn('Interaction in sequence failed, continuing', error, { action });
        // Continue with next action even if one fails
      }
    }

    log.info('Interaction sequence completed', {
      totalInteractions: this.interactions.length,
      successful: this.interactions.filter((i) => i.success).length,
    });
  }

  /**
   * Get all interactions performed
   * 
   * @returns Array of interactions
   */
  getInteractions(): Interaction[] {
    return [...this.interactions];
  }

  /**
   * Clear interaction history
   */
  clearInteractions(): void {
    this.interactions = [];
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

