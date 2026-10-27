from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlmodel import Session, select
from backend.limiter import limiter
from datetime import datetime, timedelta, timezone
from backend.utils.clock import utc_now
from backend.database import get_session, User
from backend.auth import get_current_user
import secrets
import base64
from typing import Any, Dict
from pydantic import BaseModel, field_validator
from backend.pulse_models import (
    PulseSettings, PulseCheckin, PulseVault,
    PulseEscalationTier, PulseContact,
    PulseMessage, PulseEscalationLog, PulseSafetyTimer
)
from backend.utils.logger import get_logger
from backend.routers.contacts import ContactCreate, ContactUpdate, _apply as apply_contact_fields
from backend.challenge_store import challenge_store
from backend.utils.table_body import validated_changes

logger = get_logger(__name__)
router = APIRouter(prefix="/api/pulse", tags=["pulse"])


# --- Pydantic Validation Models (P1-High Security) ---

class WebAuthnCredentialPayload(BaseModel):
    """Validated model for WebAuthn credential registration."""
    id: str
    rawId: str
    response: Dict[str, Any]
    type: str

    @field_validator("type")
    @classmethod
    def validate_type(cls, v):
        if v != "public-key":
            raise ValueError("Invalid credential type - must be 'public-key'")
        return v

    @field_validator("response")
    @classmethod
    def validate_response(cls, v):
        required_fields = ["clientDataJSON", "attestationObject"]
        missing = [f for f in required_fields if f not in v]
        if missing:
            raise ValueError(f"Missing required response fields: {missing}")
        return v

