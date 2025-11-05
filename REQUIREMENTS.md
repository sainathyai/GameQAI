# DreamUp: Browser Game QA Pipeline - Tangible Requirements

**Version:** 2.0  
**Date:** November 3, 2025  
**Status:** Refined & Tangible

## 1. Functional Requirements

### 1.1 Browser Automation Agent (FR-001 to FR-005)

#### FR-001: Game URL Loading
- **Input:** Valid HTTP/HTTPS URL string
- **Output:** Browser session initialized with game loaded
- **Acceptance Criteria:**
  - Agent accepts URL via CLI argument or environment variable
  - Loads game in headless browser within 30 seconds
  - Handles HTTP redirects (max 5 redirects)
  - Returns error code if URL is unreachable after 3 retries

#### FR-002: UI Pattern Detection
- **Input:** Loaded game page
- **Output:** Detected UI elements (buttons, menus, game canvas)
- **Acceptance Criteria:**
  - Detects common button text patterns: "Start", "Play", "Begin", "New Game"
  - Detects clickable elements via CSS selectors (button, .btn, .play-button, etc.)
  - Detects game canvas elements (canvas, iframe containing game)
  - Timeout: 10 seconds for initial UI detection
  - Returns structured object: `{buttons: [], canvas: [], menus: []}`

#### FR-003: Interaction Execution
- **Input:** Detected UI elements and game state
- **Output:** Executed interactions (clicks, keystrokes)
- **Acceptance Criteria:**
  - Clicks detected start/play buttons
  - Simulates keyboard input: Arrow keys (↑↓←→), Spacebar, Enter
  - Simulates mouse clicks on game canvas at random coordinates (3-5 clicks)
  - Waits 2-3 seconds between interactions for game state to update
  - Executes minimum 3 interactions, maximum 10 interactions per test
  - Total interaction time: 30-60 seconds

#### FR-004: State Monitoring
- **Input:** Active browser session
- **Output:** Console logs, error messages, page state changes
- **Acceptance Criteria:**
  - Captures all console.log, console.error, console.warn messages
  - Detects JavaScript errors (window.onerror events)
  - Monitors page load events (DOMContentLoaded, load)
  - Detects page unload or navigation away from game
  - Timeout detection: No state change for 10 seconds = freeze

#### FR-005: Timeout and Retry Logic
- **Input:** Any operation with potential failure
- **Output:** Retry attempt or timeout error
- **Acceptance Criteria:**
  - Page load: 30s timeout, 3 retries max
  - UI detection: 10s timeout, 2 retries max
  - Interaction execution: 60s timeout, no retries
  - Total test session: 5 minutes max

### 1.2 Evidence Capture (FR-006 to FR-008)

#### FR-006: Screenshot Capture
- **Input:** Browser session at specific moments
- **Output:** PNG image files saved to disk
- **Acceptance Criteria:**
  - Captures 5 screenshots at specific timestamps:
    1. Initial page load (t=0s)
    2. After UI detection (t=10s)
    3. After first interaction (t=20s)
    4. Mid-gameplay (t=40s)
    5. Final state (t=60s or test end)
  - Screenshot format: PNG, 1920x1080 resolution
  - Filename format: `{timestamp}_{game-id}_{screenshot-index}.png`
  - Save location: `./output/{session-id}/screenshots/`
  - Handles screenshot failures gracefully (continues with remaining screenshots)

#### FR-007: Artifact Storage
- **Input:** Screenshots, logs, errors
- **Output:** Structured directory with all artifacts
- **Acceptance Criteria:**
  - Creates directory structure:
    ```
    output/
      {session-id}/
        screenshots/
        logs/
          console.log
          errors.log
        metadata.json
        report.json
    ```
  - Session ID: `{timestamp}-{game-url-hash}` format
  - All files are writeable and readable
  - Directory is created if it doesn't exist

#### FR-008: Console Log Capture
- **Input:** Browser console output
- **Output:** Text files with logs
- **Acceptance Criteria:**
  - Captures all console messages with timestamp
  - Logs format: `[TIMESTAMP] [LEVEL] [MESSAGE]`
  - Saves to `console.log` (all messages) and `errors.log` (errors only)
  - Minimum log retention: 1000 lines per session

### 1.3 AI Evaluation (FR-009 to FR-012)

#### FR-009: Evidence Preparation
- **Input:** Screenshots, logs, metadata
- **Output:** Formatted prompt for LLM
- **Acceptance Criteria:**
  - Encodes screenshots as base64 or provides file paths
  - Summarizes console logs (max 500 words, error-focused)
  - Includes game URL and test metadata
  - Prompt structure includes:
    - Game URL
    - Test duration
    - Number of interactions
    - Screenshot descriptions
    - Error summary

