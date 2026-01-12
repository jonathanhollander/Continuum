from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os
from typing import List, Optional
from pydantic import BaseModel
from sqlmodel import Session
from backend.database import engine, create_db_and_tables, get_session, User, Estate
from backend.security import get_registration_options, verify_registration, get_authentication_options, verify_authentication

app = FastAPI(title="Continuum SaaS API", version="4.0.0")

# Initialize database on startup
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Configure CORS
origins = [
    "http://localhost:5173",
    os.getenv("FRONTEND_URL", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    # In a real app, generate a unique ID for the user
    user_id = "user-" + request.email 
    options = get_registration_options(user_id, request.email)
    # Store options in session or temp DB
    return options

@app.post("/api/auth/register/verify")
def register_verify(request: RegistrationResponse, session: Session = Depends(get_session)):
    # Verification logic would go here
    # After verification, save user to DB
    return {"status": "success"}

@app.post("/api/auth/magic-link")
def send_magic_link(request: ChallengeRequest):
    # In a real app, send a secure signed token via email provider (Postmark/SendGrid)
    print(f"📧 Sending Magic Link to {request.email}...")
    return {"status": "sent", "email": request.email}

@app.get("/api/estate")
def get_estate(user_id: int, session: Session = Depends(get_session)):
    # In real SaaS, get user_id from JWT token
    estate = session.query(Estate).filter(Estate.user_id == user_id).first()
    if not estate:
        raise HTTPException(status_code=404, detail="Estate not found")
    return estate

@app.post("/api/estate")
def save_estate(estate_data: dict, user_id: int, session: Session = Depends(get_session)):
    # In real SaaS, get user_id from JWT token
    estate = session.query(Estate).filter(Estate.user_id == user_id).first()
    if not estate:
        estate = Estate(user_id=user_id)
        session.add(estate)
    
    estate.transparent_data = estate_data.get("transparent_data", "{}")
    estate.encrypted_vault = estate_data.get("encrypted_vault", b"")
    session.commit()
    return {"status": "saved"}


# --- SPA Static File Serving ---
# Mount the frontend/dist directory (ensure this exists after build)
# We mount this at the root, but after all /api routes are defined
# This handles CSS, JS, and image assets
app.mount("/_app", StaticFiles(directory="frontend/dist/_app"), name="_app")
app.mount("/images", StaticFiles(directory="frontend/dist/images"), name="images")

# Catch-all route to serve index.html for client-side routing
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # If the path starts with api, it should have been caught by the routes above.
    # If we are here, it means the API route doesn't exist.
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    
    # Check if the file exists in dist (e.g. /favicon.ico, /robots.txt)
    file_path = os.path.join("frontend", "dist", full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Otherwise, serve the index.html for the frontend to handle routing
    return FileResponse("frontend/dist/index.html")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
