from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timedelta
from backend.database import get_session, User
from backend.auth import get_current_user
import secrets
from backend.pulse_models import (
    PulseSettings, PulseCheckin, PulseVault, 
    PulseEscalationTier, PulseContact,
    PulseMessage, PulseEscalationLog, PulseSafetyTimer
)

router = APIRouter(prefix="/api/pulse", tags=["pulse"])

@router.post("/checkin")
def checkin(method: str = "manual", note: str = None, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    checkin = PulseCheckin(user_id=user.id, method=method, note=note)
    session.add(checkin)
    session.commit()
    return {"status": "success", "timestamp": checkin.timestamp}

@router.get("/status")
def get_status(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    settings = session.get(PulseSettings, user.id)
    if not settings:
        return {"status": "not_configured"}
    if not settings.enabled:
        return {"status": "disabled"}

    statement = select(PulseCheckin).where(PulseCheckin.user_id == user.id).order_by(PulseCheckin.timestamp.desc())
    last_checkin = session.exec(statement).first()
    
    # Calculate next expected (simplified)
    freq = settings.frequency_days or 2
    next_time = (last_checkin.timestamp if last_checkin else datetime.utcnow()) + timedelta(days=freq)
    
    return {
        "status": "active" if (last_checkin and last_checkin.timestamp > datetime.utcnow() - timedelta(days=freq+1)) else "grace",
        "last_checkin": last_checkin.timestamp if last_checkin else None,
        "next_nudge": next_time.strftime("%Y-%m-%d %H:%M")
    }

@router.get("/settings")
def get_settings(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    settings = session.get(PulseSettings, user.id)
    if not settings:
        settings = PulseSettings(user_id=user.id, checkin_token=secrets.token_urlsafe(16))
        session.add(settings)
        session.commit()
    elif not settings.checkin_token:
        settings.checkin_token = secrets.token_urlsafe(16)
        session.add(settings)
        session.commit()
    return settings

@router.post("/settings")
def update_settings(new_settings: PulseSettings, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    settings = session.get(PulseSettings, user.id)
    if not settings:
        settings = PulseSettings(user_id=user.id)
        session.add(settings)
    
    settings_data = new_settings.dict(exclude_unset=True)
    for key, value in settings_data.items():
        setattr(settings, key, value)
        
    session.add(settings)
    session.commit()
    return {"status": "updated"}

@router.get("/history")
def get_history(limit: int = 10, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    statement = select(PulseCheckin).where(PulseCheckin.user_id == user.id).order_by(PulseCheckin.timestamp.desc()).limit(limit)
    return session.exec(statement).all()

@router.get("/contacts")
def get_contacts(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    statement = select(PulseContact).where(PulseContact.user_id == user.id)
    return session.exec(statement).all()

@router.post("/contacts")
def create_contact(contact: PulseContact, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    contact.user_id = user.id
    contact.portal_token = secrets.token_urlsafe(32) # Grant portal access immediately
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return contact

@router.put("/contacts/{contact_id}")
def update_contact(contact_id: int, updated: PulseContact, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    contact = session.get(PulseContact, contact_id)
    if not contact or contact.user_id != user.id:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    data = updated.dict(exclude_unset=True)
    for key, val in data.items():
        if key != "id": setattr(contact, key, val)
    
    session.add(contact)
    session.commit()
    return contact

@router.delete("/contacts/{contact_id}")
def delete_contact(contact_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    contact = session.get(PulseContact, contact_id)
    if not contact or contact.user_id != user.id:
        raise HTTPException(status_code=404, detail="Contact not found")
    session.delete(contact)
    session.commit()
    return {"status": "deleted"}

# --- Guardian Portal (Public Access) ---

@router.get("/portal/{token}")
def get_portal_view(token: str, session: Session = Depends(get_session)):
    # 1. Verify Token
    statement = select(PulseContact).where(PulseContact.portal_token == token)
    contact = session.exec(statement).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Invalid portal token")
        
    # 2. Get User Status
    user_id = contact.user_id
    user = session.get(User, user_id)
    user_checkin_stmt = select(PulseCheckin).where(PulseCheckin.user_id == user_id).order_by(PulseCheckin.timestamp.desc())
    last_checkin = session.exec(user_checkin_stmt).first()
    
    # Check active escalation for sensitive data
    escalation_stmt = select(PulseEscalationLog).where(PulseEscalationLog.user_id == user_id).order_by(PulseEscalationLog.id.desc())
    last_escalation = session.exec(escalation_stmt).first()
    
    show_sensitive = False
    if last_escalation:
        tier = session.get(PulseEscalationTier, contact.tier_id)
        if tier and last_escalation.tier_number >= tier.tier_number:
            show_sensitive = True

    return {
        "user_id": user_id,
        "contact_id": contact.id,
        "contact_name": contact.name,
        "user_name": user.email.split('@')[0].capitalize() if user else "Estate Owner",
        "user_status": "active" if (last_checkin and last_checkin.timestamp > datetime.utcnow() - timedelta(hours=48)) else "grace",
        "last_checkin": last_checkin.timestamp if last_checkin else None,
        "show_sensitive": show_sensitive,
        "sensitive_data": {
             "medical_proxy": "Active" if show_sensitive else "Locked",
             "safe_pass": show_sensitive
        }
    }

@router.post("/respond/{token}")
def guardian_respond(token: str, action: str, session: Session = Depends(get_session)):
    contact = session.exec(select(PulseContact).where(PulseContact.portal_token == token)).first()
    if not contact: raise HTTPException(status_code=404, detail="Invalid token")
        
    if action == "snooze":
        checkin_rec = PulseCheckin(user_id=contact.user_id, method="guardian_snooze", note=f"Snoozed by {contact.name}")
        session.add(checkin_rec)
        session.commit()
        return {"status": "snoozed"}
    
    return {"status": "acknowledged"}

# --- Messaging ---

@router.get("/messages")
def get_messages(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    statement = select(PulseMessage).where(PulseMessage.user_id == user.id).order_by(PulseMessage.sent_at.desc())
    return session.exec(statement).all()

@router.post("/messages")
def send_message(contact_id: int, message: str, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    contact = session.get(PulseContact, contact_id)
    if not contact or contact.user_id != user.id:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    msg = PulseMessage(user_id=user.id, contact_id=contact_id, direction="user_to_contact", message=message)
    session.add(msg)
    session.commit()
    return {"status": "sent"}

# --- Vault & Instructions ---

@router.get("/vault")
def get_vault(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    return session.exec(select(PulseVault).where(PulseVault.user_id == user.id)).all()

@router.post("/vault")
def add_vault_item(item: PulseVault, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    item.user_id = user.id
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@router.delete("/vault/{item_id}")
def delete_vault_item(item_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    item = session.get(PulseVault, item_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Item not found")
    session.delete(item)
    session.commit()
    return {"status": "deleted"}

@router.put("/vault/{item_id}")
def update_vault_item(item_id: int, updated: PulseVault, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    item = session.get(PulseVault, item_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item.name = updated.name
    item.content = updated.content
    item.unlock_condition = updated.unlock_condition
    
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@router.post("/nudge")
def send_nudge(contact_id: int, session: Session = Depends(get_session)):
    # In a real app, this would trigger an email/SMS to the user
    # For now, we'll log it or perhaps create a system message
    contact = session.get(PulseContact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    print(f"--- NUDGE SENT from {contact.name} to User {contact.user_id} ---")
    
    # Optional: ensure we log a message
    msg = PulseMessage(
        user_id=contact.user_id, 
        contact_id=contact.id, 
        direction="contact_to_user", 
        message="Thinking of you! Just sending a quick nudge."
    )
    session.add(msg)
    session.commit()
    
    return {"status": "nudge_sent"}

@router.post("/confirm/{token}")
def confirm_contact(token: str, session: Session = Depends(get_session)):
    contact = session.exec(select(PulseContact).where(PulseContact.portal_token == token)).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Invalid token")
    
    # Resetting the user's safety timer or logging a 'spoken to' event
    # This effectively acts as a proxy check-in
    checkin = PulseCheckin(
        user_id=contact.user_id, 
        method="guardian_confirmation", 
        note=f"Confirmed by {contact.name}"
    )
    session.add(checkin)
    session.commit()
    
    return {"status": "confirmed"}

# --- Safety & Monitoring ---

@router.post("/safety/start")
def start_safety_timer(minutes: int, purpose: str = "Walking home", user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    existing = session.exec(select(PulseSafetyTimer).where(PulseSafetyTimer.user_id == user.id, PulseSafetyTimer.is_active == True)).all()
    for t in existing: t.is_active = False; session.add(t)
        
    expires = datetime.utcnow() + timedelta(minutes=minutes)
    timer = PulseSafetyTimer(user_id=user.id, expires_at=expires, purpose=purpose)
    session.add(timer)
    session.commit()
    return timer

@router.get("/safety/status")
def get_safety_status(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    return session.exec(select(PulseSafetyTimer).where(PulseSafetyTimer.user_id == user.id, PulseSafetyTimer.is_active == True)).first()

@router.post("/safety/cancel")
def cancel_safety_timer(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    timer = session.exec(select(PulseSafetyTimer).where(PulseSafetyTimer.user_id == user.id, PulseSafetyTimer.is_active == True)).first()
    if timer:
        timer.is_active = False
        session.add(timer)
        session.commit()
    return {"status": "cancelled"}

# --- Magic Link ---

@router.get("/verify/{token}")
def verify_checkin_token(token: str, session: Session = Depends(get_session)):
    settings = session.exec(select(PulseSettings).where(PulseSettings.checkin_token == token)).first()
    if not settings: raise HTTPException(status_code=404, detail="Invalid token")
        
    checkin_rec = PulseCheckin(user_id=settings.user_id, method="magic_link", note="One-Click Link")
    session.add(checkin_rec)
    session.commit()
    return {"status": "success", "user_id": settings.user_id}

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
        raise HTTPException(status_code=404, detail="Tier not found")
    
    tier.delay_hours = updated.delay_hours
    tier.notification_method = updated.notification_method
    
    session.add(tier)
    session.commit()
    return tier

from backend.security import get_registration_options, verify_registration
from backend.pulse_models import PulseCredential

# Simple in-memory challenge store (Use Redis in production)
PENDING_CHALLENGES = {} 

@router.post("/auth/webauthn/register/start")
def register_webauthn_start(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Start WebAuthn registration for current user."""
    options = get_registration_options(str(user.id), user.email)

    # Store challenge temporarily
    PENDING_CHALLENGES[str(user.id)] = options.challenge

    # Convert to JSON-compatible dict
    return options.to_dict()

@router.post("/auth/webauthn/register/finish")
def register_webauthn_finish(payload: dict, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Finish WebAuthn registration for current user."""
    challenge = PENDING_CHALLENGES.pop(str(user.id), None)
    if not challenge:
        raise HTTPException(status_code=400, detail="Challenge expired or not found")

    try:
        # Verify the registration
        verification = verify_registration(
            options={"challenge": challenge},
            response=payload
        )

        # Save credential
        cred_id = verification.credential_id

        # Check if credential already exists
        existing = session.get(PulseCredential, str(cred_id))
        if existing:
            session.delete(existing)
            session.commit()

        new_cred = PulseCredential(
            id=str(cred_id),
            user_id=user.id,
            public_key=str(verification.credential_public_key),
            sign_count=verification.sign_count
        )
        session.add(new_cred)
        session.commit()

        return {"status": "verified", "credential_id": str(cred_id)}

    except Exception as e:
        print(f"WebAuthn Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
