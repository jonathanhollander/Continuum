from datetime import datetime, timedelta
from backend.utils.clock import utc_now
from typing import List, Optional
from sqlmodel import Session, select, col
from backend.pulse_models import (
    PulseSettings, PulseCheckin, PulseEscalationTier,
    PulseContact, PulseEscalationLog, PulseMessage
)
from backend.utils.logger import get_logger
from backend.pulse_tiers import pulse_tier_expression, pulse_tier_number

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
    """Highest welfare tier logged in this outage (after `since`). Only tiers 1-4 count: tier-0
    safety-timer rows and the negative owner-reminder markers are bookkeeping, not tiers."""
    return session.exec(select(PulseEscalationLog).where(
        PulseEscalationLog.user_id == user_id,
        PulseEscalationLog.tier_number > 0,
        PulseEscalationLog.triggered_at > since,
    ).order_by(PulseEscalationLog.tier_number.desc())).first()

def alerts_paused_until(settings: PulseSettings, guardian: Optional[PulseCheckin]) -> Optional[datetime]:
    if not guardian:
        return None
    return guardian.timestamp + timedelta(days=settings.frequency_days, hours=settings.grace_period_hours)

def ghost_mode_active(settings: PulseSettings, now: datetime) -> bool:
    """Ghost Mode ("pause all alerts") is on while ghost_mode_until (naive UTC) is in the future."""
    return settings.ghost_mode_until is not None and now < settings.ghost_mode_until

