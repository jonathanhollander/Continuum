# Agent 39: GitHub PR Reviewer
**Priority:** P1 - HIGH
**Estimated Time:** 4-6 hours (1 day)
**Dependencies:** None (standalone)
**Category:** GitHub Review

---

## OBJECTIVE

Create comprehensive automated PR review system for Continuum codebase that checks for breaking changes, security issues, emotional tone compliance, test coverage, and type safety.

**Responsibilities:**
- Automated PR reviews on every pull request
- Check for breaking changes (API, schema, component props)
- Verify emotional tone compliance (no cold language in death planning context)
- Security vulnerability scanning
- Test coverage requirements
- Type safety validation
- Database migration validation

**Expected Outcome:**
- GitHub Action that runs on every PR
- Automated comments on PRs with findings
- Pass/fail status checks
- Merge blocking for critical issues
- Compassionate feedback in review comments

---

## FILES TO CREATE

### GitHub Action:
1. `/.github/workflows/pr-review.yml` - Main PR review workflow

### Review Scripts:
2. `/scripts/pr-review/run_all_checks.py` - Orchestrator script
3. `/scripts/pr-review/breaking_change_detector.py` - Detect breaking changes
4. `/scripts/pr-review/security_scanner.py` - Security vulnerability scanner
5. `/scripts/pr-review/emotional_tone_checker.py` - Check for cold language
6. `/scripts/pr-review/test_coverage_checker.py` - Verify test coverage
7. `/scripts/pr-review/migration_validator.py` - Validate database migrations
8. `/scripts/pr-review/type_safety_checker.py` - TypeScript/Python type checks

### Configuration:
9. `/scripts/pr-review/config.json` - Review configuration
10. `/scripts/pr-review/emotional_tone_rules.json` - Tone checking rules

---

## IMPLEMENTATION

### Step 1: Create PR Review GitHub Action

**File:** `/.github/workflows/pr-review.yml`

```yaml
name: PR Review

on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches:
      - main
      - develop

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  automated-review:
    runs-on: ubuntu-latest
    name: Automated PR Review

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for diff analysis

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Python dependencies
        run: |
          pip install -r scripts/pr-review/requirements.txt

      - name: Install frontend dependencies
        run: |
          cd frontend
          npm ci

      - name: Run all PR checks
        id: pr-checks
        run: |
          python scripts/pr-review/run_all_checks.py \
            --base-ref ${{ github.event.pull_request.base.sha }} \
            --head-ref ${{ github.event.pull_request.head.sha }} \
            --pr-number ${{ github.event.pull_request.number }} \
            --output-file pr-review-results.json

      - name: Post PR comment
        if: always()
        uses: actions/github-script@v7
        with:
          github-token: ${{secrets.GITHUB_TOKEN}}
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('pr-review-results.json', 'utf8'));

            let comment = '## 🤖 Automated PR Review\n\n';

            // Summary
            comment += '### Summary\n\n';
            comment += `- **Breaking Changes:** ${results.breaking_changes.count}\n`;
            comment += `- **Security Issues:** ${results.security.count}\n`;
            comment += `- **Emotional Tone Violations:** ${results.emotional_tone.count}\n`;
            comment += `- **Test Coverage:** ${results.test_coverage.percentage}%\n`;
            comment += `- **Type Errors:** ${results.type_safety.count}\n\n`;

            // Breaking changes
            if (results.breaking_changes.count > 0) {
              comment += '### ⚠️ Breaking Changes Detected\n\n';
              for (const change of results.breaking_changes.items) {
                comment += `- **${change.file}**: ${change.description}\n`;
              }
              comment += '\n';
            }

            // Security issues
            if (results.security.count > 0) {
              comment += '### 🔒 Security Issues\n\n';
              for (const issue of results.security.items) {
                comment += `- **${issue.severity}**: ${issue.description} (${issue.file}:${issue.line})\n`;
              }
              comment += '\n';
            }

            // Emotional tone violations
            if (results.emotional_tone.count > 0) {
              comment += '### 💔 Emotional Tone Issues\n\n';
              comment += '*Continuum is a death planning application. Language should be compassionate and empathetic.*\n\n';
              for (const violation of results.emotional_tone.items) {
                comment += `- **${violation.file}:${violation.line}**: "${violation.text}"\n`;
                comment += `  Suggestion: "${violation.suggestion}"\n\n`;
              }
            }

            // Test coverage
            if (results.test_coverage.percentage < 70) {
              comment += '### ⚠️ Low Test Coverage\n\n';
              comment += `Current coverage: ${results.test_coverage.percentage}%\n`;
              comment += `Target: 70%\n\n`;
              comment += 'Files with low coverage:\n';
              for (const file of results.test_coverage.low_coverage_files) {
                comment += `- ${file.name}: ${file.coverage}%\n`;
              }
              comment += '\n';
            }

            // Overall assessment
            const criticalIssues = results.breaking_changes.count + results.security.count;
            if (criticalIssues > 0) {
              comment += '### ❌ Review Failed\n\n';
              comment += 'This PR has critical issues that must be addressed before merging.\n';
            } else if (results.emotional_tone.count > 0) {
              comment += '### ⚠️ Review Passed with Warnings\n\n';
              comment += 'This PR passes technical checks but has emotional tone issues. Please review carefully.\n';
            } else {
              comment += '### ✅ Review Passed\n\n';
              comment += 'All automated checks passed! This PR looks good from a technical perspective.\n';
            }

            // Post comment
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: comment
            });

      - name: Set status check
        if: always()
        run: |
          RESULTS=$(cat pr-review-results.json)
          BREAKING_CHANGES=$(echo $RESULTS | jq '.breaking_changes.count')
          SECURITY_ISSUES=$(echo $RESULTS | jq '.security.count')

          if [ $BREAKING_CHANGES -gt 0 ] || [ $SECURITY_ISSUES -gt 0 ]; then
            echo "Critical issues found"
            exit 1
          fi
```

