# GitHub Issues Workflow Guide

## Overview

36 GitHub issues created across 4 phases representing 284 hours of work. Each issue is designed for parallel execution by multiple agentic AI assistants.

## Quick Start

1. **Create labels** - Run `./CREATE_LABELS.sh` or create manually via GitHub web UI
2. **Create issues** - Follow `QUICK_CREATE_GUIDE.md` to create all 36 issues
3. **Start Phase 1** - Begin with 5 critical infrastructure issues (P0)
4. **Use specified agents** - Each issue names the agent to use
5. **Track dependencies** - Some issues depend on others completing first

## File Structure

```
github_issues/
├── PHASE_1_P0_CRITICAL.md       # 5 issues, 44 hours - Critical infrastructure
├── PHASE_2_P1_HIGH.md            # 13 issues, 94 hours - High priority foundation
├── PHASE_3_P2_TESTING.md         # 11 issues, 90 hours - Testing and quality
├── PHASE_4_P3_POLISH.md          # 7 issues, 56 hours - Polish and optimization
├── CREATE_LABELS.sh              # Script to create GitHub labels
├── QUICK_CREATE_GUIDE.md         # Manual issue creation guide
└── GITHUB_ISSUES_GUIDE.md        # This file - workflow guide
```

## Issue Format

Each issue contains:
- **Title** - Clear, actionable description
- **Labels** - Priority (P0-P3) + category tags
- **Time Estimate** - Hours to complete
- **Agent** - Specific agent to use (see `.claude/agents/`)
- **Skill** - Custom skill if applicable (see `.claude/skills/`)
- **Dependencies** - Other issues that must complete first
- **Success Criteria** - Checklist to verify completion

## Phases

### Phase 1: Critical Infrastructure (P0)
**Start immediately - blocking all other work**

- Issue #1: Authentication guards (8h)
- Issue #2: Backend data models (16h)
- Issue #3: Media upload infrastructure (12h)
- Issue #4: Email production config (4h)
- Issue #5: AI empathy fix [CRITICAL] (4h)

**Total:** 44 hours

### Phase 2: High Priority Foundation (P1)
**Start after Phase 1 - weeks 1-2**

Issues #6-18 covering:
- Configuration management
- Database migrations
- Error handling
- Security hardening
- Frontend state cleanup
- 7 emotional tone improvements

**Total:** 94 hours

### Phase 3: Testing & Quality (P2)
**Weeks 3-4 - can start in parallel with Phase 2**

Issues #19-30 covering:
- Unit tests (backend 80%, frontend 60%)
- E2E tests with Playwright
- API documentation
- Developer docs
- Integration tests
- Deployment configuration
- Monitoring and error tracking

**Total:** 90 hours

### Phase 4: Polish & Optimization (P3)
**Week 5+ - final polish**

Issues #31-37 covering:
- Type safety enforcement
- Offline PWA mode
- Performance optimization
- Automated PR checks
- Breaking change detection
- Schema coordination
- API standardization

**Total:** 56 hours

## Multi-Agent Workflow

### For Solo Developer

1. Pick an issue from current phase
2. Launch appropriate agent: `claude --agent <agent-name>`
3. Reference issue number in commits
4. Mark issue complete when done
5. Move to next issue

### For Multiple AI Agents (Parallel Execution)

1. **Terminal 1:** Phase 1 critical work
   ```bash
   cd project
   claude --agent authentication-architect
   # Work on Issue #1
   ```

2. **Terminal 2:** Phase 2 emotional tone
   ```bash
   cd project-worktree-2
   claude --agent module-header-rewrite
   # Work on Issue #11
   ```

3. **Terminal 3:** Phase 3 testing
   ```bash
   cd project-worktree-3
   claude --agent unit-test-suite
   # Work on Issue #19
   ```

All agents work in parallel on different issues. Git worktrees keep work isolated.

### Dependencies

Some issues have dependencies and must wait:

- Issue #7 (Alembic) depends on Issue #2 (models exist)
- Issue #15 (Context messaging) depends on Issue #11 (module headers)
- Issue #16 (Executor mode) depends on Issue #15 (context aware)
- All Phase 3 testing depends on Phase 1 being stable

