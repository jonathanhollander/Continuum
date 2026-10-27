"""One temporary private-preview boundary, using the existing access-token auth."""
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.security.utils import get_authorization_scheme_param
from starlette.concurrency import run_in_threadpool
from sqlmodel import Session

from backend.auth import get_current_user
from backend.config import settings
from backend.database import engine

PRIVATE_MESSAGE = "Continuum is in private preview."
_PUBLIC_API = {
    ("GET", "/api/health"), ("GET", "/api/csrf-token"),
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


def require_signup_enabled() -> None:
    if private_mode():
        raise HTTPException(status_code=403, detail=PRIVATE_MESSAGE)


def _authorize(token: str) -> None:
    # Keep database work in a sync worker and reuse the existing JWT/type/user checks.
    with Session(engine) as session:
        user = get_current_user(token=token, session=session)
        require_allowed_user(user.id)


async def enforce_private_access(request: Request, call_next):
    path = request.url.path.rstrip("/")
    if (not private_mode() or not (path == "/api" or path.startswith("/api/")
                                 or path in {"/openapi.json", "/docs", "/redoc"})
            or request.method == "OPTIONS"):
        return await call_next(request)
    if path in _SIGNUP_API:
        return JSONResponse(status_code=403, content={"detail": PRIVATE_MESSAGE})
    if (request.method, path) in _PUBLIC_API:
        return await call_next(request)
    scheme, token = get_authorization_scheme_param(request.headers.get("Authorization"))
    if scheme.lower() != "bearer" or not token:
        return JSONResponse(status_code=403, content={"detail": PRIVATE_MESSAGE})
    try:
        await run_in_threadpool(_authorize, token)
    except HTTPException as error:
        return JSONResponse(status_code=error.status_code, content={"detail": error.detail}, headers=error.headers)
    return await call_next(request)
