#!/usr/bin/env python3
"""
Emotional Tone Checker for Continuum

CRITICAL: This is unique to Continuum and enforces compassionate language
appropriate for a death planning application.

Verifies that all user-facing text maintains the tone defined in TONE_GUIDE.md:
- Patient, never urgent
- Inviting, never demanding
- Supportive, never clinical
- Present, never dismissive

References: /TONE_GUIDE.md for full guidelines
"""

import re
import subprocess
import json
from typing import List, Dict, Any, Optional, Set
from pathlib import Path
from dataclasses import dataclass, asdict


@dataclass
class ToneViolation:
    """Represents a single tone violation"""
    file: str
    line: int
    text: str
    violation_type: str
    violation_phrase: str
    severity: str  # "high", "medium", "low"
    suggestion: str
    principle: str  # Which tone principle is violated
    context: str


class EmotionalToneChecker:
    """
    Check for cold, clinical, or inappropriate language in death planning app.

    Based on TONE_GUIDE.md principles:
    1. Invitation Over Instruction
    2. Acknowledgment Over Efficiency
    3. Presence Over Positivity
    """

    # ==========================================================================
    # FORBIDDEN PHRASES - Words/phrases that violate tone principles
    # ==========================================================================

    # HIGH SEVERITY - Must be changed
    FORBIDDEN_HIGH_SEVERITY = {
        # Clinical/Technical Death Language
        "body preparation": ("honoring final wishes", "clinical language"),
        "corpse": ("your loved one", "clinical language"),
        "remains disposal": ("final arrangements", "clinical language"),
        "deceased processing": ("caring for those we've lost", "clinical language"),
        "death certificate processing": ("documentation for your loved one", "clinical language"),
        "body removal": ("transport arrangements", "clinical language"),

        # Efficiency/Urgency Language (violates Principle 2)
        "quickly complete": ("at your own pace", "urgency language"),
        "hurry up": ("whenever you're ready", "urgency language"),
        "as fast as possible": ("when the time feels right", "urgency language"),
        "speed up": ("take the time you need", "urgency language"),
        "rapid completion": ("complete when ready", "urgency language"),
        "ASAP": ("when you can", "urgency language"),
        "urgent action required": ("when you're ready", "urgency language"),
        "immediately": ("when the time is right", "urgency language"),
        "deadline approaching": ("upcoming date", "urgency language"),

        # AI/System Tone Violations (critical)
        "skip the empathetic filler": ("REMOVE - empathy is essential", "anti-empathy"),
        "no fluff": ("be compassionate and present", "anti-empathy"),
        "be efficient": ("take your time", "anti-empathy"),
        "mission redline": ("gently guide", "anti-empathy"),
        "skip pleasantries": ("acknowledge their feelings", "anti-empathy"),
        "get to the point": ("be present with them", "anti-empathy"),

        # Cold Technical Errors
        "error 500": ("something unexpected happened", "cold error"),
        "error 404": ("we couldn't find that", "cold error"),
        "request failed": ("we couldn't complete that just now", "cold error"),
        "operation unsuccessful": ("that didn't work as expected", "cold error"),
        "invalid input": ("we need a bit more information", "cold error"),
        "validation failed": ("let's check that together", "cold error"),
        "access denied": ("you don't have access to this yet", "cold error"),
        "permission denied": ("this area isn't available right now", "cold error"),

        # Violent/Harsh Language
        "kill": ("end", "harsh language"),
        "terminate": ("complete", "harsh language"),
        "execute": ("carry out", "harsh language"),
        "abort": ("cancel", "harsh language"),
        "destroy": ("remove", "harsh language"),
        "nuke": ("clear", "harsh language"),
    }

    # MEDIUM SEVERITY - Should be changed
    FORBIDDEN_MEDIUM_SEVERITY = {
        # Demanding Language (violates Principle 1)
        "you must": ("when you're ready", "demanding"),
        "required field": ("this helps us", "demanding"),
        "mandatory": ("helpful for", "demanding"),
        "you need to": ("you might consider", "demanding"),
        "complete this now": ("complete when ready", "demanding"),
        "finish this": ("continue when ready", "demanding"),

        # Dismissive Language (violates Principle 3)
        "just enter": ("please share", "dismissive"),
        "simply add": ("you can add", "dismissive"),
        "it's easy": ("we'll guide you", "dismissive"),
        "no big deal": ("we understand", "dismissive"),
        "obviously": ("", "dismissive"),  # Just remove
        "clearly": ("", "dismissive"),  # Often condescending

        # Over-Positive (violates Principle 3)
        "don't worry": ("we're here with you", "false positivity"),
        "no problem": ("that's completely understandable", "false positivity"),
        "exciting": ("meaningful", "false positivity"),
        "awesome": ("thoughtful", "false positivity"),
        "amazing job": ("you're making progress", "false positivity"),
        "great job": ("you're making progress", "false positivity"),
        "perfect": ("well done", "false positivity"),
        "fantastic": ("meaningful", "false positivity"),

        # Task-Focused Without Empathy
        "complete checklist": ("document your wishes", "task-focused"),
        "finish tasks": ("continue your journey", "task-focused"),
        "100% completion required": ("every bit helps", "task-focused"),
        "task failed": ("that didn't save", "task-focused"),
        "incomplete": ("in progress", "task-focused"),
    }

    # LOW SEVERITY - Consider changing
    FORBIDDEN_LOW_SEVERITY = {
        # Button Text (Principle 1)
        "submit": ("save my thoughts", "button language"),
        "delete": ("remove this", "button language"),
        "cancel": ("maybe later", "button language"),
        "retry": ("try again", "button language"),
        "confirm": ("yes, continue", "button language"),
        "proceed": ("continue", "button language"),

        # Generic Tech Language
        "click here": ("explore", "generic tech"),
        "input your": ("share your", "generic tech"),
        "enter your": ("your", "generic tech"),
        "select an option": ("choose what feels right", "generic tech"),
        "loading...": ("taking a moment...", "generic tech"),
        "processing...": ("preparing your space...", "generic tech"),
        "please wait": ("almost there...", "generic tech"),
        "success!": ("saved with care", "generic tech"),
        "failed!": ("couldn't complete that", "generic tech"),
    }

    # ==========================================================================
    # CONTEXT-SPECIFIC RULES
    # ==========================================================================

    # Executor-specific violations (they're grieving)
    EXECUTOR_CONTEXT_VIOLATIONS = {
        "complete by": "this can wait if you need it to",
        "deadline": "suggested timeline",
        "overdue": "when you're able",
        "late": "whenever works for you",
        "behind schedule": "at your own pace",
    }

    # Funeral planning context (extra sensitivity)
    FUNERAL_CONTEXT_REQUIRED_PATTERNS = [
        "honoring",
        "wishes",
        "care",
        "values",
        "celebrate",
        "remember",
        "cherish",
    ]

    # ==========================================================================
    # FILE PATTERNS
    # ==========================================================================

    # Files that contain user-facing text
    USER_FACING_PATTERNS = [
        "*.svelte",
        "*.ts",
        "*.tsx",
        "*.py",
        "*.html",
        "*.md",
    ]

    # Files to exclude from tone checking
    EXCLUDE_PATTERNS = [
        "*.test.ts",
        "*.spec.ts",
        "**/tests/**",
        "**/test_*.py",
        "**/__tests__/**",
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "*.config.*",
        "package*.json",
        "tsconfig.json",
        "**/migrations/**",
        "alembic/**",
        "scripts/pr-review/**",  # Don't check the checker itself
    ]

    # Files with heightened sensitivity (funeral, grief, etc.)
    HEIGHTENED_SENSITIVITY_PATTERNS = [
        "*funeral*",
        "*grief*",
        "*memorial*",
        "*legacy*",
        "*passing*",
        "*loss*",
        "*bereavement*",
    ]

    def __init__(self, config_path: Optional[str] = None):
        self.violations: List[ToneViolation] = []
        self.config = self._load_config(config_path)
        self.checked_files: Set[str] = set()

    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """Load configuration from JSON file"""
        default_config = {
            "enabled": True,
            "fail_on_high_severity": True,
            "fail_on_medium_severity": False,
            "fail_on_low_severity": False,
            "heightened_sensitivity_files": True,
        }

        if config_path and Path(config_path).exists():
            with open(config_path) as f:
                user_config = json.load(f)
                default_config.update(user_config.get("emotional_tone", {}))

        return default_config

    def check_changes(self, base_ref: str, head_ref: str) -> List[Dict[str, Any]]:
        """
        Check git diff for emotional tone violations.

        Args:
            base_ref: Base commit SHA (e.g., main branch)
            head_ref: Head commit SHA (PR branch)

        Returns:
            List of violations as dictionaries
        """
        if not self.config.get("enabled", True):
            return []

        # Get list of changed files
        result = subprocess.run(
            ["git", "diff", "--name-only", base_ref, head_ref],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent.parent  # Project root
        )

        if result.returncode != 0:
            print(f"Warning: git diff failed: {result.stderr}")
            return []

        changed_files = [f for f in result.stdout.strip().split("\n") if f]

        # Filter to user-facing files
        for file_path in changed_files:
            if self._should_check_file(file_path):
                self._check_file(file_path, base_ref, head_ref)
                self.checked_files.add(file_path)

        return [asdict(v) for v in self.violations]

    def check_file_content(self, file_path: str, content: str) -> List[Dict[str, Any]]:
        """
        Check specific file content for tone violations.
        Useful for pre-commit hooks or direct file checking.
        """
        lines = content.split("\n")
        is_heightened = self._is_heightened_sensitivity_file(file_path)

        for line_num, line in enumerate(lines, start=1):
            self._check_line(line, file_path, line_num, is_heightened)

        return [asdict(v) for v in self.violations]

    def _should_check_file(self, file_path: str) -> bool:
        """Determine if file should be checked for tone"""
        path = Path(file_path)

        # Check exclusions first
        for pattern in self.EXCLUDE_PATTERNS:
            if path.match(pattern):
                return False

        # Check if it matches user-facing patterns
        for pattern in self.USER_FACING_PATTERNS:
            if path.match(pattern):
                return True

        return False

    def _is_heightened_sensitivity_file(self, file_path: str) -> bool:
        """Check if file requires heightened sensitivity (grief, funeral, etc.)"""
        file_lower = file_path.lower()
        for pattern in self.HEIGHTENED_SENSITIVITY_PATTERNS:
            if pattern.replace("*", "") in file_lower:
                return True
        return False

    def _check_file(self, file_path: str, base_ref: str, head_ref: str):
        """Check a single file for tone violations in changed lines"""
        # Get file diff
        result = subprocess.run(
            ["git", "diff", "-U0", base_ref, head_ref, "--", file_path],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent.parent
        )

        if result.returncode != 0:
            return

        is_heightened = self._is_heightened_sensitivity_file(file_path)
        diff_lines = result.stdout.split("\n")
        current_line_num = 0

        for line in diff_lines:
            # Track line numbers from diff headers
            if line.startswith("@@"):
                match = re.search(r"\+(\d+)", line)
                if match:
                    current_line_num = int(match.group(1)) - 1
                continue

            # Only check added lines (not removed)
            if not line.startswith("+") or line.startswith("+++"):
                if line.startswith("+"):
                    current_line_num += 1
                continue

            current_line_num += 1
            line_content = line[1:]  # Remove leading '+'

            self._check_line(line_content, file_path, current_line_num, is_heightened)

    def _check_line(self, line: str, file_path: str, line_num: int, is_heightened: bool = False):
        """Check a single line for tone violations"""
        line_lower = line.lower()

        # Skip comment-only lines or import statements
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("#") or stripped.startswith("import "):
            # Still check string literals in comments if they look like user text
            if '"' not in line and "'" not in line:
                return

        # Check high severity violations
        for phrase, (suggestion, category) in self.FORBIDDEN_HIGH_SEVERITY.items():
            if phrase.lower() in line_lower:
                self._add_violation(
                    file_path, line_num, line.strip(), "forbidden_phrase",
                    phrase, "high", suggestion,
                    self._get_principle(category),
                    f"High severity: {category}"
                )

        # Check medium severity violations
        for phrase, (suggestion, category) in self.FORBIDDEN_MEDIUM_SEVERITY.items():
            if phrase.lower() in line_lower:
                self._add_violation(
                    file_path, line_num, line.strip(), "forbidden_phrase",
                    phrase, "medium", suggestion,
                    self._get_principle(category),
                    f"Medium severity: {category}"
                )

        # Check low severity violations (only in actual strings)
        if '"' in line or "'" in line:
            for phrase, (suggestion, category) in self.FORBIDDEN_LOW_SEVERITY.items():
                if phrase.lower() in line_lower:
                    self._add_violation(
                        file_path, line_num, line.strip(), "forbidden_phrase",
                        phrase, "low", suggestion,
                        self._get_principle(category),
                        f"Consider changing: {category}"
                    )

        # Check executor context violations
        if "executor" in file_path.lower() or "executor" in line_lower:
            for phrase, suggestion in self.EXECUTOR_CONTEXT_VIOLATIONS.items():
                if phrase.lower() in line_lower:
                    self._add_violation(
                        file_path, line_num, line.strip(), "executor_context",
                        phrase, "medium", suggestion,
                        "Acknowledgment Over Efficiency",
                        "Executors are grieving - avoid deadline/urgency language"
                    )

        # Heightened sensitivity check for funeral/grief files
        if is_heightened and self.config.get("heightened_sensitivity_files", True):
            self._check_heightened_sensitivity(line, file_path, line_num)

    def _check_heightened_sensitivity(self, line: str, file_path: str, line_num: int):
        """Additional checks for grief/funeral sensitive files"""
        line_lower = line.lower()

        # In funeral planning context, certain cold phrases are worse
        extra_cold_phrases = {
            "body": "physical form",
            "dead": "who has passed",
            "death": "passing",
            "die": "pass away",
            "died": "passed",
        }

        # Only flag if it's clearly user-facing text (in quotes)
        if '"' in line or "'" in line:
            for phrase, suggestion in extra_cold_phrases.items():
                # Use word boundary to avoid false positives
                if re.search(rf'\b{phrase}\b', line_lower):
                    # Don't flag variable names or technical code
                    if not re.search(rf'[a-zA-Z_]{phrase}|{phrase}[a-zA-Z_]', line):
                        self._add_violation(
                            file_path, line_num, line.strip(), "heightened_sensitivity",
                            phrase, "medium", f"Consider using '{suggestion}'",
                            "Presence Over Positivity",
                            "This file handles sensitive grief content - extra care needed"
                        )

    def _add_violation(
        self,
        file: str,
        line: int,
        text: str,
        violation_type: str,
        violation_phrase: str,
        severity: str,
        suggestion: str,
        principle: str,
        context: str
    ):
        """Add a violation to the list"""
        violation = ToneViolation(
            file=file,
            line=line,
            text=text[:200] + "..." if len(text) > 200 else text,
            violation_type=violation_type,
            violation_phrase=violation_phrase,
            severity=severity,
            suggestion=suggestion,
            principle=principle,
            context=context
        )
        self.violations.append(violation)

    def _get_principle(self, category: str) -> str:
        """Map violation category to TONE_GUIDE principle"""
        principle_map = {
            "clinical language": "Supportive, never clinical",
            "urgency language": "Patient, never urgent",
            "anti-empathy": "Present, never dismissive",
            "cold error": "Supportive, never clinical",
            "harsh language": "Supportive, never clinical",
            "demanding": "Invitation Over Instruction",
            "dismissive": "Present, never dismissive",
            "false positivity": "Presence Over Positivity",
            "task-focused": "Acknowledgment Over Efficiency",
            "button language": "Invitation Over Instruction",
            "generic tech": "Inviting, never demanding",
        }
        return principle_map.get(category, "Compassionate communication")

    def get_summary(self) -> Dict[str, Any]:
        """Get summary of all violations"""
        high_count = sum(1 for v in self.violations if v.severity == "high")
        medium_count = sum(1 for v in self.violations if v.severity == "medium")
        low_count = sum(1 for v in self.violations if v.severity == "low")

        return {
            "total": len(self.violations),
            "high": high_count,
            "medium": medium_count,
            "low": low_count,
            "files_checked": len(self.checked_files),
            "should_fail": (
                (self.config.get("fail_on_high_severity", True) and high_count > 0) or
                (self.config.get("fail_on_medium_severity", False) and medium_count > 0) or
                (self.config.get("fail_on_low_severity", False) and low_count > 0)
            )
        }

    def format_report(self) -> str:
        """Format violations as a human-readable report"""
        if not self.violations:
            return "No emotional tone violations found. The language maintains compassion."

        report = []
        report.append("=" * 70)
        report.append("EMOTIONAL TONE REVIEW - Continuum Death Planning Application")
        report.append("=" * 70)
        report.append("")
        report.append("Continuum helps people navigate death and end-of-life planning.")
        report.append("All language must be compassionate, patient, and supportive.")
        report.append("")

        summary = self.get_summary()
        report.append(f"SUMMARY: {summary['total']} violations found")
        report.append(f"  - High severity (must fix): {summary['high']}")
        report.append(f"  - Medium severity (should fix): {summary['medium']}")
        report.append(f"  - Low severity (consider): {summary['low']}")
        report.append("")

        # Group by severity
        for severity in ["high", "medium", "low"]:
            severity_violations = [v for v in self.violations if v.severity == severity]
            if severity_violations:
                report.append("-" * 70)
                report.append(f"{severity.upper()} SEVERITY VIOLATIONS")
                report.append("-" * 70)

                for v in severity_violations:
                    report.append("")
                    report.append(f"File: {v.file}:{v.line}")
                    report.append(f"Found: \"{v.violation_phrase}\"")
                    report.append(f"Context: {v.text}")
                    report.append(f"Principle violated: {v.principle}")
                    report.append(f"Suggestion: {v.suggestion}")

                report.append("")

        report.append("=" * 70)
        report.append("Reference: /TONE_GUIDE.md for full compassionate language guidelines")
        report.append("=" * 70)

        return "\n".join(report)


def main():
    """CLI interface for tone checker"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Check code for emotional tone compliance in death planning app"
    )
    parser.add_argument(
        "--base-ref",
        default="HEAD~1",
        help="Base commit SHA for comparison"
    )
    parser.add_argument(
        "--head-ref",
        default="HEAD",
        help="Head commit SHA to check"
    )
    parser.add_argument(
        "--config",
        help="Path to config.json"
    )
    parser.add_argument(
        "--output",
        choices=["json", "text"],
        default="text",
        help="Output format"
    )
    parser.add_argument(
        "--file",
        help="Check a specific file instead of git diff"
    )

    args = parser.parse_args()

    checker = EmotionalToneChecker(config_path=args.config)

    if args.file:
        # Check specific file
        with open(args.file) as f:
            content = f.read()
        violations = checker.check_file_content(args.file, content)
    else:
        # Check git diff
        violations = checker.check_changes(args.base_ref, args.head_ref)

    if args.output == "json":
        print(json.dumps({
            "violations": violations,
            "summary": checker.get_summary()
        }, indent=2))
    else:
        print(checker.format_report())

    # Exit with error code if should fail
    summary = checker.get_summary()
    if summary["should_fail"]:
        exit(1)
    exit(0)


if __name__ == "__main__":
    main()
