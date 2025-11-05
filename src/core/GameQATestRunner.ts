/**
 * Game QA Test Runner
 * 
 * Main orchestrator that coordinates all components
 * to execute end-to-end game testing
 */

import { BrowserAgent } from '../browser/BrowserAgent.js';
import { UIPatternDetector } from '../browser/UIPatternDetector.js';
import { InteractionHandler } from '../browser/InteractionHandler.js';
import { EvidenceCapture } from '../capture/EvidenceCapture.js';
import { ConsoleLogger } from '../capture/ConsoleLogger.js';
import { ArtifactStorage } from '../capture/ArtifactStorage.js';
import { AIEvaluator } from '../evaluation/AIEvaluator.js';
import { PromptBuilder } from '../evaluation/PromptBuilder.js';
import { ReportBuilder } from '../reporting/ReportBuilder.js';
import {
  TestResult,
  TestEvidence,
  TestOptions,
  TestStatus,
  UIDetectionResult,
} from './types.js';
import { getConfig } from './ConfigManager.js';
import { log } from '../utils/logger.js';
import { GameQAError, ErrorType } from './types.js';
import { retryWithType } from '../utils/errors.js';

/**
 * Game QA Test Runner class
 */
export class GameQATestRunner {
  private config = getConfig();
  private browserAgent: BrowserAgent;
  private uiDetector: UIPatternDetector;
  private interactionHandler: InteractionHandler;
  private evidenceCapture: EvidenceCapture;
  private consoleLogger: ConsoleLogger;
  private artifactStorage: ArtifactStorage;
  private aiEvaluator: AIEvaluator;
  private promptBuilder: PromptBuilder;
  private reportBuilder: ReportBuilder;

  private sessionId: string;
  private startTime: number = 0;

  constructor() {
    this.browserAgent = new BrowserAgent();
    this.uiDetector = new UIPatternDetector(this.browserAgent);
    this.interactionHandler = new InteractionHandler(this.browserAgent);
    this.artifactStorage = new ArtifactStorage();
    this.sessionId = this.artifactStorage.getSessionId();
    this.evidenceCapture = new EvidenceCapture(
      this.browserAgent,
      this.config.output.dir
    );
    this.consoleLogger = new ConsoleLogger(this.browserAgent);
    this.aiEvaluator = new AIEvaluator();
    this.promptBuilder = new PromptBuilder();
    this.reportBuilder = new ReportBuilder();
  }

