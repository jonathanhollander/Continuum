#!/usr/bin/env python3
"""
Security Vulnerability Scanner for Continuum

Scans PRs for security vulnerabilities:
- Hardcoded secrets/API keys
- SQL injection patterns
- XSS vulnerabilities
- Authentication bypass issues
- Insecure file uploads
- Path traversal vulnerabilities
- Insecure Direct Object References (IDOR)
"""

import re
import subprocess
import json
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from dataclasses import dataclass, asdict


@dataclass
class SecurityIssue:
    """Represents a detected security issue"""
    file: str
    line: int
    issue_type: str
    description: str
    severity: str  # "critical", "high", "medium", "low"
    snippet: str
    recommendation: str
    cwe_id: Optional[str] = None  # Common Weakness Enumeration ID


class SecurityScanner:
    """
    Scan code changes for security vulnerabilities.

    Based on OWASP Top 10 and common security patterns.
    """

    # =========================================================================
    # SECRET DETECTION PATTERNS
    # =========================================================================

    SECRET_PATTERNS = {
        # API Keys
        "api_key_generic": (
            r'["\']?api[_-]?key["\']?\s*[:=]\s*["\'][a-zA-Z0-9_\-]{20,}["\']',
            "Generic API Key",
            "critical"
        ),
        "aws_access_key": (
            r'AKIA[0-9A-Z]{16}',
            "AWS Access Key ID",
            "critical"
        ),
        "aws_secret_key": (
            r'["\']?aws[_-]?secret[_-]?access[_-]?key["\']?\s*[:=]\s*["\'][A-Za-z0-9/+=]{40}["\']',
            "AWS Secret Access Key",
            "critical"
        ),
        "github_token": (
            r'gh[pousr]_[A-Za-z0-9_]{36,}',
            "GitHub Token",
            "critical"
        ),
        "jwt_secret": (
            r'["\']?jwt[_-]?secret["\']?\s*[:=]\s*["\'][^"\']{16,}["\']',
            "JWT Secret Key",
            "critical"
        ),
        "private_key": (
            r'-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----',
            "Private Key",
            "critical"
        ),
        "password_hardcoded": (
            r'["\']?password["\']?\s*[:=]\s*["\'][^"\']{8,}["\']',
            "Hardcoded Password",
            "high"
        ),
        "database_url": (
            r'(postgres|mysql|mongodb)://[^:]+:[^@]+@[^/]+',
            "Database Connection String with Credentials",
            "critical"
        ),
        "bearer_token": (
            r'Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_=]*',
            "Bearer Token",
            "high"
        ),
        "sendgrid_api_key": (
            r'SG\.[a-zA-Z0-9_\-]{22}\.[a-zA-Z0-9_\-]{43}',
            "SendGrid API Key",
            "critical"
        ),
        "stripe_key": (
            r'sk_(live|test)_[0-9a-zA-Z]{24,}',
            "Stripe Secret Key",
            "critical"
        ),
        "postmark_token": (
            r'["\']?postmark[_-]?(api[_-]?)?key["\']?\s*[:=]\s*["\'][a-f0-9\-]{36}["\']',
            "Postmark API Key",
            "critical"
        ),
    }

    # Patterns that look like secrets but are okay (allowlist)
    SECRET_ALLOWLIST = [
        r'your[_-]?api[_-]?key[_-]?here',
        r'xxx+',
        r'your[_-]?.*[_-]?here',
        r'example',
        r'placeholder',
        r'changeme',
        r'dummy',
        r'test',
        r'\$\{.*\}',  # Environment variable references
        r'process\.env\.',  # Node env references
        r'os\.environ',  # Python env references
        r'settings\.',  # Settings references
    ]

    # =========================================================================
    # SQL INJECTION PATTERNS
    # =========================================================================

    SQL_INJECTION_PATTERNS = {
        "string_format_sql": (
            r'(execute|cursor\.execute|session\.execute)\s*\(\s*f["\']',
            "SQL query with f-string (SQL injection risk)",
            "critical"
        ),
        "string_concat_sql": (
            r'(execute|cursor\.execute|session\.execute)\s*\([^)]*\+\s*[^)]*\)',
            "SQL query with string concatenation (SQL injection risk)",
            "critical"
        ),
        "percent_format_sql": (
            r'(execute|cursor\.execute)\s*\([^)]*%\s*[^)]*\)',
            "SQL query with % formatting (SQL injection risk)",
            "high"
        ),
        "raw_sql_input": (
            r'text\s*\(\s*f["\'].*\{.*\}',
            "SQLAlchemy text() with f-string (SQL injection risk)",
            "critical"
        ),
    }

    # =========================================================================
    # XSS PATTERNS
    # =========================================================================

    XSS_PATTERNS = {
        "innerHTML_usage": (
            r'\.innerHTML\s*=\s*[^"\'`]',
            "Direct innerHTML assignment (XSS risk)",
            "high"
        ),
        "dangerouslySetInnerHTML": (
            r'dangerouslySetInnerHTML',
            "React dangerouslySetInnerHTML (XSS risk if user input)",
            "medium"
        ),
        "html_unescaped": (
            r'@html\s+[^"\'`]',
            "Svelte @html with variable (XSS risk)",
            "high"
        ),
        "eval_usage": (
            r'\beval\s*\(',
            "eval() usage (code injection risk)",
            "critical"
        ),
        "document_write": (
            r'document\.write\s*\(',
            "document.write() (XSS risk)",
            "high"
        ),
    }

    # =========================================================================
    # AUTHENTICATION PATTERNS
    # =========================================================================

    AUTH_PATTERNS = {
        "auth_bypass": (
            r'#\s*TODO:?\s*(remove|fix|implement)\s*(auth|authentication)',
            "Authentication TODO/bypass comment",
            "high"
        ),
        "hardcoded_user_id": (
            r'user[_-]?id\s*[:=]\s*["\']?\d+["\']?',
            "Hardcoded user ID (potential auth bypass)",
            "medium"
        ),
        "jwt_none_algorithm": (
            r'algorithm\s*[:=]\s*["\']none["\']',
            "JWT with 'none' algorithm (authentication bypass)",
            "critical"
        ),
        "no_auth_check": (
            r'@(app|router)\.(get|post|put|delete)\s*\([^)]*\)\s*\n\s*(async\s+)?def\s+\w+\s*\([^)]*\):(?!.*get_current_user)',
            "API endpoint potentially missing authentication",
            "medium"
        ),
    }

    # =========================================================================
    # FILE UPLOAD PATTERNS
    # =========================================================================

    FILE_UPLOAD_PATTERNS = {
        "unrestricted_upload": (
            r'UploadFile(?![^)]*content_type)',
            "File upload without content-type validation",
            "medium"
        ),
        "path_traversal": (
            r'open\s*\([^)]*\+[^)]*\)',
            "File path with concatenation (path traversal risk)",
            "high"
        ),
        "unsafe_filename": (
            r'filename\s*=\s*[^)]*\.(filename|name)',
            "Using user-provided filename directly",
            "high"
        ),
    }

    # =========================================================================
    # OTHER SECURITY PATTERNS
    # =========================================================================

    OTHER_PATTERNS = {
        "debug_enabled": (
            r'DEBUG\s*[:=]\s*(True|true|1|["\']true["\'])',
            "Debug mode enabled (should be false in production)",
            "medium"
        ),
        "cors_wildcard": (
            r'(allow_origins|cors_origins)\s*[:=]\s*\[\s*["\']?\*["\']?\s*\]',
            "CORS allowing all origins",
            "medium"
        ),
        "insecure_ssl": (
            r'verify\s*[:=]\s*(False|false)',
            "SSL verification disabled",
            "high"
        ),
        "pickle_load": (
            r'pickle\.load',
            "pickle.load() (arbitrary code execution risk)",
            "critical"
        ),
        "subprocess_shell": (
            r'subprocess\.(run|Popen|call)\s*\([^)]*shell\s*=\s*True',
            "subprocess with shell=True (command injection risk)",
            "high"
        ),
        "yaml_load": (
            r'yaml\.load\s*\([^)]*(?!Loader\s*=)',
            "yaml.load() without safe Loader",
            "high"
        ),
        "os_system": (
            r'os\.system\s*\(',
            "os.system() (command injection risk)",
            "high"
        ),
        "md5_usage": (
            r'hashlib\.md5|MD5\(',
            "MD5 hash (cryptographically weak)",
            "low"
        ),
        "sha1_usage": (
            r'hashlib\.sha1|SHA1\(',
            "SHA1 hash (cryptographically weak for security)",
            "low"
        ),
    }

    # CWE mappings for common issues
    CWE_MAPPINGS = {
        "api_key_generic": "CWE-798",  # Hard-coded Credentials
        "sql_injection": "CWE-89",
        "xss": "CWE-79",
        "command_injection": "CWE-78",
        "path_traversal": "CWE-22",
        "auth_bypass": "CWE-287",
        "insecure_random": "CWE-330",
    }

    def __init__(self, config_path: Optional[str] = None):
        self.issues: List[SecurityIssue] = []
        self.config = self._load_config(config_path)
        self.project_root = Path(__file__).parent.parent.parent

    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """Load configuration from JSON file"""
        default_config = {
            "enabled": True,
            "scan_for_secrets": True,
            "check_dependencies": True,
            "sql_injection_detection": True,
            "xss_detection": True,
            "fail_on_critical": True,
            "fail_on_high": True,
        }

        if config_path and Path(config_path).exists():
            with open(config_path) as f:
                user_config = json.load(f)
                default_config.update(user_config.get("security", {}))

        return default_config

    def scan_changes(self, base_ref: str, head_ref: str) -> List[Dict[str, Any]]:
        """
        Scan git diff for security vulnerabilities.

        Args:
            base_ref: Base commit SHA
            head_ref: Head commit SHA

        Returns:
            List of security issues as dictionaries
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

        changed_files = [f for f in result.stdout.strip().split("\n") if f]

        for file_path in changed_files:
            # Skip certain files
            if self._should_skip_file(file_path):
                continue

            self._scan_file(file_path, base_ref, head_ref)

        return [asdict(issue) for issue in self.issues]

    def _should_skip_file(self, file_path: str) -> bool:
        """Check if file should be skipped"""
        skip_patterns = [
            "node_modules/",
            "dist/",
            "build/",
            ".git/",
            "package-lock.json",
            "pnpm-lock.yaml",
            "*.min.js",
            "*.map",
            "*.md",  # Documentation usually safe
        ]

        for pattern in skip_patterns:
            if pattern.replace("*", "") in file_path:
                return True
        return False

    def _scan_file(self, file_path: str, base_ref: str, head_ref: str):
        """Scan a single file for security issues"""
        # Get diff for file
        result = subprocess.run(
            ["git", "diff", "-U0", base_ref, head_ref, "--", file_path],
            capture_output=True,
            text=True,
            cwd=self.project_root
        )

        if result.returncode != 0:
            return

        diff_lines = result.stdout.split("\n")
        current_line_num = 0

        for line in diff_lines:
            # Track line numbers
            if line.startswith("@@"):
                match = re.search(r"\+(\d+)", line)
                if match:
                    current_line_num = int(match.group(1)) - 1
                continue

            # Only check added lines
            if not line.startswith("+") or line.startswith("+++"):
                if line.startswith("+"):
                    current_line_num += 1
                continue

            current_line_num += 1
            line_content = line[1:]  # Remove '+'

            # Run all security checks
            self._check_secrets(line_content, file_path, current_line_num)

            if self.config.get("sql_injection_detection", True):
                self._check_sql_injection(line_content, file_path, current_line_num)

            if self.config.get("xss_detection", True):
                self._check_xss(line_content, file_path, current_line_num)

            self._check_auth_issues(line_content, file_path, current_line_num)
            self._check_file_upload(line_content, file_path, current_line_num)
            self._check_other_issues(line_content, file_path, current_line_num)

    def _is_allowlisted(self, line: str) -> bool:
        """Check if line matches secret allowlist"""
        line_lower = line.lower()
        for pattern in self.SECRET_ALLOWLIST:
            if re.search(pattern, line_lower, re.IGNORECASE):
                return True
        return False

    def _check_secrets(self, line: str, file_path: str, line_num: int):
        """Check for hardcoded secrets"""
        if not self.config.get("scan_for_secrets", True):
            return

        if self._is_allowlisted(line):
            return

        for secret_type, (pattern, description, severity) in self.SECRET_PATTERNS.items():
            if re.search(pattern, line, re.IGNORECASE):
                self.issues.append(SecurityIssue(
                    file=file_path,
                    line=line_num,
                    issue_type="hardcoded_secret",
                    description=description,
                    severity=severity,
                    snippet=self._sanitize_snippet(line),
                    recommendation="Use environment variables or a secrets manager",
                    cwe_id="CWE-798"
                ))

    def _check_sql_injection(self, line: str, file_path: str, line_num: int):
        """Check for SQL injection vulnerabilities"""
        for vuln_type, (pattern, description, severity) in self.SQL_INJECTION_PATTERNS.items():
            if re.search(pattern, line, re.IGNORECASE):
                self.issues.append(SecurityIssue(
                    file=file_path,
                    line=line_num,
                    issue_type="sql_injection",
                    description=description,
                    severity=severity,
                    snippet=line.strip()[:100],
                    recommendation="Use parameterized queries with placeholders",
                    cwe_id="CWE-89"
                ))

    def _check_xss(self, line: str, file_path: str, line_num: int):
        """Check for XSS vulnerabilities"""
        for vuln_type, (pattern, description, severity) in self.XSS_PATTERNS.items():
            if re.search(pattern, line, re.IGNORECASE):
                self.issues.append(SecurityIssue(
                    file=file_path,
                    line=line_num,
                    issue_type="xss",
                    description=description,
                    severity=severity,
                    snippet=line.strip()[:100],
                    recommendation="Sanitize user input before rendering",
                    cwe_id="CWE-79"
                ))

    def _check_auth_issues(self, line: str, file_path: str, line_num: int):
        """Check for authentication issues"""
        for vuln_type, (pattern, description, severity) in self.AUTH_PATTERNS.items():
            if re.search(pattern, line, re.IGNORECASE):
                self.issues.append(SecurityIssue(
                    file=file_path,
                    line=line_num,
                    issue_type="auth_issue",
                    description=description,
                    severity=severity,
                    snippet=line.strip()[:100],
                    recommendation="Implement proper authentication checks",
                    cwe_id="CWE-287"
                ))

    def _check_file_upload(self, line: str, file_path: str, line_num: int):
        """Check for file upload vulnerabilities"""
        for vuln_type, (pattern, description, severity) in self.FILE_UPLOAD_PATTERNS.items():
            if re.search(pattern, line, re.IGNORECASE):
                self.issues.append(SecurityIssue(
                    file=file_path,
                    line=line_num,
                    issue_type="file_upload",
                    description=description,
                    severity=severity,
                    snippet=line.strip()[:100],
                    recommendation="Validate file types and sanitize filenames",
                    cwe_id="CWE-434"
                ))

    def _check_other_issues(self, line: str, file_path: str, line_num: int):
        """Check for other security issues"""
        for vuln_type, (pattern, description, severity) in self.OTHER_PATTERNS.items():
            if re.search(pattern, line, re.IGNORECASE):
                self.issues.append(SecurityIssue(
                    file=file_path,
                    line=line_num,
                    issue_type=vuln_type,
                    description=description,
                    severity=severity,
                    snippet=line.strip()[:100],
                    recommendation=self._get_recommendation(vuln_type),
                    cwe_id=self.CWE_MAPPINGS.get(vuln_type)
                ))

    def _get_recommendation(self, vuln_type: str) -> str:
        """Get recommendation for vulnerability type"""
        recommendations = {
            "debug_enabled": "Ensure DEBUG is False in production",
            "cors_wildcard": "Specify allowed origins explicitly",
            "insecure_ssl": "Enable SSL verification in production",
            "pickle_load": "Use json or safer serialization",
            "subprocess_shell": "Use subprocess with shell=False and argument list",
            "yaml_load": "Use yaml.safe_load() instead",
            "os_system": "Use subprocess with argument list",
            "md5_usage": "Use SHA-256 or stronger hash",
            "sha1_usage": "Use SHA-256 or stronger hash for security",
        }
        return recommendations.get(vuln_type, "Review and fix security issue")

    def _sanitize_snippet(self, line: str) -> str:
        """Sanitize snippet to partially hide sensitive data"""
        # Hide most of the secret value
        sanitized = re.sub(
            r'(["\'])[A-Za-z0-9_\-/+=.]{10,}(["\'])',
            r'\1[REDACTED]\2',
            line
        )
        return sanitized.strip()[:100]

    def get_summary(self) -> Dict[str, Any]:
        """Get summary of security scan"""
        critical = sum(1 for i in self.issues if i.severity == "critical")
        high = sum(1 for i in self.issues if i.severity == "high")
        medium = sum(1 for i in self.issues if i.severity == "medium")
        low = sum(1 for i in self.issues if i.severity == "low")

        return {
            "total": len(self.issues),
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low,
            "should_fail": (
                (self.config.get("fail_on_critical", True) and critical > 0) or
                (self.config.get("fail_on_high", True) and high > 0)
            )
        }

    def format_report(self) -> str:
        """Format security scan as human-readable report"""
        if not self.issues:
            return "No security vulnerabilities detected."

        report = []
        report.append("=" * 70)
        report.append("SECURITY VULNERABILITY SCAN REPORT")
        report.append("=" * 70)
        report.append("")

        summary = self.get_summary()
        report.append(f"SUMMARY: {summary['total']} security issues found")
        report.append(f"  - Critical: {summary['critical']}")
        report.append(f"  - High: {summary['high']}")
        report.append(f"  - Medium: {summary['medium']}")
        report.append(f"  - Low: {summary['low']}")
        report.append("")

        # Group by severity
        for severity in ["critical", "high", "medium", "low"]:
            severity_issues = [i for i in self.issues if i.severity == severity]
            if severity_issues:
                report.append("-" * 70)
                report.append(f"{severity.upper()} SEVERITY ISSUES")
                report.append("-" * 70)

                for issue in severity_issues:
                    report.append("")
                    report.append(f"File: {issue.file}:{issue.line}")
                    report.append(f"Type: {issue.issue_type}")
                    report.append(f"Issue: {issue.description}")
                    report.append(f"Code: {issue.snippet}")
                    report.append(f"Fix: {issue.recommendation}")
                    if issue.cwe_id:
                        report.append(f"Reference: {issue.cwe_id}")

                report.append("")

        report.append("=" * 70)
        return "\n".join(report)


def main():
    """CLI interface for security scanner"""
    import argparse

    parser = argparse.ArgumentParser(description="Scan PR for security vulnerabilities")
    parser.add_argument("--base-ref", default="HEAD~1", help="Base commit SHA")
    parser.add_argument("--head-ref", default="HEAD", help="Head commit SHA")
    parser.add_argument("--config", help="Path to config.json")
    parser.add_argument("--output", choices=["json", "text"], default="text")

    args = parser.parse_args()

    scanner = SecurityScanner(config_path=args.config)
    issues = scanner.scan_changes(args.base_ref, args.head_ref)

    if args.output == "json":
        print(json.dumps({
            "security_issues": issues,
            "summary": scanner.get_summary()
        }, indent=2))
    else:
        print(scanner.format_report())

    # Exit with error if should fail
    summary = scanner.get_summary()
    if summary["should_fail"]:
        exit(1)
    exit(0)


if __name__ == "__main__":
    main()
