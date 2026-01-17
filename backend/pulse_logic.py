from datetime import datetime, timedelta
from typing import List, Optional
from sqlmodel import Session, select, col
from backend.pulse_models import (
    PulseSettings, PulseCheckin, PulseEscalationTier, 
    PulseContact, PulseEscalationLog, PulseMessage
)

def check_and_escalate_all(session: Session):
    """
    Main entry point for the scheduler.
    Iterates through all users with Pulse enabled and checks/escalates status.
    """
    print(f"[{datetime.utcnow()}] 💓 Running Pulse Health Check...")
    
    # Get all enabled settings
    statement = select(PulseSettings).where(PulseSettings.enabled == True)
    all_settings = session.exec(statement).all()
    
    for settings in all_settings:
        try:
            process_user_pulse(session, settings)
        except Exception as e:
            print(f"ERROR processing user {settings.user_id}: {e}")

def process_user_pulse(session: Session, settings: PulseSettings):
    user_id = settings.user_id
    
    # 1. Get last check-in
    statement = select(PulseCheckin).where(PulseCheckin.user_id == user_id).order_by(PulseCheckin.timestamp.desc())
    last_checkin = session.exec(statement).first()
    
    last_checkin_time = last_checkin.timestamp if last_checkin else datetime.min
    
    # 2. Calculate Deadlines
    frequency_delta = timedelta(days=settings.frequency_days)
    grace_delta = timedelta(hours=settings.grace_period_hours)
    
    soft_deadline = last_checkin_time + frequency_delta
    hard_deadline = soft_deadline + grace_delta
    
    now = datetime.utcnow()
    
    # If within safe zone, do nothing (or reset escalation if needed)
    if now < soft_deadline:
        return
        
    # If in Grace Period (Overdue but not Escalating)
    if soft_deadline < now < hard_deadline:
        # TODO: Send "Soft Nudge" to USER if not sent recently
        # print(f"User {user_id} is in Grace Period (Overdue)")
        return
        
    # 3. Escalation Logic (Past Hard Deadline)
    # Check the Escalation Log to see what we've already done *for this specific outage*
    # We define "this outage" as any log created AFTER the last valid check-in
    
    log_stmt = select(PulseEscalationLog).where(
        PulseEscalationLog.user_id == user_id,
        PulseEscalationLog.triggered_at > last_checkin_time
    ).order_by(PulseEscalationLog.tier_number.desc())
    
    last_log = session.exec(log_stmt).first()
    
    current_tier_number = last_log.tier_number if last_log else 0
    
    # Decide if we need to escalate to the NEXT tier
    next_tier_number = current_tier_number + 1
    
    if next_tier_number > 4:
        # We've reached max escalation
        return

    # Get the definition for the next tier
    tier_def = session.exec(
        select(PulseEscalationTier).where(
            PulseEscalationTier.user_id == user_id,
            PulseEscalationTier.tier_number == next_tier_number
        )
    ).first()
    
    # If Tier definition doesn't exist, we can't escalate to it.
    if not tier_def:
        # Try to skip? Or stop? For now, we stop.
        return

    # Check timing
    if current_tier_number == 0:
        # We are just entering Tier 1. 
        # Trigger immediately since we are past hard_deadline
        trigger_escalation(session, user_id, 1, str(hard_deadline))
    else:
        # We are at Tier X, checking if we should upgrade to Tier X+1
        # Check delay associated with the *previous* tier (or the current one? Plan says "Delay after previous")
        # Plan: "Tier 2 ... +6 hours". This implies 6 hours after Tier 1.
        
        # Get the config for the NEW tier to see its delay
        # Actually usually 'delay' on Tier 2 means "Wait X hours after Tier 1"
        
        delay_hours = tier_def.delay_hours
        trigger_threshold = last_log.triggered_at + timedelta(hours=delay_hours)
        
        if now > trigger_threshold:
            trigger_escalation(session, user_id, next_tier_number, str(last_log.triggered_at))

def trigger_escalation(session: Session, user_id: int, tier_number: int, reference_time: str):
    print(f"🚨 [ESCALATION] Triggering Tier {tier_number} for User {user_id} (Ref: {reference_time})")
    
    # 1. Log the event
    log_entry = PulseEscalationLog(
        user_id=user_id,
        tier_number=tier_number,
        triggered_at=datetime.utcnow()
    )
    session.add(log_entry)
    
    # 2. Notify Contacts
    contacts = session.exec(
        select(PulseContact).where(
            PulseContact.user_id == user_id,
            PulseContact.tier_id == select(PulseEscalationTier.id).where(
                PulseEscalationTier.user_id == user_id,
                PulseEscalationTier.tier_number == tier_number
            )
        )
    ).all()
    
    for contact in contacts:
        send_notification(contact, tier_number)
        
    session.commit()

def send_notification(contact: PulseContact, tier_number: int):
    # Stub for Email/SMS service
    print(f"   --> 📧 Sending Tier {tier_number} Alert to {contact.name} ({contact.email})")
    # In real impl, calling SendGrid/Twilio here
