#!/usr/bin/env python3
"""
Test Coverage Checker for Continuum

Checks test coverage for changed files in PRs.

Note: Continuum currently has no automated tests.
This checker is a placeholder for when tests are added.
"""

import subprocess
import json
from typing import List, Dict, Any, Optional
from pathlib import Path
from dataclasses import dataclass, asdict


@dataclass
class CoverageResult:
    """Coverage result for a file"""
    file: str
    coverage_percentage: float
    lines_covered: int
    lines_total: int
    missing_lines: List[int]


class TestCoverageChecker:
    """
    Check test coverage for changed files.

    Currently returns placeholder data since Continuum
    doesn't have automated tests yet.
    """

    def __init__(self, config_path: Optional[str] = None):
        self.coverage_results: List[CoverageResult] = []
        self.config = self._load_config(config_path)
        self.project_root = Path(__file__).parent.parent.parent

    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """Load configuration"""
        default_config = {
            "enabled": True,
            "minimum_coverage": 70,
            "fail_on_low_coverage": False,  # Don't fail since no tests
            "check_new_files": True,
        }

        if config_path and Path(config_path).exists():
            with open(config_path) as f:
                user_config = json.load(f)
                default_config.update(user_config.get("test_coverage", {}))

        return default_config

    def check_coverage(self) -> Dict[str, Any]:
        """
        Check test coverage.

        Returns:
            Coverage report dictionary
        """
        # Check if pytest-cov is available and tests exist
        has_tests = self._check_for_tests()

        if not has_tests:
            return {
                "percentage": 0,
                "status": "no_tests",
                "message": "No automated tests found. Consider adding tests.",
                "low_coverage_files": [],
                "files_checked": 0
            }

        # Try to run coverage if tests exist
        coverage_data = self._run_coverage()

        if coverage_data:
            return coverage_data

        return {
            "percentage": 0,
            "status": "not_run",
            "message": "Coverage check skipped or failed.",
            "low_coverage_files": [],
            "files_checked": 0
        }

    def _check_for_tests(self) -> bool:
        """Check if any test files exist"""
        test_patterns = [
            "tests/",
            "**/*_test.py",
            "**/test_*.py",
            "**/*.test.ts",
            "**/*.spec.ts",
        ]

        for pattern in test_patterns:
            if pattern.endswith("/"):
                if (self.project_root / pattern).exists():
                    return True
            else:
                matches = list(self.project_root.glob(pattern))
                if matches:
                    return True

        return False

    def _run_coverage(self) -> Optional[Dict[str, Any]]:
        """
        Run pytest with coverage if available.

        Returns:
            Coverage data or None if not available
        """
        # Check if pytest-cov is installed
        check_pytest = subprocess.run(
            ["pip", "show", "pytest-cov"],
            capture_output=True,
            cwd=self.project_root
        )

        if check_pytest.returncode != 0:
            return None

        # Run pytest with coverage
        result = subprocess.run(
            [
                "pytest",
                "--cov=backend",
                "--cov-report=json:coverage.json",
                "--no-header",
                "-q",
            ],
            capture_output=True,
            text=True,
            cwd=self.project_root
        )

        # Parse coverage report if it exists
        coverage_file = self.project_root / "coverage.json"
        if coverage_file.exists():
            with open(coverage_file) as f:
                cov_data = json.load(f)

            total_coverage = cov_data.get("totals", {}).get("percent_covered", 0)
            files = cov_data.get("files", {})

            low_coverage_files = []
            for file_path, file_data in files.items():
                file_coverage = file_data.get("summary", {}).get("percent_covered", 0)
                if file_coverage < self.config["minimum_coverage"]:
                    low_coverage_files.append({
                        "name": file_path,
                        "coverage": round(file_coverage, 1)
                    })

            return {
                "percentage": round(total_coverage, 1),
                "status": "completed",
                "message": f"Coverage: {round(total_coverage, 1)}%",
                "low_coverage_files": low_coverage_files,
                "files_checked": len(files)
            }

        return None

    def get_summary(self) -> Dict[str, Any]:
        """Get coverage summary"""
        result = self.check_coverage()
        minimum = self.config["minimum_coverage"]

        return {
            "percentage": result["percentage"],
            "minimum_required": minimum,
            "meets_minimum": result["percentage"] >= minimum,
            "status": result["status"],
            "should_fail": (
                self.config.get("fail_on_low_coverage", False) and
                result["percentage"] < minimum
            )
        }

    def format_report(self) -> str:
        """Format coverage report"""
        result = self.check_coverage()

        report = []
        report.append("=" * 70)
        report.append("TEST COVERAGE REPORT")
        report.append("=" * 70)
        report.append("")

        if result["status"] == "no_tests":
            report.append("STATUS: No automated tests found")
            report.append("")
            report.append("Continuum currently relies on manual testing.")
            report.append("Consider adding:")
            report.append("  - Unit tests with pytest (backend)")
            report.append("  - Component tests with Vitest (frontend)")
            report.append("  - E2E tests with Playwright")
            report.append("")
            report.append("See: https://docs.pytest.org/")
            report.append("See: https://vitest.dev/")
        else:
            report.append(f"Coverage: {result['percentage']}%")
            report.append(f"Minimum Required: {self.config['minimum_coverage']}%")
            report.append(f"Files Checked: {result['files_checked']}")
            report.append("")

            if result["low_coverage_files"]:
                report.append("Files with low coverage:")
                for file_info in result["low_coverage_files"]:
                    report.append(f"  - {file_info['name']}: {file_info['coverage']}%")

        report.append("")
        report.append("=" * 70)
        return "\n".join(report)


def main():
    """CLI interface"""
    import argparse

    parser = argparse.ArgumentParser(description="Check test coverage")
    parser.add_argument("--config", help="Path to config.json")
    parser.add_argument("--output", choices=["json", "text"], default="text")

    args = parser.parse_args()

    checker = TestCoverageChecker(config_path=args.config)
    result = checker.check_coverage()

    if args.output == "json":
        print(json.dumps({
            "coverage": result,
            "summary": checker.get_summary()
        }, indent=2))
    else:
        print(checker.format_report())

    summary = checker.get_summary()
    if summary["should_fail"]:
        exit(1)
    exit(0)


if __name__ == "__main__":
    main()
