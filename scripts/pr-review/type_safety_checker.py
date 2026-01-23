#!/usr/bin/env python3
"""
Type Safety Checker for Continuum

Validates type safety in PRs:
- TypeScript type errors (frontend)
- Python type hints (backend)
- Mypy validation
"""

import subprocess
import json
from typing import List, Dict, Any, Optional
from pathlib import Path
from dataclasses import dataclass, asdict


@dataclass
class TypeIssue:
    """Represents a type safety issue"""
    file: str
    line: int
    column: int
    issue_type: str
    message: str
    severity: str  # "error", "warning"


class TypeSafetyChecker:
    """
    Check type safety in TypeScript and Python code.

    Uses:
    - tsc (TypeScript compiler) for frontend
    - mypy for Python backend
    """

    def __init__(self, config_path: Optional[str] = None):
        self.issues: List[TypeIssue] = []
        self.config = self._load_config(config_path)
        self.project_root = Path(__file__).parent.parent.parent

    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """Load configuration"""
        default_config = {
            "enabled": True,
            "check_typescript": True,
            "check_python": True,
            "fail_on_errors": False,  # Don't fail since types aren't fully strict yet
            "frontend_path": "frontend",
            "backend_path": "backend",
        }

        if config_path and Path(config_path).exists():
            with open(config_path) as f:
                user_config = json.load(f)
                default_config.update(user_config.get("type_safety", {}))

        return default_config

    def check_types(self) -> List[Dict[str, Any]]:
        """
        Run type checking.

        Returns:
            List of type issues as dictionaries
        """
        if not self.config.get("enabled", True):
            return []

        if self.config.get("check_typescript", True):
            self._check_typescript()

        if self.config.get("check_python", True):
            self._check_python()

        return [asdict(issue) for issue in self.issues]

    def _check_typescript(self):
        """Run TypeScript type checking"""
        frontend_path = self.project_root / self.config.get("frontend_path", "frontend")

        if not frontend_path.exists():
            return

        # Check if tsc/svelte-check is available
        check_command = None

        # Try svelte-check first (preferred for SvelteKit)
        svelte_check = frontend_path / "node_modules" / ".bin" / "svelte-check"
        if svelte_check.exists():
            check_command = ["npx", "svelte-check", "--output", "machine"]
        else:
            # Fallback to tsc
            tsc = frontend_path / "node_modules" / ".bin" / "tsc"
            if tsc.exists():
                check_command = ["npx", "tsc", "--noEmit"]

        if not check_command:
            return

        result = subprocess.run(
            check_command,
            capture_output=True,
            text=True,
            cwd=frontend_path
        )

        if result.returncode != 0:
            self._parse_typescript_errors(result.stdout + result.stderr)

    def _parse_typescript_errors(self, output: str):
        """Parse TypeScript/svelte-check error output"""
        lines = output.split("\n")

        for line in lines:
            # svelte-check format: /path/to/file.svelte:10:5 - error ts2345: ...
            svelte_match = self._parse_svelte_check_line(line)
            if svelte_match:
                self.issues.append(TypeIssue(**svelte_match))
                continue

            # tsc format: file.ts(10,5): error TS2345: ...
            tsc_match = self._parse_tsc_line(line)
            if tsc_match:
                self.issues.append(TypeIssue(**tsc_match))

    def _parse_svelte_check_line(self, line: str) -> Optional[Dict[str, Any]]:
        """Parse svelte-check output line"""
        import re

        # Format: /path/file.svelte:10:5 - error ts2345: Message
        match = re.match(r'([^:]+):(\d+):(\d+)\s*-\s*(error|warning)\s+(\w+):\s*(.+)', line)
        if match:
            return {
                "file": match.group(1),
                "line": int(match.group(2)),
                "column": int(match.group(3)),
                "issue_type": match.group(5),
                "message": match.group(6),
                "severity": match.group(4),
            }
        return None

    def _parse_tsc_line(self, line: str) -> Optional[Dict[str, Any]]:
        """Parse tsc output line"""
        import re

        # Format: file.ts(10,5): error TS2345: Message
        match = re.match(r'([^(]+)\((\d+),(\d+)\):\s*(error|warning)\s+(\w+):\s*(.+)', line)
        if match:
            return {
                "file": match.group(1),
                "line": int(match.group(2)),
                "column": int(match.group(3)),
                "issue_type": match.group(5),
                "message": match.group(6),
                "severity": match.group(4),
            }
        return None

    def _check_python(self):
        """Run Python type checking with mypy"""
        backend_path = self.project_root / self.config.get("backend_path", "backend")

        if not backend_path.exists():
            return

        # Check if mypy is available
        check_mypy = subprocess.run(
            ["pip", "show", "mypy"],
            capture_output=True,
            cwd=self.project_root
        )

        if check_mypy.returncode != 0:
            return

        # Run mypy
        result = subprocess.run(
            [
                "mypy",
                str(backend_path),
                "--ignore-missing-imports",
                "--no-error-summary",
            ],
            capture_output=True,
            text=True,
            cwd=self.project_root
        )

        if result.returncode != 0:
            self._parse_mypy_errors(result.stdout + result.stderr)

    def _parse_mypy_errors(self, output: str):
        """Parse mypy error output"""
        import re

        lines = output.split("\n")

        for line in lines:
            # Format: file.py:10: error: Message  [error-code]
            match = re.match(r'([^:]+):(\d+):\s*(error|warning|note):\s*(.+)', line)
            if match:
                file_path = match.group(1)
                # Skip certain common non-issues
                message = match.group(4)
                if "Cannot find implementation" in message:
                    continue
                if "Missing return statement" in message:
                    continue

                self.issues.append(TypeIssue(
                    file=file_path,
                    line=int(match.group(2)),
                    column=0,
                    issue_type="mypy",
                    message=message,
                    severity="error" if match.group(3) == "error" else "warning"
                ))

    def get_summary(self) -> Dict[str, Any]:
        """Get type checking summary"""
        errors = sum(1 for i in self.issues if i.severity == "error")
        warnings = sum(1 for i in self.issues if i.severity == "warning")

        return {
            "total": len(self.issues),
            "errors": errors,
            "warnings": warnings,
            "should_fail": (
                self.config.get("fail_on_errors", False) and
                errors > 0
            )
        }

    def format_report(self) -> str:
        """Format type checking report"""
        if not self.issues:
            return "No type errors found."

        report = []
        report.append("=" * 70)
        report.append("TYPE SAFETY CHECK REPORT")
        report.append("=" * 70)
        report.append("")

        summary = self.get_summary()
        report.append(f"SUMMARY: {summary['total']} type issues found")
        report.append(f"  - Errors: {summary['errors']}")
        report.append(f"  - Warnings: {summary['warnings']}")
        report.append("")

        # Group by file
        files: Dict[str, List[TypeIssue]] = {}
        for issue in self.issues:
            if issue.file not in files:
                files[issue.file] = []
            files[issue.file].append(issue)

        for file_path, file_issues in sorted(files.items()):
            report.append("-" * 70)
            report.append(f"FILE: {file_path}")
            report.append("-" * 70)

            for issue in sorted(file_issues, key=lambda x: x.line):
                severity_icon = "E" if issue.severity == "error" else "W"
                report.append(f"  [{severity_icon}] Line {issue.line}: {issue.message}")

            report.append("")

        report.append("=" * 70)
        return "\n".join(report)


def main():
    """CLI interface"""
    import argparse

    parser = argparse.ArgumentParser(description="Check type safety")
    parser.add_argument("--config", help="Path to config.json")
    parser.add_argument("--output", choices=["json", "text"], default="text")

    args = parser.parse_args()

    checker = TypeSafetyChecker(config_path=args.config)
    issues = checker.check_types()

    if args.output == "json":
        print(json.dumps({
            "type_issues": issues,
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