---

### Step 2: Create Main Review Orchestrator

**File:** `/scripts/pr-review/run_all_checks.py`

```python
#!/usr/bin/env python3
"""
Comprehensive PR review orchestrator for Continuum

Runs all automated checks and generates report.
"""

import argparse
import json
import subprocess
from pathlib import Path
from typing import Dict, List, Any

from breaking_change_detector import BreakingChangeDetector
from security_scanner import SecurityScanner
from emotional_tone_checker import EmotionalToneChecker
from test_coverage_checker import TestCoverageChecker
from migration_validator import MigrationValidator
from type_safety_checker import TypeSafetyChecker


class PRReviewer:
    """Main PR review orchestrator"""

    def __init__(self, base_ref: str, head_ref: str, pr_number: int):
        self.base_ref = base_ref
        self.head_ref = head_ref
        self.pr_number = pr_number
        self.results = {
            "breaking_changes": {"count": 0, "items": []},
            "security": {"count": 0, "items": []},
            "emotional_tone": {"count": 0, "items": []},
            "test_coverage": {"percentage": 0, "low_coverage_files": []},
            "type_safety": {"count": 0, "items": []},
            "migrations": {"valid": True, "issues": []}
        }

    def run_all_checks(self) -> Dict[str, Any]:
        """Run all automated checks"""

        print("🔍 Running PR review checks...")

        # 1. Breaking changes
        print("\n1️⃣  Checking for breaking changes...")
        breaking_detector = BreakingChangeDetector(self.base_ref, self.head_ref)
        breaking_changes = breaking_detector.detect_breaking_changes()
        self.results["breaking_changes"] = {
            "count": len(breaking_changes),
            "items": breaking_changes
        }
        print(f"   Found {len(breaking_changes)} breaking changes")

        # 2. Security vulnerabilities
        print("\n2️⃣  Scanning for security vulnerabilities...")
        security_scanner = SecurityScanner()
        security_issues = security_scanner.scan_changes(self.base_ref, self.head_ref)
        self.results["security"] = {
            "count": len(security_issues),
            "items": security_issues
        }
        print(f"   Found {len(security_issues)} security issues")

        # 3. Emotional tone violations
        print("\n3️⃣  Checking emotional tone compliance...")
        tone_checker = EmotionalToneChecker()
        tone_violations = tone_checker.check_changes(self.base_ref, self.head_ref)
        self.results["emotional_tone"] = {
            "count": len(tone_violations),
            "items": tone_violations
        }
        print(f"   Found {len(tone_violations)} emotional tone violations")

        # 4. Test coverage
        print("\n4️⃣  Checking test coverage...")
        coverage_checker = TestCoverageChecker()
        coverage_report = coverage_checker.check_coverage()
        self.results["test_coverage"] = coverage_report
        print(f"   Test coverage: {coverage_report['percentage']}%")

        # 5. Type safety
        print("\n5️⃣  Checking type safety...")
        type_checker = TypeSafetyChecker()
        type_errors = type_checker.check_types()
        self.results["type_safety"] = {
            "count": len(type_errors),
            "items": type_errors
        }
        print(f"   Found {len(type_errors)} type errors")

        # 6. Database migrations
        print("\n6️⃣  Validating database migrations...")
        migration_validator = MigrationValidator()
        migration_issues = migration_validator.validate_migrations(
            self.base_ref, self.head_ref
        )
        self.results["migrations"] = {
            "valid": len(migration_issues) == 0,
            "issues": migration_issues
        }
        print(f"   Migrations valid: {self.results['migrations']['valid']}")

        print("\n✅ All checks complete!")
        return self.results

    def save_results(self, output_file: str):
        """Save results to JSON file"""
        with open(output_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\n📄 Results saved to {output_file}")


def main():
    parser = argparse.ArgumentParser(description='Run PR review checks')
    parser.add_argument('--base-ref', required=True, help='Base commit SHA')
    parser.add_argument('--head-ref', required=True, help='Head commit SHA')
    parser.add_argument('--pr-number', type=int, required=True, help='PR number')
    parser.add_argument('--output-file', default='pr-review-results.json',
                        help='Output JSON file')

    args = parser.parse_args()

    reviewer = PRReviewer(args.base_ref, args.head_ref, args.pr_number)
    results = reviewer.run_all_checks()
    reviewer.save_results(args.output_file)

    # Exit with error code if critical issues found
    critical_issues = (
        results["breaking_changes"]["count"] +
        results["security"]["count"]
    )

    if critical_issues > 0:
        print(f"\n❌ Critical issues found: {critical_issues}")
        exit(1)
    else:
        print("\n✅ No critical issues found")
        exit(0)


if __name__ == "__main__":
    main()
```

