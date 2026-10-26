"""Grant administrator access to an existing account using its exact email."""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, EmailStr
from sqlmodel import Session, select

from backend.admin import require_admin
from backend.database import User, get_session

router = APIRouter(prefix="/api/admin/users", tags=["admin"])


class Administrator(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    display_name: str | None = None
    is_admin: bool


class AdministratorList(BaseModel):
    administrators: list[Administrator]
    next_cursor: int | None = None


class AdministratorGrant(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr


@router.get("", response_model=AdministratorList)
def list_administrators(
    limit: int = Query(50, ge=1, le=100),
    after_id: int | None = Query(None, ge=1),
    admin: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    query = select(User).where(User.is_admin.is_(True))
    if after_id is not None:
        query = query.where(User.id > after_id)
    rows = session.exec(query.order_by(User.id).limit(limit + 1)).all()
    return {"administrators": rows[:limit],
            "next_cursor": rows[limit - 1].id if len(rows) > limit else None}


@router.post("/grant", response_model=Administrator)
def grant_administrator(
    body: AdministratorGrant,
    admin: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    account = session.exec(select(User).where(User.email == str(body.email))).first()
    if account is None:
        raise HTTPException(status_code=404, detail="Use the exact email for an existing account.")
    if not account.is_admin:
        account.is_admin = True
        session.add(account)
        session.commit()
        session.refresh(account)
    return account
