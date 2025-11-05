/**
 * Score Calculator
 * 
 * Calculates confidence scores and combines LLM evaluation with heuristics
 */

import { EvaluationResult, TestEvidence } from '../core/types.js';
import { log } from '../utils/logger.js';

/**
 * Score Calculator class
 */
export class ScoreCalculator {
  /**
   * Calculate combined confidence score
   * 
   * @param llmEvaluation - LLM evaluation result
   * @param evidence - Test evidence
   * @returns Combined confidence score (0-1)
   */
  calculateConfidence(
    llmEvaluation: EvaluationResult,
    evidence: TestEvidence
  ): number {
    const llmConfidence = llmEvaluation.confidence;

    // Calculate heuristic confidence
    const heuristicConfidence = this.calculateHeuristicConfidence(evidence);

    // Combine: 70% LLM, 30% heuristics
    const combinedConfidence = llmConfidence * 0.7 + heuristicConfidence * 0.3;

    log.info('Confidence calculated', {
      llmConfidence,
      heuristicConfidence,
      combinedConfidence,
    });

    return Math.max(0, Math.min(1, combinedConfidence));
  }

  /**
   * Calculate heuristic confidence based on evidence
   * 
   * @param evidence - Test evidence
   * @returns Heuristic confidence score (0-1)
   */
  private calculateHeuristicConfidence(evidence: TestEvidence): number {
    let score = 0;
    let maxScore = 0;

    // Screenshots (20 points)
    maxScore += 20;
    if (evidence.screenshots.length >= 5) {
      score += 20;
    } else if (evidence.screenshots.length >= 3) {
      score += 15;
    } else if (evidence.screenshots.length >= 1) {
      score += 10;
    }

    // Console logs (15 points)
    maxScore += 15;
    if (evidence.console_logs.length > 0) {
      score += 15;
    }

    // No errors (25 points)
    maxScore += 25;
    if (evidence.errors.length === 0) {
      score += 25;
    } else if (evidence.errors.length <= 2) {
      score += 15;
    } else {
      score += 5;
    }

    // UI detection (20 points)
    maxScore += 20;
    if (evidence.ui_detection) {
      if (evidence.ui_detection.buttons.length > 0 || evidence.ui_detection.canvas.length > 0) {
        score += 20;
      } else {
        score += 10;
      }
    }

    // Interactions (20 points)
    maxScore += 20;
    if (evidence.interactions.length > 0) {
      const successRate =
        evidence.interactions.filter((i) => i.success).length /
        evidence.interactions.length;
      score += successRate * 20;
    }

    return score / maxScore;
  }

  /**
   * Determine test status from evaluation
   * 
   * @param evaluation - Evaluation result
   * @param confidence - Combined confidence score
   * @returns Test status
   */
  determineStatus(evaluation: EvaluationResult, confidence: number): 'pass' | 'fail' | 'partial' {
    const minConfidence = 0.6;
    const minScore = 70;

    if (confidence < minConfidence) {
      return 'partial';
    }

    if (evaluation.playability_score >= minScore) {
      // Check all criteria
      const allPass =
        evaluation.load_successful.result &&
        evaluation.controls_responsive.result &&
        evaluation.no_crashes.result;

      if (allPass) {
        return 'pass';
      } else {
        return 'partial';
      }
    }

    return 'fail';
  }
}

