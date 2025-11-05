# DreamUp: Browser Game QA Pipeline - Tech Stack Recommendations

**Version:** 2.0  
**Date:** November 3, 2025  
**Status:** ✅ Finalized

## Overview

This document provides detailed technology stack recommendations for the GameQAI project, with rationale and alternatives for each choice.

## Finalized Stack

### Core Runtime & Language

#### ✅ **Bun Runtime** (CONFIRMED)
- **Rationale:** 
  - Fast JavaScript runtime and package manager
  - Built-in TypeScript support (no transpilation needed)
  - Fast execution (excellent for Lambda)
  - Compatible with Browserbase (cloud service, HTTP API)
  - Native performance improvements
- **Version:** Latest stable (1.x)
- **Installation:** Via [bun.sh](https://bun.sh) installer
- **Note:** Bun is fully compatible with Browserbase (cloud service), making it ideal for this project

#### ✅ **TypeScript 5.x**
- **Rationale:**
  - Type safety reduces bugs
  - Better IDE support and autocomplete
  - Easier refactoring
  - Industry standard for production TypeScript projects
- **Configuration:** Strict mode enabled
- **Alternative:** JavaScript (not recommended for this project)
- **Note:** Bun has built-in TypeScript support, no separate compilation step needed

#### ✅ **Package Manager: Bun**
- **Rationale:**
  - Same tool for runtime and package management
  - Fast package installation
  - Fast script execution
  - Single dependency management
- **Alternative:** npm (if compatibility issues arise, though not expected with Browserbase)

---

## Browser Automation

### ✅ **Browserbase + Stagehand** (CONFIRMED - Primary)

#### Browserbase
- **What:** Cloud-based browser automation service
- **Why:**
  - No local browser setup needed
  - Scalable and reliable
  - Lambda-compatible (no binary dependencies)
  - **Bun-compatible** (cloud service, HTTP API only)
  - Free tier: 1 browser-hour included
  - Handles browser updates automatically
- **Package:** `@browserbasehq/sdk`
- **API Key:** Required from Browserbase dashboard
- **Documentation:** https://docs.browserbase.com/
- **Status:** Confirmed - Fully compatible with Bun runtime
- **Compatibility Note:** Browserbase works perfectly with Bun since it's a cloud service accessed via HTTP API (no native binaries required)

#### Stagehand
- **What:** AI-powered browser automation library
- **Why:**
  - Intelligent UI element detection
  - Natural language commands
  - Reduces complexity of interaction logic
- **Package:** `@browserbasehq/stagehand`
- **Status:** Confirmed - Works with Bun via Browserbase SDK
- **Alternative:** Manual element detection with CSS selectors (if Stagehand unavailable)

### ⚠️ **Alternative: Puppeteer** (Fallback)

- **When to use:** If Browserbase unavailable or for local testing
- **Package:** `puppeteer` or `puppeteer-core`
- **Pros:**
  - Direct Chrome/Chromium control
  - No external service dependency
  - Good for local development
- **Cons:**
  - Requires browser binary (harder for Lambda)
  - More setup complexity
  - Need to manage browser updates

**Recommendation:** Start with Browserbase, have Puppeteer as fallback option.

---

## AI/LLM Integration

### ✅ **OpenAI SDK** (CONFIRMED - Primary)

- **Why:**
  - Official SDK from OpenAI
  - Direct control, simpler code
  - Full TypeScript support
  - Handles retries and error handling
  - No unnecessary abstraction layer
  - Better documentation for our use case
  - Simpler dependency tree
- **Package:** `openai` (official OpenAI SDK)
- **Documentation:** https://github.com/openai/openai-node
- **Status:** Confirmed - Direct OpenAI SDK integration

### ✅ **LLM Models**

#### ✅ **OpenAI GPT-4 Vision** (CONFIRMED)
- **Model:** `gpt-4-vision-preview` or `gpt-4o` (recommended: `gpt-4o`)
- **Why:**
  - Excellent vision capabilities for screenshot analysis
  - Structured output support (JSON mode)
  - Fast response times
  - Better price/performance ratio with GPT-4o
- **Cost:** ~$0.01-0.03 per test (with screenshots)
- **API Key:** Required from OpenAI
- **Status:** Confirmed as primary LLM provider
- **Integration:** Via OpenAI SDK directly

---

## Utilities & Libraries

### ✅ **Configuration & Validation**

#### dotenv
- **Package:** `dotenv`
- **Purpose:** Environment variable management
- **Usage:** Load `.env` files in development

#### zod
- **Package:** `zod`
- **Purpose:** Runtime type validation
- **Why:** Validate config, API responses, user input
- **Alternative:** Type guards (manual validation)

### ✅ **Logging**

#### winston
- **Package:** `winston`
- **Purpose:** Structured logging
- **Why:**
  - Multiple transports (console, file, JSON)
  - Log levels (DEBUG, INFO, WARN, ERROR)
  - Production-ready
- **Alternative:** `pino` (faster, lighter) or console.log (not recommended)

### ✅ **Utilities**

#### uuid
- **Package:** `uuid`
- **Purpose:** Generate unique session IDs
- **Alternative:** `crypto.randomUUID()` (Node.js built-in)

#### date-fns (Optional)
- **Package:** `date-fns`
- **Purpose:** Date formatting and manipulation
- **Alternative:** Native Date object

---

## Development Tools

### ✅ **TypeScript Configuration**

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### ✅ **Linting & Formatting**

#### ESLint
- **Package:** `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`
- **Purpose:** Code quality and consistency
- **Config:** TypeScript-friendly rules

#### Prettier (Optional)
- **Package:** `prettier`
- **Purpose:** Code formatting
- **Alternative:** ESLint formatting rules

### ✅ **Testing**

#### Jest or Vitest
- **Jest:** `jest`, `@types/jest`, `ts-jest`
- **Vitest:** `vitest` (faster, ESM-native)
- **Purpose:** Unit and integration testing
- **Recommendation:** Vitest (faster, better TypeScript support)

#### Testing Utilities
- **Mocking:** `@vitest/spy` or Jest mocks
- **HTTP Mocking:** `msw` (Mock Service Worker) for API mocking

---

## Deployment & Infrastructure

### ✅ **Lambda Runtime**

- **Runtime:** Bun (or Node.js 20.x if Bun not supported in Lambda)
- **Memory:** 512MB - 1GB (recommended: 512MB)
- **Timeout:** 5 minutes (max)
- **Package Size:** Keep under 50MB (uncompressed) or 250MB (compressed)
- **Note:** If Lambda doesn't support Bun runtime, code should be compatible with Node.js 20.x

### ✅ **Containerization (Optional)**

#### Docker
- **Purpose:** Local development and consistent environment
- **Base Image:** `oven/bun:latest` (for Bun) or `node:20-alpine` (fallback)
- **Use Case:** If team needs consistent environment

---

## Package.json Structure

```json
{
  "name": "gameqai",
  "version": "1.0.0",
  "description": "Browser Game QA Pipeline",
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "dev": "bun run src/index.ts",
    "start": "bun run src/index.ts",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src",
    "typecheck": "bun run --bun tsc --noEmit"
  },
  "dependencies": {
    "@browserbasehq/sdk": "^1.0.0",
    "@browserbasehq/stagehand": "^1.0.0",
    "openai": "^4.0.0",
    "dotenv": "^16.0.0",
    "zod": "^3.22.0",
    "winston": "^3.11.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.50.0",
    "typescript": "^5.2.0",
    "vitest": "^1.0.0"
  },
  "engines": {
    "bun": ">=1.0.0"
  }
}
```

---

## Version Recommendations

| Package | Recommended Version | Reason |
|---------|-------------------|--------|
| Bun | 1.x (latest) | Fast runtime, Browserbase compatible |
| TypeScript | 5.2+ | Latest stable, great features |
| Browserbase SDK | Latest | Active development |
| OpenAI SDK | Latest | Official OpenAI SDK |
| zod | 3.22+ | Mature, well-tested |
| winston | 3.11+ | Stable, production-ready |

---

## Cost Considerations

### Browserbase
- **Free Tier:** 1 browser-hour/month
- **Estimated Usage:** ~0.1-0.2 hours per test (5 minutes per test)
- **Cost:** Free for ~5-10 tests/month, then ~$0.10/hour

### LLM API
- **GPT-4 Vision:** ~$0.01-0.03 per test
- **Claude Sonnet:** ~$0.01-0.02 per test
- **Estimated Monthly:** $0.50-1.50 for 50 tests

### Total Estimated Cost
- **Development:** ~$0 (free tiers)
- **Production (50 tests/month):** ~$1-2/month

---

## Migration Path

### Phase 1: Core Stack (PR-001 to PR-005)
- Node.js + TypeScript
- Browserbase + Stagehand
- Basic utilities (dotenv, zod, winston)

### Phase 2: AI Integration (PR-011 to PR-013)
- Vercel AI SDK
- OpenAI or Anthropic API

### Phase 3: Testing & Polish (PR-019 to PR-020)
- Vitest for testing
- ESLint for code quality

---

## Alternatives & Trade-offs

### Browser Automation

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| Browserbase | Cloud, no setup, scalable | Cost, external dependency | ✅ Primary |
| Puppeteer | Free, local control | Setup complexity, Lambda challenges | ⚠️ Fallback |
| Playwright | Modern, multi-browser | Similar to Puppeteer | ⚠️ Alternative |

### LLM Integration

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| OpenAI SDK | Direct control, official, simple | Single provider only | ✅ Primary (Confirmed) |
| Vercel AI SDK | Unified API, multi-provider | Unnecessary abstraction | ❌ Not needed (single provider) |

### Testing Framework

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| Vitest | Fast, ESM-native | Newer ecosystem | ✅ Recommended |
| Jest | Mature, widely used | Slower, CJS-focused | ⚠️ Alternative |
| Mocha | Flexible | More setup | ❌ Not recommended |

---

## Security Considerations

### API Keys
- ✅ Store in environment variables only
- ✅ Never commit to git
- ✅ Use `.env.example` for documentation
- ✅ Validate keys before execution

### Input Validation
- ✅ Validate URLs before processing
- ✅ Sanitize file paths
- ✅ Validate LLM responses with Zod

### Dependencies
- ✅ Keep dependencies up to date
- ✅ Use `npm audit` or `bun audit`
- ✅ Pin major versions, allow patch updates

---

## Performance Optimization

### Bundle Size
- ✅ Use tree-shaking (ES modules)
- ✅ Minimize dependencies
- ✅ Use lightweight alternatives where possible

### Runtime Performance
- ✅ Lazy load heavy modules
- ✅ Cache LLM responses if applicable
- ✅ Optimize screenshot compression

---

## Summary

### ✅ Finalized Stack (CONFIRMED)

1. **Runtime:** **Bun 1.x** (fast, Browserbase compatible)
2. **Language:** TypeScript 5.x (strict mode)
3. **Package Manager:** Bun (unified with runtime)
4. **Browser:** **Browserbase + Stagehand** (cloud, Bun-compatible)
5. **AI/LLM:** **OpenAI SDK + GPT-4 Vision** (confirmed - direct SDK)
6. **Validation:** zod
7. **Logging:** winston
8. **Testing:** Vitest
9. **Linting:** ESLint

### 🎯 Key Principles

- **Type Safety:** TypeScript + Zod for runtime validation
- **Modularity:** Separate concerns, clear boundaries
- **Reliability:** Error handling, retries, graceful degradation
- **Observability:** Structured logging, clear error messages
- **Maintainability:** Clean code, good documentation, tests
- **Performance:** Bun runtime for fast execution
- **Compatibility:** Browserbase (cloud) works seamlessly with Bun

### 📦 Installation

```bash
# Install Bun (if not installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Run (no build step needed with Bun + TypeScript)
bun run src/index.ts <game-url>

# Or with scripts
bun run dev <game-url>
```

### ✅ Compatibility Confirmed

- **Bun + Browserbase:** ✅ Fully compatible (cloud service, HTTP API)
- **Bun + OpenAI SDK:** ✅ Fully compatible (official SDK, HTTP requests)
- **Bun + Stagehand:** ✅ Compatible (via Browserbase SDK)

---

## Next Steps

1. ✅ **Tech stack finalized and confirmed**
2. ✅ **Documentation updated**
3. 🚀 **Ready for PR-001: Project Setup & Configuration**
4. ⏭️ **Next:** Set up project structure with Bun runtime
5. ⏭️ **Next:** Configure environment variables (Browserbase + OpenAI API keys)
6. ⏭️ **Next:** Test with sample game URLs

