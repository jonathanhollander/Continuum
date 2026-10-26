from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from backend.limiter import limiter
from sqlmodel import Session, select, func, and_, or_
from typing import List, Any, Dict, Optional
from pydantic import BaseModel, field_validator, model_validator
import json
from backend.database import get_session, User
from backend.auth import get_current_user
from backend.estate_models import (
    Asset, FinancialAccount, Vendor, HomeAccess, Utility,
    Document, Letter, JournalEntry, Subscription, CalendarEvent,
    InsurancePolicy, MedicalDirective, Pet, ContactRelationship,
    MedicalProfile, LifeEvent, TimeCapsuleMessage, FuneralData,
    AdvancedAssetData, DigitalGuardianData, UserCustomFieldDefinition
)
from backend.models.activity_models import ActivityLogEntry
from backend.models.qr_models import QRAccessPack, QRAssetLabel
from backend.models.acceptance_models import AcceptanceTask
from backend.models.automation_models import AutomationRule
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
    "financial_assets": FinancialAccount,
    "vendors": Vendor,
    "home_access": HomeAccess,
    "utilities": Utility,
    "documents": Document,
    # Alias: the vault's older endpoint name (settings/data still counts from it). GET only lands
    # here; routers/documents.py claims /vault_documents/{id}, so DocumentVault uses "documents".
    "vault_documents": Document,
    "letters": Letter,
    "future_letters": Letter,  # Alias for frontend SyncManager endpoint
    "journal_entries": JournalEntry,
    "subscriptions": Subscription,
    "medical_profiles": MedicalProfile,
    "medical_directives": MedicalDirective,
    "timeline_events": LifeEvent,
    "time_capsule": TimeCapsuleMessage,
    "funeral_data": FuneralData,
    "advanced_assets": AdvancedAssetData,
    "digital_guardian": DigitalGuardianData,
    "activity_log": ActivityLogEntry,
    "qr_packs": QRAccessPack,
    "qr_labels": QRAssetLabel,
    "acceptance_tasks": AcceptanceTask,
    "automation_rules": AutomationRule
}

# CU-011: one row per user (user_id is unique); GET returns that row as an object, POST upserts it.
SINGLETON_TYPES = {"funeral_data", "advanced_assets", "digital_guardian"}
SINGLETON_JSON_FIELDS = {"wishes", "budget", "transactions", "maintenance", "claims", "setup_status", "fire_drill"}  # stored as JSON text

# CU-004: these data types share the Asset table; each owns the rows whose `category` equals it.
ASSET_CATEGORIES = {"properties", "digital_assets", "heirlooms"}


def _encode_singleton_json(data: Dict[str, Any]) -> None:
    """Singleton JSON text columns: clients may send objects/lists; store as JSON text (in place)."""
    for k in SINGLETON_JSON_FIELDS & set(data):
        if not isinstance(data[k], str):
            data[k] = json.dumps(data[k])


def _has(col):
    return func.coalesce(col, "") != ""


def _category_clause(data_type: str):
    """SQL membership test for one Asset-backed list, or None (no extra filter).

    Rows with a NULL category (created before the column existed) are not
    migrated; they list under exactly one category, chosen read-time:
    platform/username -> digital_assets, else recipient/story -> heirlooms,
    else properties. "assets" lists every row of the user.
    """
    if data_type not in ASSET_CATEGORIES:
        return None
    digital = or_(_has(Asset.platform), _has(Asset.username))
    heirloom = or_(_has(Asset.recipient), _has(Asset.story))
    legacy = {
        "digital_assets": digital,
        "heirlooms": and_(~digital, heirloom),
        "properties": and_(~digital, ~heirloom),
    }[data_type]
    return or_(Asset.category == data_type, and_(Asset.category.is_(None), legacy))


def _in_category(session: Session, data_type: str, item) -> bool:
    clause = _category_clause(data_type)
    if clause is None:
        return True
    return session.exec(select(Asset.id).where(Asset.id == item.id, clause)).first() is not None

# --- CUSTOM FIELD DEFINITIONS ---
# NOTE: These routes must be declared BEFORE the generic /{data_type} routes
# so that FastAPI matches them correctly.

class CustomFieldDefCreate(BaseModel):
    entity_type: str
    name: str
    field_type: str = "text"
    options: Optional[str] = None
    order: int = 0

