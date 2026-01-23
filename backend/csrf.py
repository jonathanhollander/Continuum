"""
CSRF Protection for Continuum SaaS

Uses the Double-Submit Cookie pattern:
1. Server sends a CSRF token in a cookie (readable by JavaScript)
2. Client reads the cookie and sends the token in a header (X-CSRF-Token)
3. Server verifies the header matches the cookie

For JWT-based APIs with Authorization headers, CSRF is less critical since:
- Browsers don't auto-send Authorization headers on cross-origin requests
- Attackers can't read the JWT from localStorage

However, this protection adds defense-in-depth, especially for:
- Refresh token endpoints (if using httpOnly cookies)
- Any form-based submissions
- Future cookie-based features
"""
import secrets
from typing import Callable, Optional
from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from backend.config import settings
from backend.utils.logger import get_logger

logger = get_logger(__name__)

# CSRF Token Configuration
CSRF_COOKIE_NAME = "csrf_token"
CSRF_HEADER_NAME = "X-CSRF-Token"
CSRF_TOKEN_LENGTH = 32  # 256 bits of entropy
CSRF_COOKIE_MAX_AGE = 3600  # 1 hour

# Methods that require CSRF protection (state-changing)
CSRF_PROTECTED_METHODS = {"POST", "PUT", "DELETE", "PATCH"}

# Paths excluded from CSRF protection (public endpoints, OAuth flows)
CSRF_EXEMPT_PATHS = {
    "/api/auth/token",  # OAuth2 password grant (uses form data)
    "/api/auth/signup",  # Registration
    "/api/auth/refresh",  # Token refresh (uses its own token)
    "/api/auth/passkey/register/start",
    "/api/auth/passkey/register/finish",
    "/api/auth/passkey/login/start",
    "/api/auth/passkey/login/finish",
    "/api/auth/magic-link",
    "/api/auth/magic-link/verify",
    "/api/pulse/checkin/respond",  # Public check-in response (uses token in URL)
    "/api/health",
    "/docs",
    "/redoc",
    "/openapi.json",
}


def generate_csrf_token() -> str:
    """Generate a cryptographically secure CSRF token."""
    return secrets.token_urlsafe(CSRF_TOKEN_LENGTH)


def get_csrf_cookie(request: Request) -> Optional[str]:
    """Get CSRF token from cookie."""
    return request.cookies.get(CSRF_COOKIE_NAME)


def get_csrf_header(request: Request) -> Optional[str]:
    """Get CSRF token from header."""
    return request.headers.get(CSRF_HEADER_NAME)


def is_csrf_exempt(request: Request) -> bool:
    """Check if the request path is exempt from CSRF protection."""
    path = request.url.path

    # Check exact matches
    if path in CSRF_EXEMPT_PATHS:
        return True

    # Check prefix matches (for paths with dynamic segments)
    for exempt_path in CSRF_EXEMPT_PATHS:
        if path.startswith(exempt_path):
            return True

    return False


def validate_csrf_token(request: Request) -> bool:
    """
    Validate CSRF token by comparing cookie and header values.
    Returns True if valid, raises HTTPException if invalid.
    """
    # Safe methods don't need CSRF protection
    if request.method not in CSRF_PROTECTED_METHODS:
        return True

    # Check if path is exempt
    if is_csrf_exempt(request):
        return True

    # Get tokens from cookie and header
    cookie_token = get_csrf_cookie(request)
    header_token = get_csrf_header(request)

    # Both must be present and match
    if not cookie_token:
        logger.warning(
            "CSRF validation failed: missing cookie",
            extra={"context": {
                "path": request.url.path,
                "method": request.method
            }}
        )
        return False

    if not header_token:
        logger.warning(
            "CSRF validation failed: missing header",
            extra={"context": {
                "path": request.url.path,
                "method": request.method
            }}
        )
        return False

    if not secrets.compare_digest(cookie_token, header_token):
        logger.warning(
            "CSRF validation failed: token mismatch",
            extra={"context": {
                "path": request.url.path,
                "method": request.method
            }}
        )
        return False

    return True


class CSRFMiddleware(BaseHTTPMiddleware):
    """
    Middleware to enforce CSRF protection using double-submit cookie pattern.

    Usage in main.py:
        from backend.csrf import CSRFMiddleware
        app.add_middleware(CSRFMiddleware)
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip CSRF for non-protected methods
        if request.method in CSRF_PROTECTED_METHODS and not is_csrf_exempt(request):
            if not validate_csrf_token(request):
                # In production, reject the request
                if settings.is_production():
                    raise HTTPException(
                        status_code=403,
                        detail="CSRF token validation failed"
                    )
                else:
                    # In development, log warning but allow (for easier testing)
                    logger.warning(
                        "CSRF validation failed (development mode - allowing request)",
                        extra={"context": {
                            "path": request.url.path,
                            "method": request.method
                        }}
                    )

        # Process request
        response = await call_next(request)

        # Set CSRF cookie on all responses if not present
        if not get_csrf_cookie(request):
            token = generate_csrf_token()
            response.set_cookie(
                key=CSRF_COOKIE_NAME,
                value=token,
                max_age=CSRF_COOKIE_MAX_AGE,
                httponly=False,  # Must be readable by JavaScript
                secure=settings.is_production(),  # HTTPS only in production
                samesite="lax",  # Protect against cross-site attacks
                path="/"
            )

        return response


def get_csrf_token_endpoint(request: Request) -> dict:
    """
    Endpoint to get a CSRF token.
    Frontend can call this to get a fresh token if needed.
    """
    token = get_csrf_cookie(request)
    if not token:
        token = generate_csrf_token()
    return {"csrf_token": token}
