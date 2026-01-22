"""
Centralized logging infrastructure for Continuum SaaS.

Provides structured logging with request correlation, user context,
and automatic rotation. Replaces scattered print() statements throughout
the codebase with proper logging.

Usage:
    from backend.utils.logger import get_logger

    logger = get_logger(__name__)
    logger.info("User logged in", extra={"context": {"user_id": 123}})
    logger.error("Email send failed", extra={"context": {
        "user_id": 123,
        "email": "user@example.com",
        "error": str(e)
    }})
"""

import logging
import sys
import json
from pathlib import Path
from logging.handlers import RotatingFileHandler
from datetime import datetime
from typing import Any, Dict, Optional

# Will be set by setup_logging()
_logging_configured = False


class ContextFilter(logging.Filter):
    """Add context dict to log records if not present."""

    def filter(self, record):
        if not hasattr(record, 'context'):
            record.context = {}
        return True


class JSONFormatter(logging.Formatter):
    """
    Format log records as JSON for production environments.
    Easier to parse, query, and ingest into log aggregation systems.
    """

    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }

        # Add context if available
        if hasattr(record, 'context') and record.context:
            log_data['context'] = record.context

        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)

        return json.dumps(log_data)


class HumanReadableFormatter(logging.Formatter):
    """
    Format log records in human-readable format for development.
    Color-coded by level for easier scanning.
    """

    # ANSI color codes
    COLORS = {
        'DEBUG': '\033[36m',     # Cyan
        'INFO': '\033[32m',      # Green
        'WARNING': '\033[33m',   # Yellow
        'ERROR': '\033[31m',     # Red
        'CRITICAL': '\033[35m',  # Magenta
        'RESET': '\033[0m'       # Reset
    }

    def format(self, record):
        # Add color for console output
        if hasattr(sys.stderr, 'isatty') and sys.stderr.isatty():
            color = self.COLORS.get(record.levelname, self.COLORS['RESET'])
            reset = self.COLORS['RESET']
            levelname = f"{color}{record.levelname:8s}{reset}"
        else:
            levelname = f"{record.levelname:8s}"

        # Format timestamp
        timestamp = datetime.fromtimestamp(record.created).strftime('%Y-%m-%d %H:%M:%S')

        # Build message
        parts = [
            timestamp,
            levelname,
            f"{record.name:20s}",
            record.getMessage()
        ]

        # Add context if present
        if hasattr(record, 'context') and record.context:
            context_str = json.dumps(record.context, default=str)
            parts.append(f"| {context_str}")

        message = " | ".join(parts)

        # Add exception info if present
        if record.exc_info:
            message += "\n" + self.formatException(record.exc_info)

        return message


