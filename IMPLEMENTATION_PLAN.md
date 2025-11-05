# DreamUp: Browser Game QA Pipeline - PR-by-PR Implementation Plan

**Version:** 1.0  
**Date:** November 3, 2025

## Overview

This document outlines the implementation plan broken down into discrete Pull Requests (PRs). Each PR should be:
- **Focused:** Single responsibility, small scope
- **Testable:** Includes tests and validation
- **Reviewable:** Clear changes, well-documented
- **Mergeable:** Can be merged independently without breaking the build

## PR Timeline

| PR # | Title | Estimated Time | Dependencies |
|------|-------|----------------|--------------|
| PR-001 | Project Setup & Configuration | 30 min | None |
| PR-002 | Core Types & Interfaces | 30 min | PR-001 |
| PR-003 | Config Manager | 1 hour | PR-002 |
| PR-004 | Logger Utility | 30 min | PR-002 |
| PR-005 | Browser Agent (Basic) | 2 hours | PR-003, PR-004 |
| PR-006 | UI Pattern Detection | 2 hours | PR-005 |
| PR-007 | Interaction Handler | 2 hours | PR-006 |
| PR-008 | Evidence Capture (Screenshots) | 2 hours | PR-005 |
| PR-009 | Console Log Capture | 1 hour | PR-005 |
| PR-010 | Artifact Storage | 1 hour | PR-008, PR-009 |
| PR-011 | LLM Client Integration | 2 hours | PR-003 |
| PR-012 | Prompt Builder | 1.5 hours | PR-011 |
| PR-013 | AI Evaluator | 2 hours | PR-012, PR-010 |
| PR-014 | Report Builder | 1.5 hours | PR-013 |
| PR-015 | Main Orchestrator | 2 hours | PR-014 |
| PR-016 | CLI Interface | 1 hour | PR-015 |
| PR-017 | Lambda Interface | 1 hour | PR-015 |
| PR-018 | Error Handling & Retries | 2 hours | PR-015 |
| PR-019 | Integration Tests | 2 hours | PR-018 |
| PR-020 | Documentation & Polish | 2 hours | PR-019 |

**Total Estimated Time:** ~25 hours (3-5 days)

---

## PR-001: Project Setup & Configuration

### Goal
Set up the project structure, dependencies, and basic configuration files.

### Changes
- Initialize TypeScript project (`tsconfig.json`)
- Set up package.json with dependencies
- Create project directory structure
- Add `.gitignore`
- Add `.env.example`
- Add basic README.md

### Dependencies
- None

### Files Created
```
gameqai/
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example
├── README.md (basic)
└── src/
```

### Acceptance Criteria
- ✅ Project builds without errors (`tsc --noEmit`)
- ✅ Dependencies install successfully
- ✅ `.env.example` includes all required variables
- ✅ `.gitignore` excludes `node_modules/`, `output/`, `.env`

---

## PR-002: Core Types & Interfaces

### Goal
Define all TypeScript types and interfaces used throughout the project.

### Changes
- Create `src/core/types.ts` with all type definitions
- Define interfaces for: TestResult, TestEvidence, EvaluationResult, etc.
- Export all types for use in other modules

### Dependencies
- PR-001

### Files Created
```
src/core/types.ts
```

### Acceptance Criteria
- ✅ All types compile without errors
- ✅ Types are exported and importable
- ✅ Types match the requirements in REQUIREMENTS.md

### Key Types
```typescript
interface TestResult { ... }
interface TestEvidence { ... }
interface EvaluationResult { ... }
interface UIDetectionResult { ... }
// etc.
```

---

## PR-003: Config Manager

### Goal
Implement configuration management with environment variable loading and validation.

### Changes
- Create `src/core/ConfigManager.ts`
- Implement environment variable loading
- Add Zod schema validation
- Provide typed config object
- Add default configuration

### Dependencies
- PR-002

### Files Created
```
src/core/ConfigManager.ts
config/default.json
```

### Tests
- Unit tests for config loading
- Validation tests for invalid configs

### Acceptance Criteria
- ✅ Loads config from environment variables
- ✅ Validates config with Zod
- ✅ Provides typed config object
- ✅ Throws clear errors for invalid config

