/**
 * Prompt Builder
 * 
 * Constructs LLM prompts from evidence (screenshots, logs, etc.)
 */

import { TestEvidence } from '../core/types.js';
import { log } from '../utils/logger.js';
import { existsSync } from 'fs';

/**
 * Prompt Builder class
 */
export class PromptBuilder {
  /**
   * Build prompt from evidence
   * 
   * @param evidence - Test evidence
   * @returns Formatted prompt string
   */
  buildPrompt(evidence: TestEvidence): string {
    log.info('Building prompt from evidence', {
      sessionId: evidence.session_id,
      screenshots: evidence.screenshots.length,
      logs: evidence.console_logs.length,
      errors: evidence.errors.length,
    });

    const prompt = `
You are an expert game QA analyst. Analyze the provided evidence and evaluate the game's playability.

GAME URL: ${evidence.game_url}
SESSION ID: ${evidence.session_id}
TEST DURATION: ${evidence.test_duration_seconds} seconds

SCREENSHOTS:
${this.formatScreenshots(evidence.screenshots)}

CONSOLE LOGS:
${this.formatConsoleLogs(evidence.console_logs)}

ERRORS:
${this.formatErrors(evidence.errors)}

UI DETECTION:
${this.formatUIDetection(evidence.ui_detection)}

INTERACTIONS:
${this.formatInteractions(evidence.interactions)}

Please evaluate the game and provide a JSON response with the following structure:
{
  "load_successful": {
    "result": true/false,
    "confidence": 0.0-1.0
  },
  "controls_responsive": {
    "result": true/false,
    "confidence": 0.0-1.0
  },
  "no_crashes": {
    "result": true/false,
    "confidence": 0.0-1.0
  },
  "playability_score": 0-100,
  "issues": ["issue1", "issue2"],
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}

Evaluation Criteria:
1. load_successful: Did the game load and display properly?
2. controls_responsive: Are the controls (buttons, keyboard) working?
3. no_crashes: Did the game run without JavaScript errors or crashes?
4. playability_score: Overall score 0-100 (0 = unplayable, 100 = fully playable)
5. issues: List any problems found
6. confidence: How confident are you in this evaluation (0.0-1.0)
`;

    return prompt.trim();
  }

  /**
   * Format screenshots for prompt
   * 
   * @param screenshots - Array of screenshots
   * @returns Formatted string
   */
  private formatScreenshots(screenshots: TestEvidence['screenshots']): string {
    if (screenshots.length === 0) {
      return 'No screenshots available';
    }

    return screenshots
      .map(
        (screenshot) =>
          `Screenshot ${screenshot.index}: ${screenshot.description}\n` +
          `  Timestamp: ${screenshot.timestamp}\n` +
          `  Path: ${screenshot.file_path}\n` +
          (existsSync(screenshot.file_path)
            ? '  Status: Available'
            : '  Status: File not found')
      )
      .join('\n');
  }

  /**
   * Format console logs for prompt
   * 
   * @param logs - Array of console logs
   * @returns Formatted string
   */
  private formatConsoleLogs(logs: TestEvidence['console_logs']): string {
    if (logs.length === 0) {
      return 'No console logs';
    }

    // Limit to last 20 logs to avoid token limits
    const recentLogs = logs.slice(-20);

    return recentLogs
      .map(
        (log) =>
          `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`
      )
      .join('\n');
  }

  /**
   * Format errors for prompt
   * 
   * @param errors - Array of error logs
   * @returns Formatted string
   */
  private formatErrors(errors: TestEvidence['errors']): string {
    if (errors.length === 0) {
      return 'No errors detected';
    }

    return errors
      .map(
        (error) =>
          `[${error.timestamp}] [${error.type}] ${error.message}\n` +
          (error.stack ? `  Stack: ${error.stack}\n` : '') +
          (error.source ? `  Source: ${error.source}\n` : '')
      )
      .join('\n---\n');
  }

  /**
   * Format UI detection for prompt
   * 
   * @param uiDetection - UI detection result
   * @returns Formatted string
   */
  private formatUIDetection(uiDetection: TestEvidence['ui_detection']): string {
    if (!uiDetection) {
      return 'No UI elements detected';
    }

    return (
      `Buttons: ${uiDetection.buttons.length}\n` +
      `  ${uiDetection.buttons.map((b) => b.text || b.selector).join(', ')}\n` +
      `Canvas: ${uiDetection.canvas.length}\n` +
      `Menus: ${uiDetection.menus.length}\n` +
      `Detected at: ${uiDetection.detected_at}`
    );
  }

  /**
   * Format interactions for prompt
   * 
   * @param interactions - Array of interactions
   * @returns Formatted string
   */
  private formatInteractions(
    interactions: TestEvidence['interactions']
  ): string {
    if (interactions.length === 0) {
      return 'No interactions performed';
    }

    const successful = interactions.filter((i) => i.success).length;
    const failed = interactions.filter((i) => !i.success).length;

    return (
      `Total interactions: ${interactions.length}\n` +
      `Successful: ${successful}\n` +
      `Failed: ${failed}\n` +
      `Interactions:\n` +
      interactions
        .map(
          (i) =>
            `  [${i.timestamp}] ${i.type} ${i.action || ''} ${i.target || ''} - ${i.success ? 'SUCCESS' : 'FAILED'}`
        )
        .join('\n')
    );
  }
}

