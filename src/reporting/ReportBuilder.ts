/**
 * Report Builder
 * 
 * Generates structured JSON reports from test evidence and evaluation
 */

import {
  TestResult,
  TestEvidence,
  EvaluationResult,
  TestStatus,
  TestMetadata,
} from '../core/types.js';
import { log } from '../utils/logger.js';
import { ScoreCalculator } from '../evaluation/ScoreCalculator.js';

/**
 * Report Builder class
 */
export class ReportBuilder {
  private scoreCalculator: ScoreCalculator;

  constructor() {
    this.scoreCalculator = new ScoreCalculator();
  }

  /**
   * Build test report
   * 
   * @param evidence - Test evidence
   * @param evaluation - Evaluation result
   * @returns Test result report
   */
  build(evidence: TestEvidence, evaluation: EvaluationResult): TestResult {
    log.info('Building test report', {
      sessionId: evidence.session_id,
      playabilityScore: evaluation.playability_score,
    });

    // Calculate combined confidence
    const confidence = this.scoreCalculator.calculateConfidence(
      evaluation,
      evidence
    );

    // Determine status
    const status = this.scoreCalculator.determineStatus(
      evaluation,
      confidence
    ) as TestStatus;

    // Build metadata
    const metadata: TestMetadata = {
      interactions_count: evidence.interactions.length,
      errors_count: evidence.errors.length,
      screenshots_count: evidence.screenshots.length,
      ui_elements_detected:
        evidence.ui_detection?.buttons.length || 0 +
        evidence.ui_detection?.canvas.length || 0 +
        evidence.ui_detection?.menus.length || 0,
    };

    // Build report
    const report: TestResult = {
      status,
      playability_score: evaluation.playability_score,
      confidence,
      timestamp: evidence.timestamp,
      game_url: evidence.game_url,
      session_id: evidence.session_id,
      test_duration_seconds: evidence.test_duration_seconds,
      evaluations: {
        load_successful: evaluation.load_successful,
        controls_responsive: evaluation.controls_responsive,
        no_crashes: evaluation.no_crashes,
      },
      issues: evaluation.issues,
      screenshots: evidence.screenshots.map((s) => s.file_path),
      metadata,
    };

    // Validate report
    if (!this.validate(report)) {
      throw new Error('Invalid report structure');
    }

    log.info('Test report built successfully', {
      status: report.status,
      score: report.playability_score,
      confidence: report.confidence,
    });

    return report;
  }

  /**
   * Validate report structure
   * 
   * @param report - Test report
   * @returns True if valid
   */
  validate(report: TestResult): boolean {
    // Basic validation
    if (!report.status || !['pass', 'fail', 'partial', 'error'].includes(report.status)) {
      return false;
    }

    if (
      report.playability_score < 0 ||
      report.playability_score > 100
    ) {
      return false;
    }

    if (report.confidence < 0 || report.confidence > 1) {
      return false;
    }

    if (!report.game_url || !report.session_id) {
      return false;
    }

    return true;
  }

  /**
   * Convert report to JSON string
   * 
   * @param report - Test report
   * @returns JSON string
   */
  toJSON(report: TestResult): string {
    return JSON.stringify(report, null, 2);
  }
}

