/**
 * Artifact Storage
 * 
 * Manages file system operations for storing test artifacts
 * (screenshots, logs, reports, metadata)
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ConsoleLog, ErrorLog } from '../core/types.js';
import { log } from '../utils/logger.js';
import { getConfig } from '../core/ConfigManager.js';

/**
 * Artifact Storage class
 */
export class ArtifactStorage {
  private outputDir: string;
  private sessionId: string;

  constructor(sessionId?: string) {
    const config = getConfig();
    this.outputDir = config.output.dir;
    this.sessionId = sessionId || this.generateSessionId();
  }

  /**
   * Generate a unique session ID
   * 
   * @returns Session ID string
   */
  private generateSessionId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uuid = uuidv4().split('-')[0];
    return `${timestamp}-${uuid}`;
  }

  /**
   * Get session ID
   * 
   * @returns Session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Create session directory structure
   * 
   * @returns Path to session directory
   */
  createSessionDirectory(): string {
    const sessionDir = join(this.outputDir, this.sessionId);
    const screenshotsDir = join(sessionDir, 'screenshots');
    const logsDir = join(sessionDir, 'logs');

    if (!existsSync(sessionDir)) {
      mkdirSync(sessionDir, { recursive: true });
    }
    if (!existsSync(screenshotsDir)) {
      mkdirSync(screenshotsDir, { recursive: true });
    }
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }

    return sessionDir;
  }

  /**
   * Save console logs to file
   * 
   * @param logs - Array of console logs
   * @returns Path to saved log file
   */
  saveConsoleLogs(logs: ConsoleLog[]): string {
    const sessionDir = this.createSessionDirectory();
    const logFile = join(sessionDir, 'logs', 'console.log');

    const logContent = logs
      .map(
        (log) =>
          `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`
      )
      .join('\n');

    writeFileSync(logFile, logContent, 'utf-8');
    log.info('Console logs saved', { file: logFile, count: logs.length });

    return logFile;
  }

  /**
   * Save error logs to file
   * 
   * @param errors - Array of error logs
   * @returns Path to saved error file
   */
  saveErrorLogs(errors: ErrorLog[]): string {
    const sessionDir = this.createSessionDirectory();
    const errorFile = join(sessionDir, 'logs', 'errors.log');

    const errorContent = errors
      .map(
        (err) =>
          `[${err.timestamp}] [${err.type}] ${err.message}\n${err.stack || ''}\n${err.source || ''}\n---\n`
      )
      .join('\n');

    writeFileSync(errorFile, errorContent, 'utf-8');
    log.info('Error logs saved', { file: errorFile, count: errors.length });

    return errorFile;
  }

  /**
   * Save metadata to JSON file
   * 
   * @param metadata - Metadata object
   * @returns Path to saved metadata file
   */
  saveMetadata(metadata: Record<string, unknown>): string {
    const sessionDir = this.createSessionDirectory();
    const metadataFile = join(sessionDir, 'metadata.json');

    const metadataContent = JSON.stringify(metadata, null, 2);
    writeFileSync(metadataFile, metadataContent, 'utf-8');
    log.info('Metadata saved', { file: metadataFile });

    return metadataFile;
  }

  /**
   * Save test report to JSON file
   * 
   * @param report - Test report object
   * @returns Path to saved report file
   */
  saveReport(report: Record<string, unknown>): string {
    const sessionDir = this.createSessionDirectory();
    const reportFile = join(sessionDir, 'report.json');

    const reportContent = JSON.stringify(report, null, 2);
    writeFileSync(reportFile, reportContent, 'utf-8');
    log.info('Report saved', { file: reportFile });

    return reportFile;
  }

  /**
   * Get session directory path
   * 
   * @returns Path to session directory
   */
  getSessionPath(): string {
    return join(this.outputDir, this.sessionId);
  }

  /**
   * Get screenshots directory path
   * 
   * @returns Path to screenshots directory
   */
  getScreenshotsPath(): string {
    return join(this.outputDir, this.sessionId, 'screenshots');
  }

  /**
   * Get logs directory path
   * 
   * @returns Path to logs directory
   */
  getLogsPath(): string {
    return join(this.outputDir, this.sessionId, 'logs');
  }
}