---

## PR-004: Logger Utility

### Goal
Implement structured logging utility.

### Changes
- Create `src/utils/logger.ts`
- Set up Winston logger
- Add log levels (DEBUG, INFO, WARN, ERROR)
- Configure JSON output format

### Dependencies
- PR-002

### Files Created
```
src/utils/logger.ts
```

### Tests
- Unit tests for logger functions

### Acceptance Criteria
- ✅ Logger outputs structured JSON
- ✅ Log levels work correctly
- ✅ Configurable via environment variable

---

## PR-005: Browser Agent (Basic)

### Goal
Implement basic browser automation with Browserbase integration.

### Changes
- Create `src/browser/BrowserAgent.ts`
- Integrate Browserbase SDK
- Implement `loadGame(url)` method
- Implement `close()` method
- Add basic error handling

### Dependencies
- PR-003, PR-004

### Files Created
```
src/browser/BrowserAgent.ts
```

### Tests
- Unit tests with mocked Browserbase
- Integration test (if Browserbase available)

### Acceptance Criteria
- ✅ Can load a game URL in browser
- ✅ Browser session is created and closed properly
- ✅ Handles browser errors gracefully

---

## PR-006: UI Pattern Detection

### Goal
Implement UI element detection for common game patterns.

### Changes
- Create `src/browser/UIPatternDetector.ts`
- Implement detection for buttons (Start, Play, etc.)
- Implement detection for game canvas
- Implement detection for menus
- Integrate with BrowserAgent

### Dependencies
- PR-005

### Files Created
```
src/browser/UIPatternDetector.ts
```

### Tests
- Unit tests with mocked browser responses
- Test various UI patterns

### Acceptance Criteria
- ✅ Detects common button patterns
- ✅ Detects game canvas elements
- ✅ Returns structured detection result
- ✅ Handles cases where no UI is found

---

## PR-007: Interaction Handler

### Goal
Implement game interaction simulation (clicks, keyboard input).

### Changes
- Create `src/browser/InteractionHandler.ts`
- Implement mouse click simulation
- Implement keyboard input (arrow keys, spacebar, enter)
- Implement interaction sequence execution
- Add timing delays between interactions

### Dependencies
- PR-006

### Files Created
```
src/browser/InteractionHandler.ts
```

### Tests
- Unit tests for interaction methods
- Test interaction sequences

### Acceptance Criteria
- ✅ Can click buttons and elements
- ✅ Can simulate keyboard input
- ✅ Executes interaction sequences with delays
- ✅ Handles interaction failures gracefully

---

## PR-008: Evidence Capture (Screenshots)

### Goal
Implement screenshot capture at specific intervals.

### Changes
- Create `src/capture/EvidenceCapture.ts`
- Implement `takeScreenshot(index)` method
- Integrate with BrowserAgent
- Add screenshot naming and storage logic
- Implement screenshot timing schedule

### Dependencies
- PR-005

### Files Created
```
src/capture/EvidenceCapture.ts
```

### Tests
- Unit tests with mocked browser
- Test screenshot timing and naming

### Acceptance Criteria
- ✅ Captures screenshots at correct intervals
- ✅ Screenshots are saved with correct naming
- ✅ Handles screenshot failures gracefully
- ✅ Screenshots are in PNG format

---

## PR-009: Console Log Capture

### Goal
Implement console log and error capture from browser.

### Changes
- Create `src/capture/ConsoleLogger.ts`
- Implement console log listening
- Implement error log capture
- Format logs with timestamps
- Filter and categorize logs

### Dependencies
- PR-005

### Files Created
```
src/capture/ConsoleLogger.ts
```

### Tests
- Unit tests for log capture
- Test log formatting

### Acceptance Criteria
- ✅ Captures console.log, console.error, console.warn
- ✅ Captures window.onerror events
- ✅ Logs include timestamps
- ✅ Logs are properly formatted

---

## PR-010: Artifact Storage

### Goal
Implement file system management for storing artifacts.

### Changes
- Create `src/capture/ArtifactStorage.ts`
- Implement directory creation
- Implement file saving (screenshots, logs)
- Implement metadata.json generation
- Add session ID generation

