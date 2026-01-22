from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr
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
import secrets

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# Simple in-memory challenge store (Use Redis in production)
PENDING_CHALLENGES = {}

# Request/Response Models
class SignupRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    email: str
    external_id: str

@router.post("/signup", response_model=TokenResponse)
def signup(request: SignupRequest, session: Session = Depends(get_session)):
    """Register a new user account."""
    # Check if user already exists
    existing_user = session.exec(select(User).where(User.email == request.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    hashed_password = get_password_hash(request.password)
    new_user = User(
        email=request.email,
        external_id=f"user-{request.email}",
        hashed_password=hashed_password
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    # Send welcome email
    from backend.services.email_service import email_service
    from backend.config import settings
    try:
        dashboard_url = f"{settings.get_frontend_url()}/dashboard"
        email_service.send_welcome_email(
            to_email=new_user.email,
            user_id=new_user.id,
            dashboard_url=dashboard_url,
            db_session=session
        )
    except Exception as e:
        print(f"⚠️ Failed to send welcome email: {e}")
        # Don't fail signup if email fails

    # Generate JWT token
    access_token = create_access_token(
        data={"sub": str(new_user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/token", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    """Login and receive JWT token."""
    # Find user by email (username field in OAuth2 form)
    user = session.exec(select(User).where(User.email == form_data.username)).first()

    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate JWT token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information."""
    return current_user

# WebAuthn/Passkey Authentication

@router.post("/passkey/register/start")
def passkey_register_start(request: SignupRequest, session: Session = Depends(get_session)):
    """
    Start passkey registration flow (Step 1 of 2).
    Creates user account and initiates WebAuthn registration.
    """
    # Check if user already exists
    existing_user = session.exec(select(User).where(User.email == request.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user (without password)
    new_user = User(
        email=request.email,
        external_id=f"user-{request.email}",
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
        "options": options.to_dict()
    }

@router.post("/passkey/register/finish", response_model=TokenResponse)
def passkey_register_finish(payload: dict, session: Session = Depends(get_session)):
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

        # Check if credential already exists
        existing = session.get(PulseCredential, str(cred_id))
        if existing:
            session.delete(existing)
            session.commit()

        new_cred = PulseCredential(
            id=str(cred_id),
            user_id=user_id,
            public_key=str(verification.credential_public_key),
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
        print(f"WebAuthn Registration Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/passkey/login/start")
def passkey_login_start():
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
        "options": options.to_dict()
    }

@router.post("/passkey/login/finish", response_model=TokenResponse)
def passkey_login_finish(payload: dict, session: Session = Depends(get_session)):
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
        print(f"WebAuthn Authentication Error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

class MagicLinkRequest(BaseModel):
    email: EmailStr

@router.post("/magic-link")
def send_magic_link(request: MagicLinkRequest, session: Session = Depends(get_session)):
    """
    Send magic link for passwordless login.
    Fallback for users without passkey support.
    """
    user = session.exec(select(User).where(User.email == request.email)).first()

    if not user:
        # Don't reveal if user exists or not (timing-safe response)
        return {"status": "sent", "message": "If this email is registered, you will receive a magic link"}

    # Generate magic link JWT token with short expiration
    access_token = create_access_token(
        data={"sub": str(user.id), "type": "magic_link"},
        expires_delta=timedelta(minutes=15)  # 15 minute expiration
    )

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
        print(f"✅ Magic link sent to {user.email}")
    except Exception as e:
        print(f"❌ Failed to send magic link email: {e}")
        # Still return success to prevent email enumeration

    # Return success (don't leak if email exists)
    return {
        "status": "sent",
        "message": "If this email is registered, you will receive a magic link"
    }

@router.get("/magic-link/verify")
def verify_magic_link(token: str, session: Session = Depends(get_session)):
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
            raise HTTPException(status_code=401, detail="Invalid token type")

        user = session.get(User, int(user_id))
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        # Generate new long-lived JWT token
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        return {"access_token": access_token, "token_type": "bearer"}

    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
