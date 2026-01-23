from fastapi import APIRouter, Depends, HTTPException, status, Request
from backend.limiter import limiter
from sqlmodel import Session, select
from typing import List, Any, Dict, Optional
from pydantic import BaseModel, field_validator, model_validator
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
from backend.utils.audit import log_audit, log_deletion

logger = get_logger(__name__)
router = APIRouter(prefix="/api/data", tags=["estate_data"])

# --- Pydantic Validation Models (P1-High Security) ---

# Fields that should never be set by user input
PROTECTED_FIELDS = {"id", "user_id", "created_at", "updated_at", "__class__", "__dict__"}
# Maximum reasonable field count to prevent DoS
MAX_FIELDS = 50
# Maximum string length for any field value
MAX_STRING_LENGTH = 10000


class EstateItemCreate(BaseModel):
    """Validated model for creating estate items."""
    data: Dict[str, Any]

    @model_validator(mode="after")
    def validate_data(self):
        """Validate the data dictionary for security."""
        if not self.data:
            raise ValueError("Data cannot be empty")

        if len(self.data) > MAX_FIELDS:
            raise ValueError(f"Too many fields (max {MAX_FIELDS})")

        # Check for protected fields
        protected_found = PROTECTED_FIELDS & set(self.data.keys())
        if protected_found:
            raise ValueError(f"Cannot set protected fields: {protected_found}")

        # Validate field names and values
        for key, value in self.data.items():
            # Field names must be alphanumeric with underscores
            if not key.replace("_", "").isalnum():
                raise ValueError(f"Invalid field name: {key}")

            # Check string lengths
            if isinstance(value, str) and len(value) > MAX_STRING_LENGTH:
                raise ValueError(f"Field '{key}' exceeds maximum length ({MAX_STRING_LENGTH})")

            # Prevent nested dicts that could contain __class__ etc.
            if isinstance(value, dict):
                nested_protected = PROTECTED_FIELDS & set(value.keys())
                if nested_protected:
                    raise ValueError(f"Cannot set protected fields in nested object: {nested_protected}")

        return self


class EstateItemUpdate(BaseModel):
    """Validated model for updating estate items."""
    data: Dict[str, Any]

    @model_validator(mode="after")
    def validate_data(self):
        """Validate the update data dictionary for security."""
        if not self.data:
            raise ValueError("Update data cannot be empty")

        if len(self.data) > MAX_FIELDS:
            raise ValueError(f"Too many fields (max {MAX_FIELDS})")

        # Check for protected fields (more strict for updates)
        protected_found = PROTECTED_FIELDS & set(self.data.keys())
        if protected_found:
            raise ValueError(f"Cannot update protected fields: {protected_found}")

        # Validate field names and values
        for key, value in self.data.items():
            if not key.replace("_", "").isalnum():
                raise ValueError(f"Invalid field name: {key}")

            if isinstance(value, str) and len(value) > MAX_STRING_LENGTH:
                raise ValueError(f"Field '{key}' exceeds maximum length ({MAX_STRING_LENGTH})")

            if isinstance(value, dict):
                nested_protected = PROTECTED_FIELDS & set(value.keys())
                if nested_protected:
                    raise ValueError(f"Cannot set protected fields in nested object: {nested_protected}")

        return self

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

@router.get("/{data_type}", summary="Get estate items", response_model=List[Any])
def get_items(data_type: str, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Fetch all items of a specific type for the current user.
    """
    model = MODEL_MAP.get(data_type)
    if not model:
        raise HTTPException(status_code=400, detail=f"Invalid type: {data_type}")
    
    statement = select(model).where(model.user_id == user.id)
    return session.exec(statement).all()

def _log_estate_action(session: Session, request: Request, action: str, user: User, data_type: str, resource_id: Any):
    """Helper to centralize audit logging for estate data."""
    log_audit(
        session=session,
        request=request,
        action=f"{action}_{data_type}",
        user_id=user.id,
        user_email=user.email,
        resource_type=data_type,
        resource_id=str(resource_id)
    )

@router.post("/{data_type}", summary="Create estate item")
@limiter.limit("30/minute")
def create_item(request: Request, data_type: str, item: EstateItemCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Create a new estate item with validation and audit logging.
    """
    model = MODEL_MAP.get(data_type)
    if not model:
        raise HTTPException(status_code=400, detail=f"Invalid type: {data_type}")

    try:
        validated_data = item.data.copy()
        validated_data["user_id"] = user.id

        db_item = model.model_validate(validated_data)
        session.add(db_item)
        session.commit()
        session.refresh(db_item)

        _log_estate_action(session, request, "create", user, data_type, db_item.id)
        return db_item
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create {data_type} item: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail="Could not create item")

@router.put("/{data_type}/{item_id}", summary="Update estate item")
@limiter.limit("30/minute")
def update_item(request: Request, data_type: str, item_id: int, updates: EstateItemUpdate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Update an existing estate item with validation and audit logging.
    """
    model = MODEL_MAP.get(data_type)
    if not model:
        raise HTTPException(status_code=400, detail="Invalid data type")

    try:
        db_item = session.get(model, item_id)
        if not db_item:
            raise HTTPException(status_code=404, detail="Item not found")
        if getattr(db_item, "user_id") != user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

        for key, value in updates.data.items():
            if hasattr(db_item, key):
                setattr(db_item, key, value)

        session.add(db_item)
        session.commit()
        session.refresh(db_item)

        _log_estate_action(session, request, "update", user, data_type, item_id)
        return db_item
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update {data_type} item {item_id}: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail="Could not update item")

@router.delete("/{data_type}/{item_id}")
@limiter.limit("30/minute")
def delete_item(request: Request, data_type: str, item_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Delete an estate item with audit logging.
    """
    model = MODEL_MAP.get(data_type)
    if not model:
        raise HTTPException(status_code=400, detail="Invalid data type")
    
    try:
        db_item = session.get(model, item_id)
        if not db_item:
            raise HTTPException(status_code=404, detail="Item not found")
        if getattr(db_item, "user_id") != user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

        log_deletion(
            session=session,
            request=request,
            user_id=user.id,
            user_email=user.email,
            resource_type=data_type,
            resource_id=item_id
        )

        session.delete(db_item)
        session.commit()
        return {"status": "deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete {data_type} item {item_id}: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail="Could not delete item")