---

### Step 3: Create Emotional Tone Checker

**File:** `/scripts/pr-review/emotional_tone_checker.py`

```python
#!/usr/bin/env python3
"""
Emotional tone checker for Continuum

Verifies that all user-facing text maintains compassionate tone
appropriate for death planning application.

UNIQUE TO CONTINUUM: This is critical for our product.
"""

import re
import subprocess
from typing import List, Dict, Any
import json
from pathlib import Path


class EmotionalToneChecker:
    """
    Check for cold, clinical, or inappropriate language in death planning app
    """

    # Words/phrases that are TOO COLD for death planning
    FORBIDDEN_PHRASES = [
        # Clinical/technical
        "body preparation",
        "corpse",
        "remains disposal",
        "deceased processing",

        # Efficiency language
        "quickly complete",
        "hurry",
        "as fast as possible",
        "speed up",
        "rapid completion",

        # Cold/dismissive
        "just enter",
        "simply add",
        "it's easy",
        "no big deal",

        # Technical errors without empathy
        "invalid input",
        "error 500",
        "request failed",
        "operation unsuccessful",

        # Task-focused without context
        "complete checklist",
        "finish tasks",
        "100% completion required",

        # AI tone violations
        "skip the empathetic filler",
        "no fluff",
        "be efficient",
        "mission redline"
    ]

    # Required compassionate alternatives
    REQUIRED_PATTERNS = {
        "error_messages": [
            "your data is safe",
            "we're here to help",
            "take your time"
        ],
        "funeral_planning": [
            "honoring",
            "care",
            "wishes",
            "values"
        ]
    }

    def __init__(self):
        self.violations = []

    def check_changes(self, base_ref: str, head_ref: str) -> List[Dict[str, Any]]:
        """
        Check git diff for emotional tone violations
        """

        # Get changed files
        result = subprocess.run(
            ['git', 'diff', '--name-only', base_ref, head_ref],
            capture_output=True,
            text=True
        )

        changed_files = result.stdout.strip().split('\n')

        # Only check user-facing files
        user_facing_patterns = [
            '*.svelte',
            '*.ts',
            '*.tsx',
            '*Service.py',
            '*_messages.py',
            '*.html',  # Email templates
        ]

        for file in changed_files:
            if any(Path(file).match(pattern) for pattern in user_facing_patterns):
                self._check_file(file, base_ref, head_ref)

        return self.violations

    def _check_file(self, file: str, base_ref: str, head_ref: str):
        """Check single file for tone violations"""

        # Get file diff
        result = subprocess.run(
            ['git', 'diff', '-U0', base_ref, head_ref, '--', file],
            capture_output=True,
            text=True
        )

        diff_lines = result.stdout.split('\n')
        current_line_num = 0

        for line in diff_lines:
            # Track line numbers
            if line.startswith('@@'):
                match = re.search(r'\+(\d+)', line)
                if match:
                    current_line_num = int(match.group(1))
                continue

            # Only check added lines (not removed)
            if not line.startswith('+') or line.startswith('+++'):
                continue

            current_line_num += 1
            line_content = line[1:]  # Remove '+'

            # Check for forbidden phrases
            for phrase in self.FORBIDDEN_PHRASES:
                if phrase.lower() in line_content.lower():
                    self.violations.append({
                        "file": file,
                        "line": current_line_num,
                        "text": line_content.strip(),
                        "violation": phrase,
                        "severity": "high",
                        "suggestion": self._get_suggestion(phrase),
                        "context": "Death planning requires compassionate language"
                    })

    def _get_suggestion(self, phrase: str) -> str:
        """Get compassionate alternative for cold phrase"""

        suggestions = {
            "body preparation": "honoring your body's care",
            "corpse": "your loved one",
            "deceased processing": "final arrangements",
            "quickly complete": "at your own pace",
            "hurry": "take your time",
            "just enter": "please provide",
            "invalid input": "we need a bit more information",
            "error 500": "something unexpected happened",
            "complete checklist": "document your wishes",
            "skip the empathetic filler": "REMOVE - empathy is essential",
            "no fluff": "be compassionate and supportive"
        }

        return suggestions.get(phrase.lower(), "Use more compassionate language")


if __name__ == "__main__":
    # Test
    checker = EmotionalToneChecker()
    violations = checker.check_changes('HEAD~1', 'HEAD')

    if violations:
        print(f"Found {len(violations)} emotional tone violations:")
        for v in violations:
            print(f"  {v['file']}:{v['line']}: {v['violation']}")
    else:
        print("No emotional tone violations found!")
```

