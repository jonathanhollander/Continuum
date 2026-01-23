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
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_refresh_token,
    verify_refresh_token,
    revoke_refresh_token,
    revoke_all_user_tokens,
    rotate_refresh_token
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
from backend.challenge_store import challenge_store
import secrets
import base64
import json
from webauthn import options_to_json

logger = get_logger(__name__)

router = APIRouter(prefix="/api/auth", tags=["authentication"])

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
    refresh_token: Optional[str] = None
    token_type: str
    expires_in: int = ACCESS_TOKEN_EXPIRE_MINUTES * 60  # seconds
    warnings: List[WarningMessage] = []


class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: int
    email: str
    external_id: str
    user_role: Optional[str] = "planning"
    emotional_context: Optional[str] = None
    overwhelm_muted: bool = False
    deceased_name: Optional[str] = None
    onboarding_step: Optional[str] = None
    onboarding_completed: bool = False
    language: Optional[str] = "en"
    font_size: Optional[str] = "normal"


# --- WebAuthn Pydantic Validation Models (P1-High Security) ---
from typing import Any, Dict
from pydantic import field_validator


class PasskeyRegisterFinishPayload(BaseModel):
    """Validated model for completing passkey registration."""
    user_id: int
    credential: Dict[str, Any]

    @field_validator("credential")
    @classmethod
    def validate_credential(cls, v):
        """Validate WebAuthn credential response structure."""
        required_fields = ["id", "rawId", "response", "type"]
        missing = [f for f in required_fields if f not in v]
        if missing:
            raise ValueError(f"Missing required credential fields: {missing}")
        if v.get("type") != "public-key":
            raise ValueError("Invalid credential type - must be 'public-key'")
        return v


