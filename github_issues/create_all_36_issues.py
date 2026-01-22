#!/usr/bin/env python3
"""Create all 36 GitHub issues"""
import requests
import time

import os
TOKEN = os.getenv("GITHUB_TOKEN")
OWNER = "jonathanhollander"
REPO = "Continuum"

headers = {"Authorization": f"token {TOKEN}", "Accept": "application/vnd.github.v3+json"}

# Phase 2-4 issues (Phase 1 already created)
issues = [
    # Phase 2
    {"title": "P1: Centralize configuration and remove hardcoded URLs (60+ files)", "body": "**Agent:** configuration-management\n**Skill:** config-setup\n**Time:** 8 hours\n\nReplace all hardcoded values with environment-based configuration.\n\nSee github_issues/PHASE_2_P1_HIGH.md for details.", "labels": ["P1-high", "configuration"]},
    {"title": "P1: Set up Alembic for proper database migration management", "body": "**Agent:** database-migration\n**Time:** 8 hours\n**Dependencies:** Issue #3\n\nSet up Alembic for database schema versioning.\n\nSee github_issues/PHASE_2_P1_HIGH.md for details.", "labels": ["P1-high", "data-persistence"]},
    {"title": "P1: Standardize error handling with user-friendly messages", "body": "**Agent:** error-handling-standardization\n**Time:** 12 hours\n\nAdd comprehensive error handling across frontend and backend.\n\nSee github_issues/PHASE_2_P1_HIGH.md for details.", "labels": ["P1-high", "monitoring"]},
    {"title": "P1: Security hardening - CORS, rate limiting, HTTPS, CSRF", "body": "**Agent:** security-scanner\n**Time:** 12 hours\n**Dependencies:** Issue #7\n\nImplement security best practices for production.\n\nSee github_issues/PHASE_2_P1_HIGH.md for details.", "labels": ["P1-high", "security"]},
    {"title": "P1: Consolidate frontend state management with consistent patterns", "body": "**Agent:** frontend-state-cleanup\n**Time:** 8 hours\n**Dependencies:** Issue #3\n\nConsolidate state management using Svelte 5 patterns.\n\nSee github_issues/PHASE_2_P1_HIGH.md for details.", "labels": ["P1-high", "frontend"]},
    {"title": "P1: Rewrite all module headers to be emotionally appropriate", "body": "**Agent:** module-header-rewrite\n**Time:** 6 hours\n\nRewrite module headers to explain WHY and provide emotional support.\n\nSee github_issues/PHASE_2_P1_HIGH.md for details.", "labels": ["P1-high", "emotional-tone"]},
    {"title": "P1: Replace generic 'Saved' with meaningful progress affirmations", "body": "**Agent:** progress-celebration\n**Time:** 4 hours\n\nReplace generic success messages with courage-acknowledging affirmations.\n\nSee github_issues/PHASE_2_P1_HIGH.md for details.", "labels": ["P1-high", "emotional-tone"]},
    {"title": "P1: Replace demanding button text with compassionate language", "body": "**Agent:** button-language-audit\n**Time:** 4 hours\n\nReplace imperative verbs with invitational language.\n\nSee github_issues/PHASE_2_P1_HIGH.md for details.", "labels": ["P1-high", "emotional-tone"]},
    {"title": "P1: Replace 'No items yet' with encouraging empty states", "body": "**Agent:** empty-state-compassion\n**Time:** 4 hours\n\nReplace generic empty states with meaningful encouragement.\n\nSee github_issues/PHASE_2_P1_HIGH.md for details.", "labels": ["P1-high", "emotional-tone"]},
    {"title": "P1: Adapt language based on user role (planner vs executor vs bereaved)", "body": "**Agent:** context-aware-messaging\n**Time:** 8 hours\n\nImplement context-aware messaging for different user roles.\n\nSee github_issues/PHASE_2_P1_HIGH.md for details.", "labels": ["P1-high", "emotional-tone"]},
    {"title": "P1: Build specialized 'Executor Mode' for bereaved users", "body": "**Agent:** grief-aware-executor\n**Time:** 12 hours\n**Dependencies:** Issue #16\n\nCreate grief-aware mode for executors handling affairs.\n\nSee github_issues/PHASE_2_P1_HIGH.md for details.", "labels": ["P1-high", "emotional-tone"]},
    {"title": "P1: Detect when users are overwhelmed and offer support/breaks", "body": "**Agent:** overwhelm-detection\n**Time:** 8 hours\n\nDetect overwhelm signals and proactively offer support.\n\nSee github_issues/PHASE_2_P1_HIGH.md for details.", "labels": ["P1-high", "emotional-tone"]},
    {"title": "P1: Implement structured logging with proper levels and rotation", "body": "**Agent:** logging-system\n**Time:** 8 hours\n\nReplace print statements with structured logging.\n\nSee github_issues/PHASE_2_P1_HIGH.md for details.", "labels": ["P1-high", "monitoring"]},
    # Phase 3
    {"title": "P2: Create comprehensive backend unit test suite with 80% coverage", "body": "**Agent:** unit-test-suite\n**Time:** 16 hours\n\nCreate pytest-based unit tests for all backend modules.\n\nSee github_issues/PHASE_3_P2_TESTING.md for details.", "labels": ["P2-testing", "backend"]},
    {"title": "P2: Create frontend unit test suite with 60% coverage", "body": "**Agent:** unit-test-suite\n**Time:** 12 hours\n\nCreate Vitest tests for frontend components and services.\n\nSee github_issues/PHASE_3_P2_TESTING.md for details.", "labels": ["P2-testing", "frontend"]},
    {"title": "P2: Implement E2E tests for critical user workflows", "body": "**Agent:** e2e-tests\n**Time:** 16 hours\n**Dependencies:** Issues #2, #3\n\nCreate Playwright E2E tests for critical journeys.\n\nSee github_issues/PHASE_3_P2_TESTING.md for details.", "labels": ["P2-testing", "e2e"]},
    {"title": "P2: Generate comprehensive API documentation with OpenAPI", "body": "**Agent:** api-documentation\n**Time:** 8 hours\n\nGenerate complete API docs with OpenAPI spec.\n\nSee github_issues/PHASE_3_P2_TESTING.md for details.", "labels": ["P2-testing", "documentation"]},
    {"title": "P2: Create comprehensive developer onboarding documentation", "body": "**Agent:** developer-documentation\n**Time:** 8 hours\n\nCreate developer documentation for contributors.\n\nSee github_issues/PHASE_3_P2_TESTING.md for details.", "labels": ["P2-testing", "documentation"]},
    {"title": "P2: Validate frontend TypeScript types match backend models", "body": "**Agent:** api-contract-validator\n**Time:** 8 hours\n**Dependencies:** Issue #3\n\nEnsure frontend types stay in sync with backend.\n\nSee github_issues/PHASE_3_P2_TESTING.md for details.", "labels": ["P2-testing", "integration"]},
    {"title": "P2: Create integration tests verifying frontend/backend communication", "body": "**Agent:** frontend-backend-sync\n**Time:** 8 hours\n**Dependencies:** Issues #3, #8\n\nTest that frontend and backend work together.\n\nSee github_issues/PHASE_3_P2_TESTING.md for details.", "labels": ["P2-testing", "integration"]},
    {"title": "P2: Configure Railway deployment with health checks", "body": "**Agent:** railway-deployment\n**Time:** 6 hours\n**Dependencies:** Issues #7, #10\n\nSet up production-ready Railway deployment.\n\nSee github_issues/PHASE_3_P2_TESTING.md for details.", "labels": ["P2-testing", "deployment"]},
    {"title": "P2: Create deployment validation script to verify deployments", "body": "**Agent:** deployment-validation\n**Time:** 4 hours\n**Dependencies:** Issue #27\n\nAutomated script to verify deployment success.\n\nSee github_issues/PHASE_3_P2_TESTING.md for details.", "labels": ["P2-testing", "deployment"]},
    {"title": "P2: Implement performance monitoring for API endpoints", "body": "**Agent:** performance-monitoring\n**Time:** 6 hours\n\nMonitor and log API endpoint performance.\n\nSee github_issues/PHASE_3_P2_TESTING.md for details.", "labels": ["P2-testing", "monitoring"]},
    {"title": "P2: Set up Sentry for production error tracking", "body": "**Agent:** error-tracking\n**Time:** 4 hours\n\nIntegrate Sentry for error tracking.\n\nSee github_issues/PHASE_3_P2_TESTING.md for details.", "labels": ["P2-testing", "monitoring"]},
    {"title": "P2: Create isolated test database and mock services", "body": "**Agent:** local-testing-environment\n**Time:** 4 hours\n**Dependencies:** Issue #8\n\nSet up isolated testing environment.\n\nSee github_issues/PHASE_3_P2_TESTING.md for details.", "labels": ["P2-testing", "testing"]},
    # Phase 4
    {"title": "P3: Enable strict TypeScript and enforce Python type hints", "body": "**Agent:** type-safety-enforcer\n**Time:** 12 hours\n\nEnable strict type checking across codebase.\n\nSee github_issues/PHASE_4_P3_POLISH.md for details.", "labels": ["P3-polish", "type-safety"]},
    {"title": "P3: Implement offline-first PWA with service worker caching", "body": "**Agent:** offline-mode\n**Time:** 12 hours\n\nMake app work offline with PWA capabilities.\n\nSee github_issues/PHASE_4_P3_POLISH.md for details.", "labels": ["P3-polish", "offline"]},
    {"title": "P3: Optimize frontend performance with code splitting", "body": "**Agent:** performance-monitoring\n**Time:** 8 hours\n\nReduce bundle size and improve load times.\n\nSee github_issues/PHASE_4_P3_POLISH.md for details.", "labels": ["P3-polish", "performance"]},
    {"title": "P3: Automated PR checks for breaking API changes", "body": "**Agent:** breaking-change-detector\n**Time:** 8 hours\n**Dependencies:** Issue #25\n\nDetect breaking changes in PRs before merge.\n\nSee github_issues/PHASE_4_P3_POLISH.md for details.", "labels": ["P3-polish", "automation"]},
    {"title": "P3: Automated code review checks for pull requests", "body": "**Agent:** github-pr-reviewer\n**Time:** 8 hours\n\nAutomated PR reviews checking for issues.\n\nSee github_issues/PHASE_4_P3_POLISH.md for details.", "labels": ["P3-polish", "automation"]},
    {"title": "P3: Coordinate schema changes across SQLModel, Alembic, TypeScript", "body": "**Agent:** database-schema-coordinator\n**Time:** 4 hours\n**Dependencies:** Issues #3, #8, #25\n\nEnsure schema changes stay in sync.\n\nSee github_issues/PHASE_4_P3_POLISH.md for details.", "labels": ["P3-polish", "automation"]},
    {"title": "P3: Standardize all API responses with consistent format", "body": "**Agent:** api-response-standardization\n**Time:** 4 hours\n\nEnsure all endpoints return consistent format.\n\nSee github_issues/PHASE_4_P3_POLISH.md for details.", "labels": ["P3-polish", "api"]},
]

