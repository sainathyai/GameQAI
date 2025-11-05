/**
 * Lambda Entry Point
 * 
 * Lambda-compatible function interface for game QA testing
 * Can be imported and used in Lambda functions
 */

import { GameQATestRunner } from './core/GameQATestRunner.js';
import { TestResult, TestOptions } from './core/types.js';
import { log } from './utils/logger.js';

/**
 * Lambda handler function
 * 
 * @param event - Lambda event (URL string or object with url property)
 * @param context - Lambda context (optional)
 * @returns Promise that resolves with test result
 */
export async function handler(
  event: string | { url: string; options?: TestOptions },
  context?: unknown
): Promise<TestResult> {
  try {
    // Extract URL and options from event
    const url = typeof event === 'string' ? event : event.url;
    const options = typeof event === 'object' && 'options' in event ? event.options : {};

    if (!url || !url.startsWith('http')) {
      throw new Error('Invalid URL. Must start with http:// or https://');
    }

    log.info('Lambda handler invoked', { url, options });

    // Create test runner
    const runner = new GameQATestRunner();

    // Run test
    const result = await runner.run(url, options);

    log.info('Lambda handler completed', {
      status: result.status,
      score: result.playability_score,
    });

    return result;
  } catch (error) {
    log.error('Lambda handler failed', error);

    // Return error result
    return {
      status: 'error',
      playability_score: 0,
      confidence: 0,
      timestamp: new Date().toISOString(),
      game_url: typeof event === 'string' ? event : event.url || '',
      session_id: 'error',
      test_duration_seconds: 0,
      evaluations: {
        load_successful: { result: false, confidence: 0 },
        controls_responsive: { result: false, confidence: 0 },
        no_crashes: { result: false, confidence: 0 },
      },
      issues: [
        error instanceof Error ? error.message : 'Unknown error',
      ],
      screenshots: [],
      metadata: {
        interactions_count: 0,
        errors_count: 1,
        screenshots_count: 0,
        ui_elements_detected: 0,
      },
    };
  }
}

/**
 * Standalone test function for Lambda usage
 * 
 * @param url - Game URL to test
 * @param options - Test options
 * @returns Promise that resolves with test result
 */
export async function testGame(
  url: string,
  options?: TestOptions
): Promise<TestResult> {
  const runner = new GameQATestRunner();
  return runner.run(url, options);
}

