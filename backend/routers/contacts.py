import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import StringConstraints
from sqlmodel import Session, SQLModel, select
from typing import Annotated, List, Literal, Optional
from backend.database import get_session, User
from backend.auth import get_current_user
from backend.pulse_models import PulseContact, PulseEscalationTier
from backend.estate_models import ContactRelationship
from backend.utils.audit import log_audit, log_deletion
from backend.utils.table_body import validated_new

router = APIRouter(prefix="/api/contacts", tags=["contacts"])

ContactName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
CallTier = Literal["1_Immediate", "2_SameDay", "3_Service", "4_DNR"]
NotificationStatus = Literal["Pending", "Called", "LeftMsg", "Notified", "Unreachable"]


class ContactUpdate(SQLModel):
    """Fields the owner may set on a contact. id, user_id and portal tokens stay server-side;
    unknown keys from the client (camelCase UI helpers) are ignored."""
    name: Optional[ContactName] = None
    role: Optional[str] = None
    relation: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    avatar: Optional[str] = None
    is_executor: Optional[bool] = None
    is_beneficiary: Optional[bool] = None
    is_emergency_contact: Optional[bool] = None
    custom_attributes: Optional[str] = None
    tier_id: Optional[int] = None
    priority: Optional[int] = None
    can_view_history: Optional[bool] = None
    individual_delay_hours: Optional[int] = None
    notify_on_safety_timer: Optional[bool] = None
    call_tier: Optional[CallTier] = None
    notification_status: Optional[NotificationStatus] = None


class ContactCreate(ContactUpdate):
    name: ContactName


def _apply(contact: PulseContact, data: dict, user: User, session: Session) -> None:
    """Copy validated fields onto the row. A tier_id must be one of this user's Pulse tiers
    (0 or null means none); otherwise the insert would 500 on the foreign key."""
    if "tier_id" in data:
        if not data["tier_id"]:
            data["tier_id"] = None
        else:
            tier = session.get(PulseEscalationTier, data["tier_id"])
            if not tier or tier.user_id != user.id:
                raise HTTPException(status_code=422, detail="Choose one of your own notification tiers.")
    # Columns with a default: an explicit null keeps the row's value instead of breaking NOT NULL.
    for key, val in data.items():
        if val is None and key in ("name", "role", "is_executor", "is_beneficiary",
                                   "is_emergency_contact", "priority", "can_view_history",
                                   "notify_on_safety_timer"):
            continue
        setattr(contact, key, val)
    # A guardian (a Pulse tier, or the safety-timer reach-out) needs a portal link for their
    # alert emails; issue one the first time, keep it after (links already sent stay valid).
    if not contact.portal_token and (contact.tier_id or contact.notify_on_safety_timer):
        contact.portal_token = secrets.token_urlsafe(32)

@router.get("", response_model=List[PulseContact])
@router.get("/", response_model=List[PulseContact])
def get_contacts(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Fetch all contacts for the user (both Guardians and Non-Guardians)."""
    statement = select(PulseContact).where(PulseContact.user_id == user.id)
    return session.exec(statement).all()

@router.post("", response_model=PulseContact)
@router.post("/", response_model=PulseContact)
def create_contact(request: Request, body: ContactCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Create a new global contact."""
    # Contacts added here start outside the Pulse safety-timer reach-out (the column default
    # enrolls them); the person can still choose it, here or on the Pulse pages.
    contact = PulseContact(user_id=user.id, name=body.name, notify_on_safety_timer=False)
    _apply(contact, body.model_dump(exclude_unset=True), user, session)

    session.add(contact)
    session.flush()  # assigns contact.id for the audit row

    # P1-High: Audit logging for contact creation
    log_audit(
        session=session,
        request=request,
        action="create_contact",
        user_id=user.id,
        user_email=user.email,
        resource_type="contact",
        resource_id=str(contact.id),
        commit=False,
    )
    session.commit()  # the row and its audit entry in one transaction (X279)
    session.refresh(contact)
    return contact

@router.put("/{contact_id}", response_model=PulseContact)
def update_contact(contact_id: int, updated: ContactUpdate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Update a contact. Only the fields sent are changed."""
    contact = session.get(PulseContact, contact_id)
    if not contact or contact.user_id != user.id:
        raise HTTPException(status_code=404, detail="That contact may have been moved.")

    _apply(contact, updated.model_dump(exclude_unset=True), user, session)

    session.add(contact)
    session.commit()
    session.refresh(contact)
    return contact

@router.delete("/{contact_id}")
def delete_contact(request: Request, contact_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Delete a contact."""
    contact = session.get(PulseContact, contact_id)
    if not contact or contact.user_id != user.id:
        raise HTTPException(status_code=404, detail="That contact may have been moved.")

    # P1-High: Audit logging for contact deletion
    log_deletion(
        session=session,
        request=request,
        user_id=user.id,
        user_email=user.email,
        resource_type="contact",
        resource_id=contact_id,
        commit=False,  # written by the delete's own commit (X279)
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
def create_relationship(request: Request, rel: ContactRelationship, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    rel = validated_new(ContactRelationship, rel, user.id)
    session.add(rel)
    session.flush()  # assigns rel.id for the audit row
    log_audit(
        session=session,
        request=request,
        action="create_contact_relationship",
        user_id=user.id,
        user_email=user.email,
        resource_type="contact_relationship",
        resource_id=str(rel.id),
        commit=False,
    )
    session.commit()  # the row and its audit entry in one transaction (X289)
    session.refresh(rel)
    return rel

@router.delete("/relationships/{rel_id}")
def delete_relationship(request: Request, rel_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    rel = session.get(ContactRelationship, rel_id)
    if not rel or rel.user_id != user.id:
        raise HTTPException(status_code=404, detail="That relationship may have been moved.")

    log_deletion(
        session=session,
        request=request,
        user_id=user.id,
        user_email=user.email,
        resource_type="contact_relationship",
        resource_id=rel_id,
        commit=False,  # written by the delete's own commit (X289)
    )
    session.delete(rel)
    session.commit()
    return {"status": "deleted"}