def setup_logging(
    log_level: str = "INFO",
    log_dir: str = "backend/logs",
    max_bytes: int = 10485760,  # 10MB
    backup_count: int = 5,
    use_json: bool = False
) -> None:
    """
    Configure application-wide logging.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: Directory for log files
        max_bytes: Maximum size per log file before rotation
        backup_count: Number of backup files to keep
        use_json: Use JSON formatting (production) vs human-readable (dev)
    """
    global _logging_configured

    if _logging_configured:
        return

    # Create log directory if it doesn't exist
    log_path = Path(log_dir)
    log_path.mkdir(parents=True, exist_ok=True)

    # Convert string level to logging constant
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    # Create formatters
    if use_json:
        formatter = JSONFormatter()
    else:
        formatter = HumanReadableFormatter()

    # Console handler (always human-readable, even in production)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(HumanReadableFormatter())
    console_handler.addFilter(ContextFilter())

    # File handler with rotation
    file_handler = RotatingFileHandler(
        log_path / "continuum.log",
        maxBytes=max_bytes,
        backupCount=backup_count,
        encoding='utf-8'
    )
    file_handler.setLevel(numeric_level)
    file_handler.setFormatter(formatter)
    file_handler.addFilter(ContextFilter())

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)
    root_logger.handlers = []  # Clear existing handlers
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)

    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)

    _logging_configured = True

    # Log that logging is configured
    logger = logging.getLogger(__name__)
    logger.info(
        "Logging configured",
        extra={
            "context": {
                "level": log_level,
                "log_dir": str(log_path),
                "format": "JSON" if use_json else "human-readable"
            }
        }
    )


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a module.

    Args:
        name: Logger name (usually __name__)

    Returns:
        Configured logger instance

    Example:
        logger = get_logger(__name__)
        logger.info("Processing request", extra={"context": {"user_id": 123}})
    """
    return logging.getLogger(name)


def log_request_start(
    request_id: str,
    method: str,
    path: str,
    user_id: Optional[int] = None
) -> None:
    """
    Log the start of an HTTP request.

    Args:
        request_id: Unique request identifier
        method: HTTP method (GET, POST, etc.)
        path: Request path
        user_id: Authenticated user ID (if available)
    """
    logger = get_logger("continuum.request")
    logger.info(
        f"{method} {path}",
        extra={
            "context": {
                "request_id": request_id,
                "method": method,
                "path": path,
                "user_id": user_id,
                "event": "request_start"
            }
        }
    )


def log_request_end(
    request_id: str,
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    user_id: Optional[int] = None
) -> None:
    """
    Log the completion of an HTTP request.

    Args:
        request_id: Unique request identifier
        method: HTTP method
        path: Request path
        status_code: HTTP response status code
        duration_ms: Request duration in milliseconds
        user_id: Authenticated user ID (if available)
    """
    logger = get_logger("continuum.request")
    log_level = logging.WARNING if status_code >= 400 else logging.INFO

    logger.log(
        log_level,
        f"{method} {path} -> {status_code} ({duration_ms:.2f}ms)",
        extra={
            "context": {
                "request_id": request_id,
                "method": method,
                "path": path,
                "status_code": status_code,
                "duration_ms": duration_ms,
                "user_id": user_id,
                "event": "request_end"
            }
        }
    )


def log_email_send(
    request_id: str,
    user_id: int,
    recipient: str,
    subject: str,
    success: bool,
    error: Optional[str] = None,
    provider_message_id: Optional[str] = None
) -> None:
    """
    Log email send attempt (success or failure).

    Args:
        request_id: Request correlation ID
        user_id: User who triggered the email
        recipient: Email recipient
        subject: Email subject
        success: Whether send succeeded
        error: Error message if failed
        provider_message_id: Provider's message ID if successful
    """
    logger = get_logger("continuum.email")

    context = {
        "request_id": request_id,
        "user_id": user_id,
        "recipient": recipient,
        "subject": subject,
        "success": success,
        "event": "email_send"
    }

    if success:
        context["provider_message_id"] = provider_message_id
        logger.info(
            f"Email sent: {subject} -> {recipient}",
            extra={"context": context}
        )
    else:
        context["error"] = error
        logger.error(
            f"Email send failed: {subject} -> {recipient}",
            extra={"context": context}
        )


def log_auth_event(
    request_id: str,
    event_type: str,
    user_id: Optional[int] = None,
    email: Optional[str] = None,
    success: bool = True,
    error: Optional[str] = None
) -> None:
    """
    Log authentication events (login, signup, logout, etc.).

    Args:
        request_id: Request correlation ID
        event_type: Type of auth event (login, signup, logout, token_refresh)
        user_id: User ID (if available)
        email: User email (if available)
        success: Whether event succeeded
        error: Error message if failed
    """
    logger = get_logger("continuum.auth")

    context = {
        "request_id": request_id,
        "event": f"auth_{event_type}",
        "user_id": user_id,
        "email": email,
        "success": success
    }

    if not success and error:
        context["error"] = error

    log_level = logging.INFO if success else logging.WARNING
    message = f"Auth {event_type}: {email or user_id}" + (" (success)" if success else " (failed)")

    logger.log(log_level, message, extra={"context": context})


def log_database_error(
    request_id: str,
    operation: str,
    table: str,
    error: Exception,
    user_id: Optional[int] = None
) -> None:
    """
    Log database operation errors.

    Args:
        request_id: Request correlation ID
        operation: Database operation (create, update, delete, query)
        table: Table/model name
        error: Exception that occurred
        user_id: User ID (if available)
    """
    logger = get_logger("continuum.database")
    logger.error(
        f"Database {operation} failed on {table}: {str(error)}",
        extra={
            "context": {
                "request_id": request_id,
                "operation": operation,
                "table": table,
                "error": str(error),
                "error_type": type(error).__name__,
                "user_id": user_id,
                "event": "database_error"
            }
        },
        exc_info=True
    )
