# DreamUp: Browser Game QA Pipeline - Technical Architecture

**Version:** 1.0  
**Date:** November 3, 2025

## 1. Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Execution Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   CLI Entry  │  │ Lambda Entry │  │  Batch Entry │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┼──────────────────┘               │
│                            │                                   │
└────────────────────────────┼───────────────────────────────────┘
                             │
┌────────────────────────────▼───────────────────────────────────┐
│                    Core Orchestrator                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │         GameQATestRunner (Main Orchestrator)             │ │
│  │  - Coordinates test execution                            │ │
│  │  - Manages test lifecycle                                │ │
│  │  - Handles errors and retries                            │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────┬───────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│ Browser Agent  │  │ Evidence Capture│  │  AI Evaluator │
│                │  │                 │  │                │
│ - Browserbase  │  │ - Screenshots   │  │ - LLM Client  │
│ - Stagehand    │  │ - Logs          │  │ - Prompt       │
│ - Navigation   │  │ - Metadata      │  │ - Analysis     │
│ - Interaction  │  │ - Storage       │  │ - Scoring      │
└────────────────┘  └─────────────────┘  └────────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
┌────────────────────────────▼───────────────────────────────────┐
│                    Report Generator                            │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │         ReportBuilder                                      │ │
│  │  - Aggregates evidence                                     │ │
│  │  - Generates JSON report                                   │ │
│  │  - Saves artifacts                                         │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Architecture

#### Core Components

1. **GameQATestRunner** (Orchestrator)
   - Main entry point for test execution
   - Coordinates all components
   - Manages test lifecycle and error handling

2. **BrowserAgent** (Browser Automation)
   - Wraps Browserbase/Stagehand functionality
   - Handles game loading, navigation, interaction
   - Monitors console logs and errors

3. **EvidenceCapture** (Data Collection)
   - Captures screenshots at specific intervals
   - Collects console logs and errors
   - Manages artifact storage

4. **AIEvaluator** (LLM Integration)
   - Prepares evidence for LLM analysis
   - Calls LLM API with structured prompts
   - Parses and validates LLM responses

5. **ReportBuilder** (Output Generation)
   - Aggregates all evidence
   - Generates structured JSON report
   - Saves artifacts to disk

6. **ConfigManager** (Configuration)
   - Loads environment variables
   - Validates configuration
   - Provides typed config objects

## 2. Technology Stack

### 2.1 Core Technologies

#### Runtime & Language
- **Node.js:** 18.x or 20.x (LTS)
- **TypeScript:** 5.x (strict mode)
- **Package Manager:** Bun (preferred) or npm/yarn

#### Browser Automation
- **Browserbase:** Cloud browser service
- **@browserbasehq/stagehand:** AI-powered browser automation
- **Fallback:** Puppeteer (if Browserbase unavailable)

#### AI/LLM Integration
- **OpenAI SDK:** `openai` (official SDK)
- **Model:** GPT-4 Vision (GPT-4o recommended)

#### Utilities
- **dotenv:** Environment variable management
- **zod:** Runtime type validation
- **winston:** Structured logging
- **uuid:** Session ID generation
- **path:** File system utilities (Node.js built-in)

### 2.2 Project Structure

```
gameqai/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── lambda.ts             # Lambda entry point
│   ├── core/
│   │   ├── GameQATestRunner.ts    # Main orchestrator
│   │   ├── ConfigManager.ts       # Configuration management
│   │   └── types.ts               # TypeScript types
│   ├── browser/
│   │   ├── BrowserAgent.ts        # Browser automation wrapper
│   │   ├── InteractionHandler.ts  # Game interaction logic
│   │   └── UIPatternDetector.ts   # UI element detection
│   ├── capture/
│   │   ├── EvidenceCapture.ts     # Screenshot and log capture
│   │   ├── ArtifactStorage.ts     # File system management
│   │   └── ConsoleLogger.ts       # Console log capture
│   ├── evaluation/
│   │   ├── AIEvaluator.ts         # LLM integration
│   │   ├── PromptBuilder.ts       # LLM prompt construction
│   │   └── ScoreCalculator.ts     # Confidence scoring
│   ├── reporting/
│   │   ├── ReportBuilder.ts       # Report generation
│   │   └── ReportSchema.ts        # JSON schema definitions
│   └── utils/
│       ├── logger.ts              # Logging utilities
│       ├── validators.ts          # Input validation
│       └── errors.ts              # Error handling
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── output/                      # Generated test reports (gitignored)
├── config/
│   └── default.json             # Default configuration
├── .env.example                 # Environment variable template
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies
├── README.md                    # Setup and usage
├── ARCHITECTURE.md              # This file
└── REQUIREMENTS.md              # Detailed requirements
```

