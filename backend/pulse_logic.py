from datetime import datetime, timedelta
from backend.utils.clock import utc_now
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
        user_id = settings.user_id
        try:
            process_user_pulse(session, settings)
        except Exception as e:
            session.rollback()  # a DB error must not stop the other users' checks
            logger.error(
                f"Error processing Pulse check for user {user_id}",
                extra={"context": {
                    "user_id": user_id,
                    "error": str(e),
                    "error_type": type(e).__name__
                }},
                exc_info=True
            )

# A guardian's "they're OK" (portal snooze or confirmation) is stored as a PulseCheckin with one of
# these methods. It is never the owner's own check-in.
GUARDIAN_CHECKIN_METHODS = ("guardian_snooze", "guardian_confirmation")

# One clock, shared by the scheduler, the owner's /api/pulse/status and the guardian portal:
# - the outage starts at the owner's own last check-in; escalation history (and so portal access)
#   counts from there and only an owner check-in closes it;
# - a guardian action after that pauses new alerts (and retries) until guardian time +
#   frequency_days + grace_period_hours, the same wait an owner check-in would give; then
#   escalation carries on from the tier already reached.

def owner_last_checkin(session: Session, user_id: int) -> Optional[PulseCheckin]:
    return session.exec(select(PulseCheckin).where(
        PulseCheckin.user_id == user_id,
        col(PulseCheckin.method).notin_(GUARDIAN_CHECKIN_METHODS),
    ).order_by(PulseCheckin.timestamp.desc())).first()

def guardian_checkin_since(session: Session, user_id: int, since: datetime) -> Optional[PulseCheckin]:
    return session.exec(select(PulseCheckin).where(
        PulseCheckin.user_id == user_id,
        col(PulseCheckin.method).in_(GUARDIAN_CHECKIN_METHODS),
        PulseCheckin.timestamp > since,
    ).order_by(PulseCheckin.timestamp.desc())).first()

def current_escalation(session: Session, user_id: int, since: datetime) -> Optional[PulseEscalationLog]:
    """Highest welfare tier logged in this outage (after `since`); tier-0 safety-timer rows don't count."""
    return session.exec(select(PulseEscalationLog).where(
        PulseEscalationLog.user_id == user_id,
        PulseEscalationLog.tier_number != SAFETY_TIMER_LOG_TIER,
        PulseEscalationLog.triggered_at > since,
    ).order_by(PulseEscalationLog.tier_number.desc())).first()

def alerts_paused_until(settings: PulseSettings, guardian: Optional[PulseCheckin]) -> Optional[datetime]:
    if not guardian:
        return None
    return guardian.timestamp + timedelta(days=settings.frequency_days, hours=settings.grace_period_hours)

def process_user_pulse(session: Session, settings: PulseSettings):
    user_id = settings.user_id

    # 1. The owner's own last check-in starts this outage (guardian actions never do)
    last_checkin = owner_last_checkin(session, user_id)
    last_checkin_time = last_checkin.timestamp if last_checkin else datetime.min

    # 2. Calculate Deadlines
    frequency_delta = timedelta(days=settings.frequency_days)
    grace_delta = timedelta(hours=settings.grace_period_hours)

    soft_deadline = last_checkin_time + frequency_delta
    hard_deadline = soft_deadline + grace_delta

    now = utc_now()

    # Inside the window, or in the grace period (overdue but not escalating)
    if now < hard_deadline:
        if now >= soft_deadline:
            logger.debug(f"User {user_id} is in Grace Period (Overdue)")
        return

    # A guardian said they're OK: no new alerts until the pause ends; history stays
    paused_until = alerts_paused_until(settings, guardian_checkin_since(session, user_id, last_checkin_time))
    if paused_until and now < paused_until:
        logger.debug(f"User {user_id}: alerts paused by a guardian until {paused_until}")
        return

    # 3. Escalation Logic (Past Hard Deadline): what has been done in this outage
    last_log = current_escalation(session, user_id, last_checkin_time)

    current_tier_number = last_log.tier_number if last_log else 0
    if current_tier_number > 0:
        try:
            retry_failed_tier_sends(session, last_log)
        except Exception:
            session.rollback()
            logger.error(f"Tier {current_tier_number} retry for user {user_id} failed", exc_info=True)

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
        triggered_at=utc_now()
    )
    session.add(log_entry)
    # Committed before any send, so a DB error inside a send can't roll it back
    # (an uncommitted row would let the same tier re-trigger every tick with no cap).
    session.commit()
    
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

    # A failing send is recorded as a failed message row; retry_failed_tier_sends caps retries.
    for contact in contacts:
        try:
            send_notification(session, contact, tier_number)
        except Exception:
            logger.error(f"Tier {tier_number} alert to contact {contact.id} failed",
                         exc_info=True)

    session.commit()

def _messages_by_contact(session: Session, contact_ids: list, *conditions) -> dict:
    """PulseMessage texts for these contacts, matching `conditions`, grouped by contact_id
    in id order. One IN query in place of one query per contact."""
    grouped: dict = {}
    if not contact_ids:
        return grouped
    for contact_id, message in session.exec(
            select(PulseMessage.contact_id, PulseMessage.message)
            .where(col(PulseMessage.contact_id).in_(contact_ids), *conditions)
            .order_by(PulseMessage.id)).all():
        grouped.setdefault(contact_id, []).append(message)
    return grouped

