from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from backend.limiter import limiter
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import timedelta
from backend.database import User, get_session
from backend.config import settings
from backend.private_access import private_mode, user_allowed, require_allowed_user, require_signup_enabled, signup_enabled
from backend.auth import (
    create_access_token,
    get_password_hash,
    verify_password,
    get_current_user,
    optional_current_user,
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
import hashlib
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
    registration_id: Optional[str] = Field(default=None, min_length=32, max_length=128)

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

VALID_USER_ROLES = ("planning", "executor", "family", "advisor")


def _check_user_role(role: Any) -> str:
    """Accept only the four roles the app reads (X125); 422 otherwise."""
    if role not in VALID_USER_ROLES:
        raise HTTPException(
            status_code=422,
            detail="Choose one of these roles: planning, executor, family or advisor.",
        )
    return role


class UserResponse(BaseModel):
    id: int
    email: str
    is_admin: bool = False
    external_id: str
    display_name: Optional[str] = None
    user_role: Optional[str] = "planning"
    emotional_context: Optional[str] = None
    overwhelm_muted: bool = False
    deceased_name: Optional[str] = None
    onboarding_step: Optional[str] = None
    onboarding_completed: bool = False
    language: Optional[str] = "en"
    font_size: Optional[str] = "normal"
    view_preferences: Optional[Dict[str, str]] = None


# --- WebAuthn Pydantic Validation Models (P1-High Security) ---
from typing import Any, Dict
from pydantic import field_validator


class PasskeyRegisterFinishPayload(BaseModel):
    """Validated model for completing passkey registration."""
    user_id: int
    registration_id: str = Field(min_length=32, max_length=128)
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


class PasskeyLoginStartPayload(BaseModel):
    """Optional payload for starting passkey login with email hint."""
    email: Optional[str] = None


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
    require_signup_enabled()
    # Check if user already exists
    existing_user = session.exec(select(User).where(User.email == signup_data.email)).first()
    if existing_user:
        log_auth_failure(session, request, signup_data.email, "signup", "Email already registered")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is already registered. Signing in will take you there."
        )

    # Create new user
    hashed_password = get_password_hash(signup_data.password)
    new_user = User(
        email=signup_data.email,
        external_id=f"user-{signup_data.email}",
        hashed_password=hashed_password
    )

    session.add(new_user)
    session.flush()  # assigns new_user.id for the audit row

    # Log successful signup: the user and its audit entry in one commit (X289)
    log_auth_success(session, request, new_user.id, new_user.email, "signup", commit=False)
    session.commit()
    session.refresh(new_user)

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
        # EmailResult is a model, not a dict (result.get raised, so every signup reported a failed email)
        if result.status == "saved_local":
            warnings.append(WarningMessage(
                code="EMAIL_LOCAL_ONLY",
                message="Your account is ready! The welcome email was saved to backend/outbox/ (development mode).",
                severity="info"
            ))
        elif result.status == "failed":
            raise RuntimeError(result.error or "Welcome email not sent")
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
            message="Your account is ready, and signing in works now. We're here if you'd like help.",
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

    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        log_auth_failure(session, request, form_data.username, "password", "Invalid credentials")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Let's check the email and password together.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    require_allowed_user(user.id)

    # Log successful login; create_refresh_token's commit writes it (X289)
    log_auth_success(session, request, user.id, user.email, "password", commit=False)

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

@router.get("/access-status")
def access_status(response: Response, user: Optional[User] = Depends(optional_current_user)):
    response.headers["Cache-Control"] = "no-store"
    response.headers["Vary"] = "Authorization"
    return {"private_mode": private_mode(), "signup_enabled": signup_enabled(),
            "access_allowed": user_allowed(user.id if user else None)}


# WebAuthn/Passkey Authentication

def _registration_key(registration_id: str, challenge: bool = False) -> str:
    # The cache logs keys at debug level; keep the browser's opaque proof out of them.
    digest = hashlib.sha256(registration_id.encode()).hexdigest()
    return f"registration_{'challenge' if challenge else 'pending'}:{digest}"