def process_user_pulse(session: Session, settings: PulseSettings):
    user_id = settings.user_id

    # Ghost Mode: no tier alert, retry or tier advance while it lasts. Nothing is queued, so once it
    # passes the normal rules below apply (at most one tier per tick, delays from the last tier row).
    if ghost_mode_active(settings, utc_now()):
        logger.debug(f"User {user_id}: Ghost Mode until {settings.ghost_mode_until}; alerts paused")
        return

    # 1. The owner's own last check-in starts this outage (guardian actions never do)
    last_checkin = owner_last_checkin(session, user_id)
    last_checkin_time = last_checkin.timestamp if last_checkin else datetime.min

    # 2. Calculate Deadlines
    frequency_delta = timedelta(days=settings.frequency_days)
    grace_delta = timedelta(hours=settings.grace_period_hours)

    soft_deadline = last_checkin_time + frequency_delta
    hard_deadline = soft_deadline + grace_delta

    now = utc_now()

    # Past the owner's check-in time: remind them first (once per window, verify link inside)
    if now >= soft_deadline:
        try:
            remind_owner(session, settings, last_checkin_time, soft_deadline, hard_deadline, now)
        except Exception:
            session.rollback()
            logger.error(f"Owner reminder for user {user_id} failed", exc_info=True)

    # Inside the window, or in the grace period (overdue but not escalating)
    if now < hard_deadline:
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

    # Guardians with their own wait ("Custom Delay", individual_delay_hours) are alerted on it
    try:
        send_individual_alerts(session, user_id, last_checkin_time, hard_deadline, now)
    except Exception:
        session.rollback()
        logger.error(f"Individual-delay alerts for user {user_id} failed", exc_info=True)

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

    # Each tier waits its own delay_hours: tier 1 after the grace period ends (hard_deadline),
    # tier N+1 after tier N was reached. The Escalation Plan edits these, tier 1 included.
    base_time = hard_deadline if current_tier_number == 0 else last_log.triggered_at
    if now >= base_time + timedelta(hours=tier_def.delay_hours or 0):
        trigger_escalation(session, user_id, next_tier_number, str(base_time))

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
    
    # 2. Notify the same contacts this tier lists on the Pulse pages.
    # Contacts with their own wait (individual_delay_hours) are sent by send_individual_alerts
    contacts = session.exec(
        select(PulseContact).where(
            PulseContact.user_id == user_id,
            pulse_tier_expression() == tier_number,
            PulseContact.individual_delay_hours == None,  # noqa: E711
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

TIER_FAIL_TEXT = "This alert is waiting to be sent again to"  # owner-facing; the technical reason is logged only
LEGACY_TIER_FAIL_TEXT = "We couldn't deliver this alert to"  # rows written before G2
TIER_MAX_ATTEMPTS = 3

def tier_prefix(tier_number: int) -> str:
    return f"[System Alert Tier {tier_number}] "

def tier_sent_text(tier_number: int) -> str:
    """Owner-facing PulseMessage text for a delivered tier alert (send_notification, admin resend)."""
    return f"{tier_prefix(tier_number)}This alert reached them by email."

def is_tier_fail(message: str, tier_number: int) -> bool:
    p = tier_prefix(tier_number)
    return message.startswith(p + TIER_FAIL_TEXT) or message.startswith(p + LEGACY_TIER_FAIL_TEXT)

def retry_failed_tier_sends(session: Session, log: PulseEscalationLog):
    """Re-send the current tier to contacts whose only attempts since it triggered failed,
    up to TIER_MAX_ATTEMPTS each (same pattern as safety timers). Does not touch tier timing."""
    prefix = tier_prefix(log.tier_number)
    contacts = session.exec(select(PulseContact).where(
            PulseContact.user_id == log.user_id,
            PulseContact.individual_delay_hours == None,  # noqa: E711 (send_individual_alerts retries those)
            pulse_tier_expression() == log.tier_number)).all()
    # One query for every contact's tier rows (a send only adds rows for its own contact)
    by_contact = _messages_by_contact(session, [c.id for c in contacts],
                                      PulseMessage.sent_at >= log.triggered_at,
                                      col(PulseMessage.message).startswith(prefix))
    for contact in contacts:
        msgs = by_contact.get(contact.id, [])
        fails = sum(1 for m in msgs if is_tier_fail(m, log.tier_number))
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
            user_name = owner_display_name(session, timer.user_id)
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
    # Existing call-tier contacts predate automatic portal-link issuance. Persist the link before
    # sending, so a successful alert always opens the guardian's own view, including after reload.
    if not contact.portal_token:
        contact.portal_token = secrets.token_urlsafe(32)
        session.add(contact)
        session.commit()
    context = {
        "user_name": owner_display_name(session, contact.user_id),
        "portal_url": f"{settings.get_frontend_url()}/portal/{contact.portal_token}",
    }
    if tier_number >= 2:
        last_checkin = owner_last_checkin(session, contact.user_id)
        if last_checkin:
            context.update({
                "last_checkin_date": last_checkin.timestamp.strftime("%B %d, %Y at %I:%M %p UTC"),
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
                 f"{tier_prefix(tier_number)}{TIER_FAIL_TEXT} {contact.name}.")
    )
    if result.status == "failed":
        logger.error(f"Tier {tier_number} alert to contact {contact.id} failed: {result.error}")
    session.add(log_msg)
    session.commit()  # each contact's row is durable before the next send


# --- G2: owner name, reminders, per-guardian waits, portal reach, all-clear ---

import json
import secrets
from backend.database import Estate
from backend.config import settings as settings_module

OWNER_NAME_FALLBACK = "someone close to you"

def _estate_profile(session: Session, user_id: int) -> dict:
    estate = session.exec(select(Estate).where(Estate.user_id == user_id)).first()
    if not estate:
        return {}
    try:
        td = json.loads(estate.transparent_data or "{}")
        ep = td.get("estate_profile", td) if isinstance(td, dict) else {}
        return ep if isinstance(ep, dict) else {}
    except Exception:
        return {}

def owner_phone(session: Session, user_id: int) -> Optional[str]:
    """The owner's phone from their estate profile (owner_phone, else phone), for the guardian portal."""
    ep = _estate_profile(session, user_id)
    for key in ("owner_phone", "phone"):
        val = ep.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    return None

def owner_display_name(session: Session, user_id: int, fallback: str = OWNER_NAME_FALLBACK) -> str:
    """The name guardians see: User.display_name, then the estate profile's owner_name, then a
    gentle fallback. Never the email address (same rule as the packet, X110)."""
    user = session.get(User, user_id)
    if user and (user.display_name or "").strip():
        return user.display_name.strip()
    name = _estate_profile(session, user_id).get("owner_name")
    if isinstance(name, str) and name.strip():
        return name.strip()
    return fallback

# Owner reminders: PulseEscalationLog rows with these negative markers record that a reminder
# went out in this window (rows after the owner's last check-in), so each sends once.
OWNER_REMINDER_FIRST = -1   # at the check-in time (last check-in + frequency_days)
OWNER_REMINDER_SECOND = -2  # halfway through the grace period, before any guardian is told

def verify_url(session: Session, pulse_settings: PulseSettings) -> str:
    if not pulse_settings.checkin_token:
        pulse_settings.checkin_token = secrets.token_urlsafe(16)
        session.add(pulse_settings)
        session.commit()
    return f"{settings_module.get_frontend_url()}/pulse/verify/{pulse_settings.checkin_token}"

def remind_owner(session: Session, pulse_settings: PulseSettings, since: datetime,
                 soft_deadline: datetime, hard_deadline: datetime, now: datetime) -> None:
    user_id = pulse_settings.user_id
    sent = set(session.exec(select(PulseEscalationLog.tier_number).where(
        PulseEscalationLog.user_id == user_id,
        col(PulseEscalationLog.tier_number).in_((OWNER_REMINDER_FIRST, OWNER_REMINDER_SECOND)),
        PulseEscalationLog.triggered_at > since,
    )).all())
    midpoint = soft_deadline + (hard_deadline - soft_deadline) / 2
    if OWNER_REMINDER_FIRST not in sent:
        which = OWNER_REMINDER_FIRST
    elif OWNER_REMINDER_SECOND not in sent and hard_deadline > soft_deadline and midpoint <= now < hard_deadline:
        which = OWNER_REMINDER_SECOND
    else:
        return
    user = session.get(User, user_id)
    if not user or not user.email:
        return
    # Recorded before the send, so a send error can't make it repeat every tick
    session.add(PulseEscalationLog(user_id=user_id, tier_number=which, triggered_at=now))
    session.commit()
    first = which == OWNER_REMINDER_FIRST
    payload = email_service._build_payload(
        to_email=user.email,
        recipient_name=owner_display_name(session, user_id, fallback="friend"),
        subject="Time for your gentle check-in" if first else "Checking in with you again",
        template_name="pulse_owner_reminder",
        template_context={
            "verify_url": verify_url(session, pulse_settings),
            "second": not first,
            "circle_told_at": hard_deadline.strftime("%B %d, %Y at %I:%M %p UTC"),
        },
        user_id=user_id,
    )
    result = payload if isinstance(payload, EmailResult) else \
        email_service.send_email(payload=payload, db_session=session)
    if result.status == "failed":
        logger.error(f"Owner reminder ({which}) for user {user_id} failed: {result.error}")


def _outage_tier_times(session: Session, user_id: int, since: datetime) -> dict:
    """tier_number -> when it was first reached in this outage (one query)."""
    times: dict = {}
    for n, at in session.exec(select(PulseEscalationLog.tier_number, PulseEscalationLog.triggered_at).where(
            PulseEscalationLog.user_id == user_id,
            PulseEscalationLog.tier_number > 0,
            PulseEscalationLog.triggered_at > since)).all():
        if n not in times or at < times[n]:
            times[n] = at
    return times

def send_individual_alerts(session: Session, user_id: int, since: datetime,
                           hard_deadline: datetime, now: datetime) -> None:
    """A guardian with individual_delay_hours is alerted that many hours after their tier's start
    (tier 1: the end of the grace period; tier N: when tier N-1 was reached), in place of the
    tier's own wait. Failed sends are retried here up to TIER_MAX_ATTEMPTS."""
    contacts = session.exec(select(PulseContact, pulse_tier_expression()).where(
        PulseContact.user_id == user_id,
        pulse_tier_expression().is_not(None),
        PulseContact.individual_delay_hours != None,  # noqa: E711
    )).all()
    if not contacts:
        return
    reached = _outage_tier_times(session, user_id, since)
    by_contact = _messages_by_contact(session, [c.id for c, _ in contacts],
                                      PulseMessage.sent_at > since,
                                      col(PulseMessage.message).startswith("[System Alert Tier "))
    for contact, n in contacts:
        start = hard_deadline if n == 1 else reached.get(n - 1)
        if start is None or now < start + timedelta(hours=max(0, contact.individual_delay_hours)):
            continue
        msgs = [m for m in by_contact.get(contact.id, []) if m.startswith(tier_prefix(n))]
        fails = sum(1 for m in msgs if is_tier_fail(m, n))
        if fails < len(msgs) or fails >= TIER_MAX_ATTEMPTS:
            continue  # already reached them, or out of attempts
        send_notification(session, contact, n)


def contact_reach(session: Session, contact: PulseContact) -> Optional[int]:
    """Up to which tier this guardian's portal opens the owner's notes in this outage, or None.
    Open once the outage has reached their tier, or once they were sent their own tier alert
    (a guardian with an individual wait can be told before or after the tier itself)."""
    tier_number = pulse_tier_number(session, contact)
    if tier_number is None:
        return None
    last = owner_last_checkin(session, contact.user_id)
    since = last.timestamp if last else datetime.min
    esc = current_escalation(session, contact.user_id, since)
    if esc and esc.tier_number >= tier_number:
        return esc.tier_number
    if contact.individual_delay_hours is not None:
        sent = session.exec(select(PulseMessage.id).where(
            PulseMessage.contact_id == contact.id,
            PulseMessage.sent_at > since,
            PulseMessage.message == tier_sent_text(tier_number))).first()
        if sent:
            return tier_number
    return None


SYSTEM_PREFIXES = ("[System Alert", "[Safety timer")

def owner_notes(session: Session, contact: PulseContact, limit: int = 50) -> list:
    """The owner's own notes to this guardian (Pulse messages), oldest first; system rows left out."""
    rows = session.exec(select(PulseMessage).where(
        PulseMessage.contact_id == contact.id,
        PulseMessage.user_id == contact.user_id,
        PulseMessage.direction == "user_to_contact",
        col(PulseMessage.message).notlike("[System Alert%"),
        col(PulseMessage.message).notlike("[Safety timer%"),
    ).order_by(PulseMessage.sent_at.desc()).limit(limit)).all()
    return list(reversed(rows))


ALL_CLEAR_PREFIX = tier_prefix(0)  # shown by the messages page as a system line

def send_all_clear(session: Session, user_id: int, since: datetime) -> int:
    """Called right after an owner check-in. If the outage that check-in closes (escalation rows
    after `since`, the previous owner check-in) alerted guardians, tell each one the owner is
    well. Returns how many were told. Never raises (a check-in must always succeed)."""
    try:
        if not current_escalation(session, user_id, since):
            return 0
        alerted = {cid for cid, msg in session.exec(select(PulseMessage.contact_id, PulseMessage.message).where(
            PulseMessage.user_id == user_id,
            PulseMessage.sent_at > since,
            col(PulseMessage.message).startswith("[System Alert Tier "))).all()
            if not msg.startswith(ALL_CLEAR_PREFIX)
            and ("reached them" in msg or "Escalation notification sent" in msg)}
        if not alerted:
            return 0
        name = owner_display_name(session, user_id)
        told = 0
        for contact in session.exec(select(PulseContact).where(col(PulseContact.id).in_(alerted))).all():
            payload = email_service._build_payload(
                to_email=contact.email, recipient_name=contact.name,
                subject=f"{name} checked in and is well",
                template_name="pulse_all_clear",
                template_context={"user_name": name,
                                  "portal_url": f"{settings_module.get_frontend_url()}/portal/{contact.portal_token}"},
                user_id=user_id)
            result = payload if isinstance(payload, EmailResult) else \
                email_service.send_email(payload=payload, db_session=session)
            ok = result.status != "failed"
            told += ok
            session.add(PulseMessage(user_id=user_id, contact_id=contact.id, direction="user_to_contact",
                                     message=f"{ALL_CLEAR_PREFIX}{contact.name} heard that you checked in and are well."
                                     if ok else f"{ALL_CLEAR_PREFIX}Your all-clear note to {contact.name} is waiting to be sent."))
            session.commit()
        return told
    except Exception:
        session.rollback()
        logger.error(f"All-clear for user {user_id} failed", exc_info=True)
        return 0
