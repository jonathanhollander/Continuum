from datetime import datetime, timedelta
from typing import List, Optional
from sqlmodel import Session, select, col
from backend.pulse_models import (
    PulseSettings, PulseCheckin, PulseEscalationTier,
    PulseContact, PulseEscalationLog, PulseMessage
)
from backend.utils.logger import get_logger

logger = get_logger(__name__)

def check_and_escalate_all(session: Session):
    """
    Main entry point for the scheduler.
    Iterates through all users with Pulse enabled and checks/escalates status.
    """
    logger.info("Running Pulse health check for all enabled users")

    # Get all enabled settings
    statement = select(PulseSettings).where(PulseSettings.enabled == True)
    all_settings = session.exec(statement).all()

    for settings in all_settings:
        try:
            process_user_pulse(session, settings)
        except Exception as e:
            logger.error(
                f"Error processing Pulse check for user {settings.user_id}",
                extra={"context": {
                    "user_id": settings.user_id,
                    "error": str(e),
                    "error_type": type(e).__name__
                }},
                exc_info=True
            )

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
        logger.debug(f"User {user_id} is in Grace Period (Overdue)")
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
    logger.warning(
        f"Pulse escalation triggered: Tier {tier_number}",
        extra={"context": {
            "user_id": user_id,
            "tier_number": tier_number,
            "reference_time": reference_time,
            "event": "pulse_escalation"
        }}
    )
    
    # 1. Log the event
    log_entry = PulseEscalationLog(
        user_id=user_id,
        tier_number=tier_number,
        triggered_at=datetime.utcnow()
    )
    session.add(log_entry)
    
    # 2. Notify Contacts (tier pick is deterministic: lowest id wins if two tiers share a number)
    tier_id_sq = select(PulseEscalationTier.id).where(
        PulseEscalationTier.user_id == user_id,
        PulseEscalationTier.tier_number == tier_number
    ).order_by(PulseEscalationTier.id).limit(1).scalar_subquery()
    contacts = session.exec(
        select(PulseContact).where(
            PulseContact.user_id == user_id,
            PulseContact.tier_id == tier_id_sq
        )
    ).all()

    # The log row is committed with the sends, so a failing send is not retried every tick.
    for contact in contacts:
        try:
            send_notification(session, contact, tier_number)
        except Exception:
            logger.error(f"Tier {tier_number} alert to contact {contact.id} failed; not retrying this tier",
                         exc_info=True)

    session.commit()

SAFETY_TIMER_LOG_TIER = 0  # PulseEscalationLog.tier_number marker for safety-timer alerts (no schema change)
SAFETY_TIMER_MAX_ATTEMPTS = 3

def _timer_marker(timer_id: int, what: str) -> str:
    return f"[Safety timer {timer_id}] {what}"

def trigger_safety_timer_alert(session: Session, timer) -> bool:
    """Alert only contacts with notify_on_safety_timer, with a timer-specific message.
    Each contact gets at most SAFETY_TIMER_MAX_ATTEMPTS tries (recorded as PulseMessage rows).
    Returns True once every flagged contact is sent or out of attempts (timer can be closed)."""
    contacts = session.exec(
        select(PulseContact).where(
            PulseContact.user_id == timer.user_id,
            PulseContact.notify_on_safety_timer == True
        )
    ).all()
    sent_msg, fail_msg = _timer_marker(timer.id, "alert sent"), _timer_marker(timer.id, "send failed")
    done = True
    for contact in contacts:
        msgs = session.exec(select(PulseMessage.message).where(
            PulseMessage.user_id == timer.user_id, PulseMessage.contact_id == contact.id,
            col(PulseMessage.message).startswith(_timer_marker(timer.id, ""))
        )).all()
        if any(m.startswith(sent_msg) for m in msgs):
            continue
        fails = sum(1 for m in msgs if m.startswith(fail_msg))
        if fails >= SAFETY_TIMER_MAX_ATTEMPTS:
            continue
        ok, err = False, None
        try:
            user = session.get(User, timer.user_id)
            user_name = user.email.split('@')[0].title() if user else "the user"
            result = email_service.send_email(EmailPayload(
                to_email=contact.email,
                recipient_name=contact.name,
                subject="Continuum Pulse: A gentle safety check",
                template_name="pulse_safety_timer",
                template_context={
                    "user_name": user_name,
                    "purpose": timer.purpose or "a safety timer",
                    "portal_url": f"{settings.get_frontend_url()}/portal/{contact.portal_token}",
                },
                user_id=timer.user_id
            ), db_session=session)
            ok, err = result.status != "failed", result.error
        except Exception as e:
            err = str(e)
        if ok:
            session.add(PulseMessage(user_id=timer.user_id, contact_id=contact.id,
                                     direction="user_to_contact", message=sent_msg))
        else:
            session.rollback()
            session.add(PulseMessage(user_id=timer.user_id, contact_id=contact.id,
                                     direction="user_to_contact", message=f"{fail_msg} (attempt {fails + 1})"))
            logger.error(f"Safety timer {timer.id}: alert to contact {contact.id} failed "
                         f"(attempt {fails + 1}/{SAFETY_TIMER_MAX_ATTEMPTS}): {err}")
            if fails + 1 < SAFETY_TIMER_MAX_ATTEMPTS:
                done = False
        session.commit()
    return done

from backend.services.email_service import email_service, EmailPayload
from backend.config import settings
from backend.database import User
import os

def send_notification(session: Session, contact: PulseContact, tier_number: int):
    """
    Send escalation notification to guardian contact.
    Uses new template-based email service with proper delivery tracking.
    """
    logger.info(
        f"Sending Tier {tier_number} escalation alert to guardian",
        extra={"context": {
            "contact_name": contact.name,
            "contact_email": contact.email,
            "tier_number": tier_number,
            "user_id": contact.user_id
        }}
    )

    # Get user information for personalization
    user = session.get(User, contact.user_id)
    user_name = user.email.split('@')[0].title() if user else "the user"

    # Generate guardian portal link
    frontend_url = settings.get_frontend_url()
    portal_url = f"{frontend_url}/portal/{contact.portal_token}"

    # Additional context for templates
    additional_context = {}
    if tier_number >= 2:
        # Add timeline information for tier 2+
        from backend.pulse_models import PulseCheckin
        from sqlmodel import select
        last_checkin = session.exec(
            select(PulseCheckin)
            .where(PulseCheckin.user_id == contact.user_id)
            .order_by(PulseCheckin.timestamp.desc())
        ).first()

        if last_checkin:
            additional_context.update({
                "last_checkin_date": last_checkin.timestamp.strftime("%B %d, %Y at %I:%M %p UTC"),
                "expected_checkin_date": "See Guardian Portal for details",
                "escalation_date": datetime.utcnow().strftime("%B %d, %Y at %I:%M %p UTC")
            })

    # Send email using new service with templates and logging
    email_service.send_pulse_alert(
        to_email=contact.email,
        recipient_name=contact.name,
        tier_number=tier_number,
        user_id=contact.user_id,
        user_name=user_name,
        portal_url=portal_url,
        additional_context=additional_context,
        db_session=session
    )

    # Log communication in pulse system
    log_msg = PulseMessage(
        user_id=contact.user_id,
        contact_id=contact.id,
        direction="user_to_contact",  # System acting on behalf of user
        message=f"[System Alert Tier {tier_number}] Escalation notification sent via email"
    )
    session.add(log_msg)