#### FR-010: LLM Analysis
- **Input:** Formatted prompt with evidence
- **Output:** LLM response with evaluation
- **Acceptance Criteria:**
  - Uses OpenAI SDK (official SDK)
  - Structured prompt asking:
    1. "Did the game load successfully?" (Yes/No + confidence 0-1)
    2. "Are controls responsive?" (Yes/No + confidence 0-1)
    3. "Did the game complete without crashes?" (Yes/No + confidence 0-1)
    4. "Overall playability score" (0-100)
    5. "Issue descriptions" (array of strings)
  - Response timeout: 30 seconds
  - Handles API failures with retry (2 retries)

#### FR-011: Structured Output Generation
- **Input:** LLM response, raw evidence
- **Output:** JSON report file
- **Acceptance Criteria:**
  - JSON schema:
    ```json
    {
      "status": "pass" | "fail" | "partial",
      "playability_score": 0-100,
      "confidence": 0-1,
      "timestamp": "ISO-8601",
      "game_url": "string",
      "session_id": "string",
      "test_duration_seconds": number,
      "evaluations": {
        "load_successful": { "result": boolean, "confidence": number },
        "controls_responsive": { "result": boolean, "confidence": number },
        "no_crashes": { "result": boolean, "confidence": number }
      },
      "issues": ["string"],
      "screenshots": ["path/to/file"],
      "metadata": {
        "interactions_count": number,
        "errors_count": number,
        "screenshots_count": number
      }
    }
    ```
  - File saved to: `./output/{session-id}/report.json`

#### FR-012: Confidence Scoring
- **Input:** LLM evaluation, heuristics
- **Output:** Combined confidence score
- **Acceptance Criteria:**
  - LLM confidence: 0-1 from structured output
  - Heuristic confidence: Based on error count, screenshot quality
  - Combined score: `(llm_confidence * 0.7) + (heuristic_confidence * 0.3)`
  - Minimum confidence threshold: 0.6 for "pass" status

### 1.4 Execution Interface (FR-013 to FR-015)

#### FR-013: CLI Interface
- **Input:** Command-line arguments
- **Output:** JSON report to stdout and file
- **Acceptance Criteria:**
  - Command: `bun run qa.ts <game-url>` or `npx tsx qa.ts <game-url>`
  - Accepts optional flags:
    - `--output-dir <path>`: Custom output directory
    - `--timeout <seconds>`: Override default timeout
    - `--verbose`: Enable detailed logging
  - Returns exit code: 0 (pass), 1 (fail), 2 (error)
  - Prints JSON report to stdout at completion

#### FR-014: Lambda-Compatible Execution
- **Input:** Environment variables or function parameters
- **Output:** JSON response
- **Acceptance Criteria:**
  - Can be imported as function: `import { testGame } from './qa'`
  - Function signature: `testGame(url: string, options?: TestOptions): Promise<TestResult>`
  - Works in Node.js runtime (Lambda compatible)
  - No file system dependencies for core logic (optional artifact saving)
  - Returns same JSON structure as CLI

#### FR-015: Error Handling and Logging
- **Input:** Any operation
- **Output:** Error logs and graceful degradation
- **Acceptance Criteria:**
  - All errors logged to stderr or error log file
  - Critical errors (browser crash, API failure) return error status
  - Non-critical errors (screenshot failure) continue with warnings
  - Error messages include: error type, timestamp, context

## 2. Non-Functional Requirements

### 2.1 Performance (NFR-001 to NFR-003)

#### NFR-001: Execution Time
- **Target:** Single game test completes in 2-5 minutes
- **Maximum:** 5 minutes per game (hard limit)
- **Measurement:** End-to-end test execution time

#### NFR-002: Resource Usage
- **Memory:** < 512MB per test session
- **CPU:** Efficient browser automation (idle when waiting)
- **Network:** Minimal bandwidth (screenshots compressed if > 1MB)

#### NFR-003: Scalability
- **Concurrent Tests:** Support 1-3 concurrent test sessions (for future batch mode)
- **Lambda:** Compatible with AWS Lambda 512MB-1GB memory limits

### 2.2 Reliability (NFR-004 to NFR-006)

#### NFR-004: Accuracy
- **Target:** 80%+ accuracy on playability assessment
- **Measurement:** Manual validation of 10+ test results
- **Confidence Threshold:** Minimum 0.6 confidence for pass/fail decisions

#### NFR-005: Error Recovery
- **Browser Crash:** Automatic retry with new session (max 2 retries)
- **API Failure:** Retry with exponential backoff (max 2 retries)
- **Network Issues:** Retry with 3-second delay (max 3 retries)

#### NFR-006: Graceful Degradation
- **Screenshot Failure:** Continue with remaining screenshots
- **LLM Failure:** Fallback to heuristic-based evaluation
- **UI Detection Failure:** Proceed with generic interaction attempts

### 2.3 Maintainability (NFR-007 to NFR-009)

