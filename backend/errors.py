"""
Centralized error handling for Continuum backend.

Provides:
- The ContinuumException base class
- Compassionate, user-friendly error messages
- Consistent error response format
- Error logging integration
"""
from fastapi import HTTPException, status
from starlette.exceptions import HTTPException as StarletteHTTPException
from http import HTTPStatus
from typing import Optional, Dict, Any
import traceback
from datetime import datetime
from backend.utils.clock import utc_now

from backend.config import settings


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
        self.timestamp = utc_now().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dict for JSON response."""
        body = {
            "error": {
                "message": self.user_message,  # User sees this
                "code": self.error_code,
                "details": self.details,
                "timestamp": self.timestamp
            }
        }
        if settings.is_development():
            body["_technical"] = self.message  # Only in dev mode
        return body


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

    # Handle FastAPI and Starlette HTTPException; a bare status phrase ("Method Not Allowed") gets gentle copy
    if isinstance(exc, StarletteHTTPException):
        phrase = HTTPStatus(exc.status_code).phrase if exc.status_code in HTTPStatus._value2member_map_ else None
        return ErrorResponse(
            message=f"HTTP {exc.status_code}: {exc.detail}",
            user_message=exc.detail if isinstance(exc.detail, str) and exc.detail != phrase else "That paused for a moment. We can try again whenever you're ready.",
            status_code=exc.status_code,
            error_code="HTTP_ERROR"
        )

    # Unknown exception - log it and return generic error
    error_trace = traceback.format_exc()
    logger.error(f"Unhandled exception during {context}:")
    logger.error(error_trace)

    return ErrorResponse(
        message=f"Unhandled exception: {str(exc)}",
        user_message="That paused on our side for a moment. We can try again whenever you're ready.",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code="INTERNAL_ERROR",
        details={"context": context}
    )
