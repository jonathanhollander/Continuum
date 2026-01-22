from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
import uvicorn
import json
import os
import uuid
from typing import List, Optional
from pydantic import BaseModel
from sqlmodel import Session
from backend.config import settings
from backend.database import engine, create_db_and_tables, get_session, User, Estate
from backend.security import get_registration_options, verify_registration, get_authentication_options, verify_authentication
from backend.auth import create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
from backend.pulse_scheduler import start_scheduler, stop_scheduler
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select
from datetime import timedelta
from backend.routers import pulse, contacts, estate_data, insurance, medical, pets, memories, auth as auth_router, media, email, heirlooms, support

from backend.errors import ContinuumException, handle_exception
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from backend.limiter import limiter
from secure import Secure, ContentSecurityPolicy, StrictTransportSecurity, ReferrerPolicy
from backend.utils.logger import get_logger, setup_logging

logger = get_logger(__name__)

# Initialize rate limiter
# limiter definition moved to backend/limiter.py to avoid circular imports

app = FastAPI(
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
    docs_url="/docs" if settings.DEBUG else "/api/docs",
    redoc_url="/redoc" if settings.DEBUG else "/api/redoc",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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

# Security Headers Configuration
csp = (
    ContentSecurityPolicy()
    .default_src("'self'")
    .script_src("'self'", "'unsafe-inline'")
    .style_src("'self'", "'unsafe-inline'")
    .img_src("'self'", "data:", "https:")
    .connect_src("'self'", settings.API_URL or "*")
)

hsts = StrictTransportSecurity().max_age(31536000).include_subdomains()
referrer = ReferrerPolicy().no_referrer()

secure_headers = Secure(csp=csp, hsts=hsts, referrer=referrer)

app.include_router(auth_router.router)
app.include_router(email.router)
app.include_router(pulse.router)
app.include_router(contacts.router)
app.include_router(estate_data.router)
app.include_router(insurance.router)
app.include_router(medical.router)
app.include_router(pets.router)
app.include_router(memories.router)
app.include_router(media.router)
app.include_router(heirlooms.router)
app.include_router(support.router)

# Initialize database on startup
@app.on_event("startup")
def on_startup():
    # Setup logging first
    setup_logging(
        log_level="DEBUG" if settings.DEBUG else "INFO",
        use_json=settings.ENVIRONMENT == "production"
    )
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    create_db_and_tables()
    seed_dev_user()
    start_scheduler()

def seed_dev_user():
    """Seed a default dev user for development/testing."""
    from backend.auth import get_password_hash
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

@app.on_event("shutdown")
def on_shutdown():
    stop_scheduler()

@app.middleware("http")
async def set_secure_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    secure_headers.set_headers(response)
    return response

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins_list(),
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"] if settings.is_production()
                  else (settings.CORS_ALLOW_METHODS.split(",") if settings.CORS_ALLOW_METHODS != "*" else ["*"]),
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "User-Agent"] if settings.is_production()
                  else (settings.CORS_ALLOW_HEADERS.split(",") if settings.CORS_ALLOW_HEADERS != "*" else ["*"]),
    max_age=3600,  # Cache preflight responses for 1 hour
)

# HTTPS Enforcement for Production
if settings.is_production():
    @app.middleware("http")
    async def enforce_https(request: Request, call_next):
        """Redirect HTTP to HTTPS in production."""
        if request.url.scheme != "https":
            url = request.url.replace(scheme="https")
            return RedirectResponse(url, status_code=301)
        return await call_next(request)

# --- Global Exception Handlers ---

@app.exception_handler(ContinuumException)
async def continuum_exception_handler(request: Request, exc: ContinuumException):
    """Handle all ContinuumException errors with consistent formatting."""
    error_response = exc.to_error_response()
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.to_dict()
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle FastAPI HTTPException errors."""
    error_response = handle_exception(exc, context=f"{request.method} {request.url.path}")
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.to_dict()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catch-all handler for unexpected errors."""
    error_response = handle_exception(exc, context=f"{request.method} {request.url.path}")
    return JSONResponse(
        status_code=error_response.status_code,
        content=error_response.to_dict()
    )

# --- Models ---
class ChallengeRequest(BaseModel):
    email: str

class RegistrationResponse(BaseModel):
    email: str
    response: dict

# --- Endpoints ---

