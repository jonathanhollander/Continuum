from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select
from typing import List
from backend.database import get_session, User
from backend.auth import get_current_user
from backend.pulse_models import PulseContact
from backend.estate_models import ContactRelationship
from backend.utils.audit import log_audit, log_deletion

router = APIRouter(prefix="/api/contacts", tags=["contacts"])

@router.get("", response_model=List[PulseContact])
@router.get("/", response_model=List[PulseContact])
def get_contacts(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Fetch all contacts for the user (both Guardians and Non-Guardians)."""
    statement = select(PulseContact).where(PulseContact.user_id == user.id)
    return session.exec(statement).all()

@router.post("", response_model=PulseContact)
@router.post("/", response_model=PulseContact)
def create_contact(request: Request, contact: PulseContact, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Create a new global contact."""
    contact.user_id = user.id
    # Default to no tier if not provided
    if contact.tier_id == 0:
        contact.tier_id = None

    session.add(contact)
    session.commit()
    session.refresh(contact)

    # P1-High: Audit logging for contact creation
    log_audit(
        session=session,
        request=request,
        action="create_contact",
        user_id=user.id,
        user_email=user.email,
        resource_type="contact",
        resource_id=str(contact.id)
    )
    return contact

@router.put("/{contact_id}", response_model=PulseContact)
def update_contact(contact_id: int, updated: PulseContact, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Update a contact."""
    contact = session.get(PulseContact, contact_id)
    if not contact or contact.user_id != user.id:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    data = updated.dict(exclude_unset=True)
    for key, val in data.items():
        if key != "id": setattr(contact, key, val)
    
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return contact

@router.delete("/{contact_id}")
def delete_contact(request: Request, contact_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Delete a contact."""
    contact = session.get(PulseContact, contact_id)
    if not contact or contact.user_id != user.id:
        raise HTTPException(status_code=404, detail="Contact not found")

    # P1-High: Audit logging for contact deletion
    log_deletion(
        session=session,
        request=request,
        user_id=user.id,
        user_email=user.email,
        resource_type="contact",
        resource_id=contact_id
    )

    session.delete(contact)
    session.commit()
    return {"status": "deleted"}

# --- Relationships ---
@router.get("/relationships", response_model=List[ContactRelationship])
def get_relationships(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    statement = select(ContactRelationship).where(ContactRelationship.user_id == user.id)
    return session.exec(statement).all()

@router.post("/relationships", response_model=ContactRelationship)
def create_relationship(rel: ContactRelationship, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    rel.user_id = user.id
    session.add(rel)
    session.commit()
    session.refresh(rel)
    return rel

@router.delete("/relationships/{rel_id}")
def delete_relationship(rel_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    rel = session.get(ContactRelationship, rel_id)
    if not rel or rel.user_id != user.id:
        raise HTTPException(status_code=404, detail="Relationship not found")
    
    session.delete(rel)
    session.commit()
    return {"status": "deleted"}