Check "Dependencies" field in each issue before starting.

## Agent Reference

Agents are in `.claude/agents/` directory:

**Phase 1 Agents:**
- `authentication-architect` - Auth guards and JWT
- `data-persistence-unifier` - Backend models and sync
- `media-upload-infrastructure` - File uploads
- `email-integration` - Email service setup
- `ai-empathy` - Fix AI system prompt

**Phase 2 Agents:**
- `configuration-management` - Centralize config
- `database-migration` - Alembic setup
- `error-handling-standardization` - Error handling
- `security-scanner` - Security hardening
- `frontend-state-cleanup` - State management
- `module-header-rewrite` - Module descriptions
- `progress-celebration` - Affirmations
- `button-language-audit` - Button text
- `empty-state-compassion` - Empty states
- `context-aware-messaging` - Role-based text
- `grief-aware-executor` - Executor mode
- `overwhelm-detection` - Overwhelm signals
- `logging-system` - Structured logging

**Phase 3 Agents:**
- `unit-test-suite` - Unit tests
- `e2e-tests` - Playwright tests
- `api-documentation` - OpenAPI docs
- `developer-documentation` - Dev guides
- `api-contract-validator` - Type sync
- `frontend-backend-sync` - Integration tests
- `railway-deployment` - Deploy config
- `deployment-validation` - Smoke tests
- `performance-monitoring` - Performance tracking
- `error-tracking` - Sentry setup
- `local-testing-environment` - Test environment

**Phase 4 Agents:**
- `type-safety-enforcer` - Strict typing
- `offline-mode` - PWA and service workers
- `breaking-change-detector` - PR checks
- `github-pr-reviewer` - Automated reviews
- `database-schema-coordinator` - Schema sync
- `api-response-standardization` - Response format

## Custom Skills

Skills in `.claude/skills/` for quick fixes:

- `fix-auth` - Quick auth fixes
- `fix-data` - Quick data persistence fixes
- `fix-empathy` - Quick AI empathy fixes
- `config-setup` - Config management
- `deploy` - Deployment tasks

## Commit Message Format

Reference issue numbers in commits:

```bash
git commit -m "feat: add authentication route guards (#1)"
git commit -m "fix: remove hardcoded USER_ID from contacts (#2)"
git commit -m "docs: rewrite module headers with emotional context (#11)"
```

## Pull Request Strategy

### Option A: One PR per phase
- Create PR for all Phase 1 issues together
- Review and merge as a unit
- Then move to Phase 2

### Option B: One PR per issue
- Smaller, focused PRs
- Easier to review
- Can merge independently

### Option C: Feature branches
- Group related issues into feature branches
- E.g., "auth-system" includes issues #1, #6, #9
- Merge feature branches to main

## Verification

After completing each issue:

1. Check all success criteria boxes
2. Run tests if applicable
3. Verify no regressions
4. Update issue with completion notes
5. Link PR to issue
6. Close issue

## Progress Tracking

Use GitHub Projects to track:

1. Create project: https://github.com/jonathanhollander/Continuum/projects
2. Add columns: To Do, In Progress, Done
3. Add all 36 issues to project
4. Move issues as work progresses
5. Filter by phase/priority/label

## Time Estimates

- **Phase 1:** 44 hours (1 week for 1 person, 1 day for 5 agents)
- **Phase 2:** 94 hours (2.5 weeks for 1 person, 2 days for 5 agents)
- **Phase 3:** 90 hours (2.5 weeks for 1 person, 2 days for 5 agents)
- **Phase 4:** 56 hours (1.5 weeks for 1 person, 1.5 days for 5 agents)

**Total:** 284 hours (7 weeks solo, 1 week with 5 parallel agents)

## Getting Started Right Now

1. Go to: https://github.com/jonathanhollander/Continuum/issues
2. Create labels using `CREATE_LABELS.sh` or manually
3. Create Issue #1 using template from `QUICK_CREATE_GUIDE.md`
4. Launch agent: `claude --agent authentication-architect`
5. Start implementing authentication guards
6. Reference detailed instructions in `PHASE_1_P0_CRITICAL.md`

---

**Questions?** See individual phase files for detailed implementation guidance for each issue.
