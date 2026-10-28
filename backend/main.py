from fastapi import FastAPI, Depends, HTTPException, status, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
import uvicorn
import json
import logging
import os
import sys
import uuid
from typing import List, Optional
from pydantic import BaseModel
from sqlmodel import Session
from backend.config import settings
from backend.database import engine, create_db_and_tables, get_session, User, Estate
from backend.estate_persistence import estate_for_write, merge_profile, profile_of, recovery_summary
from backend.security import verify_registration, get_authentication_options, verify_authentication
from backend.auth import create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
from backend.pulse_scheduler import start_scheduler, stop_scheduler
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select
from datetime import timedelta
from backend.routers import pulse, contacts, estate_data, medical, memories, auth as auth_router, media, email, support, ai_proxy, export, recipient, admin_users, ai_settings
from backend.models.ai_settings import AISetting

from backend.errors import ContinuumException, ErrorResponse, handle_exception
from slowapi.errors import RateLimitExceeded
from backend.limiter import limiter
from secure import Secure, ContentSecurityPolicy, StrictTransportSecurity, ReferrerPolicy
from backend.utils.logger import get_logger, setup_logging
from backend.csrf import CSRFMiddleware, get_csrf_token_endpoint
from backend.private_access import enforce_private_access

logger = get_logger(__name__)

# Uvicorn's own startup lines go to stderr, which Railway shows as level "error". The app is
# imported before uvicorn logs "Started server process", so pointing its handler at stdout here
# covers every uvicorn line.
for _handler in logging.getLogger("uvicorn").handlers:
    if isinstance(_handler, logging.StreamHandler) and _handler.stream is sys.stderr:
        _handler.setStream(sys.stdout)

# Initialize rate limiter
# limiter definition moved to backend/limiter.py to avoid circular imports

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: logging first, then database, dev user seed, Pulse scheduler.
    setup_logging(
        log_level="DEBUG" if settings.DEBUG else "INFO",
        use_json=settings.ENVIRONMENT == "production"
    )
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    create_db_and_tables()
    if not settings.is_production():
        seed_dev_user()
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()

