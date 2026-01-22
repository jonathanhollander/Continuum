from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from backend.database import get_session, User
from backend.auth import get_current_user
from backend.estate_models import Heirloom

router = APIRouter(prefix="/api/heirlooms", tags=["heirlooms"])

@router.get("/", response_model=List[Heirloom])
def get_heirlooms(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    statement = select(Heirloom).where(Heirloom.user_id == user.id)
    return session.exec(statement).all()

@router.post("/", response_model=Heirloom)
def create_heirloom(heirloom: Heirloom, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    heirloom.user_id = user.id
    session.add(heirloom)
    session.commit()
    session.refresh(heirloom)
    return heirloom

@router.put("/{heirloom_id}", response_model=Heirloom)
def update_heirloom(heirloom_id: int, updated: Heirloom, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    existing = session.get(Heirloom, heirloom_id)
    if not existing or existing.user_id != user.id:
        raise HTTPException(status_code=404, detail="Heirloom not found")
    
    data = updated.dict(exclude_unset=True)
    for key, val in data.items():
        if key not in ["id", "user_id", "created_at"]:
            setattr(existing, key, val)
    
    session.add(existing)
    session.commit()
    session.refresh(existing)
    return existing

@router.delete("/{heirloom_id}")
def delete_heirloom(heirloom_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    existing = session.get(Heirloom, heirloom_id)
    if not existing or existing.user_id != user.id:
        raise HTTPException(status_code=404, detail="Heirloom not found")
    
    session.delete(existing)
    session.commit()
    return {"status": "deleted", "id": heirloom_id}
