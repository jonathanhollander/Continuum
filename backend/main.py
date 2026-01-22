from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import json
import os
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
from backend.routers import pulse, contacts, estate_data, insurance, medical, pets, memories, auth as auth_router, media

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

app.include_router(auth_router.router)
app.include_router(pulse.router)
app.include_router(contacts.router)
app.include_router(estate_data.router)
app.include_router(insurance.router)
app.include_router(medical.router)
app.include_router(pets.router)
app.include_router(memories.router)
app.include_router(media.router)

# Initialize database on startup
@app.on_event("startup")
def on_startup():
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
            print("🌱 Seeding default dev user (dev@continuum.im / password: dev123)...")
            user = User(
                external_id="dev-user-1",
                email="dev@continuum.im",
                hashed_password=get_password_hash("dev123")
            )
            session.add(user)
            session.commit()
            print("✅ Dev user created: dev@continuum.im / dev123")

@app.on_event("shutdown")
def on_shutdown():
    stop_scheduler()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins_list(),
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS.split(",") if settings.CORS_ALLOW_METHODS != "*" else ["*"],
    allow_headers=settings.CORS_ALLOW_HEADERS.split(",") if settings.CORS_ALLOW_HEADERS != "*" else ["*"],
)

# --- Models ---
class ChallengeRequest(BaseModel):
    email: str

class RegistrationResponse(BaseModel):
    email: str
    response: dict

# --- Endpoints ---

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "continuum-saas"}

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
    print(f"📧 Sending Magic Link to {request.email}...")
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
    print(f"DEBUG: Catch-all route hit for path: '{full_path}'")

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
    print(f"DEBUG: Falling back to index.html for path: '{full_path}'")
    return FileResponse("frontend/dist/index.html")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.is_development()
    )