class PasskeyLoginFinishPayload(BaseModel):
    """Validated model for completing passkey login."""
    challenge_id: str
    credential: Dict[str, Any]

    @field_validator("challenge_id")
    @classmethod
    def validate_challenge_id(cls, v):
        if not v or len(v) < 10:
            raise ValueError("Invalid challenge_id")
        return v

    @field_validator("credential")
    @classmethod
    def validate_credential(cls, v):
        """Validate WebAuthn assertion response structure."""
        required_fields = ["id", "rawId", "response", "type"]
        missing = [f for f in required_fields if f not in v]
        if missing:
            raise ValueError(f"Missing required credential fields: {missing}")
        if v.get("type") != "public-key":
            raise ValueError("Invalid credential type - must be 'public-key'")
        return v


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

    # Generate JWT tokens
    access_token = create_access_token(
        data={"sub": str(new_user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(new_user.id, session)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
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
                hashed_password="BYPASS_AUTH",
                public_key=""
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

    # Generate JWT tokens
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(user.id, session)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

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

    # Store challenge temporarily (uses Redis in production, in-memory in development)
    challenge_store.set(str(new_user.id), {
        "challenge": options.challenge,
        "type": "registration"
    }, expire_seconds=300)

    return {
        "user_id": new_user.id,
        "options": json.loads(options_to_json(options))
    }

@router.post("/passkey/register/finish", response_model=TokenResponse)
@limiter.limit("10/minute")
def passkey_register_finish(request: Request, payload: PasskeyRegisterFinishPayload, session: Session = Depends(get_session)):
    """
    Complete passkey registration (Step 2 of 2).
    Verifies WebAuthn credential and returns JWT token.
    Uses Pydantic validation for payload security (P1-High).
    """
    # Validated by Pydantic model
    user_id = payload.user_id
    credential_response = payload.credential

    challenge_data = challenge_store.pop(str(user_id))
    if not challenge_data or challenge_data.get("type") != "registration":
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

        # Generate JWT tokens
        access_token = create_access_token(
            data={"sub": str(user_id)},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        refresh_token = create_refresh_token(user_id, session)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }

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

    # Generate a temporary challenge ID and store (uses Redis in production)
    challenge_id = secrets.token_urlsafe(32)
    challenge_store.set(challenge_id, {
        "challenge": options.challenge,
        "type": "authentication"
    }, expire_seconds=300)

    return {
        "challenge_id": challenge_id,
        "options": json.loads(options_to_json(options))
    }

@router.post("/passkey/login/finish", response_model=TokenResponse)
@limiter.limit("10/minute")
def passkey_login_finish(request: Request, payload: PasskeyLoginFinishPayload, session: Session = Depends(get_session)):
    """
    Complete passkey login (Step 2 of 2).
    Verifies WebAuthn assertion and returns JWT token.
    Uses Pydantic validation for payload security (P1-High).
    """
    # Validated by Pydantic model
    challenge_id = payload.challenge_id
    credential_response = payload.credential

    challenge_data = challenge_store.pop(challenge_id)
    if not challenge_data or challenge_data.get("type") != "authentication":
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

        # Generate JWT tokens
        access_token = create_access_token(
            data={"sub": str(credential.user_id)},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        refresh_token = create_refresh_token(credential.user_id, session)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }

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

        # Generate JWT tokens
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        refresh_token = create_refresh_token(user.id, session)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }

    except jwt.PyJWTError:
        log_auth_failure(session, request, "", "magic_link_verify", "Invalid or expired token")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# --- Refresh Token Endpoints ---

@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token", description="Exchange a valid refresh token for a new access token and refresh token.")
@limiter.limit("30/minute")
def refresh_access_token(request: Request, token_request: RefreshTokenRequest, session: Session = Depends(get_session)):
    """
    Refresh access token using a refresh token.
    Implements token rotation (old refresh token is revoked, new one is issued).
    """
    result = rotate_refresh_token(token_request.refresh_token, session)

    if not result:
        log_auth_failure(session, request, "", "refresh", "Invalid or expired refresh token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    new_refresh_token, user = result

    # Generate new access token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    logger.info(f"Token refreshed for user {user.id}")

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.post("/logout", summary="Logout (revoke refresh token)", description="Revoke the current refresh token to logout from this device.")
@limiter.limit("10/minute")
def logout(request: Request, token_request: RefreshTokenRequest, session: Session = Depends(get_session)):
    """
    Logout by revoking the provided refresh token.
    This only affects the current device/session.
    """
    if revoke_refresh_token(token_request.refresh_token, session):
        return {"status": "success", "message": "Logged out successfully"}
    else:
        # Don't reveal if token was already revoked or invalid
        return {"status": "success", "message": "Logged out successfully"}


@router.post("/logout-all", summary="Logout from all devices", description="Revoke all refresh tokens for the current user, logging out from all devices.")
@limiter.limit("5/minute")
def logout_all(request: Request, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Logout from all devices by revoking all refresh tokens.
    Requires valid access token authentication.
    """
    count = revoke_all_user_tokens(user.id, session)
    return {"status": "success", "message": f"Logged out from all devices ({count} sessions revoked)"}


@router.patch("/preferences", response_model=UserResponse)
def update_preferences(
    prefs: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update user preferences."""
    if "overwhelm_muted" in prefs:
        current_user.overwhelm_muted = prefs["overwhelm_muted"]

    if "user_role" in prefs:
        current_user.user_role = prefs["user_role"]

    if "emotional_context" in prefs:
        current_user.emotional_context = prefs["emotional_context"]

    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user


# --- Onboarding Endpoint ---

class OnboardingRequest(BaseModel):
    """Request model for updating onboarding data."""
    user_role: Optional[str] = None
    emotional_context: Optional[str] = None
    deceased_name: Optional[str] = None
    onboarding_step: Optional[str] = None
    onboarding_completed: Optional[bool] = None
    language: Optional[str] = None
    font_size: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "user_role": "planning",
                "emotional_context": "healthy",
                "onboarding_step": "ready",
                "onboarding_completed": True
            }
        }
    }


class OnboardingResponse(BaseModel):
    """Response model for onboarding data."""
    id: int
    email: str
    user_role: Optional[str] = None
    emotional_context: Optional[str] = None
    deceased_name: Optional[str] = None
    onboarding_step: Optional[str] = None
    onboarding_completed: bool = False
    language: Optional[str] = None
    font_size: Optional[str] = None


@router.patch("/onboarding", response_model=OnboardingResponse, summary="Update onboarding data", description="Update user's onboarding progress and preferences collected during the onboarding flow.")
def update_onboarding(
    onboarding_data: OnboardingRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Update onboarding data for the current user.
    This endpoint is called during the onboarding flow to persist:
    - User role (planning, executor, family, advisor)
    - Emotional context (healthy, preparing, grieving)
    - Deceased person's name (for executor/family modes)
    - Onboarding step progress
    - Language and accessibility preferences
    """
    updated_fields = []

    if onboarding_data.user_role is not None:
        current_user.user_role = onboarding_data.user_role
        updated_fields.append("user_role")

    if onboarding_data.emotional_context is not None:
        current_user.emotional_context = onboarding_data.emotional_context
        updated_fields.append("emotional_context")

    if onboarding_data.deceased_name is not None:
        current_user.deceased_name = onboarding_data.deceased_name
        updated_fields.append("deceased_name")

    if onboarding_data.onboarding_step is not None:
        current_user.onboarding_step = onboarding_data.onboarding_step
        updated_fields.append("onboarding_step")

    if onboarding_data.onboarding_completed is not None:
        current_user.onboarding_completed = onboarding_data.onboarding_completed
        updated_fields.append("onboarding_completed")

    if onboarding_data.language is not None:
        current_user.language = onboarding_data.language
        updated_fields.append("language")

    if onboarding_data.font_size is not None:
        current_user.font_size = onboarding_data.font_size
        updated_fields.append("font_size")

    if updated_fields:
        session.add(current_user)
        session.commit()
        session.refresh(current_user)
        logger.info(
            "Onboarding data updated",
            extra={"context": {
                "user_id": current_user.id,
                "updated_fields": updated_fields,
                "onboarding_step": current_user.onboarding_step,
                "onboarding_completed": getattr(current_user, 'onboarding_completed', False)
            }}
        )

    return OnboardingResponse(
        id=current_user.id,
        email=current_user.email,
        user_role=current_user.user_role,
        emotional_context=current_user.emotional_context,
        deceased_name=getattr(current_user, 'deceased_name', None),
        onboarding_step=getattr(current_user, 'onboarding_step', None),
        onboarding_completed=getattr(current_user, 'onboarding_completed', False),
        language=getattr(current_user, 'language', None),
        font_size=getattr(current_user, 'font_size', None)
    )


@router.get("/onboarding", response_model=OnboardingResponse, summary="Get onboarding status", description="Retrieve the current user's onboarding progress and data.")
def get_onboarding(
    current_user: User = Depends(get_current_user)
):
    """Get current onboarding status and data."""
    return OnboardingResponse(
        id=current_user.id,
        email=current_user.email,
        user_role=current_user.user_role,
        emotional_context=current_user.emotional_context,
        deceased_name=getattr(current_user, 'deceased_name', None),
        onboarding_step=getattr(current_user, 'onboarding_step', None),
        onboarding_completed=getattr(current_user, 'onboarding_completed', False),
        language=getattr(current_user, 'language', None),
        font_size=getattr(current_user, 'font_size', None)
    )