@router.post("/checkin", summary="Record a life-check-in", description="Allows the user to manually check in, confirming they are safe. This resets the escalation timer.")
@limiter.limit("5/minute")
def checkin(request: Request, method: str = "manual", note: str = None, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    from backend.pulse_logic import GUARDIAN_CHECKIN_METHODS
    if method in GUARDIAN_CHECKIN_METHODS:  # the owner's own check-in is never a guardian action
        method = "manual"
    return _record_owner_checkin(session, user.id, method, note)


def _record_owner_checkin(session: Session, user_id: int, method: str, note: str = None) -> dict:
    """The owner's own check-in. If it closes an outage in which guardians were alerted, each
    of them gets a short all-clear email (pulse_logic.send_all_clear)."""
    from backend.pulse_logic import owner_last_checkin, send_all_clear
    previous = owner_last_checkin(session, user_id)
    checkin = PulseCheckin(user_id=user_id, method=method, note=note)
    session.add(checkin)
    session.commit()
    session.refresh(checkin)
    send_all_clear(session, user_id, previous.timestamp if previous else datetime.min)
    return {"status": "success", "timestamp": _utc_iso(checkin.timestamp)}


def _tier_activity(session: Session, user_id: int, since: datetime) -> list[dict]:
    """Current-outage stage progression and its named, message-backed email outcomes."""
    from backend.pulse_logic import (
        _outage_tier_times, is_tier_accepted, is_tier_fail, tier_prefix,
        TIER_LOCAL_TEXT, TIER_MAX_ATTEMPTS,
    )
    from backend.pulse_tiers import pulse_tier_expression

    reached = _outage_tier_times(session, user_id, since)
    contacts = session.exec(select(PulseContact, pulse_tier_expression()).where(
        PulseContact.user_id == user_id)).all()
    names = {contact.id: contact.name for contact, _ in contacts}
    members: dict[int, dict[int, list]] = {n: {} for n in reached}
    for contact, n in contacts:
        if n in reached:
            members[n][contact.id] = []
    rows = session.exec(select(PulseMessage).where(
        PulseMessage.user_id == user_id,
        PulseMessage.direction == "user_to_contact",
        PulseMessage.sent_at > since,
        PulseMessage.message.startswith("[System Alert Tier "),
    ).order_by(PulseMessage.id)).all()
    for row in rows:
        for n in range(1, 5):
            if not row.message.startswith(tier_prefix(n)):
                continue
            state = ("provider_accepted" if is_tier_accepted(row.message, n)
                     else "saved_local" if row.message == tier_prefix(n) + TIER_LOCAL_TEXT
                     else "failed" if is_tier_fail(row.message, n)
                     else "recorded")
            members.setdefault(n, {}).setdefault(row.contact_id, []).append({
                "id": row.id, "message": row.message, "sent_at": _utc_iso(row.sent_at), "state": state,
            })
            break

    stages = []
    states = ("provider_accepted", "saved_local", "failed", "awaiting_attempt", "recorded")
    for n, stage_members in sorted(members.items()):
        recipients = []
        for contact_id, evidence in stage_members.items():
            observed = {row["state"] for row in evidence}
            state = next((value for value in states[:3] if value in observed),
                         "recorded" if evidence else "awaiting_attempt")
            failed_attempts = sum(row["state"] == "failed" for row in evidence)
            recipients.append({
                "contact_id": contact_id, "contact_name": names.get(contact_id, "Saved contact"),
                "state": state, "attempts": len(evidence), "failed_attempts": failed_attempts,
                "retry_available": state == "failed" and failed_attempts < TIER_MAX_ATTEMPTS,
                "source_messages": evidence,
            })
        recipients.sort(key=lambda contact: (contact["contact_name"].casefold(), contact["contact_id"]))
        stages.append({
            "tier_number": n, "reached_at": _utc_iso(reached.get(n)), "contacts": recipients,
            "outcomes": [{"state": state, "count": sum(c["state"] == state for c in recipients),
                          "contact_ids": [c["contact_id"] for c in recipients if c["state"] == state]}
                         for state in states],
        })
    return stages


@router.get("/status", summary="Get current Pulse status", description="Returns if Pulse is active, grace period status, and the next expected nudge time.")
def get_status(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    settings = session.get(PulseSettings, user.id)
    if not settings:
        return {"status": "not_configured"}
    if not settings.enabled:
        return {"status": "disabled"}

    # Same clock as the scheduler and the guardian portal (pulse_logic): "active" until the owner's
    # own last check-in + frequency_days; guardian check-ins are listed as such and never reset it.
    from backend.pulse_logic import (owner_last_checkin, guardian_checkin_since,
                                     current_escalation, alerts_paused_until)
    now = utc_now()
    last_checkin = owner_last_checkin(session, user.id)
    since = last_checkin.timestamp if last_checkin else datetime.min
    guardian = guardian_checkin_since(session, user.id, since)
    escalation = current_escalation(session, user.id, since)
    paused_until = alerts_paused_until(settings, guardian)

    freq = timedelta(days=settings.frequency_days)
    next_time = (last_checkin.timestamp if last_checkin else now) + freq

    return {
        "status": "active" if (last_checkin and now < last_checkin.timestamp + freq) else "grace",
        "last_checkin": _utc_iso(last_checkin.timestamp) if last_checkin else None,
        "next_nudge": _utc_iso(next_time),
        "guardian_checkin": {
            "at": _utc_iso(guardian.timestamp),
            "by": (guardian.note or "").rpartition(" by ")[2] or "A guardian",
        } if guardian else None,
        "escalation_tier": escalation.tier_number if escalation else None,
        "escalation_at": _utc_iso(escalation.triggered_at) if escalation else None,
        "tier_activity": _tier_activity(session, user.id, since),
        "alerts_paused_until": _utc_iso(paused_until) if paused_until and now < paused_until else None,
    }

@router.get("/settings", summary="Retrieve Pulse settings", description="Gets the user's Pulse configuration, including frequency and current check-in token.")
def get_settings(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    # A read never writes: with no saved row, return the defaults unsaved. The row (and its
    # check-in token) is created when the person saves their settings.
    settings = session.get(PulseSettings, user.id) or PulseSettings(user_id=user.id)
    data = settings.model_dump()
    # Stored times are naive UTC; send them with "Z" (as /status does) so the browser reads UTC, not local.
    for key in _SETTINGS_DATETIME_FIELDS:
        data[key] = _utc_iso(data.get(key))
    return data

_SETTINGS_DATETIME_FIELDS = ("ghost_mode_until", "safety_timer_active_until", "last_known_location_time")


def _parse_settings_datetime(value):
    """ISO 8601 string (a trailing "Z" or any offset allowed) -> naive UTC datetime; None stays None.
    Anything else is a 422 with a gentle message, never a 500 from the database driver."""
    if value is None:
        return None
    parsed = value if isinstance(value, datetime) else None
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value.strip())
        except ValueError:
            parsed = None
    if parsed is None:
        raise HTTPException(status_code=422, detail="That date and time needs another look. Choose it again whenever you're ready and we'll save it.")
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


_SETTINGS_BOOL_FIELDS = (
    "enabled", "elderly_mode", "notify_contacts_on_checkin", "send_weekly_summary",
    "pet_protocol_enabled", "legacy_heartbeat_enabled", "medical_safe_pass_enabled",
    "location_vault_enabled", "biometric_extension_enabled",
)
# field -> (lowest, highest, gentle message)
_SETTINGS_INT_FIELDS = {
    "frequency_days": (1, 365, "Choose how often we check in as a whole number of days, from 1 to 365."),
    "grace_period_hours": (0, 720, "Choose the grace period as a whole number of hours, from 0 to 720 (30 days)."),
    "biometric_extension_hours": (1, 168, "Choose the biometric extension as a whole number of hours, from 1 to 168 (7 days)."),
}
_SETTINGS_TEXT_FIELDS = {"custom_message": 2000, "pet_details": 2000}
_SETTINGS_COORD_FIELDS = {"last_known_location_lat": 90, "last_known_location_lon": 180}


def _check_settings_fields(data: dict) -> None:
    """PulseSettings is a table model, so FastAPI passes body values through unvalidated.
    Check each non-date field sent by type and range; anything off is a 422 with a gentle message."""
    for key in _SETTINGS_BOOL_FIELDS:
        if key in data and not isinstance(data[key], bool):
            raise HTTPException(status_code=422, detail="One of your Pulse choices needs another look. Turn it on or off again whenever you're ready.")
    for key, (low, high, message) in _SETTINGS_INT_FIELDS.items():
        if key not in data:
            continue
        val = data[key]
        if isinstance(val, float) and val.is_integer():
            val = int(val)
        if isinstance(val, bool) or not isinstance(val, int) or not low <= val <= high:
            raise HTTPException(status_code=422, detail=message)
        data[key] = val
    for key, limit in _SETTINGS_TEXT_FIELDS.items():
        val = data.get(key)
        if val is not None and (not isinstance(val, str) or len(val) > limit):
            raise HTTPException(status_code=422, detail=f"That note needs another look. A few words up to {limit} characters works well.")
    for key, limit in _SETTINGS_COORD_FIELDS.items():
        val = data.get(key)
        if val is not None and (isinstance(val, bool) or not isinstance(val, (int, float)) or not -limit <= val <= limit):
            raise HTTPException(status_code=422, detail="That location needs another look. We'll keep your last saved place until it's ready.")


@router.post("/settings", summary="Update Pulse settings", description="Saves the user's Pulse configuration, creating the row on first save. The check-in token is issued by the server on first save and kept.")
@limiter.limit("600/minute")  # authenticated owner route, same level as /api/data/*
def update_settings(request: Request, new_settings: PulseSettings, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    settings = session.get(PulseSettings, user.id)
    was_enabled = bool(settings and settings.enabled)
    if not settings:
        settings = PulseSettings(user_id=user.id)
        session.add(settings)

    settings_data = new_settings.dict(exclude_unset=True)
    settings_data.pop("user_id", None)  # the row always belongs to the signed-in person
    settings_data.pop("checkin_token", None)  # server-issued, kept once made
    _check_settings_fields(settings_data)
    # PulseSettings is a table model, so the body is not validated: its DateTime fields arrive as
    # the raw JSON value (an ISO string from the browser). Parse them here to naive UTC, the form
    # every stored time and utc_now() comparison uses; null clears the field.
    for key in _SETTINGS_DATETIME_FIELDS:
        if key in settings_data:
            settings_data[key] = _parse_settings_datetime(settings_data[key])
    for key, value in settings_data.items():
        setattr(settings, key, value)
    if not settings.checkin_token:
        settings.checkin_token = secrets.token_urlsafe(16)
    if settings.enabled and not was_enabled:
        # Turning Pulse on starts the owner's clock now. With no check-in on record the outage
        # would date from datetime.min and the first scheduler pass would alert Tier 1 at once.
        session.add(PulseCheckin(user_id=user.id, method=PULSE_ENABLED_METHOD, note="Wellness check-ins began"))

    session.add(settings)
    session.commit()
    return {"status": "updated"}

PULSE_ENABLED_METHOD = "pulse_enabled"  # an owner check-in (pulse_logic.owner_last_checkin counts it)

@router.get("/history")
def get_history(limit: int = Query(10, ge=1, le=500), user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    statement = select(PulseCheckin).where(PulseCheckin.user_id == user.id).order_by(PulseCheckin.timestamp.desc()).limit(limit)
    # Stored times are naive UTC; send them with "Z" (as /status does) so the browser reads UTC
    return [{**c.model_dump(), "timestamp": _utc_iso(c.timestamp)} for c in session.exec(statement).all()]

@router.get("/contacts")
def get_contacts(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    statement = select(PulseContact).where(PulseContact.user_id == user.id)
    return session.exec(statement).all()

@router.post("/contacts", summary="Create a Guardian contact", description="Adds a new contact who will be notified during Pulse escalation. Generates a unique portal token for them.")
def create_contact(body: ContactCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    # Validated body (C8 schema): id, user_id and portal tokens are set here, never from the client.
    # notify_on_safety_timer keeps the column default (enrolled) unless the person chooses otherwise.
    contact = PulseContact(user_id=user.id, name=body.name,
                           portal_token=secrets.token_urlsafe(32))  # Grant portal access immediately
    apply_contact_fields(contact, body.model_dump(exclude_unset=True), user, session)
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return contact

@router.put("/contacts/{contact_id}")
def update_contact(contact_id: int, updated: ContactUpdate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    contact = session.get(PulseContact, contact_id)
    if not contact or contact.user_id != user.id:
        raise HTTPException(status_code=404, detail="That contact may have been moved.")

    apply_contact_fields(contact, updated.model_dump(exclude_unset=True), user, session)

    session.add(contact)
    session.commit()
    session.refresh(contact)  # commit expires the instance; return the saved row
    return contact

@router.delete("/contacts/{contact_id}")
def delete_contact(contact_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    contact = session.get(PulseContact, contact_id)
    if not contact or contact.user_id != user.id:
        raise HTTPException(status_code=404, detail="That contact may have been moved.")
    session.delete(contact)
    session.commit()
    return {"status": "deleted"}

# --- Guardian Portal (Public Access) ---
# Rate limiting on public endpoints to prevent abuse

# --- Guardian portal helpers ---

# A guardian's snooze ("they're OK") or confirmation ("I've spoken to them") is stored as a
# PulseCheckin with a guardian method (pulse_logic.GUARDIAN_CHECKIN_METHODS). It pauses new alerts
# (pulse_logic.alerts_paused_until) but is never the owner's own check-in, so the portal ignores
# it for status, the shown time and vault access; one guardian's action leaves every other
# guardian's access as it was.
GUARDIAN_SNOOZE_METHOD = "guardian_snooze"
GUARDIAN_CONFIRMATION_METHOD = "guardian_confirmation"


def _owner_last_checkin(session: Session, user_id: int):
    from backend.pulse_logic import owner_last_checkin
    return owner_last_checkin(session, user_id)


def _utc_iso(ts: datetime):
    """Stored times are naive UTC; send them as aware ISO with "Z" so browsers read them as UTC."""
    if ts is None:
        return None
    ts = ts.replace(tzinfo=timezone.utc) if ts.tzinfo is None else ts.astimezone(timezone.utc)
    return ts.isoformat().replace("+00:00", "Z")


@router.get("/transparency")
def get_transparency(contact_id: int | None = None, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Owner-only current portal preview; planned/private record names remain in their own block."""
    from backend.pulse_logic import guardian_link_state, guardian_portal_view, guardian_vault_records, guardian_vault_out
    from backend.pulse_tiers import pulse_tier_expression

    # One chooser query; build the detailed snapshot only for the selected guardian.
    rows = session.exec(select(PulseContact, pulse_tier_expression()).where(
        PulseContact.user_id == user.id).order_by(PulseContact.name, PulseContact.id)).all()
    rows = [(contact, tier) for contact, tier in rows
            if contact.portal_token or tier is not None or contact.notify_on_safety_timer]
    guardians = [{"id": contact.id, "name": contact.name, "tier_number": tier,
                  "link_state": guardian_link_state(contact)} for contact, tier in rows]
    selected = next(((contact, tier) for contact, tier in rows if contact.id == contact_id), None) if contact_id is not None else (rows[0] if rows else None)
    if contact_id is not None and selected is None:
        raise HTTPException(status_code=404, detail="Choose one of the people in your circle to open their view.")
    if selected is None:
        return {"guardians": guardians, "preview": None}

    contact, tier_number = selected
    link_state = guardian_link_state(contact)
    view = guardian_portal_view(session, contact) if link_state == "ready" else None
    opened = guardian_vault_records(session, contact) if view else []
    opened_ids = {item.id for item in opened}
    vault = session.exec(select(PulseVault).where(PulseVault.user_id == user.id)).all()
    pulse_settings = session.get(PulseSettings, user.id) or PulseSettings(user_id=user.id)
    tiers = session.exec(select(PulseEscalationTier).where(
        PulseEscalationTier.user_id == user.id).order_by(PulseEscalationTier.tier_number)).all()
    return {
        "guardians": guardians,
        "preview": {
            "contact_id": contact.id, "contact_name": contact.name, "tier_number": tier_number,
            "link_state": link_state, "view": view, "vault": guardian_vault_out(opened),
            "planned": {
                "release_enabled": pulse_settings.location_vault_enabled,
                "pulse_enabled": pulse_settings.enabled,
                "frequency_days": pulse_settings.frequency_days,
                "grace_period_hours": pulse_settings.grace_period_hours,
                "personal_wait_hours": max(0, contact.individual_delay_hours) if contact.individual_delay_hours is not None else None,
                "tier_waits": [{"tier_number": tier.tier_number, "hours": tier.delay_hours}
                               for tier in tiers if tier_number is not None and tier.tier_number <= tier_number],
                "private_vault": [{"id": item.id, "name": item.name, "unlock_condition": item.unlock_condition}
                                  for item in vault if item.id not in opened_ids],
            },
        },
    }


@router.get("/portal/{token}")
@limiter.limit("30/minute")  # P1-High: Rate limit public portal
def get_portal_view(request: Request, token: str, session: Session = Depends(get_session)):
    # 1. Verify Token
    statement = select(PulseContact).where(PulseContact.portal_token == token)
    contact = session.exec(statement).first()
    if not contact:
        raise HTTPException(status_code=404, detail="This link has rested. The person who shared it can send a fresh one.")
    if contact.portal_token_expires and contact.portal_token_expires < utc_now():
        raise HTTPException(status_code=401, detail="This link has rested. The person who shared it can send a fresh one.")

    from backend.pulse_logic import guardian_portal_view
    return guardian_portal_view(session, contact)

@router.get("/portal/{token}/vault")
@limiter.limit("10/minute")  # Public portal read, authorized by the portal token
def get_portal_vault(request: Request, token: str, session: Session = Depends(get_session)):
    contact = session.exec(select(PulseContact).where(PulseContact.portal_token == token)).first()
    if not contact:
        raise HTTPException(status_code=404, detail="This link has rested. The person who shared it can send a fresh one.")
    if contact.portal_token_expires and contact.portal_token_expires < utc_now():
        raise HTTPException(status_code=401, detail="This link has rested. The person who shared it can send a fresh one.")

    from backend.pulse_logic import guardian_vault_records, guardian_vault_out
    return guardian_vault_out(guardian_vault_records(session, contact))

@router.post("/respond/{token}")
@limiter.limit("10/minute")  # P1-High: Rate limit public portal actions
def guardian_respond(request: Request, token: str, action: str, session: Session = Depends(get_session)):
    contact = session.exec(select(PulseContact).where(PulseContact.portal_token == token)).first()
    if not contact: raise HTTPException(status_code=404, detail="This link has rested. The person who shared it can send a fresh one.")
    if contact.portal_token_expires and contact.portal_token_expires < utc_now():
        raise HTTPException(status_code=401, detail="This link has rested. The person who shared it can send a fresh one.")
    if action not in ("snooze", "acknowledge"):
        raise HTTPException(status_code=400, detail="This link offers two choices: they're OK, or I've seen this.")

    if action == "snooze":
        # Pauses new alerts (pulse_logic.alerts_paused_until); the owner's own clock, escalation
        # history and other guardians' access stay as they were
        checkin_rec = PulseCheckin(user_id=contact.user_id, method=GUARDIAN_SNOOZE_METHOD, note=f"Marked OK by {contact.name}")
        session.add(checkin_rec)
        session.commit()
        return {"status": "snoozed"}

    if action == "acknowledge":
        # "I've seen this": a note to the owner on their Messages page. Never a check-in, so the
        # owner's clock, alerts and every guardian's access stay as they were. One note per guardian
        # per outage: a repeat since the owner's own last check-in adds nothing.
        from backend.pulse_logic import owner_last_checkin
        last = owner_last_checkin(session, contact.user_id)
        repeat = select(PulseMessage.id).where(
            PulseMessage.user_id == contact.user_id,
            PulseMessage.contact_id == contact.id,
            PulseMessage.direction == "contact_to_user",
            PulseMessage.message == ACKNOWLEDGE_MESSAGE,
        )
        if last:
            repeat = repeat.where(PulseMessage.sent_at > last.timestamp)
        if session.exec(repeat).first() is None:
            session.add(PulseMessage(user_id=contact.user_id, contact_id=contact.id,
                                     direction="contact_to_user", message=ACKNOWLEDGE_MESSAGE))
            session.commit()
    return {"status": "acknowledged"}

ACKNOWLEDGE_MESSAGE = "I've seen this. I'm looking in on you."

# --- Messaging ---

@router.get("/messages")
def get_messages(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    statement = select(PulseMessage).where(PulseMessage.user_id == user.id).order_by(PulseMessage.sent_at.desc())
    return [{**m.model_dump(), "sent_at": _utc_iso(m.sent_at), "read_at": _utc_iso(m.read_at)}
            for m in session.exec(statement).all()]

@router.post("/messages")
def send_message(contact_id: int, message: str, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    contact = session.get(PulseContact, contact_id)
    if not contact or contact.user_id != user.id:
        raise HTTPException(status_code=404, detail="That contact may have been moved.")
        
    msg = PulseMessage(user_id=user.id, contact_id=contact_id, direction="user_to_contact", message=message)
    session.add(msg)
    session.commit()
    return {"status": "sent"}

# --- Vault & Instructions ---

class VaultItemIn(BaseModel):
    name: str
    content: str
    unlock_condition: str = "tier_3_escalation"

def _vault_out(item: PulseVault) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "content": (item.encrypted_content or b"").decode("utf-8", errors="replace"),
        "unlock_condition": item.unlock_condition,
    }

@router.get("/vault")
@limiter.limit("600/minute")  # authenticated owner route, same level as /api/data/*
def get_vault(request: Request, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    items = session.exec(select(PulseVault).where(PulseVault.user_id == user.id)).all()
    return [_vault_out(i) for i in items]

@router.post("/vault")
def add_vault_item(data: VaultItemIn, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    # Not actually encrypted: "encrypted_content" holds plain UTF-8 text (encryption is out of scope).
    item = PulseVault(user_id=user.id, name=data.name, encrypted_content=data.content.encode("utf-8"), unlock_condition=data.unlock_condition)
    session.add(item)
    session.commit()
    session.refresh(item)
    return _vault_out(item)

@router.delete("/vault/{item_id}")
def delete_vault_item(item_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    item = session.get(PulseVault, item_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="That note may have been moved.")
    session.delete(item)
    session.commit()
    return {"status": "deleted"}

@router.put("/vault/{item_id}")
def update_vault_item(item_id: int, data: VaultItemIn, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    item = session.get(PulseVault, item_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="That note may have been moved.")

    item.name = data.name
    item.encrypted_content = data.content.encode("utf-8")  # plain UTF-8, not encrypted
    item.unlock_condition = data.unlock_condition

    session.add(item)
    session.commit()
    session.refresh(item)
    return _vault_out(item)

@router.post("/nudge/{token}")
@limiter.limit("10/minute")  # Public portal action, authorized by the portal token
def send_nudge(request: Request, token: str, session: Session = Depends(get_session)):
    contact = session.exec(select(PulseContact).where(PulseContact.portal_token == token)).first()
    if not contact:
        raise HTTPException(status_code=404, detail="This link has rested. The person who shared it can send a fresh one.")
    if contact.portal_token_expires and contact.portal_token_expires < utc_now():
        raise HTTPException(status_code=401, detail="This link has rested. The person who shared it can send a fresh one.")

    logger.info(
        "Pulse nudge sent to user",
        extra={"context": {
            "from_contact": contact.name,
            "to_user_id": contact.user_id,
            "contact_id": contact.id
        }}
    )

    msg = PulseMessage(
        user_id=contact.user_id,
        contact_id=contact.id,
        direction="contact_to_user",
        message="Thinking of you."
    )
    session.add(msg)
    session.commit()

    return {"status": "nudge_sent"}

@router.post("/confirm/{token}")
@limiter.limit("10/minute")  # P1-High: Rate limit public confirmation
def confirm_contact(request: Request, token: str, session: Session = Depends(get_session)):
    contact = session.exec(select(PulseContact).where(PulseContact.portal_token == token)).first()
    if not contact:
        raise HTTPException(status_code=404, detail="This link has rested. The person who shared it can send a fresh one.")
    if contact.portal_token_expires and contact.portal_token_expires < utc_now():
        raise HTTPException(status_code=401, detail="This link has rested. The person who shared it can send a fresh one.")

    # A guardian action, like a snooze: pauses new alerts, never the owner's own check-in
    checkin = PulseCheckin(
        user_id=contact.user_id,
        method=GUARDIAN_CONFIRMATION_METHOD,
        note=f"Confirmed by {contact.name}"
    )
    session.add(checkin)
    session.commit()
    
    return {"status": "confirmed"}

# --- Safety & Monitoring ---

@router.post("/safety/start")
def start_safety_timer(minutes: int = Query(..., ge=1, le=1440), purpose: str = Query("Walking home", max_length=200), user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    existing = session.exec(select(PulseSafetyTimer).where(PulseSafetyTimer.user_id == user.id, PulseSafetyTimer.is_active == True)).all()
    for t in existing: t.is_active = False; session.add(t)
        
    expires = utc_now() + timedelta(minutes=minutes)
    timer = PulseSafetyTimer(user_id=user.id, expires_at=expires, purpose=purpose)
    session.add(timer)
    session.commit()
    session.refresh(timer)  # after commit the row is expired and would serialize as {}
    return _safety_timer_out(timer)

def _safety_timer_out(timer: PulseSafetyTimer):
    # Times go out as UTC with "Z" so the countdown reads them correctly in any time zone
    data = timer.model_dump()
    data["started_at"] = _utc_iso(timer.started_at)
    data["expires_at"] = _utc_iso(timer.expires_at)
    return data

@router.get("/safety/status")
def get_safety_status(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    timer = session.exec(select(PulseSafetyTimer).where(PulseSafetyTimer.user_id == user.id, PulseSafetyTimer.is_active == True)).first()
    return _safety_timer_out(timer) if timer else None

@router.post("/safety/cancel")
def cancel_safety_timer(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    timer = session.exec(select(PulseSafetyTimer).where(PulseSafetyTimer.user_id == user.id, PulseSafetyTimer.is_active == True)).first()
    if timer:
        timer.is_active = False
        session.add(timer)
        session.commit()
    return {"status": "cancelled"}

# --- Magic Link ---

_VERIFY_RESTED = "This link has rested. You can check in from your Wellness Check-in page any time."

def _verify_settings(session: Session, token: str) -> PulseSettings:
    settings = session.exec(select(PulseSettings).where(PulseSettings.checkin_token == token)).first()
    if not settings:
        raise HTTPException(status_code=404, detail=_VERIFY_RESTED)
    return settings

@router.get("/verify/{token}", summary="Read the owner's one-click check-in link (records nothing)")
@limiter.limit("10/minute")  # P1-High: Rate limit magic link verification
def read_checkin_token(request: Request, token: str, session: Session = Depends(get_session)):
    # Read-only: mail scanners pre-open links, so opening the page must never check the owner in
    from backend.pulse_logic import owner_display_name
    settings = _verify_settings(session, token)
    return {"status": "ready", "user_name": owner_display_name(session, settings.user_id, fallback=""),
            "frequency_days": settings.frequency_days}

@router.post("/verify/{token}", summary="Record the owner's one-click check-in")
@limiter.limit("10/minute")
def verify_checkin_token(request: Request, token: str, session: Session = Depends(get_session)):
    settings = _verify_settings(session, token)
    result = _record_owner_checkin(session, settings.user_id, "magic_link", "One-Click Link")
    return {**result, "frequency_days": settings.frequency_days}

@router.get("/tiers")
def get_tiers(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    tiers = session.exec(select(PulseEscalationTier).where(PulseEscalationTier.user_id == user.id).order_by(PulseEscalationTier.tier_number)).all()
    if not tiers:
        # Auto-initialize defaults
        defaults = [
            PulseEscalationTier(user_id=user.id, tier_number=1, delay_hours=0, notification_method="email"),
            PulseEscalationTier(user_id=user.id, tier_number=2, delay_hours=6, notification_method="both"),
            PulseEscalationTier(user_id=user.id, tier_number=3, delay_hours=12, notification_method="both"),
            PulseEscalationTier(user_id=user.id, tier_number=4, delay_hours=24, notification_method="both"),
        ]
        for t in defaults:
            session.add(t)
        session.commit()
        # Refresh to get IDs
        tiers = session.exec(select(PulseEscalationTier).where(PulseEscalationTier.user_id == user.id).order_by(PulseEscalationTier.tier_number)).all()
    
    return tiers

@router.put("/tiers/{tier_id}")
def update_tier(tier_id: int, updated: PulseEscalationTier, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    tier = session.get(PulseEscalationTier, tier_id)
    if not tier or tier.user_id != user.id:
        raise HTTPException(status_code=404, detail="That tier may have been moved.")
    
    # Only these two are the owner's to change; an omitted one keeps its saved value.
    changes = updated.model_dump(exclude_unset=True, include={"delay_hours", "notification_method"})
    for key, val in validated_changes(PulseEscalationTier, tier, changes).items():
        setattr(tier, key, val)

    session.add(tier)
    session.commit()
    session.refresh(tier)  # the commit expires it; otherwise the response is {}
    return tier

from backend.security import get_registration_options, verify_registration
from backend.pulse_models import PulseCredential

@router.post("/auth/webauthn/register/start")
def register_webauthn_start(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Start WebAuthn registration for current user."""
    options = get_registration_options(str(user.id), user.email)

    # Store challenge temporarily (uses Redis in production, in-memory in development)
    challenge_store.set(f"pulse_webauthn:{user.id}", options.challenge, expire_seconds=300)

    # Convert to JSON-compatible dict
    from webauthn import options_to_json
    import json
    return json.loads(options_to_json(options))

@router.post("/auth/webauthn/register/finish")
def register_webauthn_finish(payload: WebAuthnCredentialPayload, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Finish WebAuthn registration for current user.
    Uses Pydantic validation for payload security (P1-High).
    """
    challenge = challenge_store.pop(f"pulse_webauthn:{user.id}")
    if not challenge:
        raise HTTPException(status_code=400, detail="That passkey step paused. Start it again whenever you're ready.")

    try:
        # Verify the registration - convert Pydantic model to dict for library
        verification = verify_registration(
            options={"challenge": challenge},
            response=payload.model_dump()
        )

        # Store credential
        cred_id = verification.credential_id
        pub_key = verification.credential_public_key
        
        # Convert bytes to base64url strings for safe storage
        cred_id_b64 = base64.urlsafe_b64encode(cred_id).decode('utf-8').rstrip('=')
        pub_key_b64 = base64.urlsafe_b64encode(pub_key).decode('utf-8').rstrip('=')

        # Check if credential already exists
        existing = session.get(PulseCredential, cred_id_b64)
        if existing:
            session.delete(existing)
            session.commit()

        new_cred = PulseCredential(
            id=cred_id_b64,
            user_id=user.id,
            public_key=pub_key_b64,
            sign_count=verification.sign_count
        )
        session.add(new_cred)
        session.commit()

        return {"status": "verified", "credential_id": cred_id_b64}

    except Exception as e:
        logger.error(
            "WebAuthn verification failed for Pulse credential",
            extra={"context": {
                "error": str(e),
                "error_type": type(e).__name__
            }},
            exc_info=True
        )
        raise HTTPException(status_code=400, detail="Let's try setting up your device again in a moment.")
