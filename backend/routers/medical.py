from fastapi import APIRouter, Depends, HTTPException, Request
from backend.limiter import limiter
from sqlmodel import Session, select
from typing import List, Optional
from backend.database import get_session, User
from backend.auth import get_current_user
from backend.estate_models import MedicalProfile, MedicalDirective
from backend.utils.audit import log_audit, log_deletion

router = APIRouter(prefix="/api/medical", tags=["medical"])

DIRECTIVE_TYPES = {"healthcare_proxy", "living_will", "dnr", "palliative_care", "other"}


def _check_directive(data: dict, existing: Optional[MedicalDirective] = None) -> None:
    """type and title are NOT NULL; a missing or unknown value would 500 on insert.
    On update, an omitted field keeps the row's value, and a row's own stored type stays acceptable."""
    if existing is None or "type" in data:
        val = data.get("type")
        if not val or (val not in DIRECTIVE_TYPES and (existing is None or val != existing.type)):
            raise HTTPException(status_code=422, detail="Choose the kind of directive this is, such as a healthcare proxy or a living will.")
    if existing is None or "title" in data:
        val = data.get("title")
        if not isinstance(val, str) or not val.strip():
            raise HTTPException(status_code=422, detail="Give this directive a short name so you can find it again.")

# --- Medical Profile ---
@router.get("/profile", response_model=MedicalProfile, summary="Get medical profile", description="Retrieves the user's core medical information (blood type, organ donor status, allergies).")
def get_medical_profile(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    profile = session.get(MedicalProfile, user.id)
    if not profile:
        profile = MedicalProfile(user_id=user.id)
        session.add(profile)
        session.commit()
        session.refresh(profile)
    return profile

@router.post("/profile", response_model=MedicalProfile)
@router.put("/profile", response_model=MedicalProfile)
@limiter.limit("10/minute")
def update_medical_profile(request: Request, updated: MedicalProfile, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    profile = session.get(MedicalProfile, user.id)
    if not profile:
        profile = MedicalProfile(user_id=user.id)

    data = updated.dict(exclude_unset=True)
    for key, val in data.items():
        if key == "user_id" or (key == "organ_donor" and val is None):
            continue  # organ_donor is NOT NULL: an explicit null keeps the row's value
        setattr(profile, key, val)

    session.add(profile)
    session.commit()
    session.refresh(profile)

    # P1-High: Audit logging for medical profile update
    log_audit(
        session=session,
        request=request,
        action="update_medical_profile",
        user_id=user.id,
        user_email=user.email,
        resource_type="medical_profile",
        resource_id=str(user.id)
    )
    session.refresh(profile)  # the audit commit expires it; otherwise the response is {}
    return profile

# --- Medical Directives ---
@router.get("/directives", response_model=List[MedicalDirective], summary="Get medical directives", description="Fetches all healthcare proxies, living wills, and other medical directives for the user.")
def get_medical_directives(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    statement = select(MedicalDirective).where(MedicalDirective.user_id == user.id)
    return session.exec(statement).all()

@router.post("/directives", response_model=MedicalDirective)
@limiter.limit("20/minute")
def create_medical_directive(request: Request, directive: MedicalDirective, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    _check_directive({"type": getattr(directive, "type", None), "title": getattr(directive, "title", None)})
    directive.user_id = user.id
    session.add(directive)
    session.commit()
    session.refresh(directive)

    # P1-High: Audit logging for medical directive creation
    log_audit(
        session=session,
        request=request,
        action="create_medical_directive",
        user_id=user.id,
        user_email=user.email,
        resource_type="medical_directive",
        resource_id=str(directive.id)
    )
    session.refresh(directive)  # the audit commit expires it; otherwise the response is {}
    return directive

@router.put("/directives/{directive_id}", response_model=MedicalDirective)
@limiter.limit("20/minute")
def update_medical_directive(request: Request, directive_id: int, updated: MedicalDirective, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    directive = session.get(MedicalDirective, directive_id)
    if not directive or directive.user_id != user.id:
        raise HTTPException(status_code=404, detail="Directive not found")
    
    data = updated.dict(exclude_unset=True)
    _check_directive(data, directive)
    for key, val in data.items():
        if key != "id" and key != "user_id":
            setattr(directive, key, val)
    
    session.add(directive)
    session.commit()
    session.refresh(directive)
    return directive

@router.delete("/directives/{directive_id}")
def delete_medical_directive(request: Request, directive_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    directive = session.get(MedicalDirective, directive_id)
    if not directive or directive.user_id != user.id:
        raise HTTPException(status_code=404, detail="Directive not found")

    # P1-High: Audit logging for medical directive deletion
    log_deletion(
        session=session,
        request=request,
        user_id=user.id,
        user_email=user.email,
        resource_type="medical_directive",
        resource_id=directive_id
    )

    session.delete(directive)
    session.commit()
    return {"status": "deleted"}
