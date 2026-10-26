from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from sqlmodel import Session, select
from backend.database import engine
from backend.config import settings
from backend.pulse_logic import check_and_escalate_all, trigger_escalation
from backend.pulse_models import PulseSafetyTimer
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
    """Hand each expired active safety timer to the escalation logic once.
    The timer is deactivated in the same commit as the escalation, so a later tick skips it."""
    expired = session.exec(
        select(PulseSafetyTimer).where(
            PulseSafetyTimer.is_active == True,
            PulseSafetyTimer.expires_at < datetime.utcnow()
        )
    ).all()
    for timer in expired:
        try:
            timer.is_active = False
            session.add(timer)
            logger.warning(f"Safety timer {timer.id} expired for user {timer.user_id}; escalating once")
            trigger_escalation(session, timer.user_id, 1, str(timer.expires_at))  # commits
        except Exception:
            session.rollback()
            logger.error(f"Safety timer {timer.id} escalation failed", exc_info=True)

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