  /**
   * Run complete test execution
   * 
   * @param url - Game URL to test
   * @param options - Test options (timeout, retries, etc.)
   * @returns Promise that resolves with test result
   */
  async run(url: string, options: TestOptions = {}): Promise<TestResult> {
    this.startTime = Date.now();
    const timeout = options.timeout || this.config.test.default_timeout;
    const maxRetries = options.max_retries || this.config.test.max_retries;

    log.info('Starting game QA test', {
      url,
      sessionId: this.sessionId,
      timeout,
      maxRetries,
    });

    try {
      // Step 1: Load game (with retry)
      await retryWithType(
        () => this.loadGame(url, timeout),
        ErrorType.BROWSER_CRASH
      );

      // Step 2: Capture initial screenshot
      await this.captureInitialScreenshot();

      // Step 3: Detect UI patterns
      const uiDetection = await this.detectUI();

      // Step 4: Start console logging
      await this.consoleLogger.startListening();

      // Step 5: Execute interactions
      await this.executeInteractions(uiDetection);

      // Step 6: Capture evidence (screenshots, logs)
      const evidence = await this.captureEvidence(uiDetection);

      // Step 7: Evaluate with AI
      const evaluation = await this.evaluateEvidence(evidence);

      // Step 8: Build report
      const report = await this.buildReport(evidence, evaluation);

      // Step 9: Save artifacts
      await this.saveArtifacts(evidence, report);

      log.info('Test execution completed', {
        status: report.status,
        score: report.playability_score,
        confidence: report.confidence,
      });

      return report;
    } catch (error) {
      log.error('Test execution failed', error);
      return this.handleError(error, url);
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  /**
   * Load game in browser
   */
  private async loadGame(url: string, timeout: number): Promise<void> {
    log.info('Loading game', { url });
    await this.browserAgent.loadGame(url, timeout);
  }

  /**
   * Capture initial screenshot
   */
  private async captureInitialScreenshot(): Promise<void> {
    log.info('Capturing initial screenshot');
    await this.evidenceCapture.takeScreenshot(
      0,
      'Initial page load',
      this.sessionId
    );
  }

  /**
   * Detect UI patterns
   */
  private async detectUI(): Promise<UIDetectionResult | null> {
    log.info('Detecting UI patterns');
    try {
      const result = await this.uiDetector.detect();
      log.info('UI detection completed', {
        buttons: result.buttons.length,
        canvas: result.canvas.length,
        menus: result.menus.length,
      });
      return result;
    } catch (error) {
      log.warn('UI detection failed, continuing', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Execute game interactions
   */
  private async executeInteractions(
    uiDetection: UIDetectionResult | null
  ): Promise<void> {
    log.info('Executing interactions');

    // Find and click start/play button
    if (uiDetection && uiDetection.buttons.length > 0) {
      const startButton = uiDetection.buttons.find(
        (btn) =>
          btn.text?.toLowerCase().includes('start') ||
          btn.text?.toLowerCase().includes('play')
      );

      if (startButton) {
        try {
          await this.interactionHandler.click(startButton);
          await this.evidenceCapture.takeScreenshot(
            1,
            'After UI detection and start button click',
            this.sessionId
          );
        } catch (error) {
          log.warn('Failed to click start button', { error: error instanceof Error ? error.message : String(error) });
        }
      }
    }

    // Wait a bit
    await this.wait(2000);

    // Simulate some gameplay interactions
    const interactions = [
      { type: 'keyboard' as const, key: 'ArrowUp' },
      { type: 'wait' as const, duration: 1000 },
      { type: 'keyboard' as const, key: 'ArrowRight' },
      { type: 'wait' as const, duration: 1000 },
      { type: 'keyboard' as const, key: 'Space' },
      { type: 'wait' as const, duration: 2000 },
    ];

    await this.interactionHandler.executeSequence(interactions, 2000);

    // Capture mid-gameplay screenshot
    await this.evidenceCapture.takeScreenshot(
      2,
      'Mid-gameplay interaction',
      this.sessionId
    );

    // Wait for final state
    await this.wait(3000);

    // Capture final screenshot
    await this.evidenceCapture.takeScreenshot(
      3,
      'Final game state',
      this.sessionId
    );
  }

  /**
   * Capture all evidence
   */
  private async captureEvidence(
    uiDetection: UIDetectionResult | null
  ): Promise<TestEvidence> {
    log.info('Capturing evidence');

    // Collect console logs
    const { consoleLogs, errorLogs } = await this.consoleLogger.collectLogs();

    // Get screenshots
    const screenshots = this.evidenceCapture.getScreenshots();

    // Get interactions
    const interactions = this.interactionHandler.getInteractions();

    // Calculate test duration
    const testDuration = (Date.now() - this.startTime) / 1000;

    const evidence: TestEvidence = {
      session_id: this.sessionId,
      game_url: await this.browserAgent.getUrl() || '',
      screenshots,
      console_logs: consoleLogs,
      errors: errorLogs,
      ui_detection: uiDetection,
      interactions,
      test_duration_seconds: testDuration,
      timestamp: new Date().toISOString(),
    };

    return evidence;
  }

  /**
   * Evaluate evidence with AI
   */
  private async evaluateEvidence(evidence: TestEvidence) {
    log.info('Evaluating evidence with AI');

    // Build prompt
    const prompt = this.promptBuilder.buildPrompt(evidence);

    // Evaluate with AI
    const evaluation = await this.aiEvaluator.evaluate(evidence, prompt);

    return evaluation;
  }

  /**
   * Build test report
   */
  private async buildReport(evidence: TestEvidence, evaluation: any) {
    log.info('Building test report');
    return this.reportBuilder.build(evidence, evaluation);
  }

  /**
   * Save artifacts to disk
   */
  private async saveArtifacts(evidence: TestEvidence, report: TestResult) {
    log.info('Saving artifacts');

    // Save console logs
    this.artifactStorage.saveConsoleLogs(evidence.console_logs);

    // Save error logs
    this.artifactStorage.saveErrorLogs(evidence.errors);

    // Save metadata
    this.artifactStorage.saveMetadata({
      session_id: evidence.session_id,
      game_url: evidence.game_url,
      test_duration_seconds: evidence.test_duration_seconds,
      timestamp: evidence.timestamp,
    });

    // Save report (convert to plain object for JSON)
    this.artifactStorage.saveReport(report as unknown as Record<string, unknown>);
  }

  /**
   * Handle errors during test execution
   */
  private handleError(error: unknown, url: string): TestResult {
    const testDuration = (Date.now() - this.startTime) / 1000;

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorType =
      error instanceof GameQAError ? error.type : ErrorType.FATAL;

      log.error('Test execution error', error instanceof Error ? error : new Error(String(error)), {
        url,
        errorType: String(errorType),
        duration: testDuration,
      } as Record<string, unknown>);

    return {
      status: 'error' as TestStatus,
      playability_score: 0,
      confidence: 0,
      timestamp: new Date().toISOString(),
      game_url: url,
      session_id: this.sessionId,
      test_duration_seconds: testDuration,
      evaluations: {
        load_successful: { result: false, confidence: 0 },
        controls_responsive: { result: false, confidence: 0 },
        no_crashes: { result: false, confidence: 0 },
      },
      issues: [`Test execution failed: ${errorMessage}`],
      screenshots: [],
      metadata: {
        interactions_count: 0,
        errors_count: 1,
        screenshots_count: 0,
        ui_elements_detected: 0,
      },
    };
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    log.info('Cleaning up resources');
    try {
      await this.browserAgent.close();
    } catch (error) {
      log.warn('Cleanup failed', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Wait for specified duration
   */
  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

