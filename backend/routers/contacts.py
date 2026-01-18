from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from backend.database import get_session
from backend.pulse_models import PulseContact

router = APIRouter(prefix="/api/contacts", tags=["contacts"])

@router.get("/", response_model=List[PulseContact])
def get_contacts(user_id: int, session: Session = Depends(get_session)):
    """Fetch all contacts for the user (both Guardians and Non-Guardians)."""
    statement = select(PulseContact).where(PulseContact.user_id == user_id)
    return session.exec(statement).all()

@router.post("/", response_model=PulseContact)
def create_contact(user_id: int, contact: PulseContact, session: Session = Depends(get_session)):
    """Create a new global contact."""
    contact.user_id = user_id
    # Default to no tier if not provided
    if contact.tier_id == 0:
        contact.tier_id = None
        
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return contact

@router.put("/{contact_id}", response_model=PulseContact)
def update_contact(user_id: int, contact_id: int, updated: PulseContact, session: Session = Depends(get_session)):
    """Update a contact."""
    contact = session.get(PulseContact, contact_id)
    if not contact or contact.user_id != user_id:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    data = updated.dict(exclude_unset=True)
    for key, val in data.items():
        if key != "id": setattr(contact, key, val)
    
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return contact

@router.delete("/{contact_id}")
def delete_contact(user_id: int, contact_id: int, session: Session = Depends(get_session)):
    """Delete a contact."""
    contact = session.get(PulseContact, contact_id)
    if not contact or contact.user_id != user_id:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    session.delete(contact)
    session.commit()
    return {"status": "deleted"}