### Dependencies
- PR-008, PR-009

### Files Created
```
src/capture/ArtifactStorage.ts
```

### Tests
- Unit tests for file operations
- Test directory structure creation

### Acceptance Criteria
- ✅ Creates proper directory structure
- ✅ Saves screenshots and logs correctly
- ✅ Generates metadata.json
- ✅ Handles file system errors

---

## PR-011: LLM Client Integration

### Goal
Integrate OpenAI SDK (official SDK).

### Changes
- Create `src/evaluation/AIEvaluator.ts` (basic structure)
- Implement LLM client initialization
- Add API key validation
- Implement basic API call method
- Add error handling for API failures

### Dependencies
- PR-003

### Files Created
```
src/evaluation/AIEvaluator.ts (basic)
```

### Tests
- Unit tests with mocked LLM API
- Test API error handling

### Acceptance Criteria
- ✅ LLM client initializes correctly
- ✅ Can make API calls (mocked)
- ✅ Handles API errors gracefully
- ✅ Validates API keys

---

## PR-012: Prompt Builder

### Goal
Implement LLM prompt construction from evidence.

### Changes
- Create `src/evaluation/PromptBuilder.ts`
- Implement prompt template
- Implement evidence formatting (screenshots, logs)
- Add prompt validation
- Structure prompt for structured output

### Dependencies
- PR-011

### Files Created
```
src/evaluation/PromptBuilder.ts
```

### Tests
- Unit tests for prompt generation
- Test prompt formatting

### Acceptance Criteria
- ✅ Generates structured prompts
- ✅ Includes all evidence (screenshots, logs)
- ✅ Prompt is well-formatted and clear
- ✅ Handles missing evidence gracefully

---

## PR-013: AI Evaluator

### Goal
Complete AI evaluation with LLM integration and response parsing.

### Changes
- Complete `src/evaluation/AIEvaluator.ts`
- Implement `evaluate(evidence)` method
- Integrate PromptBuilder
- Implement response parsing
- Create `src/evaluation/ScoreCalculator.ts` for confidence scoring
- Add heuristic fallback

### Dependencies
- PR-012, PR-010

### Files Created
```
src/evaluation/ScoreCalculator.ts
(Complete AIEvaluator.ts)
```

### Tests
- Unit tests with mocked LLM responses
- Test response parsing
- Test confidence scoring

### Acceptance Criteria
- ✅ Evaluates evidence with LLM
- ✅ Parses LLM response correctly
- ✅ Calculates confidence scores
- ✅ Falls back to heuristics if LLM fails

---

## PR-014: Report Builder

### Goal
Implement structured JSON report generation.

### Changes
- Create `src/reporting/ReportBuilder.ts`
- Implement report aggregation
- Create `src/reporting/ReportSchema.ts` for validation
- Implement JSON report generation
- Add report validation

### Dependencies
- PR-013

### Files Created
```
src/reporting/ReportBuilder.ts
src/reporting/ReportSchema.ts
```

### Tests
- Unit tests for report generation
- Test report validation

### Acceptance Criteria
- ✅ Generates valid JSON reports
- ✅ Reports match required schema
- ✅ Reports include all required fields
- ✅ Reports are validated before saving

---

## PR-015: Main Orchestrator

### Goal
Implement the main test runner that coordinates all components.

### Changes
- Create `src/core/GameQATestRunner.ts`
- Implement test execution flow
- Coordinate BrowserAgent, EvidenceCapture, AIEvaluator
- Integrate ReportBuilder
- Implement basic error handling

### Dependencies
- PR-014

### Files Created
```
src/core/GameQATestRunner.ts
```

### Tests
- Integration tests with mocked components
- Test full execution flow

### Acceptance Criteria
- ✅ Executes full test flow
- ✅ Coordinates all components correctly
- ✅ Handles basic errors
- ✅ Returns structured TestResult

---

## PR-016: CLI Interface

### Goal
Implement command-line interface for running tests.

### Changes
- Create `src/index.ts` (CLI entry point)
- Implement argument parsing
- Add CLI options (--output-dir, --timeout, --verbose)
- Implement JSON output to stdout
- Add exit codes