def _pending_registration_user(
    session: Session, registration_id: str, *, email: Optional[str] = None, user_id: Optional[int] = None
) -> User:
    pending = challenge_store.get(_registration_key(registration_id))
    if not pending or (email is not None and pending.get("email") != email) or (user_id is not None and pending.get("user_id") != user_id):
        raise HTTPException(status_code=400, detail="That passkey step paused. Start it again whenever you're ready.")
    # Serialize completion/refresh for this pending account. An established account
    # always uses its existing sign-in path, even if an earlier attempt is still cached.
    user = session.exec(select(User).where(User.id == pending["user_id"]).with_for_update()).first()
    if not user or user.email != pending["email"] or user.hashed_password or user.public_key or session.exec(
        select(PulseCredential.id).where(PulseCredential.user_id == user.id).limit(1)
    ).first() is not None:
        raise HTTPException(status_code=400, detail="This email is already registered. Signing in will take you there.")
    return user


@router.post("/passkey/register/start", summary="Start Passkey registration", description="Initiates the WebAuthn registration process by creating a user and returning registration options/challenge.")
@limiter.limit("10/minute")
def passkey_register_start(request: Request, signup_data: PasskeySignupRequest, session: Session = Depends(get_session)):
    """
    Start passkey registration flow (Step 1 of 2).
    Creates user account and initiates WebAuthn registration.
    """
    require_signup_enabled()
    registration_id = signup_data.registration_id
    if registration_id:
        new_user = _pending_registration_user(session, registration_id, email=signup_data.email)
    else:
        existing_user = session.exec(select(User).where(User.email == signup_data.email)).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email is already registered. Signing in will take you there."
            )
        new_user = User(
            email=signup_data.email,
            external_id=f"user-{signup_data.email}",
            hashed_password=None,
            public_key=""
        )
        session.add(new_user)
        session.flush()
        registration_id = secrets.token_urlsafe(32)
        # Ownership outlives the five-minute WebAuthn challenge, without becoming a
        # sign-in token or permission to enroll an already established account.
        challenge_store.set(_registration_key(registration_id), {
            "user_id": new_user.id, "email": new_user.email
        }, expire_seconds=3600)

    # Generate WebAuthn registration options
    options = get_registration_options(str(new_user.id), new_user.email)

    # Every Retry gets a fresh, single-use challenge for this same pending attempt.
    challenge_store.set(_registration_key(registration_id, challenge=True), {
        "challenge": options.challenge,
        "type": "registration"
    }, expire_seconds=300)
    session.commit()

    return {
        "user_id": new_user.id,
        "registration_id": registration_id,
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
    require_signup_enabled()
    user_id = payload.user_id
    credential_response = payload.credential

    _pending_registration_user(session, payload.registration_id, user_id=user_id)
    challenge_data = challenge_store.pop(_registration_key(payload.registration_id, challenge=True))
    if not challenge_data or challenge_data.get("type") != "registration":
        raise HTTPException(status_code=400, detail="That passkey step paused. Start it again whenever you're ready.")

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

        # Extract AAGUID (identifies authenticator type: Google, Apple, etc.)
        aaguid_str = None
        if hasattr(verification, 'aaguid') and verification.aaguid:
            # AAGUID is 16 bytes, format as UUID string
            aaguid_bytes = verification.aaguid
            if isinstance(aaguid_bytes, bytes) and len(aaguid_bytes) == 16:
                aaguid_str = f"{aaguid_bytes[:4].hex()}-{aaguid_bytes[4:6].hex()}-{aaguid_bytes[6:8].hex()}-{aaguid_bytes[8:10].hex()}-{aaguid_bytes[10:].hex()}"
            logger.info(f"Passkey AAGUID: {aaguid_str}")

        # Extract transports from client response (e.g., ["internal", "hybrid"])
        transports_json = None
        if isinstance(credential_response, dict) and 'transports' in credential_response:
            transports_json = json.dumps(credential_response['transports'])
            logger.info(f"Passkey transports: {credential_response['transports']}")
        elif isinstance(credential_response, dict) and 'response' in credential_response:
            # Transports might be nested in response
            resp = credential_response.get('response', {})
            if 'transports' in resp:
                transports_json = json.dumps(resp['transports'])
                logger.info(f"Passkey transports (nested): {resp['transports']}")

        # Check if credential already exists
        existing = session.get(PulseCredential, cred_id_b64)
        if existing:
            raise HTTPException(status_code=400, detail="Let's try your passkey again, or sign in another way.")

        new_cred = PulseCredential(
            id=cred_id_b64,
            user_id=user_id,
            public_key=pub_key_b64,
            sign_count=verification.sign_count,
            aaguid=aaguid_str,
            transports=transports_json
        )
        session.add(new_cred)
        session.commit()
        challenge_store.delete(_registration_key(payload.registration_id))

        logger.info(f"Passkey registered for user {user_id}: aaguid={aaguid_str}, transports={transports_json}")

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
        session.rollback()
        logger.error(
            "WebAuthn registration verification failed",
            extra={"context": {
                "user_id": user_id,
                "error": str(e),
                "error_type": type(e).__name__
            }},
            exc_info=True
        )
        raise HTTPException(status_code=400, detail="Let's try your passkey again, or sign in another way.")

@router.post("/passkey/login/start", summary="Start Passkey login", description="Initiates the WebAuthn assertion process by returning an authentication challenge.")
@limiter.limit("10/minute")
def passkey_login_start(request: Request, payload: PasskeyLoginStartPayload = None, session: Session = Depends(get_session)):
    """
    Start passkey login flow (Step 1 of 2).
    Generates authentication challenge.

    If email is provided, looks up the user's credentials and restricts
    authentication to platform authenticators only (prevents QR code).
    """
    credentials = None
    if private_mode():
        owner = session.get(User, settings.PRIVATE_ACCESS_USER_ID)
        if owner is None or (payload and payload.email and payload.email != owner.email):
            require_allowed_user(None)
        credentials = [{"id": credential.id} for credential in session.exec(
            select(PulseCredential).where(PulseCredential.user_id == owner.id)).all()]

    # Debug: Log what we received
    logger.info(f"Passkey login start - payload: {payload}")
    if payload:
        logger.info(f"Passkey login start - email: {payload.email}")

    # If email provided, look up user's credentials to restrict to platform auth
    if payload and payload.email:
        # Find user by email
        user = session.exec(select(User).where(User.email == payload.email)).first()
        if user:
            # Get user's passkey credentials
            user_creds = session.exec(
                select(PulseCredential).where(PulseCredential.user_id == user.id)
            ).all()

            if user_creds:
                credentials = []
                for cred in user_creds:
                    cred_data = {"id": cred.id}
                    # Include stored transports if available
                    if cred.transports:
                        try:
                            cred_data["transports"] = json.loads(cred.transports)
                        except json.JSONDecodeError:
                            pass
                    credentials.append(cred_data)
                logger.info(f"Found {len(credentials)} credentials for user {payload.email}: {credentials}")
            else:
                logger.info(f"No credentials found for user {payload.email}")
        else:
            logger.info(f"User not found for email: {payload.email}")

    logger.info(f"Calling get_authentication_options with credentials: {credentials is not None}")
    options = get_authentication_options(credentials=credentials)

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

    if private_mode():
        candidate = session.get(PulseCredential, credential_response.get("id"))
        require_allowed_user(candidate.user_id if candidate else None)
    challenge_data = challenge_store.pop(challenge_id)
    if not challenge_data or challenge_data.get("type") != "authentication":
        raise HTTPException(status_code=400, detail="That passkey step paused. Start it again whenever you're ready.")

    try:
        # Get credential ID from response
        cred_id = credential_response.get("id")
        if not cred_id:
            raise HTTPException(status_code=400, detail="We need the passkey once more; try again.")

        # Find credential in database
        credential = session.get(PulseCredential, cred_id)
        if not credential:
            raise HTTPException(status_code=401, detail="Let's try your passkey again, or sign in another way.")

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

        passkey_user = session.get(User, credential.user_id)
        if not passkey_user:
            raise HTTPException(status_code=401, detail="Let's try that again together.")
        # create_refresh_token's commit writes the audit row (X289)
        log_auth_success(session, request, passkey_user.id, passkey_user.email, "passkey", commit=False)

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

    except HTTPException as e:
        # Keep the specific 400/401 raised above instead of folding it into the generic failure
        log_auth_failure(session, request, "", "passkey", str(e.detail))
        raise
    except Exception as e:
        session.rollback()
        log_auth_failure(session, request, "", "passkey", "Verification failed")
        logger.error(
            "WebAuthn authentication verification failed",
            extra={"context": {
                "credential_id": cred_id if 'cred_id' in locals() else "unknown",
                "error": str(e),
                "error_type": type(e).__name__
            }},
            exc_info=True
        )
        raise HTTPException(status_code=401, detail="Let's try that again together.")

class MagicLinkRequest(BaseModel):
    email: EmailStr
    redirect: Optional[str] = None


def _safe_redirect(value: Optional[str]) -> Optional[str]:
    """Keep only a same-site relative path (e.g. /modules/pets); anything else is dropped."""
    if not value or len(value) > 500 or not value.startswith("/") or value.startswith("//"):
        return None
    if "\\" in value or any(ord(c) < 32 for c in value) or "://" in value:
        return None
    return value

@router.post("/magic-link", summary="Request Magic Link", description="Requests a short-lived sign-in email. Existing passkeys remain available.")
@limiter.limit("5/minute")
def send_magic_link(request: Request, link_data: MagicLinkRequest, session: Session = Depends(get_session)):
    """
    Send magic link for passwordless login.
    Fallback for users without passkey support.
    """
    # Receipt of a request says nothing about the account or email delivery outcome.
    response = {
        "status": "requested",
        "message": "Your sign-in request is received. If a link arrives, open it within 15 minutes. You can also sign in with an existing passkey."
    }
    user = session.exec(select(User).where(User.email == link_data.email)).first()

    if private_mode() and (user is None or not user_allowed(user.id)):
        return response
    if not user:
        # Keep the public response identical for existing and unknown accounts.
        # Still log the attempt for security monitoring
        log_auth_failure(session, request, link_data.email, "magic_link", "User not found")
        return response

    # Generate magic link JWT token with short expiration
    access_token = create_access_token(
        data={"sub": str(user.id), "type": "magic_link", "jti": secrets.token_urlsafe(16)},
        expires_delta=timedelta(minutes=15)  # 15 minute expiration
    )

    # Generate magic link URL
    from backend.services.email_service import email_service
    from backend.config import settings
    frontend_url = settings.get_frontend_url()
    magic_link_url = f"{frontend_url}/auth/verify?token={access_token}"
    safe_redirect = _safe_redirect(link_data.redirect)
    if safe_redirect:
        from urllib.parse import quote
        magic_link_url += f"&redirect={quote(safe_redirect, safe='/')}"

    # Send email with magic link
    from backend.utils.audit import log_audit
    try:
        result = email_service.send_magic_link(
            to_email=user.email,
            magic_link_url=magic_link_url,
            db_session=session
        )
        delivery_state = result.delivery_state
        accepted = result.provider_accepted
        outcome = {"delivery_state": delivery_state, "provider": result.provider}
        # A request is not a login: record it as a request, not as an auth success
        log_audit(
            session=session, request=request, action="magic_link_requested",
            user_id=user.id, user_email=user.email, resource_type="magic_link_request",
            success=accepted, error_message=None if accepted else delivery_state,
            details=json.dumps(outcome)
        )
        context = {"user_id": user.id, "email": user.email, **outcome}
        if accepted:
            logger.info(
                "Magic link email accepted by provider",
                extra={"context": context}
            )
        elif delivery_state == "saved_local":
            logger.info(
                "Magic link email prepared locally",
                extra={"context": context}
            )
        else:
            logger.warning(
                "Magic link email failed to send",
                extra={"context": context}
            )
    except Exception as e:
        log_audit(
            session=session, request=request, action="magic_link_requested",
            user_id=user.id, user_email=user.email, resource_type="magic_link_request",
            success=False, error_message=type(e).__name__,
            details=json.dumps({"delivery_state": "failed"})
        )
        logger.warning(
            "Magic link email failed to send",
            extra={"context": {
                "user_id": user.id,
                "email": user.email,
                "error_type": type(e).__name__,
                "delivery_state": "failed"
            }}
        )
        # The public receipt stays uniform even when sending raises.

    return response

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
            raise HTTPException(status_code=401, detail="Let's sign in again.")

        try:
            user_pk = int(user_id)
        except (TypeError, ValueError):
            log_auth_failure(session, request, "", "magic_link_verify", "Token missing valid subject")
            raise HTTPException(status_code=401, detail="This link has rested. A fresh one is a click away from the sign-in page.")

        user = session.get(User, user_pk)
        if not user:
            log_auth_failure(session, request, "", "magic_link_verify", "User not found")
            raise HTTPException(status_code=401, detail="Let's check the email you used.")

        require_allowed_user(user.id)

        # One-time use: record the jti on first verify. Reuses refresh_tokens (unique token_hash,
        # revoked=True so it can never act as a refresh token). Tokens without a jti (issued before
        # this change) are refused: they live 15 minutes at most and fail-closed is the safe default.
        jti = payload.get("jti")
        if not jti or not isinstance(jti, str):
            log_auth_failure(session, request, user.email, "magic_link_verify", "Token has no one-time id")
            raise HTTPException(status_code=401, detail="This link has rested. A fresh one is a click away from the sign-in page.")
        import hashlib
        from datetime import datetime
        from sqlalchemy.exc import IntegrityError
        from backend.database import RefreshToken
        try:
            session.add(RefreshToken(
                user_id=user.id,
                token_hash=hashlib.sha256(f"magic_link:{jti}".encode()).hexdigest(),
                expires_at=datetime.utcfromtimestamp(payload["exp"]),
                revoked=True,
                device_info="magic_link_used",
            ))
            session.commit()
        except IntegrityError:
            session.rollback()
            log_auth_failure(session, request, user.email, "magic_link_verify", "Token already used")
            raise HTTPException(status_code=401, detail="This link has rested. A fresh one is a click away from the sign-in page.")

        # Log successful magic link authentication; create_refresh_token's commit writes it (X289)
        log_auth_success(session, request, user.id, user.email, "magic_link", commit=False)

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
        raise HTTPException(status_code=401, detail="This link has rested. A fresh one is a click away from the sign-in page.")


# --- Refresh Token Endpoints ---

@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token", description="Exchange a valid refresh token for a new access token and refresh token.")
@limiter.limit("30/minute")
def refresh_access_token(request: Request, token_request: RefreshTokenRequest, session: Session = Depends(get_session)):
    """
    Refresh access token using a refresh token.
    Implements token rotation (old refresh token is revoked, new one is issued).
    """
    if private_mode():
        candidate = verify_refresh_token(token_request.refresh_token, session)
        require_allowed_user(candidate.id if candidate else None)
    result = rotate_refresh_token(token_request.refresh_token, session)

    if not result:
        log_auth_failure(session, request, "", "refresh", "Invalid or expired refresh token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please sign in again whenever you're ready.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    new_refresh_token, user = result

    # Expired rows (old refresh tokens, used magic-link markers past their link's expiry) can never verify again
    from sqlalchemy import delete
    from backend.database import RefreshToken
    from backend.utils.clock import utc_now
    session.execute(delete(RefreshToken).where(RefreshToken.expires_at < utc_now()))
    session.commit()

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
    if private_mode():
        candidate = verify_refresh_token(token_request.refresh_token, session)
        require_allowed_user(candidate.id if candidate else None)
    if revoke_refresh_token(token_request.refresh_token, session):
        return {"status": "success", "message": "You're signed out. Take care."}
    else:
        # Don't reveal if token was already revoked or invalid
        return {"status": "success", "message": "You're signed out. Take care."}


@router.post("/logout-all", summary="Logout from all devices", description="Revoke all refresh tokens for the current user, logging out from all devices.")
@limiter.limit("5/minute")
def logout_all(request: Request, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Logout from all devices by revoking all refresh tokens.
    Requires valid access token authentication.
    """
    count = revoke_all_user_tokens(user.id, session)
    return {"status": "success", "message": f"You're signed out everywhere ({count} sessions)."}


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
        current_user.user_role = _check_user_role(prefs["user_role"])

    if "emotional_context" in prefs:
        current_user.emotional_context = prefs["emotional_context"]

    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user


# --- View Preferences Endpoints ---

class ViewPreferencesResponse(BaseModel):
    """Response model for view preferences."""
    view_preferences: Optional[Dict[str, str]] = None

class ViewPreferencesUpdate(BaseModel):
    """Request model for updating view preferences."""
    view_preferences: Dict[str, str]

    model_config = {
        "json_schema_extra": {
            "example": {
                "view_preferences": {
                    "contacts": "card",
                    "assets": "table",
                    "documents": "card"
                }
            }
        }
    }

@router.get("/me/preferences", response_model=ViewPreferencesResponse, summary="Get user view preferences", description="Returns the user's view preferences for UI toggles (card/table view per module).")
def get_view_preferences(
    current_user: User = Depends(get_current_user)
):
    """Get current user's view preferences."""
    return ViewPreferencesResponse(
        view_preferences=current_user.view_preferences or {}
    )

@router.patch("/me/preferences", response_model=ViewPreferencesResponse, summary="Update user view preferences", description="Update the user's view preferences for UI toggles (card/table view per module).")
def update_view_preferences(
    preferences: ViewPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update user's view preferences."""
    # Merge with existing preferences if any
    current_prefs = dict(current_user.view_preferences or {})
    current_prefs.update(preferences.view_preferences)

    current_user.view_preferences = current_prefs
    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    logger.info(
        "View preferences updated",
        extra={"context": {
            "user_id": current_user.id,
            "view_preferences": current_user.view_preferences
        }}
    )

    return ViewPreferencesResponse(
        view_preferences=current_user.view_preferences
    )


# --- Onboarding Endpoint ---

class OnboardingRequest(BaseModel):
    """Request model for updating onboarding data."""
    display_name: Optional[str] = None
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
                "display_name": "John",
                "user_role": "planning",
                "onboarding_step": "complete",
                "onboarding_completed": True
            }
        }
    }


class OnboardingResponse(BaseModel):
    """Response model for onboarding data."""
    id: int
    email: str
    display_name: Optional[str] = None
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
    - Display name (owner's preferred name)
    - User role (planning, executor, family, advisor)
    - Emotional context (healthy, preparing, grieving)
    - Deceased person's name (for executor/family modes)
    - Onboarding step progress
    - Language and accessibility preferences
    """
    updated_fields = []

    if onboarding_data.display_name is not None:
        current_user.display_name = onboarding_data.display_name
        updated_fields.append("display_name")

    if onboarding_data.user_role is not None:
        current_user.user_role = _check_user_role(onboarding_data.user_role)
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
        display_name=getattr(current_user, 'display_name', None),
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
        display_name=getattr(current_user, 'display_name', None),
        user_role=current_user.user_role,
        emotional_context=current_user.emotional_context,
        deceased_name=getattr(current_user, 'deceased_name', None),
        onboarding_step=getattr(current_user, 'onboarding_step', None),
        onboarding_completed=getattr(current_user, 'onboarding_completed', False),
        language=getattr(current_user, 'language', None),
        font_size=getattr(current_user, 'font_size', None)
    )
