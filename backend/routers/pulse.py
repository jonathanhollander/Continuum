from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timedelta
from backend.database import get_session, User
import secrets
from backend.pulse_models import (
    PulseSettings, PulseCheckin, PulseVault, 
    PulseEscalationTier, PulseContact,
    PulseMessage, PulseEscalationLog, PulseSafetyTimer
)

router = APIRouter(prefix="/api/pulse", tags=["pulse"])

@router.post("/checkin")
def checkin(user_id: int, method: str = "manual", note: str = None, session: Session = Depends(get_session)):
    checkin = PulseCheckin(user_id=user_id, method=method, note=note)
    session.add(checkin)
    session.commit()
    return {"status": "success", "timestamp": checkin.timestamp}

@router.get("/status")
def get_status(user_id: int, session: Session = Depends(get_session)):
    settings = session.get(PulseSettings, user_id)
    if not settings:
        return {"status": "not_configured"}
    if not settings.enabled:
        return {"status": "disabled"}

    statement = select(PulseCheckin).where(PulseCheckin.user_id == user_id).order_by(PulseCheckin.timestamp.desc())
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
def get_settings(user_id: int, session: Session = Depends(get_session)):
    settings = session.get(PulseSettings, user_id)
    if not settings:
        settings = PulseSettings(user_id=user_id, checkin_token=secrets.token_urlsafe(16))
        session.add(settings)
        session.commit()
    elif not settings.checkin_token:
        settings.checkin_token = secrets.token_urlsafe(16)
        session.add(settings)
        session.commit()
    return settings

@router.post("/settings")
def update_settings(user_id: int, new_settings: PulseSettings, session: Session = Depends(get_session)):
    settings = session.get(PulseSettings, user_id)
    if not settings:
        settings = PulseSettings(user_id=user_id)
        session.add(settings)
    
    settings_data = new_settings.dict(exclude_unset=True)
    for key, value in settings_data.items():
        setattr(settings, key, value)
        
    session.add(settings)
    session.commit()
    return {"status": "updated"}

@router.get("/history")
def get_history(user_id: int, limit: int = 10, session: Session = Depends(get_session)):
    statement = select(PulseCheckin).where(PulseCheckin.user_id == user_id).order_by(PulseCheckin.timestamp.desc()).limit(limit)
    return session.exec(statement).all()

@router.get("/contacts")
def get_contacts(user_id: int, session: Session = Depends(get_session)):
    statement = select(PulseContact).where(PulseContact.user_id == user_id)
    return session.exec(statement).all()

@router.post("/contacts")
def create_contact(user_id: int, contact: PulseContact, session: Session = Depends(get_session)):
    contact.user_id = user_id
    contact.portal_token = secrets.token_urlsafe(32) # Grant portal access immediately
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return contact

@router.put("/contacts/{contact_id}")
def update_contact(user_id: int, contact_id: int, updated: PulseContact, session: Session = Depends(get_session)):
    contact = session.get(PulseContact, contact_id)
    if not contact or contact.user_id != user_id:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    data = updated.dict(exclude_unset=True)
    for key, val in data.items():
        if key != "id": setattr(contact, key, val)
    
    session.add(contact)
    session.commit()
    return contact

@router.delete("/contacts/{contact_id}")
def delete_contact(user_id: int, contact_id: int, session: Session = Depends(get_session)):
    contact = session.get(PulseContact, contact_id)
    if not contact or contact.user_id != user_id:
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
def get_messages(user_id: int, session: Session = Depends(get_session)):
    statement = select(PulseMessage).where(PulseMessage.user_id == user_id).order_by(PulseMessage.sent_at.desc())
    return session.exec(statement).all()

@router.post("/messages")
def send_message(user_id: int, contact_id: int, message: str, session: Session = Depends(get_session)):
    contact = session.get(PulseContact, contact_id)
    if not contact or contact.user_id != user_id:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    msg = PulseMessage(user_id=user_id, contact_id=contact_id, direction="user_to_contact", message=message)
    session.add(msg)
    session.commit()
    return {"status": "sent"}

# --- Vault & Instructions ---

@router.get("/vault")
def get_vault(user_id: int, session: Session = Depends(get_session)):
    return session.exec(select(PulseVault).where(PulseVault.user_id == user_id)).all()

@router.post("/vault")
def add_vault_item(item: PulseVault, session: Session = Depends(get_session)):
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@router.delete("/vault/{item_id}")
def delete_vault_item(item_id: int, user_id: int, session: Session = Depends(get_session)):
    item = session.get(PulseVault, item_id)
    if item and item.user_id == user_id:
        session.delete(item)
        session.commit()
    return {"status": "deleted"}

# --- Safety & Monitoring ---

@router.post("/safety/start")
def start_safety_timer(user_id: int, minutes: int, purpose: str = "Walking home", session: Session = Depends(get_session)):
    existing = session.exec(select(PulseSafetyTimer).where(PulseSafetyTimer.user_id == user_id, PulseSafetyTimer.is_active == True)).all()
    for t in existing: t.is_active = False; session.add(t)
        
    expires = datetime.utcnow() + timedelta(minutes=minutes)
    timer = PulseSafetyTimer(user_id=user_id, expires_at=expires, purpose=purpose)
    session.add(timer)
    session.commit()
    return timer

@router.get("/safety/status")
def get_safety_status(user_id: int, session: Session = Depends(get_session)):
    return session.exec(select(PulseSafetyTimer).where(PulseSafetyTimer.user_id == user_id, PulseSafetyTimer.is_active == True)).first()

@router.post("/safety/cancel")
def cancel_safety_timer(user_id: int, session: Session = Depends(get_session)):
    timer = session.exec(select(PulseSafetyTimer).where(PulseSafetyTimer.user_id == user_id, PulseSafetyTimer.is_active == True)).first()
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
def get_tiers(user_id: int, session: Session = Depends(get_session)):
    return session.exec(select(PulseEscalationTier).where(PulseEscalationTier.user_id == user_id).order_by(PulseEscalationTier.tier_number)).all()
