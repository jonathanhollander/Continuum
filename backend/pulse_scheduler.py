from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from backend.utils.clock import utc_now
from sqlmodel import Session, select
from backend.database import engine
from backend.config import settings
from backend.pulse_logic import check_and_escalate_all, trigger_safety_timer_alert, SAFETY_TIMER_LOG_TIER
from backend.pulse_models import PulseSafetyTimer, PulseEscalationLog
from backend.utils.logger import get_logger

logger = get_logger(__name__)
scheduler = BackgroundScheduler()

def pulse_job():
    """
    Wrapper to create a new session for each job execution.
    """
    with Session(engine) as session:
        check_and_escalate_all(session)
        escalate_expired_safety_timers(session)

def escalate_expired_safety_timers(session: Session):
    """Alert the safety-timer contacts of each expired active timer.
    The timer stays active (retried next tick) only while a send can still be retried;
    each contact is capped at 3 attempts, after which the timer is closed and a log row written."""
    expired = session.exec(
        select(PulseSafetyTimer).where(
            PulseSafetyTimer.is_active == True,
            PulseSafetyTimer.expires_at < utc_now()
        )
    ).all()
    for timer in expired:
        try:
            logger.warning(f"Safety timer {timer.id} expired for user {timer.user_id}; alerting safety-timer contacts")
            if trigger_safety_timer_alert(session, timer):
                timer.is_active = False
                session.add(PulseEscalationLog(user_id=timer.user_id, tier_number=SAFETY_TIMER_LOG_TIER,
                                               triggered_at=utc_now()))
                session.add(timer)
                session.commit()
                logger.info(f"Safety timer {timer.id} closed")
        except Exception:
            session.rollback()
            logger.error(f"Safety timer {timer.id} alert failed", exc_info=True)

def start_scheduler():
    if not settings.PULSE_SCHEDULER_ENABLED:
        logger.info("Pulse Scheduler not started (PULSE_SCHEDULER_ENABLED is false)")
        return
    minutes = max(1, settings.PULSE_CHECK_INTERVAL_MINUTES)
    # Avoid adding duplicate jobs if reload is active
    if not scheduler.get_jobs():
        scheduler.add_job(pulse_job, 'interval', minutes=minutes, id='pulse_check',
                          max_instances=1, coalesce=True)
        scheduler.start()
        logger.info(f"Pulse Scheduler started (checking every {minutes} minutes)")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Pulse Scheduler stopped")
