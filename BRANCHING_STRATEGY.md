# DreamUp: Browser Game QA Pipeline - Branching Strategy

**Version:** 1.0  
**Date:** November 3, 2025

## Overview

This document defines the Git branching strategy for the GameQAI project. We use a **feature branch workflow** with protected main branch and clear naming conventions.

## Branch Structure

```
main (protected)
  ├── feature/PR-001-project-setup
  ├── feature/PR-002-core-types
  ├── feature/PR-003-config-manager
  ├── ...
  └── develop (optional, for integration testing)
```

## Branch Types

### 1. `main` Branch
- **Purpose:** Production-ready code
- **Protection:** Protected branch (requires PR approval)
- **Merge Policy:** Only via Pull Requests
- **Status:** Always stable and deployable

### 2. `feature/*` Branches
- **Purpose:** Development of new features or components
- **Naming:** `feature/PR-XXX-description` (e.g., `feature/PR-001-project-setup`)
- **Lifecycle:** 
  - Created from `main`
  - Developed and tested
  - Merged back to `main` via PR
  - Deleted after merge

### 3. `develop` Branch (Optional)
- **Purpose:** Integration branch for testing multiple features together
- **Usage:** If we need to test multiple PRs together before merging to main
- **Merge Policy:** Feature branches can merge to `develop` for integration testing

### 4. `hotfix/*` Branches (If Needed)
- **Purpose:** Critical bug fixes in production
- **Naming:** `hotfix/description`
- **Lifecycle:**
  - Created from `main`
  - Fixed and tested
  - Merged to `main` and optionally `develop`

## Branch Naming Convention

### Feature Branches
```
feature/PR-XXX-description
```

**Examples:**
- `feature/PR-001-project-setup`
- `feature/PR-005-browser-agent`
- `feature/PR-013-ai-evaluator`

### Format Rules
- **Prefix:** `feature/` or `hotfix/`
- **PR Number:** `PR-XXX` (3-digit number with leading zeros)
- **Description:** Short, kebab-case description
- **Length:** Keep under 50 characters total

## Workflow

### 1. Starting a New Feature (PR)

```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/PR-001-project-setup

# Start development
# ... make changes ...
git add .
git commit -m "feat: initialize project setup"
```

### 2. During Development

```bash
# Make incremental commits
git add .
git commit -m "feat: add TypeScript configuration"

# Push to remote
git push origin feature/PR-001-project-setup

# Keep branch up to date with main (if needed)
git checkout main
git pull origin main
git checkout feature/PR-001-project-setup
git merge main
```

### 3. Creating a Pull Request

1. **Push branch to remote:**
   ```bash
   git push origin feature/PR-001-project-setup
   ```

2. **Create PR on GitHub:**
   - Title: `[PR-001] Project Setup & Configuration`
   - Description: Use PR template (see below)
   - Base: `main`
   - Compare: `feature/PR-001-project-setup`

3. **PR Description Template:**
   ```markdown
   ## PR-XXX: [Title]
   
   ### Goal
   [Brief description of what this PR accomplishes]
   
   ### Changes
   - [List of key changes]
   
   ### Dependencies
   - [List dependent PRs]
   
   ### Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass (if applicable)
   - [ ] Manual testing completed
   
   ### Checklist
   - [ ] Code compiles without errors
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] No hardcoded credentials
   - [ ] Error handling implemented
   ```

### 4. PR Review Process

1. **Self-Review:**
   - Check all items in PR checklist
   - Run tests locally
   - Verify code quality

2. **Code Review:**
   - At least one approval required
   - Address review comments
   - Update PR if needed

3. **Merge:**
   - Squash and merge (preferred) or merge commit
   - Delete branch after merge
   - Update main branch

### 5. After Merge

```bash
# Update local main
git checkout main
git pull origin main

# Delete local feature branch (if not auto-deleted)
git branch -d feature/PR-001-project-setup
```

## Commit Message Convention

We follow **Conventional Commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(browser): add UI pattern detection

- Implement button detection (Start, Play, etc.)
- Add canvas element detection
- Return structured detection result

fix(capture): handle screenshot failures gracefully

