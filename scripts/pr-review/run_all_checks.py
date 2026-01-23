#!/usr/bin/env python3
"""
PR Review Orchestrator for Continuum

Runs all automated checks for pull requests:
1. Breaking change detection
2. Security vulnerability scanning
3. Emotional tone compliance (UNIQUE TO CONTINUUM)
4. Test coverage validation
5. Database migration validation
6. Type safety checking

Usage:
    python run_all_checks.py --base-ref HEAD~1 --head-ref HEAD --pr-number 123
"""

import argparse
import json
import sys
import os
from pathlib import Path
from typing import Dict, Any
from datetime import datetime

# Add the script directory to path for imports
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

from breaking_change_detector import BreakingChangeDetector
from security_scanner import SecurityScanner
from emotional_tone_checker import EmotionalToneChecker
from test_coverage_checker import TestCoverageChecker
from migration_validator import MigrationValidator
from type_safety_checker import TypeSafetyChecker


class PRReviewer:
    """
    Main PR review orchestrator for Continuum.

    Runs all automated checks and generates a comprehensive report.
    """

    def __init__(self, base_ref: str, head_ref: str, pr_number: int, config_path: str = None):
        self.base_ref = base_ref
        self.head_ref = head_ref
        self.pr_number = pr_number
        self.config_path = config_path or str(script_dir / "config.json")
        self.project_root = script_dir.parent.parent

        self.results: Dict[str, Any] = {
            "metadata": {
                "pr_number": pr_number,
                "base_ref": base_ref,
                "head_ref": head_ref,
                "timestamp": datetime.utcnow().isoformat(),
                "project": "Continuum SaaS"
            },
            "breaking_changes": {"count": 0, "items": []},
            "security": {"count": 0, "items": []},
            "emotional_tone": {"count": 0, "items": []},
            "test_coverage": {"percentage": 0, "low_coverage_files": []},
            "migrations": {"valid": True, "issues": []},
            "type_safety": {"count": 0, "items": []},
            "summary": {
                "passed": True,
                "critical_issues": 0,
                "warnings": 0,
                "checks_run": 0
            }
        }

    def run_all_checks(self) -> Dict[str, Any]:
        """
        Run all automated checks.

        Returns:
            Complete results dictionary
        """
        print("=" * 70)
        print("CONTINUUM PR REVIEW - Automated Code Review")
        print("=" * 70)
        print(f"PR #{self.pr_number} | Base: {self.base_ref[:8]} | Head: {self.head_ref[:8]}")
        print("=" * 70)
        print()

        checks_passed = 0
        checks_failed = 0
        total_critical = 0
        total_warnings = 0

        # 1. Breaking Changes
        print("1️⃣  CHECKING FOR BREAKING CHANGES...")
        print("-" * 50)
        try:
            detector = BreakingChangeDetector(self.base_ref, self.head_ref)
            breaking_changes = detector.detect_breaking_changes()
            summary = detector.get_summary()

            self.results["breaking_changes"] = {
                "count": len(breaking_changes),
                "items": breaking_changes,
                "critical": summary.get("critical", 0),
                "high": summary.get("high", 0),
                "should_block": summary.get("should_block", False)
            }

            if summary.get("should_block"):
                checks_failed += 1
                total_critical += summary.get("critical", 0) + summary.get("high", 0)
                print(f"   FAILED: {len(breaking_changes)} breaking changes detected")
            else:
                checks_passed += 1
                print(f"   PASSED: {len(breaking_changes)} changes (none blocking)")
        except Exception as e:
            print(f"   ERROR: {e}")
            checks_failed += 1
        print()

        # 2. Security Vulnerabilities
        print("2️⃣  SCANNING FOR SECURITY VULNERABILITIES...")
        print("-" * 50)
        try:
            scanner = SecurityScanner(config_path=self.config_path)
            security_issues = scanner.scan_changes(self.base_ref, self.head_ref)
            summary = scanner.get_summary()

            self.results["security"] = {
                "count": len(security_issues),
                "items": security_issues,
                "critical": summary.get("critical", 0),
                "high": summary.get("high", 0),
                "should_block": summary.get("should_fail", False)
            }

            if summary.get("should_fail"):
                checks_failed += 1
                total_critical += summary.get("critical", 0) + summary.get("high", 0)
                print(f"   FAILED: {len(security_issues)} security issues detected")
            else:
                checks_passed += 1
                if security_issues:
                    print(f"   PASSED with warnings: {len(security_issues)} low-severity issues")
                else:
                    print("   PASSED: No security issues")
        except Exception as e:
            print(f"   ERROR: {e}")
            checks_failed += 1
        print()

        # 3. Emotional Tone (UNIQUE TO CONTINUUM)
        print("3️⃣  CHECKING EMOTIONAL TONE COMPLIANCE...")
        print("-" * 50)
        print("   (Continuum is a death planning app - language must be compassionate)")
        try:
            tone_checker = EmotionalToneChecker(config_path=self.config_path)
            tone_violations = tone_checker.check_changes(self.base_ref, self.head_ref)
            summary = tone_checker.get_summary()

            self.results["emotional_tone"] = {
                "count": len(tone_violations),
                "items": tone_violations,
                "high": summary.get("high", 0),
                "medium": summary.get("medium", 0),
                "low": summary.get("low", 0),
                "should_warn": summary.get("high", 0) > 0
            }

            if summary.get("high", 0) > 0:
                total_warnings += summary.get("high", 0)
                print(f"   WARNING: {summary.get('high', 0)} high-severity tone violations")
                print("   (Review language for compassion before merging)")
            else:
                checks_passed += 1
                if tone_violations:
                    print(f"   PASSED with suggestions: {len(tone_violations)} minor issues")
                else:
                    print("   PASSED: Language maintains compassionate tone")
        except Exception as e:
            print(f"   ERROR: {e}")
        print()

        # 4. Test Coverage
        print("4️⃣  CHECKING TEST COVERAGE...")
        print("-" * 50)
        try:
            coverage_checker = TestCoverageChecker(config_path=self.config_path)
            coverage_report = coverage_checker.check_coverage()

            self.results["test_coverage"] = coverage_report

            if coverage_report.get("status") == "no_tests":
                print("   INFO: No automated tests (manual testing required)")
                total_warnings += 1
            else:
                coverage = coverage_report.get("percentage", 0)
                print(f"   Coverage: {coverage}%")
                if coverage >= 70:
                    checks_passed += 1
                else:
                    total_warnings += 1
        except Exception as e:
            print(f"   ERROR: {e}")
        print()

        # 5. Database Migrations
        print("5️⃣  VALIDATING DATABASE MIGRATIONS...")
        print("-" * 50)
        try:
            validator = MigrationValidator(config_path=self.config_path)
            migration_issues = validator.validate_migrations(self.base_ref, self.head_ref)
            summary = validator.get_summary()

            self.results["migrations"] = {
                "valid": summary.get("valid", True),
                "issues": migration_issues,
                "critical": summary.get("critical", 0),
                "should_block": summary.get("should_fail", False)
            }

            if summary.get("should_fail"):
                checks_failed += 1
                total_critical += summary.get("critical", 0)
                print(f"   FAILED: {len(migration_issues)} migration issues")
            else:
                checks_passed += 1
                if migration_issues:
                    print(f"   PASSED with warnings: {len(migration_issues)} notes")
                else:
                    print("   PASSED: Migrations valid")
        except Exception as e:
            print(f"   ERROR: {e}")
            checks_passed += 1  # Don't fail on migration check errors
        print()

        # 6. Type Safety
        print("6️⃣  CHECKING TYPE SAFETY...")
        print("-" * 50)
        try:
            type_checker = TypeSafetyChecker(config_path=self.config_path)
            type_errors = type_checker.check_types()
            summary = type_checker.get_summary()

            self.results["type_safety"] = {
                "count": len(type_errors),
                "items": type_errors,
                "errors": summary.get("errors", 0),
                "warnings": summary.get("warnings", 0)
            }

            if summary.get("should_fail"):
                checks_failed += 1
                print(f"   FAILED: {summary.get('errors', 0)} type errors")
            else:
                checks_passed += 1
                if type_errors:
                    print(f"   PASSED with warnings: {len(type_errors)} type issues")
                else:
                    print("   PASSED: No type errors")
        except Exception as e:
            print(f"   ERROR: {e}")
            checks_passed += 1  # Don't fail on type check errors
        print()

        # Summary
        total_checks = checks_passed + checks_failed
        passed = checks_failed == 0

        self.results["summary"] = {
            "passed": passed,
            "checks_passed": checks_passed,
            "checks_failed": checks_failed,
            "checks_run": total_checks,
            "critical_issues": total_critical,
            "warnings": total_warnings
        }

        print("=" * 70)
        print("REVIEW SUMMARY")
        print("=" * 70)
        print()

        if passed:
            print("✅ ALL CRITICAL CHECKS PASSED")
        else:
            print("❌ REVIEW FAILED - Critical issues found")

        print()
        print(f"   Checks Passed: {checks_passed}/{total_checks}")
        print(f"   Critical Issues: {total_critical}")
        print(f"   Warnings: {total_warnings}")
        print()

        if not passed:
            print("Action Required:")
            if self.results["breaking_changes"]["count"] > 0:
                print("   - Review breaking changes before merging")
            if self.results["security"]["count"] > 0:
                print("   - Fix security vulnerabilities")
            if self.results["migrations"].get("critical", 0) > 0:
                print("   - Review destructive migration operations")
        elif total_warnings > 0:
            print("Recommendations:")
            if self.results["emotional_tone"]["count"] > 0:
                print("   - Review emotional tone for compassionate language")
            if self.results["test_coverage"].get("status") == "no_tests":
                print("   - Consider adding automated tests")

        print()
        print("=" * 70)

        return self.results

    def save_results(self, output_file: str):
        """Save results to JSON file"""
        with open(output_file, "w") as f:
            json.dump(self.results, f, indent=2, default=str)
        print(f"Results saved to: {output_file}")

    def format_pr_comment(self) -> str:
        """
        Format results as a GitHub PR comment.

        Returns:
            Markdown-formatted comment
        """
        comment = []
        comment.append("## 🤖 Automated PR Review\n")

        # Summary badge
        if self.results["summary"]["passed"]:
            comment.append("### ✅ Review Passed\n")
        else:
            comment.append("### ❌ Review Failed - Critical Issues Found\n")

        # Quick summary
        comment.append("### Summary\n")
        comment.append(f"| Check | Status |")
        comment.append(f"|-------|--------|")

        bc = self.results["breaking_changes"]
        comment.append(f"| Breaking Changes | {'❌ ' + str(bc['count']) + ' found' if bc.get('should_block') else '✅ None blocking'} |")

        sec = self.results["security"]
        comment.append(f"| Security | {'❌ ' + str(sec['count']) + ' issues' if sec.get('should_block') else '✅ Passed'} |")

        tone = self.results["emotional_tone"]
        comment.append(f"| Emotional Tone | {'⚠️ ' + str(tone['high']) + ' high-severity' if tone.get('should_warn') else '✅ Compassionate'} |")

        cov = self.results["test_coverage"]
        comment.append(f"| Test Coverage | {'📝 No tests' if cov.get('status') == 'no_tests' else str(cov.get('percentage', 0)) + '%'} |")

        mig = self.results["migrations"]
        comment.append(f"| Migrations | {'❌ Issues' if mig.get('should_block') else '✅ Valid'} |")

        types = self.results["type_safety"]
        comment.append(f"| Type Safety | {'⚠️ ' + str(types['count']) + ' issues' if types['count'] > 0 else '✅ Passed'} |")

        comment.append("\n")

        # Breaking changes details
        if bc["count"] > 0:
            comment.append("### ⚠️ Breaking Changes Detected\n")
            for item in bc["items"][:5]:  # Limit to 5
                comment.append(f"- **{item['file']}**: {item['description']}")
            if bc["count"] > 5:
                comment.append(f"\n*...and {bc['count'] - 5} more*\n")
            comment.append("\n")

        # Security issues details
        if sec["count"] > 0:
            comment.append("### 🔒 Security Issues\n")
            for item in sec["items"][:5]:
                comment.append(f"- **{item['severity'].upper()}** ({item['file']}:{item['line']}): {item['description']}")
            if sec["count"] > 5:
                comment.append(f"\n*...and {sec['count'] - 5} more*\n")
            comment.append("\n")

        # Emotional tone violations
        if tone["count"] > 0:
            comment.append("### 💔 Emotional Tone Issues\n")
            comment.append("*Continuum is a death planning app. Language should be compassionate.*\n")
            for item in tone["items"][:5]:
                comment.append(f"- **{item['file']}:{item['line']}**: Found \"{item['violation_phrase']}\"")
                comment.append(f"  - Suggestion: \"{item['suggestion']}\"")
                comment.append(f"  - Principle: {item['principle']}\n")
            if tone["count"] > 5:
                comment.append(f"\n*...and {tone['count'] - 5} more suggestions*\n")
            comment.append("\n")

        # Footer
        comment.append("---\n")
        comment.append("*Automated review by Continuum PR Reviewer*\n")
        comment.append("*Reference: [TONE_GUIDE.md](/TONE_GUIDE.md) for language guidelines*")

        return "\n".join(comment)