TIER_FAIL_TEXT = "We couldn't deliver this alert to"  # owner-facing; the technical reason is logged only
TIER_MAX_ATTEMPTS = 3

def tier_sent_text(tier_number: int) -> str:
    """Owner-facing PulseMessage text for a delivered tier alert (send_notification, admin resend)."""
    return f"[System Alert Tier {tier_number}] Escalation notification sent via email"

def retry_failed_tier_sends(session: Session, log: PulseEscalationLog):
    """Re-send the current tier to contacts whose only attempts since it triggered failed,
    up to TIER_MAX_ATTEMPTS each (same pattern as safety timers). Does not touch tier timing."""
    prefix = f"[System Alert Tier {log.tier_number}] "
    contacts = session.exec(select(PulseContact).where(
            PulseContact.user_id == log.user_id,
            PulseContact.tier_id == select(PulseEscalationTier.id).where(
                PulseEscalationTier.user_id == log.user_id,
                PulseEscalationTier.tier_number == log.tier_number
            ).order_by(PulseEscalationTier.id).limit(1).scalar_subquery())).all()
    # One query for every contact's tier rows (a send only adds rows for its own contact)
    by_contact = _messages_by_contact(session, [c.id for c in contacts],
                                      PulseMessage.sent_at >= log.triggered_at,
                                      col(PulseMessage.message).startswith(prefix))
    for contact in contacts:
        msgs = by_contact.get(contact.id, [])
        fails = sum(1 for m in msgs if m.startswith(prefix + TIER_FAIL_TEXT))
        if fails == len(msgs) and 0 < fails < TIER_MAX_ATTEMPTS:
            logger.warning(f"Retrying Tier {log.tier_number} alert to contact {contact.id} "
                           f"(attempt {fails + 1}/{TIER_MAX_ATTEMPTS})")
            send_notification(session, contact, log.tier_number)
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
    # One query for every contact's rows for this timer (a send only adds rows for its own contact)
    by_contact = _messages_by_contact(session, [c.id for c in contacts],
                                      PulseMessage.user_id == timer.user_id,
                                      col(PulseMessage.message).startswith(_timer_marker(timer.id, "")))
    done = True
    for contact in contacts:
        msgs = by_contact.get(contact.id, [])
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

from backend.services.email_service import email_service, EmailPayload, EmailResult
from backend.config import settings
from backend.database import User
import os

def tier_alert_context(session: Session, contact: PulseContact, tier_number: int) -> dict:
    """Template context for a tier alert email: user_name, portal_url, and the
    check-in timeline for tier 2+. Shared by send_notification and the admin resend."""
    user = session.get(User, contact.user_id)
    context = {
        "user_name": user.email.split('@')[0].title() if user else "the user",
        "portal_url": f"{settings.get_frontend_url()}/portal/{contact.portal_token}",
    }
    if tier_number >= 2:
        last_checkin = owner_last_checkin(session, contact.user_id)
        if last_checkin:
            context.update({
                "last_checkin_date": last_checkin.timestamp.strftime("%B %d, %Y at %I:%M %p UTC"),
                "expected_checkin_date": "See Guardian Portal for details",
                "escalation_date": utc_now().strftime("%B %d, %Y at %I:%M %p UTC")
            })
    return context

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

    context = tier_alert_context(session, contact, tier_number)

    # Send email using new service with templates and logging.
    # A raising sender is treated as a failed result, so the failed row is written and
    # retry_failed_tier_sends can pick it up (it never sees a tier with no rows).
    try:
        result = email_service.send_pulse_alert(
            to_email=contact.email,
            recipient_name=contact.name,
            tier_number=tier_number,
            user_id=contact.user_id,
            user_name=context.pop("user_name"),
            portal_url=context.pop("portal_url"),
            additional_context=context,
            db_session=session
        )
    except Exception as e:
        # Roll back first: after a failed flush the session can't even load contact.id.
        # Safe because the tier log row and earlier contacts' rows are already committed.
        session.rollback()
        logger.error(f"Tier {tier_number} alert to contact {contact.id} raised "
                     f"{type(e).__name__}: {e}", exc_info=True)
        result = EmailResult(status="failed", provider=email_service.provider,
                             error=f"{type(e).__name__}: {e}")

    # Log communication in pulse system
    log_msg = PulseMessage(
        user_id=contact.user_id,
        contact_id=contact.id,
        direction="user_to_contact",  # System acting on behalf of user
        message=(tier_sent_text(tier_number)
                 if result.status != "failed" else
                 f"[System Alert Tier {tier_number}] {TIER_FAIL_TEXT} {contact.name}.")
    )
    if result.status == "failed":
        logger.error(f"Tier {tier_number} alert to contact {contact.id} failed: {result.error}")
    session.add(log_msg)
    session.commit()  # each contact's row is durable before the next send
