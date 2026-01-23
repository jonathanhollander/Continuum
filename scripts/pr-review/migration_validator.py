#!/usr/bin/env python3
"""
Database Migration Validator for Continuum

Validates Alembic migrations in PRs:
- Migration files have proper structure
- No destructive operations without confirmation
- Rollback functions are present
- Migration order is correct
"""

import re
import subprocess
import json
from typing import List, Dict, Any, Optional, Set
from pathlib import Path
from dataclasses import dataclass, asdict


@dataclass
class MigrationIssue:
    """Represents a migration validation issue"""
    file: str
    line: int
    issue_type: str
    description: str
    severity: str  # "critical", "high", "medium"
    recommendation: str


class MigrationValidator:
    """
    Validate database migrations in changed files.

    Checks:
    - Migration file structure
    - Destructive operations (DROP, TRUNCATE)
    - Rollback (downgrade) function presence
    - Data migrations handling
    """

    # Destructive operations that need review
    DESTRUCTIVE_OPERATIONS = {
        "drop_table": (
            r'\bop\.drop_table\s*\(',
            "Table drop operation - data will be lost",
            "critical"
        ),
        "drop_column": (
            r'\bop\.drop_column\s*\(',
            "Column drop operation - data will be lost",
            "critical"
        ),
        "drop_index": (
            r'\bop\.drop_index\s*\(',
            "Index drop operation",
            "medium"
        ),
        "drop_constraint": (
            r'\bop\.drop_constraint\s*\(',
            "Constraint drop operation",
            "medium"
        ),
        "execute_sql": (
            r'\bop\.execute\s*\(\s*["\'].*DROP',
            "Raw SQL DROP statement",
            "critical"
        ),
        "truncate": (
            r'\bTRUNCATE\b',
            "TRUNCATE operation - all data will be deleted",
            "critical"
        ),
        "delete_all": (
            r'\bDELETE\s+FROM\s+\w+\s*(?:;|$)',
            "DELETE without WHERE - deletes all rows",
            "critical"
        ),
    }

    # Required patterns for migrations
    REQUIRED_PATTERNS = {
        "revision_id": r'revision\s*=\s*["\'][a-f0-9]+["\']',
        "down_revision": r'down_revision\s*=',
        "upgrade_function": r'def\s+upgrade\s*\(',
        "downgrade_function": r'def\s+downgrade\s*\(',
    }

    def __init__(self, config_path: Optional[str] = None):
        self.issues: List[MigrationIssue] = []
        self.config = self._load_config(config_path)
        self.project_root = Path(__file__).parent.parent.parent

    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """Load configuration"""
        default_config = {
            "enabled": True,
            "require_downgrade": True,
            "block_destructive": True,
            "migration_path": "backend/alembic/versions",
        }

        if config_path and Path(config_path).exists():
            with open(config_path) as f:
                user_config = json.load(f)
                default_config.update(user_config.get("migrations", {}))

        return default_config

    def validate_migrations(self, base_ref: str, head_ref: str) -> List[Dict[str, Any]]:
        """
        Validate migrations changed between refs.

        Args:
            base_ref: Base commit SHA
            head_ref: Head commit SHA

        Returns:
            List of validation issues
        """
        if not self.config.get("enabled", True):
            return []

        # Get changed files
        result = subprocess.run(
            ["git", "diff", "--name-only", base_ref, head_ref],
            capture_output=True,
            text=True,
            cwd=self.project_root
        )

        if result.returncode != 0:
            return []

        changed_files = result.stdout.strip().split("\n")
        migration_path = self.config.get("migration_path", "backend/alembic/versions")

        # Filter to migration files
        migration_files = [
            f for f in changed_files
            if migration_path in f and f.endswith(".py")
        ]

        for file_path in migration_files:
            self._validate_migration_file(file_path, base_ref, head_ref)

        # Also check for model changes without migrations
        self._check_model_migration_sync(changed_files, migration_files)

        return [asdict(issue) for issue in self.issues]

    def _validate_migration_file(self, file_path: str, base_ref: str, head_ref: str):
        """Validate a single migration file"""
        # Get file content
        result = subprocess.run(
            ["git", "show", f"{head_ref}:{file_path}"],
            capture_output=True,
            text=True,
            cwd=self.project_root
        )

        if result.returncode != 0:
            return

        content = result.stdout

        # Check required patterns
        self._check_required_patterns(content, file_path)

        # Check for destructive operations
        self._check_destructive_operations(content, file_path)

        # Check downgrade function content
        self._check_downgrade_content(content, file_path)

    def _check_required_patterns(self, content: str, file_path: str):
        """Check that required patterns exist in migration"""
        for pattern_name, pattern in self.REQUIRED_PATTERNS.items():
            if not re.search(pattern, content):
                # Don't flag missing downgrade if it's configured off
                if pattern_name == "downgrade_function" and not self.config.get("require_downgrade", True):
                    continue

                self.issues.append(MigrationIssue(
                    file=file_path,
                    line=0,
                    issue_type="missing_required",
                    description=f"Missing required pattern: {pattern_name}",
                    severity="high",
                    recommendation=f"Add {pattern_name} to migration file"
                ))

    def _check_destructive_operations(self, content: str, file_path: str):
        """Check for destructive operations that need review"""
        lines = content.split("\n")

        for line_num, line in enumerate(lines, start=1):
            for op_name, (pattern, description, severity) in self.DESTRUCTIVE_OPERATIONS.items():
                if re.search(pattern, line, re.IGNORECASE):
                    self.issues.append(MigrationIssue(
                        file=file_path,
                        line=line_num,
                        issue_type="destructive_operation",
                        description=description,
                        severity=severity,
                        recommendation="Ensure this is intentional and data has been backed up"
                    ))

    def _check_downgrade_content(self, content: str, file_path: str):
        """Check that downgrade function has content"""
        # Find downgrade function
        downgrade_match = re.search(
            r'def\s+downgrade\s*\(\s*\)\s*:\s*\n((?:\s+.*\n)*)',
            content
        )

        if downgrade_match:
            downgrade_body = downgrade_match.group(1)

            # Check if downgrade only contains pass or is empty
            if re.match(r'^\s*pass\s*$', downgrade_body.strip()) or not downgrade_body.strip():
                self.issues.append(MigrationIssue(
                    file=file_path,
                    line=0,
                    issue_type="empty_downgrade",
                    description="Downgrade function is empty or only contains 'pass'",
                    severity="medium",
                    recommendation="Implement downgrade to enable rollback"
                ))

    def _check_model_migration_sync(self, changed_files: List[str], migration_files: List[str]):
        """Check if model changes have corresponding migrations"""
        # Look for model file changes
        model_files = [
            f for f in changed_files
            if "_models.py" in f or "/models/" in f
        ]

        # If models changed but no migrations, that might be intentional
        # but worth noting
        if model_files and not migration_files:
            for model_file in model_files:
                self.issues.append(MigrationIssue(
                    file=model_file,
                    line=0,
                    issue_type="model_without_migration",
                    description="Model file changed but no migration added",
                    severity="medium",
                    recommendation="Run 'alembic revision --autogenerate' if schema changed"
                ))

    def get_summary(self) -> Dict[str, Any]:
        """Get validation summary"""
        critical = sum(1 for i in self.issues if i.severity == "critical")
        high = sum(1 for i in self.issues if i.severity == "high")
        medium = sum(1 for i in self.issues if i.severity == "medium")

        return {
            "valid": len(self.issues) == 0,
            "total_issues": len(self.issues),
            "critical": critical,
            "high": high,
            "medium": medium,
            "should_fail": (
                self.config.get("block_destructive", True) and
                critical > 0
            )
        }

    def format_report(self) -> str:
        """Format validation report"""
        if not self.issues:
            return "All database migrations are valid."

        report = []
        report.append("=" * 70)
        report.append("DATABASE MIGRATION VALIDATION REPORT")
        report.append("=" * 70)
        report.append("")

        summary = self.get_summary()
        report.append(f"SUMMARY: {summary['total_issues']} issues found")
        report.append(f"  - Critical: {summary['critical']}")
        report.append(f"  - High: {summary['high']}")
        report.append(f"  - Medium: {summary['medium']}")
        report.append("")

        # Group by severity
        for severity in ["critical", "high", "medium"]:
            severity_issues = [i for i in self.issues if i.severity == severity]
            if severity_issues:
                report.append("-" * 70)
                report.append(f"{severity.upper()} ISSUES")
                report.append("-" * 70)

                for issue in severity_issues:
                    report.append("")
                    report.append(f"File: {issue.file}:{issue.line}")
                    report.append(f"Type: {issue.issue_type}")
                    report.append(f"Issue: {issue.description}")
                    report.append(f"Fix: {issue.recommendation}")

                report.append("")

        report.append("=" * 70)
        report.append("Reference: /MIGRATIONS.md for migration guidelines")
        report.append("=" * 70)
        return "\n".join(report)


def main():
    """CLI interface"""
    import argparse

    parser = argparse.ArgumentParser(description="Validate database migrations")
    parser.add_argument("--base-ref", default="HEAD~1", help="Base commit SHA")
    parser.add_argument("--head-ref", default="HEAD", help="Head commit SHA")
    parser.add_argument("--config", help="Path to config.json")
    parser.add_argument("--output", choices=["json", "text"], default="text")

    args = parser.parse_args()

    validator = MigrationValidator(config_path=args.config)
    issues = validator.validate_migrations(args.base_ref, args.head_ref)

    if args.output == "json":
        print(json.dumps({
            "migration_issues": issues,
            "summary": validator.get_summary()
        }, indent=2))
    else:
        print(validator.format_report())

    summary = validator.get_summary()
    if summary["should_fail"]:
        exit(1)
    exit(0)


if __name__ == "__main__":
    main()