## 3. Data Flow

### 3.1 Test Execution Flow

```
1. Input (URL)
   ↓
2. ConfigManager.validate() → Load config
   ↓
3. GameQATestRunner.initialize() → Create session
   ↓
4. BrowserAgent.loadGame(url) → Load game in browser
   ↓
5. EvidenceCapture.takeScreenshot(0) → Initial screenshot
   ↓
6. UIPatternDetector.detect() → Find UI elements
   ↓
7. InteractionHandler.execute() → Simulate gameplay
   ├─→ EvidenceCapture.takeScreenshot(1) → After UI detection
   ├─→ EvidenceCapture.takeScreenshot(2) → After first interaction
   ├─→ EvidenceCapture.takeScreenshot(3) → Mid-gameplay
   └─→ EvidenceCapture.takeScreenshot(4) → Final state
   ↓
8. EvidenceCapture.collectLogs() → Gather console logs
   ↓
9. AIEvaluator.evaluate(evidence) → LLM analysis
   ↓
10. ReportBuilder.generate() → Create JSON report
   ↓
11. ArtifactStorage.save() → Save to disk
   ↓
12. Output JSON report
```

### 3.2 Error Handling Flow

```
Error occurs
   ↓
GameQATestRunner.handleError()
   ↓
Check error type:
   ├─ Browser Crash → Retry (max 2x)
   ├─ API Failure → Retry with backoff (max 2x)
   ├─ Network Issue → Retry with delay (max 3x)
   ├─ Screenshot Failure → Continue with warning
   ├─ LLM Failure → Fallback to heuristics
   └─ Fatal Error → Abort and return error status
   ↓
Log error → Continue or abort
```

## 4. Component Details

### 4.1 GameQATestRunner

**Responsibility:** Main orchestrator for test execution

**Key Methods:**
- `run(url: string, options?: TestOptions): Promise<TestResult>`
- `initialize(): Promise<void>`
- `executeTest(): Promise<TestEvidence>`
- `handleError(error: Error): Promise<ErrorAction>`

**Dependencies:**
- BrowserAgent
- EvidenceCapture
- AIEvaluator
- ReportBuilder

### 4.2 BrowserAgent

**Responsibility:** Browser automation and game interaction

**Key Methods:**
- `loadGame(url: string): Promise<void>`
- `detectUI(): Promise<UIDetectionResult>`
- `interact(actions: Interaction[]): Promise<void>`
- `monitorConsole(): Promise<ConsoleLog[]>`
- `close(): Promise<void>`

**Dependencies:**
- Browserbase SDK
- Stagehand

### 4.3 EvidenceCapture

**Responsibility:** Capture and store evidence

**Key Methods:**
- `takeScreenshot(index: number): Promise<string>` (returns file path)
- `collectConsoleLogs(): Promise<ConsoleLog[]>`
- `collectErrors(): Promise<ErrorLog[]>`
- `saveArtifacts(sessionId: string): Promise<void>`

**Dependencies:**
- BrowserAgent (for screenshots)
- ArtifactStorage

### 4.4 AIEvaluator

**Responsibility:** LLM-based game evaluation

**Key Methods:**
- `evaluate(evidence: TestEvidence): Promise<EvaluationResult>`
- `buildPrompt(evidence: TestEvidence): Promise<string>`
- `parseResponse(response: string): EvaluationResult`
- `calculateConfidence(evaluation: EvaluationResult): number`