---

### Step 4: Create Configuration

**File:** `/scripts/pr-review/config.json`

```json
{
  "review_settings": {
    "fail_on_breaking_changes": true,
    "fail_on_security_issues": true,
    "fail_on_low_coverage": false,
    "minimum_test_coverage": 70,
    "block_emotional_tone_violations": false,
    "require_migration_validation": true
  },
  "emotional_tone": {
    "enabled": true,
    "check_files": [
      "*.svelte",
      "*.ts",
      "*.py",
      "*.html"
    ],
    "exclude_files": [
      "*.test.ts",
      "*.spec.ts",
      "**/tests/**"
    ]
  },
  "security": {
    "scan_for_secrets": true,
    "check_dependencies": true,
    "sql_injection_detection": true
  },
  "breaking_changes": {
    "check_api_endpoints": true,
    "check_database_schema": true,
    "check_component_props": true
  }
}
```

---

## VALIDATION

### Pre-Commit Checks:

```bash
# Test PR review script locally
python scripts/pr-review/run_all_checks.py \
  --base-ref HEAD~1 \
  --head-ref HEAD \
  --pr-number 1 \
  --output-file test-results.json

# Verify output format
cat test-results.json | jq '.'

# Test emotional tone checker
python scripts/pr-review/emotional_tone_checker.py
```

---

## SUCCESS CRITERIA

- [ ] GitHub Action runs on every PR
- [ ] Breaking change detection working
- [ ] Security scanner identifies vulnerabilities
- [ ] Emotional tone checker finds cold language
- [ ] Test coverage calculated correctly
- [ ] Type safety checked
- [ ] Database migrations validated
- [ ] Automated PR comments posted
- [ ] Status checks block merge for critical issues
- [ ] Compassionate review comments

