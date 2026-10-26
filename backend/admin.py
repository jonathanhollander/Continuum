"""Administrator authority comes from the signed-in account's saved designation."""
from fastapi import Depends, HTTPException, status

from backend.auth import get_current_user
from backend.database import User


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Administrator access is required.")
    return user
