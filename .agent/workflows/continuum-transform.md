---
description: Execute the 10-phase Continuum project transformation roadmap
---

# Continuum Project Transformation Workflow

Use this workflow to execute the step-by-step transformation of Continuum from a Notion-inspired app to a standalone SaaS platform, following the 31-day manifest.

## Reference
See `continuum-agents/MANIFEST.md` for the full roadmap, dependencies, and progress tracking.

## Phase Execution Steps

### 1. Identify Target Phase
Review `MANIFEST.md` to see the current status and the next agent to execute.

### 2. Execute Quick Wins (Phase 1)
Run these immediately to fix known issues:
- `06-webauthn-quick-fix`
- `07-pulse-scheduler-tuner`
- `05-configuration-management`

### 3. core Infrastructure (Weeks 1-2)
Proceed with:
- `01-authentication-architect`
- `04-email-integration`
- `02-data-persistence-unifier`

### 4. Continuous Validation
After every agent execution or code change, run the validation suite:
```bash
python3 scripts/pr-review/run_all_checks.py
```

### 5. UI Standards Audit
Periodically use the `ui-standards-auditor` skill to ensure the site's emotional tone and visual consistency are maintained.

### 6. Deployment
Once all 10 phases are complete:
1. Run `23-code-validation`
2. Run `24-railway-deployment`
3. Run `25-deployment-verification`

## Reporting
Maintain the `MANIFEST.md` progress tracking section to keep the user informed of the transformation status.