docs: update README with setup instructions

test(evaluator): add unit tests for AI evaluator
```

### Commit Message Rules
- **Subject:** Imperative mood, 50 chars max
- **Body:** Explain what and why, not how
- **Footer:** Reference issues/PRs if applicable

## Branch Protection Rules

### Main Branch Protection
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Restrict force pushes
- ✅ Restrict deletions

### Status Checks (CI/CD)
- TypeScript compilation (`tsc --noEmit`)
- Linting (ESLint)
- Unit tests
- (Optional) Integration tests

## Handling Dependencies Between PRs

### Scenario 1: Sequential Dependencies
If PR-002 depends on PR-001:

1. **Option A: Wait for PR-001 to merge**
   ```bash
   # PR-001 merges to main
   # PR-002 is created from updated main
   git checkout main
   git pull origin main
   git checkout -b feature/PR-002-core-types
   ```

2. **Option B: Branch from PR-001** (if PR-001 is not merged yet)
   ```bash
   # PR-002 branches from PR-001
   git checkout feature/PR-001-project-setup
   git checkout -b feature/PR-002-core-types
   # When PR-001 merges, rebase PR-002 onto main
   ```

### Scenario 2: Parallel Development
If PRs can be developed in parallel:
- Create all branches from `main`
- Merge independently when ready
- Resolve conflicts if they arise

## Rebase vs Merge

### Use Rebase for:
- Updating feature branch with latest `main`
- Cleaning up commit history before merge

```bash
# Update feature branch with main
git checkout feature/PR-001-project-setup
git rebase main

# If conflicts, resolve and continue
git rebase --continue
```

### Use Merge for:
- Merging feature branch to `main` (via PR)
- Integrating `main` into feature branch (if rebase is complex)

## Conflict Resolution

### If Conflicts Occur:

1. **During rebase/merge:**
   ```bash
   # Resolve conflicts in files
   # Stage resolved files
   git add <resolved-files>
   
   # Continue rebase
   git rebase --continue
   # OR continue merge
   git commit
   ```

2. **During PR merge:**
   - Resolve conflicts in GitHub UI, or
   - Pull latest main, rebase feature branch, resolve conflicts

## Branch Cleanup

### Automatic Cleanup
- Delete feature branches after PR merge (GitHub setting)

### Manual Cleanup
```bash
# List merged branches
git branch --merged main

# Delete local merged branches
git branch -d feature/PR-001-project-setup

# Delete remote branches (after merge)
git push origin --delete feature/PR-001-project-setup
```

## Best Practices

### ✅ Do:
- Create feature branches from latest `main`
- Keep branches focused (one PR per branch)
- Commit frequently with clear messages
- Keep branches up to date with `main`
- Delete branches after merge
- Use descriptive branch names

### ❌ Don't:
- Commit directly to `main`
- Force push to shared branches
- Create long-lived feature branches
- Mix unrelated changes in one PR
- Skip PR review process

## Example Workflow Timeline

```
Day 1:
  - Create feature/PR-001-project-setup
  - Develop and commit
  - Create PR, review, merge

Day 2:
  - Update main
  - Create feature/PR-002-core-types
  - Develop and commit
  - Create PR, review, merge

... continue for each PR
```

## Troubleshooting

### Branch is behind main
```bash
git checkout feature/PR-XXX-description
git rebase main
# Resolve conflicts if any
git push --force-with-lease origin feature/PR-XXX-description
```

### Accidentally committed to main
```bash
# Create feature branch from current state
git checkout -b feature/PR-XXX-description

# Reset main to previous commit
git checkout main
git reset --hard origin/main
```

### Need to update PR after review comments
```bash
git checkout feature/PR-XXX-description
# Make changes
git add .
git commit -m "fix: address review comments"
git push origin feature/PR-XXX-description
# PR updates automatically
```

## Summary

- **Branch from:** `main`
- **Name:** `feature/PR-XXX-description`
- **Merge via:** Pull Request (required)
- **After merge:** Delete branch
- **Commits:** Use Conventional Commits format
- **Keep updated:** Rebase/merge with `main` regularly

