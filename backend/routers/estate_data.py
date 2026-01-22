from fastapi import APIRouter, Depends, HTTPException, status, Request
from backend.limiter import limiter
from sqlmodel import Session, select
from typing import List, Any
from backend.database import get_session, User
from backend.auth import get_current_user
from backend.estate_models import (
    Asset, FinancialAccount, Vendor, HomeAccess, Utility,
    Document, Letter, JournalEntry, Subscription, CalendarEvent,
    InsurancePolicy, MedicalDirective, Pet, ContactRelationship,
    MedicalProfile, LifeEvent, TimeCapsuleMessage, FuneralData,
    AdvancedAssetData
)
from backend.utils.logger import get_logger

logger = get_logger(__name__)
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
    "medical_directives": MedicalDirective,
    "timeline_events": LifeEvent,
    "time_capsule": TimeCapsuleMessage,
    "funeral_data": FuneralData,
    "advanced_assets": AdvancedAssetData
}

@router.get("/{data_type}", summary="Get estate items", description="Fetches a list of items for a specific estate data type (e.g., assets, documents, pets).")
def get_items(data_type: str, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    model = MODEL_MAP.get(data_type)
    if not model:
        raise HTTPException(status_code=400, detail=f"Invalid type: {data_type}")
    
    statement = select(model).where(model.user_id == user.id)
    return session.exec(statement).all()

@router.post("/{data_type}", summary="Create estate item", description="Creates a new record for the specified estate data type. Automatically associates it with the current user.")
@limiter.limit("30/minute")
def create_item(request: Request, data_type: str, item: dict, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
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
        logger.error(
            f"Failed to create {data_type} item",
            extra={"context": {
                "data_type": data_type,
                "user_id": user.id,
                "error": str(e),
                "error_type": type(e).__name__
            }},
            exc_info=True
        )
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{data_type}/{item_id}", summary="Update estate item", description="Updates an existing estate data record. Only allows modifications to the user's own items.")
@limiter.limit("30/minute")
def update_item(request: Request, data_type: str, item_id: int, updates: dict, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
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
@limiter.limit("30/minute")
def delete_item(request: Request, data_type: str, item_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
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