### Dependencies
- PR-015

### Files Created
```
src/index.ts
```

### Tests
- Test CLI argument parsing
- Test exit codes

### Acceptance Criteria
- ✅ CLI accepts URL argument
- ✅ CLI accepts optional flags
- ✅ Outputs JSON to stdout
- ✅ Returns correct exit codes

---

## PR-017: Lambda Interface

### Goal
Implement Lambda-compatible function interface.

### Changes
- Create `src/lambda.ts`
- Export function for Lambda usage
- Ensure no file system dependencies for core logic
- Add environment variable support
- Optimize for cold starts

### Dependencies
- PR-015

### Files Created
```
src/lambda.ts
```

### Tests
- Test Lambda function export
- Test function signature

### Acceptance Criteria
- ✅ Function can be imported
- ✅ Function signature matches requirements
- ✅ Works without file system dependencies
- ✅ Returns JSON result

---

## PR-018: Error Handling & Retries

### Goal
Implement comprehensive error handling and retry logic.

### Changes
- Enhance error handling in GameQATestRunner
- Implement retry strategies (browser, API, network)
- Add graceful degradation
- Create `src/utils/errors.ts` for error types
- Add error logging

### Dependencies
- PR-015

### Files Created
```
src/utils/errors.ts
(Update GameQATestRunner.ts)
```

### Tests
- Test retry logic
- Test error recovery
- Test graceful degradation

### Acceptance Criteria
- ✅ Retries browser crashes (max 2x)
- ✅ Retries API failures with backoff
- ✅ Gracefully degrades on non-critical errors
- ✅ Logs all errors appropriately

---

## PR-019: Integration Tests

### Goal
Add end-to-end integration tests with real games.

### Changes
- Create `tests/integration/` directory
- Add integration tests for full flow
- Test with sample games (3-5 games)
- Validate output format
- Add test fixtures

### Dependencies
- PR-018

### Files Created
```
tests/integration/
tests/fixtures/
```

### Tests
- Integration tests with real games
- Output validation tests

### Acceptance Criteria
- ✅ Tests run end-to-end with real games
- ✅ Output format is validated
- ✅ Tests cover different game types
- ✅ Tests handle errors correctly

---

## PR-020: Documentation & Polish

### Goal
Complete documentation, code cleanup, and final polish.

### Changes
- Complete README.md with setup instructions
- Add JSDoc comments to all public functions
- Update ARCHITECTURE.md if needed
- Code cleanup and refactoring
- Add example configuration
- Add contributing guidelines (if needed)

### Dependencies
- PR-019

### Files Created/Updated
```
README.md (complete)
ARCHITECTURE.md (update if needed)
(Add JSDoc to all files)
```

### Acceptance Criteria
- ✅ README has complete setup instructions
- ✅ All public functions have JSDoc
- ✅ Code is clean and well-structured
- ✅ Example config is provided

---

## Testing Strategy per PR

### Unit Tests
- Each PR should include unit tests for new functionality
- Mock external dependencies (Browserbase, LLM API)
- Target: 60%+ coverage for new code

### Integration Tests
- PR-005: Test BrowserAgent with real Browserbase (if available)
- PR-011: Test LLM client with real API (use test key)
- PR-015: Test orchestrator with mocked components
- PR-019: Full integration tests

### Manual Testing
- Each PR should be manually tested before merge
- Test with at least one sample game URL
- Verify output format

---

## PR Review Checklist

Before merging each PR:

- [ ] Code compiles without errors
- [ ] Tests pass (unit + integration if applicable)
- [ ] Code follows TypeScript best practices
- [ ] Error handling is implemented
- [ ] Logging is appropriate
- [ ] Documentation is updated
- [ ] No hardcoded credentials
- [ ] Environment variables are documented
- [ ] PR description explains changes clearly

---

## Branching Strategy

See `BRANCHING_STRATEGY.md` for detailed branching guidelines.

---

## Notes

- **Early Integration:** Start testing with real games as early as PR-005
- **Iterative Refinement:** Refine prompts and heuristics in PR-013 based on real results
- **Performance:** Monitor execution time starting from PR-015
- **Error Handling:** Add error handling incrementally, complete in PR-018

