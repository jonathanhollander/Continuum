from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from backend.database import get_session, User
from backend.auth import get_current_user
from backend.estate_models import MedicalProfile, MedicalDirective

router = APIRouter(prefix="/api/medical", tags=["medical"])

# --- Medical Profile ---
@router.get("/profile", response_model=MedicalProfile)
def get_medical_profile(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    profile = session.get(MedicalProfile, user.id)
    if not profile:
        profile = MedicalProfile(user_id=user.id)
        session.add(profile)
        session.commit()
        session.refresh(profile)
    return profile

@router.put("/profile", response_model=MedicalProfile)
def update_medical_profile(updated: MedicalProfile, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    profile = session.get(MedicalProfile, user.id)
    if not profile:
        profile = MedicalProfile(user_id=user.id)
    
    data = updated.dict(exclude_unset=True)
    for key, val in data.items():
        if key != "user_id":
            setattr(profile, key, val)
    
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile

# --- Medical Directives ---
@router.get("/directives", response_model=List[MedicalDirective])
def get_medical_directives(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    statement = select(MedicalDirective).where(MedicalDirective.user_id == user.id)
    return session.exec(statement).all()

@router.post("/directives", response_model=MedicalDirective)
def create_medical_directive(directive: MedicalDirective, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    directive.user_id = user.id
    session.add(directive)
    session.commit()
    session.refresh(directive)
    return directive

@router.put("/directives/{directive_id}", response_model=MedicalDirective)
def update_medical_directive(directive_id: int, updated: MedicalDirective, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    directive = session.get(MedicalDirective, directive_id)
    if not directive or directive.user_id != user.id:
        raise HTTPException(status_code=404, detail="Directive not found")
    
    data = updated.dict(exclude_unset=True)
    for key, val in data.items():
        if key != "id" and key != "user_id":
            setattr(directive, key, val)
    
    session.add(directive)
    session.commit()
    session.refresh(directive)
    return directive

@router.delete("/directives/{directive_id}")
def delete_medical_directive(directive_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    directive = session.get(MedicalDirective, directive_id)
    if not directive or directive.user_id != user.id:
        raise HTTPException(status_code=404, detail="Directive not found")
    
    session.delete(directive)
    session.commit()
    return {"status": "deleted"}