app = FastAPI(
    lifespan=lifespan,
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
Continuum SaaS API - A compassionate estate planning platform.

This API provides endpoints for:
* **Authentication**: WebAuthn/Passkey and JWT-based auth.
* **Estate Data**: Managing assets, documents, and digital memories.
* **Pulse**: Life-check-in system with multi-tier escalation.
* **Family Hub**: Managing contacts and relationships.
""",
    contact={
        "name": "Continuum Support",
        "url": "https://continuum.im/support",
        "email": "support@continuum.im",
    },
    license_info={
        "name": "Proprietary",
    },
    openapi_tags=[
        {"name": "auth", "description": "Authentication and user lifecycle (Passkeys, JWT, Signup)"},
        {"name": "pulse", "description": "Life-check-in system and guardian escalation"},
        {"name": "estate", "description": "Core estate planning data (Assets, Vault, Profile)"},
        {"name": "contacts", "description": "Family and relationship management"},
        {"name": "media", "description": "Backend file storage and management"},
        {"name": "email", "description": "Internal email service verification"},
    ],
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)
app.state.limiter = limiter

# Request ID Middleware for log correlation
class RequestIdMiddleware(BaseHTTPMiddleware):
    """
    Adds a unique request ID to each request for log correlation.
    The ID is stored in request.state.request_id and returned in X-Request-ID header.
    """
    async def dispatch(self, request: Request, call_next):
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Process request
        response = await call_next(request)

        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id

        return response

# Add request ID middleware (should be early in chain)
app.add_middleware(RequestIdMiddleware)

# Naive-UTC datetimes leave as UTC ("...Z") in every JSON response; see backend/utils/utc_json.py.
from backend.utils.utc_json import UtcJsonMiddleware
app.add_middleware(UtcJsonMiddleware)

# Security Headers Configuration
def _inline_script_sources():
    # SvelteKit's adapter-static writes one inline bootstrap <script> into dist/index.html and its
    # content (so its hash) changes every build. Hash whatever inline scripts the build on disk has,
    # so script-src can drop 'unsafe-inline'. With no build there is nothing to hash; keep 'unsafe-inline'.
    import base64, hashlib, re
    from pathlib import Path
    index_html = Path(__file__).resolve().parent.parent / "frontend" / "dist" / "index.html"
    if not index_html.is_file():
        return ["'unsafe-inline'"]
    html = index_html.read_text(encoding="utf-8")
    bodies = re.findall(r"<script\b(?![^>]*\bsrc\s*=)[^>]*>(.*?)</script>", html, re.DOTALL | re.IGNORECASE)
    return [
        "'sha256-" + base64.b64encode(hashlib.sha256(b.encode("utf-8")).digest()).decode() + "'"
        for b in bodies
    ]

def _connect_sources():
    # The app calls its own origin, so 'self' covers it. API_URL is added only when it is set and is a
    # different origin from the site (settings.ORIGIN, the site's public origin; the CSP is built at import,
    # so there is no request to compare against). Never '*'.
    from urllib.parse import urlparse
    def origin(u):
        p = urlparse((u or "").strip())
        return f"{p.scheme}://{p.netloc}".lower() if p.scheme and p.netloc else ""
    api = origin(settings.API_URL)
    return ["'self'"] + ([api] if api and api != origin(settings.ORIGIN) else [])

csp = (
    ContentSecurityPolicy()
    .default_src("'self'")
    # Cloudflare Web Analytics: Cloudflare injects its beacon script at the edge and it reports
    # back to cloudflareinsights.com. Exact hosts only.
    .script_src("'self'", *_inline_script_sources(), "https://static.cloudflareinsights.com")
    .style_src("'self'", "'unsafe-inline'", "https://fonts.googleapis.com")
    .font_src("'self'", "https://fonts.gstatic.com")
    # blob: so stored photos, recordings and videos (fetched with the auth header
    # by mediaService, then shown from an object URL) can display and play.
    .img_src("'self'", "data:", "https:", "blob:")
    .media_src("'self'", "blob:")
    # The export preview shows the generated PDF in an iframe from a blob: URL.
    .frame_src("'self'", "blob:")
    .connect_src(*_connect_sources(), "https://cloudflareinsights.com")
    .base_uri("'self'")
    .frame_ancestors("'none'")
    .object_src("'none'")
)

hsts = StrictTransportSecurity().max_age(31536000).include_subdomains()
referrer = ReferrerPolicy().no_referrer()

secure_headers = Secure(csp=csp, hsts=hsts, referrer=referrer)

app.include_router(auth_router.router)
app.include_router(admin_users.router)
app.include_router(email.router)
app.include_router(pulse.router)
app.include_router(contacts.router)
app.include_router(estate_data.router)
app.include_router(medical.router)
app.include_router(memories.router)
app.include_router(media.router)
app.include_router(support.router)
app.include_router(ai_proxy.router)
app.include_router(ai_settings.router)
app.include_router(export.router)
app.include_router(recipient.router)

def seed_dev_user():
    """Seed a default dev user for development/testing."""
    from backend.auth import get_password_hash
    try:
        logger.info("Checking for dev user...")
        with Session(engine) as session:
            # Check if dev user exists
            existing = session.exec(select(User).where(User.email == "dev@continuum.im")).first()
            if not existing:
                logger.info("Seeding default dev user (dev@continuum.im / password: dev123)")
                user = User(
                    external_id="dev-user-1",
                    email="dev@continuum.im",
                    hashed_password=get_password_hash("dev123")
                )
                session.add(user)
                session.commit()
                logger.info("Dev user created: dev@continuum.im / dev123")
            else:
                logger.info(f"Dev user already exists: id={existing.id}")
    except Exception:
        # Keep the server running, but log the full traceback so a seed failure is visible.
        logger.exception("Failed to seed dev user")

@app.middleware("http")
async def set_secure_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    secure_headers.set_headers(response)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Permissions-Policy"] = "camera=(self), microphone=(self), geolocation=(), payment=(), usb=()"
    return response

# Configure CORS (Reload Triggered)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins_list(),
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"] if settings.is_production()
                  else (settings.CORS_ALLOW_METHODS.split(",") if settings.CORS_ALLOW_METHODS != "*" else ["*"]),
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "User-Agent", "X-CSRF-Token"] if settings.is_production()
                  else (settings.CORS_ALLOW_HEADERS.split(",") if settings.CORS_ALLOW_HEADERS != "*" else ["*"]),
    expose_headers=["X-Request-ID", "X-CSRF-Token"],  # Allow frontend to read these headers
    max_age=3600,  # Cache preflight responses for 1 hour
)

# CSRF Protection Middleware (Double-Submit Cookie Pattern)
# In production, rejects requests without valid CSRF token
# In development, logs warning but allows (for easier testing)
app.add_middleware(CSRFMiddleware)
app.middleware("http")(enforce_private_access)

# HTTPS Enforcement for Production
if settings.is_production():
    @app.middleware("http")
    async def enforce_https(request: Request, call_next):
        """Redirect HTTP to HTTPS in production."""
        # Railway terminates TLS at its proxy, so the app sees plain http plus X-Forwarded-Proto.
        # The health check hits the container directly over http and must not be redirected.
        forwarded_proto = request.headers.get("x-forwarded-proto", request.url.scheme).split(",")[0].strip()
        if forwarded_proto != "https" and request.url.path != "/api/health":
            url = request.url.replace(scheme="https")
            return RedirectResponse(url, status_code=301)
        return await call_next(request)

# --- Global Exception Handlers ---
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import DataError

# The technical message stays in the logs. The browser receives it only on a local
# development run: ENVIRONMENT defaults to "development", and production on Railway
# leaves it unset, so a Railway run counts as deployed whatever ENVIRONMENT says (X227).
SEND_TECHNICAL_TO_BROWSER = settings.is_development() and not settings.RAILWAY_ENVIRONMENT


def _error_json(request: Request, error_response) -> dict:
    body = error_response.to_dict()
    technical = body.get("_technical") or error_response.message
    logger.info(f"{request.method} {request.url.path} -> {error_response.status_code}: {technical}")
    if not SEND_TECHNICAL_TO_BROWSER:
        body.pop("_technical", None)
    return body


@app.exception_handler(ContinuumException)
async def continuum_exception_handler(request: Request, exc: ContinuumException):
    """Handle all ContinuumException errors with consistent formatting."""
    error_response = exc.to_error_response()
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_json(request, error_response)
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle FastAPI and Starlette HTTPException errors (including routing 404/405)."""
    error_response = handle_exception(exc, context=f"{request.method} {request.url.path}")
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_json(request, error_response),
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Request validation (422) in the standard shape; field names only, never the sent values."""
    fields = [{"field": " · ".join(str(part) for part in e.get("loc", ())[1:]), "message": e.get("msg", "")}
              for e in exc.errors()]
    error_response = ErrorResponse(
        message=f"Validation failed: {fields}",
        user_message="A detail here needs a second look before it saves.",
        status_code=422,
        error_code="VALIDATION_ERROR",
        details={"fields": fields},
    )
    return JSONResponse(status_code=422, content=_error_json(request, error_response))


@app.exception_handler(RateLimitExceeded)
async def rate_limit_exception_handler(request: Request, exc: RateLimitExceeded):
    """429 in the standard shape, with slowapi's Retry-After / X-RateLimit headers."""
    error_response = ErrorResponse(
        message=f"Rate limit exceeded: {exc.detail}",
        user_message="Let's pause for a minute, then try again whenever you're ready.",
        status_code=429,
        error_code="RATE_LIMITED",
    )
    response = JSONResponse(status_code=429, content=_error_json(request, error_response))
    return request.app.state.limiter._inject_headers(response, request.state.view_rate_limit)


@app.exception_handler(OverflowError)
@app.exception_handler(DataError)
async def out_of_range_exception_handler(request: Request, exc: Exception):
    """A number too large for the database column (SQLite OverflowError, PostgreSQL DataError) is a 422."""
    error_response = ErrorResponse(
        message=f"Value out of range: {exc}",
        user_message="A smaller number will fit here.",
        status_code=422,
        error_code="VALUE_OUT_OF_RANGE",
    )
    return JSONResponse(status_code=422, content=_error_json(request, error_response))


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catch-all handler for unexpected errors."""
    error_response = handle_exception(exc, context=f"{request.method} {request.url.path}")
    return JSONResponse(
        status_code=error_response.status_code,
        content=_error_json(request, error_response)
    )

# --- Models ---

# --- Pydantic Validation Models (P1-High Security) ---
from typing import Any, Dict
from pydantic import field_validator

MAX_ESTATE_DATA_SIZE = 100000  # 100KB max for estate data


class EstateProfilePayload(BaseModel):
    """Validated model for estate profile data."""
    data: Dict[str, Any]

    @field_validator("data")
    @classmethod
    def validate_data(cls, v):
        # Check size
        json_str = json.dumps(v)
        if len(json_str) > MAX_ESTATE_DATA_SIZE:
            raise ValueError(f"Profile data exceeds maximum size ({MAX_ESTATE_DATA_SIZE} bytes)")
        return v

# --- Endpoints ---

@app.get("/api/csrf-token", summary="Get a CSRF token", tags=["auth"])
async def csrf_token(request: Request):
    """
    Get a CSRF token for frontend use.
    The token is also set as a cookie automatically by the CSRF middleware.
    Frontend should include this token in X-CSRF-Token header for state-changing requests.
    """
    return get_csrf_token_endpoint(request)


@app.api_route("/api/health", methods=["GET", "HEAD"], summary="Perform a deep health check", tags=["monitoring"])
async def health_check(session: Session = Depends(get_session)):
    """
    Perform a robust health check that verifies:
    1. Database connectivity
    2. Storage write permissions
    3. Scheduler status
    """
    health = {
        "status": "healthy",
        "database": False,
        "storage": False,
        "scheduler": False,
        "environment": settings.ENVIRONMENT,
        "version": settings.APP_VERSION
    }

    # 1. Verify Database
    try:
        from sqlmodel import text
        session.exec(text("SELECT 1"))
        health["database"] = True
    except Exception as e:
        logger.error(f"Health check failure: Database connection failed: {e}")
        health["status"] = "unhealthy"

    # 2. Verify Storage
    try:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        test_file = os.path.join(settings.UPLOAD_DIR, ".health_check")
        with open(test_file, "w") as f:
            f.write("ok")
        os.remove(test_file)
        health["storage"] = True
    except Exception as e:
        logger.error(f"Health check failure: Storage is not writable: {e}")
        health["status"] = "unhealthy"

    # 3. Verify Scheduler
    try:
        from backend.pulse_scheduler import scheduler
        if not settings.PULSE_SCHEDULER_ENABLED:
            health["scheduler"] = "disabled"  # deliberately off: healthy
        else:
            health["scheduler"] = scheduler.running  # reported only; never fails the Railway healthcheck
    except Exception as e:
        logger.error(f"Health check failure: Scheduler status unknown: {e}")
        health["status"] = "unhealthy"

    if health["status"] != "healthy":
        return JSONResponse(status_code=503, content=health)
    
    return health

@app.get("/api/estate")
def get_estate(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    estate = estate_for_write(session, user.id)
    session.commit()
    session.refresh(estate)
    return estate

@app.get("/api/estate/profile")
def get_estate_profile(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    estate = session.exec(select(Estate).where(Estate.user_id == user.id)).first()
    if not estate:
        return {}
    return profile_of(estate)

@app.get("/api/estate/recovery")
def get_estate_recovery(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Preserved original profiles and source-linked alternatives for this owner only."""
    return recovery_summary(session, user.id)

@app.post("/api/estate/profile")
def save_estate_profile(body: Dict[str, Any] = Body(...), user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Shallow-merge the posted keys into the stored profile. Accepts a raw object or {data: {...}}.
    A key posted as null is removed from the profile."""
    updates = body["data"] if set(body) == {"data"} and isinstance(body["data"], dict) else body
    try:
        updates = EstateProfilePayload(data=updates).data  # size validation
    except ValueError:
        raise HTTPException(status_code=413, detail="A shorter profile will fit here.")
    return merge_profile(session, user.id, updates)


# --- SPA Static File Serving ---
# Mount the frontend/dist directory (ensure this exists after build)
# We mount this at the root, but after all /api routes are defined
# This handles CSS, JS, and image assets
# Each mount is skipped when its directory is missing, so the API can run without a frontend build.
# Resolved from this file, not the working directory, so the server finds the build from any cwd.
from pathlib import Path
DIST_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if (DIST_DIR / "_app").is_dir():
    app.mount("/_app", StaticFiles(directory=DIST_DIR / "_app"), name="_app")
if (DIST_DIR / "images").is_dir():
    app.mount("/images", StaticFiles(directory=DIST_DIR / "images"), name="images")


def _spa_index():
    # Without a frontend build there is no index.html; answer 404 instead of a 500 traceback.
    index_path = DIST_DIR / "index.html"
    if not index_path.is_file():
        raise HTTPException(status_code=404, detail="Frontend build not found")
    return FileResponse(index_path)

# Handle root specifically to avoid 404s
# GET and HEAD both, so `curl -I` and uptime probes get 200 instead of 405.
@app.api_route("/", methods=["GET", "HEAD"])
async def serve_root(request: Request):
    # The home page lives at /marketing2; a permanent redirect keeps old links and search results.
    return RedirectResponse(f"/marketing2{'?' + request.url.query if request.url.query else ''}", status_code=301)

# Catch-all route to serve index.html for client-side routing
@app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
async def serve_spa(full_path: str):
    logger.debug(f"Catch-all route hit for path: '{full_path}'")

    # If the path starts with api, it should have been caught by the routes above.
    # If we are here, it means the API route doesn't exist.
    if full_path == "api" or full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="That address may have moved.")

    # P1-High: Path traversal protection
    # Define the base directory for static files
    base_dir = os.path.realpath(DIST_DIR)

    # Check if the file exists in dist (e.g. /favicon.ico, /robots.txt)
    # Ensure full_path does not start with / to work with os.path.join correctly
    clean_path = full_path.lstrip("/")

    # Block any path containing traversal sequences before joining
    if ".." in clean_path:
        logger.warning(f"Blocked potential path traversal attempt: '{full_path}'")
        return _spa_index()

    # Construct the file path
    file_path = os.path.join(base_dir, clean_path)

    # Resolve to absolute path and verify it's within allowed directory
    resolved_path = os.path.realpath(file_path)
    # Compare whole path components so a sibling like "dist-other" cannot pass a plain prefix test.
    if os.path.commonpath([resolved_path, base_dir]) != base_dir:
        logger.warning(f"Blocked path traversal attempt: '{full_path}' resolved to '{resolved_path}'")
        raise HTTPException(status_code=403, detail="That page is kept private.")

    if os.path.isfile(resolved_path):
        return FileResponse(resolved_path)

    # Otherwise, serve the index.html for the frontend to handle routing
    logger.debug(f"Falling back to index.html for path: '{full_path}'")
    return _spa_index()

if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.is_development(),
        reload_dirs=[os.path.dirname(os.path.abspath(__file__))],  # backend/ only, not frontend/node_modules
    )