**Dependencies:**
- OpenAI SDK (official SDK)
- PromptBuilder

### 4.5 ReportBuilder

**Responsibility:** Generate structured reports

**Key Methods:**
- `build(evidence: TestEvidence, evaluation: EvaluationResult): TestReport`
- `validate(report: TestReport): boolean`
- `toJSON(report: TestReport): string`

**Dependencies:**
- ReportSchema (for validation)

## 5. Configuration Management

### 5.1 Environment Variables

```typescript
interface Config {
  // Browser
  BROWSERBASE_API_KEY: string;
  BROWSERBASE_PROJECT_ID?: string;
  
  // LLM
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  LLM_MODEL?: string; // 'gpt-4-vision' or 'claude-sonnet-3.5'
  
  // Test Settings
  DEFAULT_TIMEOUT?: number; // seconds
  MAX_RETRIES?: number;
  SCREENSHOT_RESOLUTION?: string; // '1920x1080'
  
  // Output
  OUTPUT_DIR?: string; // './output'
  
  // Logging
  LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
}
```

### 5.2 Configuration Loading

1. Load from `.env` file (if exists)
2. Override with environment variables
3. Apply defaults from `config/default.json`
4. Validate with Zod schema
5. Provide typed config object

## 6. Error Handling Strategy

### 6.1 Error Types

```typescript
enum ErrorType {
  BROWSER_CRASH = 'BROWSER_CRASH',
  API_FAILURE = 'API_FAILURE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SCREENSHOT_FAILURE = 'SCREENSHOT_FAILURE',
  LLM_FAILURE = 'LLM_FAILURE',
  FATAL = 'FATAL'
}
```

### 6.2 Retry Strategy

- **Browser Crashes:** Retry with new session (max 2 retries, 5s delay)
- **API Failures:** Exponential backoff (max 2 retries: 2s, 4s)
- **Network Issues:** Linear backoff (max 3 retries: 3s, 3s, 3s)
- **Screenshot Failures:** Continue with warning (no retry)
- **LLM Failures:** Retry once, then fallback to heuristics

### 6.3 Graceful Degradation

- Screenshot failures → Continue with remaining screenshots
- LLM API failure → Use heuristic-based evaluation
- UI detection failure → Proceed with generic interactions
- Console log capture failure → Continue without logs

## 7. Security Considerations

### 7.1 API Key Management
- All API keys in environment variables only
- No hardcoded credentials
- Validation before execution

### 7.2 Input Sanitization
- URL validation (format, protocol)
- File path sanitization (prevent directory traversal)
- Rate limiting for API calls

### 7.3 Data Privacy
- Screenshots stored locally only (not uploaded)
- Console logs may contain sensitive data (handle with care)
- No external data transmission except LLM API

## 8. Performance Optimization

### 8.1 Browser Optimization
- Headless mode for faster execution
- Disable images/CSS if not needed for testing
- Close browser sessions immediately after use

### 8.2 LLM Optimization
- Cache similar evaluations (if applicable)
- Compress screenshots if > 1MB
- Batch requests if evaluating multiple games

### 8.3 Resource Management
- Limit concurrent browser sessions (max 3)
- Clean up temporary files
- Monitor memory usage

## 9. Testing Strategy

### 9.1 Unit Tests
- Test individual components in isolation
- Mock external dependencies (Browserbase, LLM API)
- Target: 60%+ code coverage

### 9.2 Integration Tests
- Test component interactions
- Use real Browserbase (if available) or mock
- Test error handling paths

### 9.3 End-to-End Tests
- Test full execution flow with sample games
- Validate output format and accuracy
- Test error recovery

## 10. Deployment Considerations

### 10.1 Lambda Compatibility
- No file system dependencies for core logic
- Artifact storage optional (can be streamed)
- Environment variable configuration
- Cold start optimization (lazy loading)

### 10.2 Docker (Optional)
- Containerize for consistent environment
- Include Node.js runtime
- Mount output directory as volume

### 10.3 CI/CD Integration
- Automated tests on PR
- Build and package verification
- Example game test on merge

