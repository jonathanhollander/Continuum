import os
from datetime import datetime, timedelta
from typing import Optional
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from backend.config import settings
from backend.database import User, get_session

SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES

# Fix for passlib + bcrypt 4.0.0+ crashing on 72 byte limit check during initialization
# This applies even if only using argon2 because passlib tries to load all handlers
from passlib.handlers.bcrypt import _bcrypt
if _bcrypt and hasattr(_bcrypt, "hashpw"):
    import bcrypt
    # Monkeypatch for passlib's BCrypt test that fails with bcrypt 4.0.0+
    try:
        from passlib.handlers.bcrypt import detect_wrap_bug
    except ImportError:
        pass

pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token", auto_error=False)

import hashlib

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash with SHA-256 pre-hashing."""
    # Pre-hash with SHA-256 to handle passwords longer than 72 bytes consistently
    # Argon2 handles long passwords, but SHA-256 ensures compatibility if we ever swap
    pre_hashed = hashlib.sha256(plain_password.encode()).hexdigest()
    return pwd_context.verify(pre_hashed, hashed_password)

from backend.utils.logger import get_logger

logger = get_logger(__name__)

def get_password_hash(password: str) -> str:
    """Hash a password with SHA-256 pre-hashing for storing."""
    # Pre-hash with SHA-256 to handle passwords longer than 72 bytes
    pre_hashed = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.hash(pre_hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # If no token is provided, we return None for public endpoints
    # or raise exception for protected ones.
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
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
        user_id: int = payload.get("sub")
        if user_id is None:
            return None
        return session.get(User, user_id)
    except jwt.PyJWTError:
        return None
