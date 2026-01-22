"""
Centralized error handling for Continuum backend.

Provides:
- Custom exception classes for different error types
- Compassionate, user-friendly error messages
- Consistent error response format
- Error logging integration
"""
from fastapi import HTTPException, status
from typing import Optional, Dict, Any
import traceback
from datetime import datetime


class ErrorResponse:
    """Standard error response format."""

    def __init__(
        self,
        message: str,
        user_message: str,
        status_code: int = 500,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message  # Technical message (for logs)
        self.user_message = user_message  # Compassionate message (for users)
        self.status_code = status_code
        self.error_code = error_code  # For frontend error mapping
        self.details = details or {}
        self.timestamp = datetime.utcnow().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dict for JSON response."""
        return {
            "error": {
                "message": self.user_message,  # User sees this
                "code": self.error_code,
                "details": self.details,
                "timestamp": self.timestamp
            },
            "_technical": self.message  # Only in dev mode
        }


class ContinuumException(Exception):
    """Base exception for all Continuum errors."""

    def __init__(
        self,
        message: str,
        user_message: str,
        status_code: int = 500,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.user_message = user_message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(message)

    def to_error_response(self) -> ErrorResponse:
        return ErrorResponse(
            message=self.message,
            user_message=self.user_message,
            status_code=self.status_code,
            error_code=self.error_code,
            details=self.details
        )


# --- Authentication & Authorization Errors ---

class AuthenticationError(ContinuumException):
    """User authentication failed."""

    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            user_message="We couldn't verify your identity. Please try signing in again.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="AUTH_FAILED",
            details=details
        )


class AuthorizationError(ContinuumException):
    """User doesn't have permission."""

    def __init__(self, resource: str = "this resource", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"User not authorized to access {resource}",
            user_message=f"You don't have permission to access {resource}. If you believe this is an error, please contact support.",
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="NOT_AUTHORIZED",
            details=details
        )


class TokenExpiredError(ContinuumException):
    """Authentication token has expired."""

    def __init__(self):
        super().__init__(
            message="Authentication token expired",
            user_message="Your session has expired. Please sign in again to continue.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="TOKEN_EXPIRED"
        )


# --- Resource Errors ---

class ResourceNotFoundError(ContinuumException):
    """Requested resource doesn't exist."""

    def __init__(self, resource_type: str = "item", resource_id: Optional[str] = None):
        details = {"resource_type": resource_type}
        if resource_id:
            details["resource_id"] = resource_id

        super().__init__(
            message=f"{resource_type} not found: {resource_id}",
            user_message=f"We couldn't find that {resource_type}. It may have been moved or deleted.",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND",
            details=details
        )


class ResourceAlreadyExistsError(ContinuumException):
    """Resource already exists (duplicate)."""

    def __init__(self, resource_type: str = "item", field: Optional[str] = None):
        details = {"resource_type": resource_type}
        if field:
            details["field"] = field

        user_msg = f"This {resource_type} already exists."
        if field:
            user_msg = f"A {resource_type} with this {field} already exists."

        super().__init__(
            message=f"Duplicate {resource_type}: {field}",
            user_message=user_msg,
            status_code=status.HTTP_409_CONFLICT,
            error_code="ALREADY_EXISTS",
            details=details
        )


# --- Validation Errors ---

class ValidationError(ContinuumException):
    """User input validation failed."""

    def __init__(self, field: str, reason: str, details: Optional[Dict[str, Any]] = None):
        error_details = {"field": field, "reason": reason}
        if details:
            error_details.update(details)

        super().__init__(
            message=f"Validation failed for {field}: {reason}",
            user_message=f"Please check the {field} field. {reason}",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="VALIDATION_ERROR",
            details=error_details
        )


class InvalidDataTypeError(ContinuumException):
    """Invalid data type requested."""

    def __init__(self, data_type: str, valid_types: Optional[list] = None):
        details = {"requested_type": data_type}
        if valid_types:
            details["valid_types"] = valid_types

        super().__init__(
            message=f"Invalid data type: {data_type}",
            user_message="We encountered an issue with your request. Please try again or contact support.",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_TYPE",
            details=details
        )


# --- Database Errors ---

class DatabaseError(ContinuumException):
    """Database operation failed."""

    def __init__(self, operation: str = "database operation", original_error: Optional[Exception] = None):
        details = {"operation": operation}
        if original_error:
            details["original_error"] = str(original_error)

        super().__init__(
            message=f"Database error during {operation}: {original_error}",
            user_message="We're having trouble saving your changes right now. Please try again in a moment.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="DATABASE_ERROR",
            details=details
        )


# --- External Service Errors ---

class EmailSendError(ContinuumException):
    """Email failed to send."""

    def __init__(self, recipient: str, original_error: Optional[Exception] = None):
        details = {"recipient": recipient}
        if original_error:
            details["original_error"] = str(original_error)

        super().__init__(
            message=f"Failed to send email to {recipient}: {original_error}",
            user_message="We couldn't send that email right now. We'll retry automatically, or you can contact support if this persists.",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="EMAIL_FAILED",
            details=details
        )


class ExternalServiceError(ContinuumException):
    """External service (API, etc.) failed."""

    def __init__(self, service_name: str, original_error: Optional[Exception] = None):
        details = {"service": service_name}
        if original_error:
            details["original_error"] = str(original_error)

        super().__init__(
            message=f"{service_name} service error: {original_error}",
            user_message=f"We're having trouble connecting to {service_name}. Please try again in a moment.",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="SERVICE_UNAVAILABLE",
            details=details
        )


# --- File/Media Errors ---

class FileUploadError(ContinuumException):
    """File upload failed."""

    def __init__(self, reason: str, filename: Optional[str] = None):
        details = {"reason": reason}
        if filename:
            details["filename"] = filename

        super().__init__(
            message=f"File upload failed: {reason}",
            user_message=f"We couldn't upload your file. {reason}",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="UPLOAD_FAILED",
            details=details
        )


class FileTooLargeError(ContinuumException):
    """File exceeds size limit."""

    def __init__(self, size: int, max_size: int, filename: Optional[str] = None):
        details = {"size": size, "max_size": max_size}
        if filename:
            details["filename"] = filename

        size_mb = size / (1024 * 1024)
        max_mb = max_size / (1024 * 1024)

        super().__init__(
            message=f"File too large: {size_mb:.1f}MB (max: {max_mb:.1f}MB)",
            user_message=f"This file is too large ({size_mb:.1f}MB). Please choose a file under {max_mb:.1f}MB.",
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            error_code="FILE_TOO_LARGE",
            details=details
        )


class InvalidFileTypeError(ContinuumException):
    """File type not allowed."""

    def __init__(self, file_type: str, allowed_types: list, filename: Optional[str] = None):
        details = {"file_type": file_type, "allowed_types": allowed_types}
        if filename:
            details["filename"] = filename

        super().__init__(
            message=f"Invalid file type: {file_type}",
            user_message=f"This file type isn't supported. Please use one of: {', '.join(allowed_types)}",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_FILE_TYPE",
            details=details
        )


# --- Rate Limiting ---

class RateLimitError(ContinuumException):
    """User exceeded rate limit."""

    def __init__(self, retry_after: Optional[int] = None):
        details = {}
        if retry_after:
            details["retry_after_seconds"] = retry_after

        retry_msg = ""
        if retry_after:
            retry_msg = f" Please try again in {retry_after} seconds."

        super().__init__(
            message=f"Rate limit exceeded (retry after {retry_after}s)",
            user_message=f"You're doing that too quickly.{retry_msg} Take your time—we're here when you're ready.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_code="RATE_LIMITED",
            details=details
        )


# --- Helper Functions ---

from backend.utils.logger import get_logger

logger = get_logger(__name__)

def handle_exception(exc: Exception, context: str = "operation") -> ErrorResponse:
    """
    Convert any exception to an ErrorResponse.

    Args:
        exc: The exception to handle
        context: Description of what was being done (for user message)

    Returns:
        ErrorResponse with appropriate status code and messages
    """
    # If it's already one of our exceptions, use it directly
    if isinstance(exc, ContinuumException):
        return exc.to_error_response()

    # Handle FastAPI HTTPException
    if isinstance(exc, HTTPException):
        return ErrorResponse(
            message=f"HTTP {exc.status_code}: {exc.detail}",
            user_message=exc.detail if isinstance(exc.detail, str) else "Something went wrong. Please try again.",
            status_code=exc.status_code,
            error_code="HTTP_ERROR"
        )

    # Unknown exception - log it and return generic error
    error_trace = traceback.format_exc()
    logger.error(f"Unhandled exception during {context}:")
    logger.error(error_trace)

    return ErrorResponse(
        message=f"Unhandled exception: {str(exc)}",
        user_message="We encountered an unexpected issue. Our team has been notified. Please try again or contact support if this persists.",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code="INTERNAL_ERROR",
        details={"context": context}
    )


def to_http_exception(error: ContinuumException) -> HTTPException:
    """Convert ContinuumException to FastAPI HTTPException."""
    return HTTPException(
        status_code=error.status_code,
        detail=error.to_error_response().to_dict()
    )
