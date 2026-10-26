import os
from datetime import datetime, timedelta, timezone
from backend.utils.clock import utc_now
from typing import Optional
import jwt
import bcrypt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from backend.config import settings
from backend.database import User, get_session

SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS

pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token", auto_error=False)

import hashlib

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash with SHA-256 pre-hashing."""
    # Pre-hash with SHA-256 to handle passwords longer than 72 bytes consistently
    # Argon2 handles long passwords, but SHA-256 ensures compatibility if we ever swap
    pre_hashed = hashlib.sha256(plain_password.encode()).hexdigest()
    if hashed_password.startswith(("$2a$", "$2b$", "$2y$")):
        # Legacy bcrypt hashes: passlib 1.7.4's bcrypt backend fails to load with
        # bcrypt>=5 (its wrap-bug self-test raises ValueError on a >72-byte secret),
        # so verify these directly. The 64-char hex pre-hash is under bcrypt's 72-byte limit.
        try:
            return bcrypt.checkpw(pre_hashed.encode(), hashed_password.encode())
        except ValueError:
            return False  # malformed bcrypt hash
    try:
        return pwd_context.verify(pre_hashed, hashed_password)
    except (ValueError, TypeError):
        # Unrecognised/non-hash stored value (e.g. "BYPASS_AUTH"): treat as a failed check.
        # passlib's UnknownHashError subclasses ValueError.
        return False

from backend.utils.logger import get_logger

logger = get_logger(__name__)


def get_password_hash(password: str) -> str:
    """Hash a password with SHA-256 pre-hashing for storing."""
    # Pre-hash with SHA-256 to handle passwords longer than 72 bytes
    pre_hashed = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.hash(pre_hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def _subject_to_user_id(sub) -> Optional[int]:
    """Token `sub` is a string; return it as an int user id, or None if it is not a plain integer."""
    if isinstance(sub, bool):
        return None
    try:
        return int(sub)
    except (TypeError, ValueError):
        return None


def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Let's sign in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # If no token is provided, we return None for public endpoints
    # or raise exception for protected ones.
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = _subject_to_user_id(payload.get("sub"))
        if user_id is None:
            raise credentials_exception
        # Access tokens carry no "type" claim; reject typed tokens (e.g. "magic_link").
        if payload.get("type") not in (None, "access"):
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = session.get(User, user_id)
    if user is None:
        raise credentials_exception
    return user

def optional_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = _subject_to_user_id(payload.get("sub"))
        if user_id is None:
            return None
        if payload.get("type") not in (None, "access"):
            return None
        return session.get(User, user_id)
    except jwt.PyJWTError:
        return None


# --- Refresh Token Functions ---

def create_refresh_token(user_id: int, session: Session, device_info: Optional[str] = None) -> str:
    """
    Create a new refresh token for the user.
    Stores token hash in database for revocation support.
    Returns the raw token to be sent to client.
    """
    import secrets
    from backend.database import RefreshToken

    # Generate a secure random token
    raw_token = secrets.token_urlsafe(64)

    # Hash the token for storage (never store raw tokens)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    # Calculate expiration
    expires_at = utc_now() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    # Store in database
    refresh_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
        device_info=device_info
    )
    session.add(refresh_token)
    session.commit()

    logger.info(f"Created refresh token for user {user_id}")
    return raw_token


def verify_refresh_token(raw_token: str, session: Session) -> Optional[User]:
    """
    Verify a refresh token and return the associated user.
    Returns None if token is invalid, expired, or revoked.
    """
    from backend.database import RefreshToken

    # Hash the provided token
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    # Find the token in database
    token_record = session.exec(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False,
            RefreshToken.expires_at > utc_now()
        )
    ).first()

    if not token_record:
        logger.warning("Invalid or expired refresh token used")
        return None

    # Get the user
    user = session.get(User, token_record.user_id)
    if not user:
        logger.warning(f"Refresh token user not found: {token_record.user_id}")
        return None

    return user


def revoke_refresh_token(raw_token: str, session: Session) -> bool:
    """
    Revoke a specific refresh token.
    Returns True if revoked, False if not found.
    """
    from backend.database import RefreshToken

    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    token_record = session.exec(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    ).first()

    if token_record:
        token_record.revoked = True
        session.commit()
        logger.info(f"Revoked refresh token for user {token_record.user_id}")
        return True

    return False


def revoke_all_user_tokens(user_id: int, session: Session) -> int:
    """
    Revoke all refresh tokens for a user (logout from all devices).
    Returns count of revoked tokens.
    """
    from backend.database import RefreshToken

    tokens = session.exec(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False
        )
    ).all()

    count = 0
    for token in tokens:
        token.revoked = True
        count += 1

    session.commit()
    logger.info(f"Revoked {count} refresh tokens for user {user_id}")
    return count


def rotate_refresh_token(old_token: str, session: Session, device_info: Optional[str] = None) -> Optional[tuple]:
    """
    Rotate a refresh token (revoke old, create new).
    Returns (new_token, user) tuple or None if old token is invalid.
    """
    from backend.database import RefreshToken

    # Verify the old token
    token_hash = hashlib.sha256(old_token.encode()).hexdigest()

    token_record = session.exec(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False,
            RefreshToken.expires_at > utc_now()
        )
    ).first()

    if not token_record:
        return None

    user = session.get(User, token_record.user_id)
    if not user:
        return None

    # Revoke the old token
    token_record.revoked = True

    # Create a new token
    new_token = create_refresh_token(user.id, session, device_info)

    return (new_token, user)
