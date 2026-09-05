---
description: Run comprehensive automated PR review checks for Continuum
---

# PR Review Workflow

Use this workflow to perform automated validation on pull requests, covering emotional tone, security, breaking changes, and type safety.

## Steps

1. **Review Changed Files**
   Identify the files changed in the PR to focus the review on relevant areas.

2. **Run All Checks**
   Execute the full automated review suite:
   ```bash
   python3 scripts/pr-review/run_all_checks.py
   ```

3. **Run Targeted Checks (Optional)**
   If specific focus is needed, run individual scripts:
   ```bash
   # Emotional tone (Critical for death planning context)
   python3 scripts/pr-review/emotional_tone_checker.py

   # Security scan
   python3 scripts/pr-review/security_scanner.py

   # Breaking changes detection
   python3 scripts/pr-review/breaking_change_detector.py
   ```

4. **Verify Emotional Tone**
   Ensure all user-facing text follows the principles in `TONE_GUIDE.md`:
   - Patient, never urgent
   - Inviting, never demanding
   - Supportive, never clinical
   - Present, never dismissive

5. **Review Severity & Fixes**
   - **High Severity**: Must be fixed before merge.
   - **Medium/Low Severity**: Review and prioritize fixes.
   - For tone violations, suggest compassionate alternatives.

6. **Summarize & Report**
   Provide a concise summary of findings and recommendations to the user.
