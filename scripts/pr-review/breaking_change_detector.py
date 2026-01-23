#!/usr/bin/env python3
"""
Breaking Change Detector for Continuum

Detects breaking changes in PRs:
- API endpoint removals/renames
- Database schema changes
- Component prop changes
- Function signature changes
- Configuration variable changes
"""

import re
import subprocess
import json
from typing import List, Dict, Any, Optional, Set
from pathlib import Path
from dataclasses import dataclass, asdict


@dataclass
class BreakingChange:
    """Represents a detected breaking change"""
    file: str
    line: int
    change_type: str  # "api_removed", "schema_change", "prop_change", etc.
    description: str
    severity: str  # "critical", "high", "medium"
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    migration_required: bool = False


class BreakingChangeDetector:
    """
    Detect breaking changes in code changes.

    Monitors:
    - FastAPI route definitions
    - SQLModel/database schema
    - Svelte component props
    - TypeScript interfaces
    - Python function signatures
    - Environment variables
    """

    # Patterns for detecting API routes
    API_ROUTE_PATTERNS = [
        r'@(app|router)\.(get|post|put|patch|delete)\s*\(\s*["\']([^"\']+)["\']',
        r'@(app|router)\.(get|post|put|patch|delete)\s*\(\s*path\s*=\s*["\']([^"\']+)["\']',
    ]

    # Patterns for SQLModel fields
    SQLMODEL_FIELD_PATTERNS = [
        r'(\w+):\s*(?:Optional\[)?(\w+)(?:\])?\s*=\s*Field\(',
        r'(\w+):\s*(?:Mapped\[)?(?:Optional\[)?(\w+)',
    ]

    # Patterns for TypeScript interfaces
    TS_INTERFACE_PATTERNS = [
        r'interface\s+(\w+)',
        r'type\s+(\w+)\s*=',
    ]

    # Patterns for Svelte component props
    SVELTE_PROP_PATTERNS = [
        r'export\s+let\s+(\w+)',
        r'let\s*{\s*([^}]+)\s*}\s*=\s*\$props',
    ]

    # Patterns for environment variables
    ENV_VAR_PATTERNS = [
        r'(?:os\.environ|os\.getenv|process\.env)\.?(?:\[|\.)?["\']?(\w+)',
        r'(\w+):\s*str\s*=\s*Field\(\s*env\s*=',
    ]

    def __init__(self, base_ref: str, head_ref: str):
        self.base_ref = base_ref
        self.head_ref = head_ref
        self.breaking_changes: List[BreakingChange] = []
        self.project_root = Path(__file__).parent.parent.parent

    def detect_breaking_changes(self) -> List[Dict[str, Any]]:
        """
        Detect all breaking changes between base and head refs.

        Returns:
            List of breaking changes as dictionaries
        """
        # Get list of changed files
        changed_files = self._get_changed_files()

        for file_path in changed_files:
            # Check based on file type
            if file_path.endswith(".py"):
                self._check_python_file(file_path)
            elif file_path.endswith(".svelte"):
                self._check_svelte_file(file_path)
            elif file_path.endswith(".ts") or file_path.endswith(".tsx"):
                self._check_typescript_file(file_path)
            elif file_path.endswith(".env") or file_path.endswith(".env.example"):
                self._check_env_file(file_path)

        return [asdict(bc) for bc in self.breaking_changes]

    def _get_changed_files(self) -> List[str]:
        """Get list of files changed between refs"""
        result = subprocess.run(
            ["git", "diff", "--name-only", self.base_ref, self.head_ref],
            capture_output=True,
            text=True,
            cwd=self.project_root
        )

        if result.returncode != 0:
            return []

        return [f for f in result.stdout.strip().split("\n") if f]

    def _get_file_diff(self, file_path: str) -> str:
        """Get diff for a specific file"""
        result = subprocess.run(
            ["git", "diff", self.base_ref, self.head_ref, "--", file_path],
            capture_output=True,
            text=True,
            cwd=self.project_root
        )
        return result.stdout if result.returncode == 0 else ""

    def _get_file_content_at_ref(self, file_path: str, ref: str) -> str:
        """Get file content at a specific git ref"""
        result = subprocess.run(
            ["git", "show", f"{ref}:{file_path}"],
            capture_output=True,
            text=True,
            cwd=self.project_root
        )
        return result.stdout if result.returncode == 0 else ""

    def _check_python_file(self, file_path: str):
        """Check Python file for breaking changes"""
        # Check for API route changes
        if "routers" in file_path or "main.py" in file_path:
            self._check_api_routes(file_path)

        # Check for model changes
        if "models" in file_path or "_models.py" in file_path:
            self._check_sqlmodel_changes(file_path)

        # Check for function signature changes in key files
        if any(key in file_path for key in ["auth.py", "database.py", "config.py"]):
            self._check_function_signatures(file_path)

    def _check_api_routes(self, file_path: str):
        """Check for API route removals or changes"""
        old_content = self._get_file_content_at_ref(file_path, self.base_ref)
        new_content = self._get_file_content_at_ref(file_path, self.head_ref)

        old_routes = self._extract_routes(old_content)
        new_routes = self._extract_routes(new_content)

        # Find removed routes
        removed_routes = old_routes - new_routes
        for route in removed_routes:
            self.breaking_changes.append(BreakingChange(
                file=file_path,
                line=0,  # Would need more parsing for exact line
                change_type="api_removed",
                description=f"API endpoint removed: {route}",
                severity="critical",
                old_value=route,
                new_value=None,
                migration_required=True
            ))

        # Check for route path changes (same method, different path)
        for old_route in old_routes:
            method, path = old_route.split(" ", 1) if " " in old_route else ("", old_route)
            for new_route in new_routes:
                new_method, new_path = new_route.split(" ", 1) if " " in new_route else ("", new_route)
                if method == new_method and path != new_path:
                    # Potential rename
                    if self._routes_similar(path, new_path):
                        self.breaking_changes.append(BreakingChange(
                            file=file_path,
                            line=0,
                            change_type="api_renamed",
                            description=f"API endpoint renamed: {path} -> {new_path}",
                            severity="high",
                            old_value=old_route,
                            new_value=new_route,
                            migration_required=True
                        ))

    def _extract_routes(self, content: str) -> Set[str]:
        """Extract API route definitions from Python content"""
        routes = set()
        for pattern in self.API_ROUTE_PATTERNS:
            matches = re.findall(pattern, content)
            for match in matches:
                if len(match) >= 3:
                    method = match[1].upper()
                    path = match[2]
                    routes.add(f"{method} {path}")
        return routes

    def _routes_similar(self, path1: str, path2: str) -> bool:
        """Check if two route paths are similar (potential rename)"""
        # Simple heuristic: same number of segments and most match
        parts1 = path1.strip("/").split("/")
        parts2 = path2.strip("/").split("/")

        if len(parts1) != len(parts2):
            return False

        matches = sum(1 for p1, p2 in zip(parts1, parts2) if p1 == p2)
        return matches >= len(parts1) - 1  # At most one segment different

    def _check_sqlmodel_changes(self, file_path: str):
        """Check for database model/schema changes"""
        diff = self._get_file_diff(file_path)

        # Check for removed fields
        removed_fields = re.findall(r'^-\s+(\w+):\s*(?:Optional\[)?(\w+)', diff, re.MULTILINE)
        for field_name, field_type in removed_fields:
            if not field_name.startswith("_"):  # Ignore private fields
                self.breaking_changes.append(BreakingChange(
                    file=file_path,
                    line=0,
                    change_type="schema_field_removed",
                    description=f"Database field removed: {field_name} ({field_type})",
                    severity="critical",
                    old_value=f"{field_name}: {field_type}",
                    migration_required=True
                ))

        # Check for type changes
        old_content = self._get_file_content_at_ref(file_path, self.base_ref)
        new_content = self._get_file_content_at_ref(file_path, self.head_ref)

        old_fields = dict(re.findall(r'(\w+):\s*(?:Optional\[)?(\w+)', old_content))
        new_fields = dict(re.findall(r'(\w+):\s*(?:Optional\[)?(\w+)', new_content))

        for field_name, old_type in old_fields.items():
            if field_name in new_fields and new_fields[field_name] != old_type:
                self.breaking_changes.append(BreakingChange(
                    file=file_path,
                    line=0,
                    change_type="schema_type_change",
                    description=f"Field type changed: {field_name} ({old_type} -> {new_fields[field_name]})",
                    severity="high",
                    old_value=f"{field_name}: {old_type}",
                    new_value=f"{field_name}: {new_fields[field_name]}",
                    migration_required=True
                ))

    def _check_function_signatures(self, file_path: str):
        """Check for changes in critical function signatures"""
        diff = self._get_file_diff(file_path)

        # Find modified function definitions
        removed_funcs = re.findall(r'^-\s*(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)', diff, re.MULTILINE)
        added_funcs = re.findall(r'^\+\s*(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)', diff, re.MULTILINE)

        removed_dict = {name: params for name, params in removed_funcs}
        added_dict = {name: params for name, params in added_funcs}

        for func_name, old_params in removed_dict.items():
            if func_name in added_dict:
                new_params = added_dict[func_name]
                if old_params != new_params:
                    self.breaking_changes.append(BreakingChange(
                        file=file_path,
                        line=0,
                        change_type="function_signature_change",
                        description=f"Function signature changed: {func_name}",
                        severity="medium",
                        old_value=f"def {func_name}({old_params})",
                        new_value=f"def {func_name}({new_params})"
                    ))

    def _check_svelte_file(self, file_path: str):
        """Check Svelte component for prop changes"""
        old_content = self._get_file_content_at_ref(file_path, self.base_ref)
        new_content = self._get_file_content_at_ref(file_path, self.head_ref)

        old_props = self._extract_svelte_props(old_content)
        new_props = self._extract_svelte_props(new_content)

        # Find removed props
        removed_props = old_props - new_props
        for prop in removed_props:
            self.breaking_changes.append(BreakingChange(
                file=file_path,
                line=0,
                change_type="component_prop_removed",
                description=f"Component prop removed: {prop}",
                severity="high",
                old_value=prop,
                migration_required=True
            ))

    def _extract_svelte_props(self, content: str) -> Set[str]:
        """Extract props from Svelte component"""
        props = set()

        # export let style
        for match in re.findall(r'export\s+let\s+(\w+)', content):
            props.add(match)

        # $props() style (Svelte 5)
        props_match = re.search(r'let\s*\{([^}]+)\}\s*=\s*\$props', content)
        if props_match:
            prop_list = props_match.group(1)
            for prop in prop_list.split(","):
                prop = prop.strip().split(":")[0].split("=")[0].strip()
                if prop:
                    props.add(prop)

        return props

    def _check_typescript_file(self, file_path: str):
        """Check TypeScript file for interface/type changes"""
        diff = self._get_file_diff(file_path)

        # Check for removed interfaces
        removed_interfaces = re.findall(r'^-\s*(?:export\s+)?interface\s+(\w+)', diff, re.MULTILINE)
        for iface in removed_interfaces:
            if not re.search(rf'^\+\s*(?:export\s+)?interface\s+{iface}', diff, re.MULTILINE):
                self.breaking_changes.append(BreakingChange(
                    file=file_path,
                    line=0,
                    change_type="interface_removed",
                    description=f"TypeScript interface removed: {iface}",
                    severity="high",
                    old_value=iface,
                    migration_required=True
                ))

        # Check for removed type aliases
        removed_types = re.findall(r'^-\s*(?:export\s+)?type\s+(\w+)\s*=', diff, re.MULTILINE)
        for type_name in removed_types:
            if not re.search(rf'^\+\s*(?:export\s+)?type\s+{type_name}\s*=', diff, re.MULTILINE):
                self.breaking_changes.append(BreakingChange(
                    file=file_path,
                    line=0,
                    change_type="type_removed",
                    description=f"TypeScript type removed: {type_name}",
                    severity="high",
                    old_value=type_name,
                    migration_required=True
                ))

    def _check_env_file(self, file_path: str):
        """Check for removed environment variables"""
        old_content = self._get_file_content_at_ref(file_path, self.base_ref)
        new_content = self._get_file_content_at_ref(file_path, self.head_ref)

        old_vars = set(re.findall(r'^([A-Z_][A-Z0-9_]*)=', old_content, re.MULTILINE))
        new_vars = set(re.findall(r'^([A-Z_][A-Z0-9_]*)=', new_content, re.MULTILINE))

        removed_vars = old_vars - new_vars
        for var in removed_vars:
            self.breaking_changes.append(BreakingChange(
                file=file_path,
                line=0,
                change_type="env_var_removed",
                description=f"Environment variable removed: {var}",
                severity="high",
                old_value=var,
                migration_required=True
            ))

    def get_summary(self) -> Dict[str, Any]:
        """Get summary of detected breaking changes"""
        critical = sum(1 for bc in self.breaking_changes if bc.severity == "critical")
        high = sum(1 for bc in self.breaking_changes if bc.severity == "high")
        medium = sum(1 for bc in self.breaking_changes if bc.severity == "medium")

        return {
            "total": len(self.breaking_changes),
            "critical": critical,
            "high": high,
            "medium": medium,
            "requires_migration": sum(1 for bc in self.breaking_changes if bc.migration_required),
            "should_block": critical > 0 or high > 0
        }

    def format_report(self) -> str:
        """Format breaking changes as a human-readable report"""
        if not self.breaking_changes:
            return "No breaking changes detected."

        report = []
        report.append("=" * 70)
        report.append("BREAKING CHANGE DETECTION REPORT")
        report.append("=" * 70)
        report.append("")

        summary = self.get_summary()
        report.append(f"SUMMARY: {summary['total']} breaking changes detected")
        report.append(f"  - Critical: {summary['critical']}")
        report.append(f"  - High: {summary['high']}")
        report.append(f"  - Medium: {summary['medium']}")
        report.append(f"  - Requires migration: {summary['requires_migration']}")
        report.append("")

        # Group by severity
        for severity in ["critical", "high", "medium"]:
            changes = [bc for bc in self.breaking_changes if bc.severity == severity]
            if changes:
                report.append("-" * 70)
                report.append(f"{severity.upper()} BREAKING CHANGES")
                report.append("-" * 70)

                for bc in changes:
                    report.append("")
                    report.append(f"File: {bc.file}")
                    report.append(f"Type: {bc.change_type}")
                    report.append(f"Description: {bc.description}")
                    if bc.old_value:
                        report.append(f"Old: {bc.old_value}")
                    if bc.new_value:
                        report.append(f"New: {bc.new_value}")
                    if bc.migration_required:
                        report.append("Migration Required: Yes")

                report.append("")

        report.append("=" * 70)
        return "\n".join(report)


def main():
    """CLI interface for breaking change detector"""
    import argparse

    parser = argparse.ArgumentParser(description="Detect breaking changes in PR")
    parser.add_argument("--base-ref", default="HEAD~1", help="Base commit SHA")
    parser.add_argument("--head-ref", default="HEAD", help="Head commit SHA")
    parser.add_argument("--output", choices=["json", "text"], default="text")

    args = parser.parse_args()

    detector = BreakingChangeDetector(args.base_ref, args.head_ref)
    changes = detector.detect_breaking_changes()

    if args.output == "json":
        print(json.dumps({
            "breaking_changes": changes,
            "summary": detector.get_summary()
        }, indent=2))
    else:
        print(detector.format_report())

    # Exit with error if blocking changes found
    summary = detector.get_summary()
    if summary["should_block"]:
        exit(1)
    exit(0)


if __name__ == "__main__":
    main()
