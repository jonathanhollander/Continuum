from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Any
from backend.database import get_session, User
from backend.auth import get_current_user
from backend.estate_models import (
    Asset, FinancialAccount, Vendor, HomeAccess, Utility, 
    Document, Letter, JournalEntry, Subscription, CalendarEvent,
    InsurancePolicy, MedicalDirective, Pet, ContactRelationship,
    MedicalProfile
)

router = APIRouter(prefix="/api/data", tags=["estate_data"])

MODEL_MAP = {
    "calendar_events": CalendarEvent,
    "insurance_policies": InsurancePolicy,
    "pets": Pet,
    "contact_relationships": ContactRelationship,
    "assets": Asset,
    "properties": Asset,
    "digital_assets": Asset,
    "heirlooms": Asset,
    "financial_accounts": FinancialAccount,
    "vendors": Vendor,
    "home_access": HomeAccess,
    "utilities": Utility,
    "documents": Document,
    "letters": Letter,
    "journal_entries": JournalEntry,
    "subscriptions": Subscription,
    "medical_profiles": MedicalProfile,
    "medical_directives": MedicalDirective
}

@router.get("/{data_type}")
def get_items(data_type: str, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    model = MODEL_MAP.get(data_type)
    if not model:
        raise HTTPException(status_code=400, detail=f"Invalid type: {data_type}")
    
    statement = select(model).where(model.user_id == user.id)
    return session.exec(statement).all()

@router.post("/{data_type}")
def create_item(data_type: str, item: dict, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    model = MODEL_MAP.get(data_type)
    if not model:
        raise HTTPException(status_code=400, detail=f"Invalid type: {data_type}")
    
    try:
        # Enforce user_id
        item["user_id"] = user.id
        # Create instance
        db_item = model.model_validate(item)
        session.add(db_item)
        session.commit()
        session.refresh(db_item)
        return db_item
    except Exception as e:
        print(f"Error creating {data_type}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{data_type}/{item_id}")
def update_item(data_type: str, item_id: int, updates: dict, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    model = MODEL_MAP.get(data_type)
    if not model:
        raise HTTPException(status_code=400, detail="Invalid data type")
    
    db_item = session.get(model, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    if getattr(db_item, "user_id") != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    for key, value in updates.items():
         if key != "id" and key != "user_id":
             setattr(db_item, key, value)
             
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item

@router.delete("/{data_type}/{item_id}")
def delete_item(data_type: str, item_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    model = MODEL_MAP.get(data_type)
    if not model:
        raise HTTPException(status_code=400, detail="Invalid data type")
    
    db_item = session.get(model, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    if getattr(db_item, "user_id") != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    session.delete(db_item)
    session.commit()
    return {"status": "deleted"}
