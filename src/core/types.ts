/**
 * Core TypeScript types and interfaces for GameQAI
 * 
 * This file defines all types used throughout the application
 * for type safety and consistency.
 */

/**
 * Test execution status
 */
export type TestStatus = 'pass' | 'fail' | 'partial' | 'error';

/**
 * Log level for structured logging
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * UI element types that can be detected
 */
export type UIElementType = 'button' | 'canvas' | 'menu' | 'input' | 'other';

/**
 * Interaction types that can be simulated
 */
export type InteractionType = 'click' | 'keyboard' | 'mouse' | 'wait';

/**
 * Main test result structure
 */
export interface TestResult {
  status: TestStatus;
  playability_score: number;
  confidence: number;
  timestamp: string;
  game_url: string;
  session_id: string;
  test_duration_seconds: number;
  evaluations: Evaluations;
  issues: string[];
  screenshots: string[];
  metadata: TestMetadata;
}

/**
 * Detailed evaluation results for each criterion
 */
export interface Evaluations {
  load_successful: EvaluationItem;
  controls_responsive: EvaluationItem;
  no_crashes: EvaluationItem;
}

/**
 * Individual evaluation item with result and confidence
 */
export interface EvaluationItem {
  result: boolean;
  confidence: number;
}

/**
 * Test metadata including interaction and error counts
 */
export interface TestMetadata {
  interactions_count: number;
  errors_count: number;
  screenshots_count: number;
  ui_elements_detected: number;
}

/**
 * Evidence collected during test execution
 */
export interface TestEvidence {
  session_id: string;
  game_url: string;
  screenshots: Screenshot[];
  console_logs: ConsoleLog[];
  errors: ErrorLog[];
  ui_detection: UIDetectionResult | null;
  interactions: Interaction[];
  test_duration_seconds: number;
  timestamp: string;
}

/**
 * Screenshot information
 */
export interface Screenshot {
  index: number;
  file_path: string;
  timestamp: string;
  description: string;
}

/**
 * Console log entry
 */
export interface ConsoleLog {
  timestamp: string;
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  source?: string;
}

/**
 * Error log entry
 */
export interface ErrorLog {
  timestamp: string;
  type: string;
  message: string;
  stack?: string;
  source?: string;
}

/**
 * UI element detection result
 */
export interface UIDetectionResult {
  buttons: UIElement[];
  canvas: UIElement[];
  menus: UIElement[];
  detected_at: string;
}

/**
 * Detected UI element
 */
export interface UIElement {
  type: UIElementType;
  selector: string;
  text?: string;
  attributes?: Record<string, string>;
}

/**
 * Interaction record
 */
export interface Interaction {
  type: InteractionType;
  timestamp: string;
  target?: string;
  action?: string;
  success: boolean;
}

/**
 * Evaluation result from LLM
 */
export interface EvaluationResult {
  load_successful: EvaluationItem;
  controls_responsive: EvaluationItem;
  no_crashes: EvaluationItem;
  playability_score: number;
  issues: string[];
  confidence: number;
  reasoning?: string;
}

/**
 * Configuration options for test execution
 */
export interface TestOptions {
  timeout?: number;
  max_retries?: number;
  output_dir?: string;
  verbose?: boolean;
  screenshot_resolution?: string;
}

/**
 * Application configuration
 */
export interface AppConfig {
  browserbase: {
    api_key: string;
    project_id?: string;
  };
  openai: {
    api_key: string;
    model: string;
  };
  test: {
    default_timeout: number;
    max_retries: number;
    screenshot_resolution: string;
  };
  output: {
    dir: string;
  };
  logging: {
    level: LogLevel;
  };
}

/**
 * Error types for error handling
 */
export enum ErrorType {
  BROWSER_CRASH = 'BROWSER_CRASH',
  API_FAILURE = 'API_FAILURE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SCREENSHOT_FAILURE = 'SCREENSHOT_FAILURE',
  LLM_FAILURE = 'LLM_FAILURE',
  FATAL = 'FATAL',
}

/**
 * Custom error class for application errors
 */
export class GameQAError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GameQAError';
  }
}