# Create more labels
more_labels = [
    {"name": "configuration", "color": "5319e7"},
    {"name": "security", "color": "d93f0b"},
    {"name": "monitoring", "color": "006b75"},
    {"name": "testing", "color": "fbca04"},
    {"name": "documentation", "color": "0075ca"},
    {"name": "deployment", "color": "5319e7"},
    {"name": "integration", "color": "1d76db"},
    {"name": "e2e", "color": "fbca04"},
    {"name": "offline", "color": "006b75"},
    {"name": "performance", "color": "ff6b6b"},
    {"name": "automation", "color": "5319e7"},
    {"name": "api", "color": "1d76db"},
    {"name": "type-safety", "color": "0052cc"},
]

print("Creating additional labels...")
for label in more_labels:
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/labels"
    r = requests.post(url, headers=headers, json=label)
    if r.status_code in [201, 422]:
        print(f"✓ {label['name']}")

print(f"\nCreating {len(issues)} remaining issues...")
for i, issue in enumerate(issues, 7):
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/issues"
    r = requests.post(url, headers=headers, json=issue)
    if r.status_code == 201:
        print(f"✓ Issue #{r.json()['number']}: {issue['title'][:60]}...")
    else:
        print(f"✗ Failed: {issue['title'][:40]}")
    time.sleep(0.5)  # Rate limit protection

print(f"\n✅ All 36 issues created!")
print(f"View at: https://github.com/{OWNER}/{REPO}/issues")
