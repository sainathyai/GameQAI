/**
 * Report Schema
 * 
 * JSON schema validation for test reports
 */

import { z } from 'zod';
import { TestResult } from '../core/types.js';

/**
 * Zod schema for TestResult validation
 */
export const TestResultSchema = z.object({
  status: z.enum(['pass', 'fail', 'partial', 'error']),
  playability_score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  timestamp: z.string(),
  game_url: z.string().url(),
  session_id: z.string(),
  test_duration_seconds: z.number().nonnegative(),
  evaluations: z.object({
    load_successful: z.object({
      result: z.boolean(),
      confidence: z.number().min(0).max(1),
    }),
    controls_responsive: z.object({
      result: z.boolean(),
      confidence: z.number().min(0).max(1),
    }),
    no_crashes: z.object({
      result: z.boolean(),
      confidence: z.number().min(0).max(1),
    }),
  }),
  issues: z.array(z.string()),
  screenshots: z.array(z.string()),
  metadata: z.object({
    interactions_count: z.number().nonnegative(),
    errors_count: z.number().nonnegative(),
    screenshots_count: z.number().nonnegative(),
    ui_elements_detected: z.number().nonnegative(),
  }),
});

/**
 * Validate test report against schema
 * 
 * @param report - Test report to validate
 * @returns True if valid
 */
export function validateReport(report: unknown): report is TestResult {
  try {
    TestResultSchema.parse(report);
    return true;
  } catch (error) {
    return false;
  }
}

