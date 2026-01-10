from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
