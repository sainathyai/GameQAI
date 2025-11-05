/**
 * AI Evaluator
 * 
 * Integrates with OpenAI SDK to evaluate game playability
 * based on screenshots, logs, and evidence
 */

import OpenAI from 'openai';
import { getConfig } from '../core/ConfigManager.js';
import { log } from '../utils/logger.js';
import { GameQAError, ErrorType, TestEvidence, EvaluationResult } from '../core/types.js';

/**
 * AI Evaluator class
 */
export class AIEvaluator {
  private openai: OpenAI;
  private config = getConfig();

  constructor() {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: this.config.openai.api_key,
    });

    // Validate API key
    if (!this.config.openai.api_key) {
      throw new GameQAError(
        ErrorType.VALIDATION_ERROR,
        'OpenAI API key is required'
      );
    }

    log.info('AI Evaluator initialized', { model: this.config.openai.model });
  }

  /**
   * Evaluate evidence using LLM
   * 
   * @param evidence - Test evidence (screenshots, logs, etc.)
   * @param prompt - Formatted prompt (from PromptBuilder)
   * @returns Promise that resolves with evaluation result
   */
  async evaluate(
    evidence: TestEvidence,
    prompt: string
  ): Promise<EvaluationResult> {
    try {
      log.info('Starting AI evaluation', {
        sessionId: evidence.session_id,
        screenshots: evidence.screenshots.length,
        errors: evidence.errors.length,
      });

      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: this.config.openai.model,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert game QA analyst. Analyze the provided evidence and evaluate game playability.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 1000,
      });

      // Parse response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new GameQAError(
          ErrorType.LLM_FAILURE,
          'No response from LLM'
        );
      }

      const evaluation = this.parseResponse(content);

      log.info('AI evaluation completed', {
        playabilityScore: evaluation.playability_score,
        confidence: evaluation.confidence,
      });

      return evaluation;
    } catch (error) {
      log.error('AI evaluation failed', error);

      if (error instanceof GameQAError) {
        throw error;
      }

      // Fallback to heuristic evaluation
      log.warn('Falling back to heuristic evaluation');
      return this.heuristicEvaluation(evidence);
    }
  }

  /**
   * Parse LLM response into EvaluationResult
   * 
   * @param response - JSON response from LLM
   * @returns Parsed evaluation result
   */
  private parseResponse(response: string): EvaluationResult {
    try {
      const parsed = JSON.parse(response);

      // Validate structure
      const evaluation: EvaluationResult = {
        load_successful: {
          result: parsed.load_successful?.result ?? false,
          confidence: parsed.load_successful?.confidence ?? 0.5,
        },
        controls_responsive: {
          result: parsed.controls_responsive?.result ?? false,
          confidence: parsed.controls_responsive?.confidence ?? 0.5,
        },
        no_crashes: {
          result: parsed.no_crashes?.result ?? false,
          confidence: parsed.no_crashes?.confidence ?? 0.5,
        },
        playability_score: parsed.playability_score ?? 0,
        issues: parsed.issues ?? [],
        confidence: parsed.confidence ?? 0.5,
        reasoning: parsed.reasoning,
      };

      // Validate confidence scores
      if (evaluation.confidence < 0 || evaluation.confidence > 1) {
        evaluation.confidence = 0.5;
      }

      if (evaluation.playability_score < 0 || evaluation.playability_score > 100) {
        evaluation.playability_score = Math.max(0, Math.min(100, evaluation.playability_score));
      }

      return evaluation;
    } catch (error) {
      log.error('Failed to parse LLM response', error);
      throw new GameQAError(
        ErrorType.LLM_FAILURE,
        `Failed to parse LLM response: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Heuristic evaluation fallback
   * 
   * @param evidence - Test evidence
   * @returns Evaluation result based on heuristics
   */
  private heuristicEvaluation(evidence: TestEvidence): EvaluationResult {
    log.info('Using heuristic evaluation fallback');

    // Calculate heuristics
    const errorCount = evidence.errors.length;
    const hasScreenshots = evidence.screenshots.length > 0;
    const hasInteractions = evidence.interactions.length > 0;

    // Determine results
    const loadSuccessful = hasScreenshots && !errorCount;
    const controlsResponsive = hasInteractions && evidence.interactions.some((i) => i.success);
    const noCrashes = errorCount === 0;

    // Calculate scores
    let playabilityScore = 0;
    if (loadSuccessful) playabilityScore += 30;
    if (controlsResponsive) playabilityScore += 40;
    if (noCrashes) playabilityScore += 30;

    const confidence = Math.min(0.6, playabilityScore / 100);

    const issues: string[] = [];
    if (!loadSuccessful) issues.push('Game may not have loaded successfully');
    if (!controlsResponsive) issues.push('Controls may not be responsive');
    if (!noCrashes) issues.push(`Detected ${errorCount} errors`);

    return {
      load_successful: {
        result: loadSuccessful,
        confidence: loadSuccessful ? 0.7 : 0.3,
      },
      controls_responsive: {
        result: controlsResponsive,
        confidence: controlsResponsive ? 0.7 : 0.3,
      },
      no_crashes: {
        result: noCrashes,
        confidence: noCrashes ? 0.8 : 0.2,
      },
      playability_score: playabilityScore,
      issues,
      confidence,
      reasoning: 'Heuristic evaluation based on evidence counts',
    };
  }
}

