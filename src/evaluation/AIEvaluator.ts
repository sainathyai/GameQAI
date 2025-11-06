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
import { getSecretsManager } from '../utils/SecretsManager.js';

/**
 * AI Evaluator class
 */
export class AIEvaluator {
  private openai: OpenAI | null = null;
  private config: Awaited<ReturnType<typeof getConfig>> | null = null;
  private secretsManager = getSecretsManager();
  private useAWSSecrets: boolean;

  constructor() {
    // Check if we should use AWS Secrets Manager
    // Use AWS Secrets Manager only if:
    // 1. Explicitly enabled via USE_AWS_SECRETS=true, OR
    // 2. Running in Lambda environment, OR
    // 3. AWS_SECRET_OPENAI_KEY is explicitly set (and not disabled)
    // Otherwise, use .env file for local development
    const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    this.useAWSSecrets = 
      process.env.USE_AWS_SECRETS === 'true' || 
      isLambda ||
      (!!process.env.AWS_SECRET_OPENAI_KEY && process.env.USE_AWS_SECRETS !== 'false');
    
    log.info('AI Evaluator initializing', {
      useAWSSecrets: this.useAWSSecrets,
      model: process.env.LLM_MODEL || process.env.OPENAI_MODEL || 'gpt-4o',
    });
  }

  /**
   * Initialize OpenAI client (async to support AWS Secrets Manager)
   */
  private async initializeClient(): Promise<void> {
    if (this.openai) {
      return; // Already initialized
    }

    let apiKey: string;

    // Fetch API key from AWS Secrets Manager if configured
    if (this.useAWSSecrets) {
      try {
        const secretName = process.env.AWS_SECRET_OPENAI_KEY || 'sainathyai';
        // Try specific key number if specified, otherwise try all keys in order
        const keyNumber = process.env.AWS_SECRET_OPENAI_KEY_NUMBER 
          ? parseInt(process.env.AWS_SECRET_OPENAI_KEY_NUMBER, 10) 
          : undefined;
        console.log(`[INFO] Fetching OpenAI API key from AWS Secrets Manager: ${secretName}${keyNumber ? ` (key${keyNumber})` : ''}`);
        apiKey = await this.secretsManager.getOpenAIKey(secretName, keyNumber, true);
        console.log(`[INFO] OpenAI API key retrieved from AWS Secrets Manager${keyNumber ? ` (key${keyNumber})` : ''}`);
      } catch (error) {
        console.error('[ERROR] Failed to fetch OpenAI key from AWS Secrets Manager', error);
        // Fallback to environment variable
        apiKey = process.env.OPENAI_API_KEY || '';
        if (!apiKey) {
          throw new GameQAError(
            ErrorType.VALIDATION_ERROR,
            'OpenAI API key is required. Failed to fetch from AWS Secrets Manager and no environment variable set.'
          );
        }
        console.warn('[WARN] Using fallback OpenAI API key from environment variable');
      }
    } else {
      // Load config synchronously (for backward compatibility)
      if (!this.config) {
        this.config = await getConfig();
      }
      apiKey = this.config.openai.api_key;
    }

    // Validate API key
    if (!apiKey) {
      throw new GameQAError(
        ErrorType.VALIDATION_ERROR,
        'OpenAI API key is required'
      );
    }

    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey,
    });

    // Load model from config
    if (!this.config) {
      this.config = await getConfig();
    }

    console.log(`[INFO] AI Evaluator initialized (model: ${this.config.openai.model}, keySource: ${this.useAWSSecrets ? 'AWS Secrets Manager' : 'Environment Variable'})`);
  }

  /**
   * Get OpenAI client (initializes if needed)
   */
  private async getClient(): Promise<OpenAI> {
    if (!this.openai) {
      await this.initializeClient();
    }
    return this.openai!;
  }

  /**
   * Refresh API key from AWS Secrets Manager (for rotation)
   * 
   * @param keyNumber - Optional key number (1, 2, or 3) to use. If not specified, tries all keys.
   */
  async refreshApiKey(keyNumber?: number): Promise<void> {
    if (this.useAWSSecrets) {
      try {
        const secretName = process.env.AWS_SECRET_OPENAI_KEY || 'sainathyai';
        
        // Invalidate cache for all possible keys
        this.secretsManager.invalidateCache(secretName, 'api_key');
        this.secretsManager.invalidateCache(secretName, 'api_key2');
        this.secretsManager.invalidateCache(secretName, 'api_key3');
        this.secretsManager.invalidateCache(secretName);
        
        // Fetch new key (will try key1, key2, key3 in order if keyNumber not specified)
        const newApiKey = await this.secretsManager.getOpenAIKey(secretName, keyNumber, false);
        
        // Reinitialize client with new key
        this.openai = new OpenAI({
          apiKey: newApiKey,
        });
        
        console.log(`[INFO] OpenAI API key refreshed from AWS Secrets Manager${keyNumber ? ` (key${keyNumber})` : ''}`);
      } catch (error) {
        console.error('[ERROR] Failed to refresh OpenAI API key', error);
        throw new GameQAError(
          ErrorType.API_FAILURE,
          `Failed to refresh API key: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    } else {
      console.warn('[WARN] API key refresh called but AWS Secrets Manager is not enabled');
    }
  }

  /**
   * Try next API key (for rotation when current key fails)
   * 
   * @param currentKeyNumber - Current key number (1, 2, or 3)
   * @returns Promise that resolves with next API key, or null if no more keys
   */
  async tryNextApiKey(currentKeyNumber: number): Promise<string | null> {
    if (!this.useAWSSecrets) {
      return null;
    }

    try {
      const secretName = process.env.AWS_SECRET_OPENAI_KEY || 'sainathyai';
      const nextKeyNumber = currentKeyNumber + 1;
      
      // Try next key (max 3)
      if (nextKeyNumber > 3) {
        return null;
      }
      
      const apiKey = await this.secretsManager.getOpenAIKey(secretName, nextKeyNumber, false);
      
      // Reinitialize client with new key
      this.openai = new OpenAI({
        apiKey,
      });
      
      console.log(`[INFO] Switched to OpenAI API key ${nextKeyNumber} from AWS Secrets Manager`);
      return apiKey;
    } catch (error) {
      console.warn(`[WARN] Failed to get API key ${currentKeyNumber + 1}`, error);
      return null;
    }
  }

  /**
   * Get all available API keys from AWS Secrets Manager
   * 
   * @returns Promise that resolves with array of available API keys
   */
  async getAllApiKeys(): Promise<string[]> {
    if (!this.useAWSSecrets) {
      return [];
    }

    try {
      const secretName = process.env.AWS_SECRET_OPENAI_KEY || 'sainathyai';
      return await this.secretsManager.getAllOpenAIKeys(secretName, false);
    } catch (error) {
      console.error('[ERROR] Failed to get all API keys', error);
      return [];
    }
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
      // Ensure client is initialized
      const client = await this.getClient();
      
      // Load config if not already loaded
      if (!this.config) {
        this.config = await getConfig();
      }

      log.info('Starting AI evaluation', {
        sessionId: evidence.session_id,
        screenshots: evidence.screenshots.length,
        errors: evidence.errors.length,
        model: this.config.openai.model,
      });

      // Call OpenAI API
      const response = await client.chat.completions.create({
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

