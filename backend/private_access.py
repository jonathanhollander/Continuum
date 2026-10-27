"""One temporary private-preview boundary, using the existing access-token auth."""
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.security.utils import get_authorization_scheme_param
from starlette.concurrency import run_in_threadpool
from sqlmodel import Session

from backend.auth import get_current_user
from backend.config import settings
from backend.database import engine
from backend.errors import ErrorResponse

PRIVATE_MESSAGE = "Continuum is in private preview."
SIGNUP_CLOSED_MESSAGE = "Continuum is open to existing members. Sign in whenever you're ready."
_PUBLIC_API = {
    ("GET", "/api/health"), ("HEAD", "/api/health"), ("GET", "/api/csrf-token"),
    ("GET", "/api/auth/access-status"), ("POST", "/api/auth/token"),
    ("POST", "/api/auth/passkey/login/start"), ("POST", "/api/auth/passkey/login/finish"),
    ("POST", "/api/auth/magic-link"), ("GET", "/api/auth/magic-link/verify"),
    ("POST", "/api/auth/refresh"), ("POST", "/api/auth/logout"),
}
_SIGNUP_API = {"/api/auth/signup", "/api/auth/passkey/register/start", "/api/auth/passkey/register/finish"}


def private_mode() -> bool:
    return settings.PRIVATE_ACCESS_USER_ID is not None


def user_allowed(user_id: int | None) -> bool:
    return not private_mode() or user_id == settings.PRIVATE_ACCESS_USER_ID


def require_allowed_user(user_id: int | None) -> None:
    if not user_allowed(user_id):
        raise HTTPException(status_code=403, detail=PRIVATE_MESSAGE)


def signup_enabled() -> bool:
    return settings.SIGNUP_ENABLED and not private_mode()


def require_signup_enabled() -> None:
    if not signup_enabled():
        raise HTTPException(status_code=403, detail=SIGNUP_CLOSED_MESSAGE)


def _denied(status_code: int, message: str, headers=None) -> JSONResponse:
    # The standard {"error": {"message"}} shape the frontend reads (PL-19).
    body = ErrorResponse(message=f"Private access: {message}", user_message=message,
                         status_code=status_code, error_code="PRIVATE_ACCESS").to_dict()
    return JSONResponse(status_code=status_code, content=body, headers=headers)


def _authorize(token: str) -> None:
    # Keep database work in a sync worker and reuse the existing JWT/type/user checks.
    with Session(engine) as session:
        user = get_current_user(token=token, session=session)
        require_allowed_user(user.id)


async def enforce_private_access(request: Request, call_next):
    path = request.url.path.rstrip("/")
    if path in _SIGNUP_API and request.method == "POST" and not signup_enabled():
        return _denied(403, SIGNUP_CLOSED_MESSAGE)
    if (not private_mode() or not (path == "/api" or path.startswith("/api/")
                                 or path in {"/openapi.json", "/docs", "/redoc"})
            or request.method == "OPTIONS"):
        return await call_next(request)
    if (request.method, path) in _PUBLIC_API:
        return await call_next(request)
    scheme, token = get_authorization_scheme_param(request.headers.get("Authorization"))
    if scheme.lower() != "bearer" or not token:
        return _denied(403, PRIVATE_MESSAGE)
    try:
        await run_in_threadpool(_authorize, token)
    except HTTPException as error:
        return _denied(error.status_code, error.detail, error.headers)
    return await call_next(request)
