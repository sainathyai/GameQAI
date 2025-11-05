# DreamUp: Browser Game QA Pipeline

**Version:** 1.0  
**Status:** Planning & Setup Phase

## Overview

GameQAI is an AI-powered browser game QA pipeline that autonomously tests browser games by simulating user interactions, capturing visual evidence, and evaluating playability metrics. The system works with any web-hosted game URL and generates structured reports for automated game quality assessment.

## Project Status

🚧 **Project is in planning phase. Implementation will begin following PR-001.**

## Documentation

- **[REQUIREMENTS.md](./REQUIREMENTS.md)** - Detailed functional and non-functional requirements
- **[TECH_ARCHITECTURE.md](./TECH_ARCHITECTURE.md)** - System architecture and component design
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** - PR-by-PR implementation roadmap
- **[BRANCHING_STRATEGY.md](./BRANCHING_STRATEGY.md)** - Git branching and workflow guidelines
- **[TECH_STACK.md](./TECH_STACK.md)** - Technology stack recommendations and rationale

## Quick Start

### Prerequisites

- Bun 1.x (runtime and package manager)
- TypeScript 5.x
- Browserbase API key
- OpenAI API key

### Setup

```bash
# Install Bun (if not installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env

# Edit .env with your API keys
# - BROWSERBASE_API_KEY
# - OPENAI_API_KEY

# Run tests
bun run test

# Run QA pipeline
bun run dev <game-url>

# Example:
bun run dev https://example.com/game
```

## Architecture

The system consists of five main components:

1. **Browser Agent** - Handles browser automation and game interaction
2. **Evidence Capture** - Captures screenshots and console logs
3. **AI Evaluator** - Uses LLM to analyze game playability
4. **Report Builder** - Generates structured JSON reports
5. **Core Orchestrator** - Coordinates all components

See [TECH_ARCHITECTURE.md](./TECH_ARCHITECTURE.md) for detailed architecture.

## Implementation Plan

The project has been implemented in 4 phases (20 PRs), following the plan in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).

**Status:** ✅ All phases complete

- **Phase 1:** Foundation (PR-001 to PR-004) ✅
- **Phase 2:** Browser Automation (PR-005 to PR-010) ✅
- **Phase 3:** AI Integration (PR-011 to PR-014) ✅
- **Phase 4:** Integration & Polish (PR-015 to PR-020) ✅

## Tech Stack

- **Runtime:** Bun 1.x (fast, Browserbase compatible)
- **Language:** TypeScript 5.x (strict mode)
- **Package Manager:** Bun
- **Browser Automation:** Browserbase + Stagehand (cloud, Bun-compatible)
- **AI/LLM:** OpenAI SDK + GPT-4 Vision (direct SDK integration)
- **Validation:** zod
- **Logging:** winston
- **Testing:** Vitest

See [TECH_STACK.md](./TECH_STACK.md) for complete stack details.

## Contributing

This project follows a feature branch workflow. See [BRANCHING_STRATEGY.md](./BRANCHING_STRATEGY.md) for guidelines.

## License

[To be determined]

## Contact

For questions or issues, please contact:
- **Project Lead:** [Your Name]
- **Email:** [Your Email]

---

**Note:** This project is currently in the planning phase. Implementation will begin with PR-001.

