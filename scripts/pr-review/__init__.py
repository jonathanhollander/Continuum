"""
Continuum PR Review Scripts

Automated PR review system for Continuum SaaS.

Modules:
- run_all_checks: Main orchestrator
- emotional_tone_checker: Compassionate language validation (UNIQUE)
- breaking_change_detector: API/schema breaking change detection
- security_scanner: Security vulnerability scanning
- test_coverage_checker: Test coverage validation
- migration_validator: Database migration validation
- type_safety_checker: TypeScript/Python type checking

Usage:
    python -m scripts.pr_review.run_all_checks --base-ref HEAD~1 --head-ref HEAD --pr-number 1
"""

__version__ = "1.0.0"
__author__ = "Continuum Team"
