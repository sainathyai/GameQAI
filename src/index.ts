#!/usr/bin/env bun

/**
 * CLI Entry Point
 * 
 * Command-line interface for running game QA tests
 * Usage: bun run src/index.ts <game-url> [options]
 */

import { GameQATestRunner } from './core/GameQATestRunner.js';
import { TestOptions } from './core/types.js';
import { log } from './utils/logger.js';
import { getConfig } from './core/ConfigManager.js';

/**
 * Parse command-line arguments
 */
function parseArgs(): { url: string; options: TestOptions } {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: bun run src/index.ts <game-url> [options]');
    console.error('Options:');
    console.error('  --output-dir <path>  Custom output directory');
    console.error('  --timeout <seconds>  Override default timeout');
    console.error('  --verbose            Enable detailed logging');
    process.exit(2);
  }

  const url = args[0];
  const options: TestOptions = {
    verbose: false,
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--output-dir' && i + 1 < args.length) {
      options.output_dir = args[++i];
    } else if (arg === '--timeout' && i + 1 < args.length) {
      options.timeout = parseInt(args[++i], 10) * 1000; // Convert to milliseconds
    } else if (arg === '--verbose') {
      options.verbose = true;
    }
  }

  return { url, options };
}

/**
 * Main CLI function
 */
async function main() {
  try {
    // Load configuration
    const config = getConfig();

    // Parse arguments
    const { url, options } = parseArgs();

    // Set log level if verbose
    if (options.verbose) {
      // Note: Logger level is set via config, but we can log more details
      log.info('Verbose mode enabled');
    }

    // Validate URL
    if (!url || !url.startsWith('http')) {
      console.error('Error: Invalid URL. Must start with http:// or https://');
      process.exit(1);
    }

    log.info('Starting game QA test', { url, options });

    // Create test runner
    const runner = new GameQATestRunner();

    // Run test
    const result = await runner.run(url, options);

    // Output result as JSON
    console.log(JSON.stringify(result, null, 2));

    // Exit with appropriate code
    if (result.status === 'pass') {
      process.exit(0);
    } else if (result.status === 'partial') {
      process.exit(1);
    } else {
      process.exit(1);
    }
  } catch (error) {
    log.error('CLI execution failed', error);
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(2);
  }
}

// Run if called directly
if (import.meta.main) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(2);
  });
}