#### NFR-007: Code Quality
- **TypeScript:** Strict mode enabled, no `any` types
- **Modularity:** Separate modules for browser, LLM, evaluation, reporting
- **Documentation:** JSDoc comments for all public functions
- **Testing:** Unit tests for core logic (target: 60%+ coverage)

#### NFR-008: Configuration
- **Environment Variables:** All API keys and config via env vars
- **Config File:** Optional `config.json` for local development
- **Defaults:** Sensible defaults for all optional parameters

#### NFR-009: Observability
- **Logging:** Structured logging (JSON format in production)
- **Log Levels:** DEBUG, INFO, WARN, ERROR
- **Metrics:** Track execution time, success rate, error types

### 2.4 Security (NFR-010 to NFR-011)

#### NFR-010: API Key Management
- **Storage:** API keys in environment variables only
- **No Hardcoding:** No credentials in source code or config files
- **Validation:** Validate API keys before execution

#### NFR-011: Input Validation
- **URL Validation:** Validate URL format before processing
- **Sanitization:** Sanitize file paths to prevent directory traversal
- **Rate Limiting:** Respect API rate limits (implement backoff)

## 3. Test Cases

### 3.1 Test Game Categories

#### TC-001: Simple Puzzle Game
- **Example:** Tic-tac-toe, match-3
- **Expected:** Pass with high confidence (90%+)
- **Validation:** Game loads, clicks work, game completes

#### TC-002: Platformer Game
- **Example:** Simple Mario clone, runner game
- **Expected:** Pass with medium-high confidence (75%+)
- **Validation:** Keyboard controls work, game progresses

#### TC-003: Idle/Clicker Game
- **Example:** Cookie Clicker clone
- **Expected:** Pass with high confidence (85%+)
- **Validation:** Minimal interaction needed, game state persists

#### TC-004: Intentionally Broken Game
- **Example:** Game with JavaScript errors, missing assets
- **Expected:** Fail with high confidence (80%+)
- **Validation:** Error detection, appropriate failure status

#### TC-005: Complex Multi-Level Game
- **Example:** RPG demo, puzzle with levels
- **Expected:** Pass or partial with medium confidence (70%+)
- **Validation:** Navigation works, game state changes

### 3.2 Edge Cases

#### TC-006: Slow Loading Game
- **Scenario:** Game takes > 20 seconds to load
- **Expected:** Timeout or partial pass with note about load time

#### TC-007: Game with External Dependencies
- **Scenario:** Game requires external API or CDN
- **Expected:** Handles gracefully, may fail if dependencies unavailable

#### TC-008: Game with Popup/Modal
- **Scenario:** Game shows cookie consent or tutorial modal
- **Expected:** Detects and dismisses modal, continues testing

## 4. Success Metrics

### 4.1 Functional Success
- ✅ Successfully tests 3+ diverse browser games end-to-end
- ✅ Generates structured reports with 80%+ accuracy
- ✅ Handles common failure modes gracefully
- ✅ Clean, documented, modular codebase

### 4.2 Quality Metrics
- **Code Coverage:** 60%+ unit test coverage
- **Documentation:** README with setup, usage, architecture
- **Performance:** 90%+ of tests complete within 5 minutes
- **Reliability:** 95%+ test execution success rate (excluding game failures)

## 5. Out of Scope (Clarified)

- ❌ Multiplayer games requiring real-time network connections
- ❌ Mobile browser emulation (desktop only)
- ❌ Security testing (XSS, CSRF, etc.)
- ❌ Performance testing (FPS, memory profiling)
- ❌ Integration with DreamUp production systems (prototype only)
- ❌ User authentication or login flows
- ❌ Games requiring WebGL shader compilation (unless basic support)

## 6. Dependencies

### 6.1 External Services
- **Browserbase:** Browser automation service (free tier: 1 browser-hour)
- **LLM API:** OpenAI API (via official OpenAI SDK)

### 6.2 Required APIs
- Browserbase API key (environment variable)
- LLM API key (OpenAI or Anthropic, environment variable)

### 6.3 Browser Compatibility
- **Target:** Modern browsers (Chrome/Edge latest 2 versions)
- **Headless Mode:** Required for Lambda compatibility
- **Resolution:** 1920x1080 default

## 7. Deliverables

### 7.1 Code Deliverables
1. Source code in GitHub repository
2. TypeScript project with proper structure
3. Unit tests for core modules
4. Example configuration files (`.env.example`)

### 7.2 Documentation Deliverables
1. README.md with setup instructions
2. ARCHITECTURE.md with system design
3. API documentation (JSDoc)
4. CONTRIBUTING.md (if applicable)

### 7.3 Test Deliverables
1. QA reports for 3-5 sample games (JSON + screenshots)
2. Test results stored in `output/` directory
3. Demo video (2-5 minutes) showing end-to-end execution