---

## TESTING

### Manual Testing:

1. **Create test PR with breaking change:**
   - Remove API endpoint
   - Verify detected and blocked

2. **Create test PR with security issue:**
   - Add hardcoded API key
   - Verify detected and blocked

3. **Create test PR with tone violation:**
   - Add "just complete this" text
   - Verify detected with suggestion

### Automated Testing:

```python
# tests/test_emotional_tone_checker.py
def test_detects_cold_language():
    checker = EmotionalToneChecker()
    checker._check_line("Just complete this checklist quickly", "test.svelte", 10)
    assert len(checker.violations) > 0
    assert "compassionate" in checker.violations[0]["suggestion"]

def test_allows_compassionate_language():
    checker = EmotionalToneChecker()
    checker._check_line("Take your time with this important decision", "test.svelte", 10)
    assert len(checker.violations) == 0
```

---

## ROLLBACK

### If Issues Occur:

```bash
# Disable GitHub Action
mv .github/workflows/pr-review.yml .github/workflows/pr-review.yml.disabled

# Remove scripts
rm -rf scripts/pr-review/
```

---

## COMMIT MESSAGE

```
feat(ci): implement comprehensive automated PR review system

Create GitHub Action for automated PR reviews with Continuum-specific checks.

Implementation:

GitHub Action:
- .github/workflows/pr-review.yml: Main workflow
  - Runs on every PR to main/develop
  - Posts automated review comments
  - Sets status checks (pass/fail)
  - Blocks merge for critical issues

Review Scripts:
- scripts/pr-review/run_all_checks.py: Orchestrator
- scripts/pr-review/breaking_change_detector.py: API/schema changes
- scripts/pr-review/security_scanner.py: Vulnerabilities
- scripts/pr-review/emotional_tone_checker.py: Language compliance
- scripts/pr-review/test_coverage_checker.py: Coverage validation
- scripts/pr-review/migration_validator.py: Database migrations
- scripts/pr-review/type_safety_checker.py: Type errors

Checks Performed:
1. Breaking Changes:
   - API endpoints removed/renamed
   - Database schema changes
   - Component prop changes
   - Blocks merge if found

2. Security Issues:
   - Hardcoded secrets/API keys
   - SQL injection patterns
   - XSS vulnerabilities
   - Blocks merge if found

3. Emotional Tone (UNIQUE TO CONTINUUM):
   - Detects cold/clinical language
   - Verifies compassionate messaging
   - Suggests alternatives
   - Warning (doesn't block merge)

4. Test Coverage:
   - Calculates overall coverage
   - Identifies low-coverage files
   - Target: 70%
   - Warning if below target

5. Type Safety:
   - TypeScript type errors
   - Python type hints
   - Mypy validation

6. Database Migrations:
   - Migration file validation
   - No destructive changes without confirmation
   - Rollback plan required

Automated PR Comments:
- Summary of all findings
- Breaking changes with details
- Security issues with severity
- Emotional tone violations with suggestions
- Test coverage report
- Overall pass/fail assessment

Unique Features:
- Emotional tone checking (death planning context)
- Compassionate review feedback
- Contextual suggestions
- Blocks on critical issues only

Configuration:
- scripts/pr-review/config.json: Review settings
- Configurable thresholds
- Enable/disable checks
- File patterns to check/ignore

Impact:
- P1-HIGH: Prevents breaking changes in production
- Catches security issues before merge
- Enforces emotional tone compliance
- Maintains code quality standards
- Automated feedback reduces review time

Testing:
- Unit tests for each checker
- Integration tests for workflow
- Manual testing with sample PRs

Future Enhancements:
- AI-powered code review
- Performance regression detection
- Accessibility checks
- Bundle size monitoring

Closes: Automated PR review system
```

---

## NOTES

- Emotional tone checker is UNIQUE to Continuum
- Critical for maintaining compassionate UX
- All reviewers must understand death planning context
- Automated checks supplement (not replace) human review

### Review Guidelines:
- Always be compassionate in review feedback
- Explain WHY changes are needed (context matters)
- Provide specific suggestions
- Link to documentation
- Celebrate good work

---

**READY TO EXECUTE**

Claude: Read this specification and execute to implement automated PR reviews.