@app.get("/api/health", summary="Perform a deep health check", tags=["monitoring"])
async def health_check(session: Session = Depends(get_session)):
    """
    Perform a robust health check that verifies:
    1. Database connectivity
    2. Storage write permissions
    3. Frontend availability (loopback)
    """
    import httpx
    health = {
        "status": "healthy",
        "database": False,
        "storage": False,
        "frontend_reachable": False,
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

    # 3. Verify Frontend Reachability
    try:
        async with httpx.AsyncClient() as client:
            # Check for 200 OK or 301/302 from the frontend
            response = await client.head(settings.FRONTEND_URL, timeout=2.0, follow_redirects=True)
            if response.status_code < 400:
                health["frontend_reachable"] = True
            else:
                logger.warning(f"Health check: Frontend returned status {response.status_code}")
    except Exception as e:
        logger.warning(f"Health check: Frontend loopback check failed: {e}")

    # 4. Verify Scheduler
    try:
        from backend.pulse_scheduler import scheduler
        health["scheduler"] = scheduler.running
    except Exception as e:
        logger.error(f"Health check failure: Scheduler status unknown: {e}")
        health["status"] = "unhealthy"

    if health["status"] != "healthy":
        return JSONResponse(status_code=503, content=health)
    
    return health

@app.post("/api/auth/register/challenge")
def register_challenge(request: ChallengeRequest):
    # WebAuthn challenge endpoint (legacy - kept for compatibility)
    user_id = "user-" + request.email
    options = get_registration_options(user_id, request.email)
    return options

@app.post("/api/auth/register/verify")
def register_verify(request: RegistrationResponse, session: Session = Depends(get_session)):
    # WebAuthn verification endpoint (legacy - kept for compatibility)
    return {"status": "success"}

@app.post("/api/auth/magic-link")
def send_magic_link(request: ChallengeRequest):
    # Magic link endpoint (future feature)
    logger.info(
        "Magic link requested (legacy endpoint)",
        extra={"context": {"email": request.email}}
    )
    return {"status": "sent", "email": request.email}

@app.get("/api/estate")
def get_estate(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    estate = session.exec(select(Estate).where(Estate.user_id == user.id)).first()
    if not estate:
        # Create empty estate for new user
        estate = Estate(user_id=user.id)
        session.add(estate)
        session.commit()
        session.refresh(estate)
    return estate

@app.post("/api/estate")
def save_estate(estate_data: dict, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    estate = session.exec(select(Estate).where(Estate.user_id == user.id)).first()
    if not estate:
        estate = Estate(user_id=user.id)
        session.add(estate)
    
    estate.transparent_data = estate_data.get("transparent_data", "{}")
    estate.encrypted_vault = estate_data.get("encrypted_vault", b"")
    session.commit()
    return {"status": "saved"}

@app.get("/api/estate/profile")
def get_estate_profile(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    estate = session.exec(select(Estate).where(Estate.user_id == user.id)).first()
    if not estate:
        return {}
    try:
        td = json.loads(estate.transparent_data or "{}")
        # Handle cases where td is the profile itself or contains estate_profile
        if "estate_profile" in td:
            return td["estate_profile"]
        return td
    except:
        return {}

@app.post("/api/estate/profile")
def save_estate_profile(profile: dict, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    estate = session.exec(select(Estate).where(Estate.user_id == user.id)).first()
    if not estate:
        estate = Estate(user_id=user.id)
        session.add(estate)
    
    try:
        td = json.loads(estate.transparent_data or "{}")
    except:
        td = {}
    
    td["estate_profile"] = profile
    estate.transparent_data = json.dumps(td)
    session.commit()
    return td["estate_profile"]


# --- SPA Static File Serving ---
# Mount the frontend/dist directory (ensure this exists after build)
# We mount this at the root, but after all /api routes are defined
# This handles CSS, JS, and image assets
app.mount("/_app", StaticFiles(directory="frontend/dist/_app"), name="_app")
app.mount("/images", StaticFiles(directory="frontend/dist/images"), name="images")

# Handle root specifically to avoid 404s
@app.get("/")
async def serve_root():
    return FileResponse("frontend/dist/index.html")

# Catch-all route to serve index.html for client-side routing
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    logger.debug(f"Catch-all route hit for path: '{full_path}'")

    # If the path starts with api, it should have been caught by the routes above.
    # If we are here, it means the API route doesn't exist.
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="API endpoint not found")

    # Check if the file exists in dist (e.g. /favicon.ico, /robots.txt)
    # Ensure full_path does not start with / to work with os.path.join correctly
    clean_path = full_path.lstrip("/")
    file_path = os.path.join("frontend", "dist", clean_path)

    if os.path.isfile(file_path):
        return FileResponse(file_path)

    # Otherwise, serve the index.html for the frontend to handle routing
    logger.debug(f"Falling back to index.html for path: '{full_path}'")
    return FileResponse("frontend/dist/index.html")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.is_development()
    )