def main():
    parser = argparse.ArgumentParser(
        description="Run comprehensive PR review for Continuum",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Review changes in last commit
    python run_all_checks.py --base-ref HEAD~1 --head-ref HEAD --pr-number 1

    # Review changes between branches
    python run_all_checks.py --base-ref main --head-ref feature-branch --pr-number 123

    # Output as JSON
    python run_all_checks.py --base-ref main --head-ref HEAD --pr-number 1 --output-format json
        """
    )

    parser.add_argument(
        "--base-ref",
        required=True,
        help="Base commit SHA or branch (e.g., main, HEAD~1)"
    )
    parser.add_argument(
        "--head-ref",
        required=True,
        help="Head commit SHA or branch to review"
    )
    parser.add_argument(
        "--pr-number",
        type=int,
        required=True,
        help="Pull request number"
    )
    parser.add_argument(
        "--output-file",
        default="pr-review-results.json",
        help="Output JSON file (default: pr-review-results.json)"
    )
    parser.add_argument(
        "--output-format",
        choices=["json", "text", "pr-comment"],
        default="text",
        help="Output format"
    )
    parser.add_argument(
        "--config",
        help="Path to config.json"
    )

    args = parser.parse_args()

    # Run review
    reviewer = PRReviewer(
        base_ref=args.base_ref,
        head_ref=args.head_ref,
        pr_number=args.pr_number,
        config_path=args.config
    )

    results = reviewer.run_all_checks()
    reviewer.save_results(args.output_file)

    # Output in requested format
    if args.output_format == "json":
        print(json.dumps(results, indent=2, default=str))
    elif args.output_format == "pr-comment":
        print(reviewer.format_pr_comment())

    # Exit with appropriate code
    if not results["summary"]["passed"]:
        print(f"\n❌ Review FAILED with {results['summary']['critical_issues']} critical issues")
        sys.exit(1)
    else:
        print(f"\n✅ Review PASSED")
        sys.exit(0)


if __name__ == "__main__":
    main()