@router.get("/custom-fields/{entity_type}", summary="Get custom field definitions")
def get_custom_field_definitions(entity_type: str, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Get all custom field definitions for a specific entity type."""
    statement = select(UserCustomFieldDefinition).where(
        UserCustomFieldDefinition.user_id == user.id,
        UserCustomFieldDefinition.entity_type == entity_type
    ).order_by(UserCustomFieldDefinition.order)
    return session.exec(statement).all()

@router.post("/custom-fields", summary="Create custom field definition")
def create_custom_field_definition(field_def: CustomFieldDefCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Create a new custom field definition."""
    try:
        db_def = UserCustomFieldDefinition(
            user_id=user.id,
            **field_def.model_dump()
        )
        session.add(db_def)
        session.commit()
        session.refresh(db_def)
        return db_def
    except Exception as e:
        logger.error(f"Failed to create custom field definition: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail="Could not create field definition")

@router.delete("/custom-fields/{field_id}", summary="Delete custom field definition")
def delete_custom_field_definition(field_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Delete a custom field definition."""
    db_def = session.get(UserCustomFieldDefinition, field_id)
    if not db_def:
        raise HTTPException(status_code=404, detail="Field definition not found")
    if db_def.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    session.delete(db_def)
    session.commit()
    return {"status": "deleted"}

# --- GENERIC ESTATE DATA ROUTES ---

@router.get("/{data_type}", summary="Get estate items", response_model=Any)
def get_items(data_type: str, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Fetch all items of a specific type for the current user.
    """
    model = MODEL_MAP.get(data_type)
    if not model:
        raise HTTPException(status_code=400, detail=f"Invalid type: {data_type}")
    
    statement = select(model).where(model.user_id == user.id)
    if data_type in SINGLETON_TYPES:
        return session.exec(statement.order_by(model.id)).first() or {}
    clause = _category_clause(data_type)
    if clause is not None:
        statement = statement.where(clause)
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
# 600/minute per client IP (slowapi key_func=get_remote_address): a first upload of
# a few hundred local items (SyncManager.migrateUp, one POST each) completes.
@limiter.limit("600/minute")
def create_item(
    request: Request,
    data_type: str,
    body: Dict[str, Any] = Body(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Create a new estate item with validation and audit logging.
    Accepts raw JSON body (no wrapper needed).
    """
    model = MODEL_MAP.get(data_type)
    if not model:
        raise HTTPException(status_code=400, detail=f"Invalid type: {data_type}")

    try:
        # Support both raw body and wrapped { data: {...} } format for backwards compatibility
        if "data" in body and isinstance(body["data"], dict) and len(body) == 1:
            validated_data = body["data"].copy()
        else:
            validated_data = body.copy()

        # Validate input - check for protected fields
        protected_found = PROTECTED_FIELDS & set(validated_data.keys())
        if protected_found:
            raise ValueError(f"Cannot set protected fields: {protected_found}")

        # Add user_id
        validated_data["user_id"] = user.id
        if model is Asset:
            validated_data["category"] = data_type  # server-owned; client value ignored

        # Serialize custom_attributes if provided as dict
        if "custom_attributes" in validated_data and isinstance(validated_data["custom_attributes"], dict):
            validated_data["custom_attributes"] = json.dumps(validated_data["custom_attributes"])

        if data_type in SINGLETON_TYPES:
            _encode_singleton_json(validated_data)
            existing = session.exec(select(model).where(model.user_id == user.id).order_by(model.id)).first()
            if existing:  # upsert: update the user's one row instead of adding another
                for k, v in validated_data.items():
                    if k != "user_id" and hasattr(existing, k):
                        setattr(existing, k, v)
                session.add(existing)
                session.commit()
                session.refresh(existing)
                _log_estate_action(session, request, "update", user, data_type, existing.id)
                session.refresh(existing)
                return existing

        db_item = model.model_validate(validated_data)
        session.add(db_item)
        session.commit()
        session.refresh(db_item)

        _log_estate_action(session, request, "create", user, data_type, db_item.id)
        session.refresh(db_item)  # Re-load attributes after audit logging expired them
        return db_item
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create {data_type} item: {e}", exc_info=True)
        # Include detailed error for debugging (TODO: limit this to dev mode)
        raise HTTPException(status_code=400, detail=f"Could not create item: {str(e)}")

@router.put("/{data_type}/{item_id}", summary="Update estate item")
# 600/minute per client IP (slowapi key_func=get_remote_address): a first upload of
# a few hundred local items (SyncManager.migrateUp, one POST each) completes.
@limiter.limit("600/minute")
def update_item(
    request: Request,
    data_type: str,
    item_id: int,
    body: Dict[str, Any] = Body(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Update an existing estate item with validation and audit logging.
    Accepts raw JSON body (no wrapper needed).
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
        if model is Asset and not _in_category(session, data_type, db_item):
            raise HTTPException(status_code=404, detail="Item not found")

        # Support both raw body and wrapped { data: {...} } format for backwards compatibility
        if "data" in body and isinstance(body["data"], dict) and len(body) == 1:
            updates = body["data"]
        else:
            updates = body

        # Validate input - check for protected fields
        protected_found = PROTECTED_FIELDS & set(updates.keys())
        if protected_found:
            raise ValueError(f"Cannot update protected fields: {protected_found}")

        if data_type in SINGLETON_TYPES:
            updates = dict(updates)
            _encode_singleton_json(updates)

        for key, value in updates.items():
            if key == "custom_attributes" and isinstance(value, dict):
                value = json.dumps(value)

            if key == "category" and model is Asset:
                continue  # asset membership is set on create only
            if hasattr(db_item, key):
                setattr(db_item, key, value)

        session.add(db_item)
        session.commit()
        session.refresh(db_item)

        _log_estate_action(session, request, "update", user, data_type, item_id)
        session.refresh(db_item)  # Re-load attributes after audit logging expired them
        return db_item
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to update {data_type} item {item_id}: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail="Could not update item")

@router.delete("/{data_type}/{item_id}")
# 600/minute per client IP (slowapi key_func=get_remote_address): a first upload of
# a few hundred local items (SyncManager.migrateUp, one POST each) completes.
@limiter.limit("600/minute")
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
        if model is Asset and not _in_category(session, data_type, db_item):
            raise HTTPException(status_code=404, detail="Item not found")

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
