from apscheduler.schedulers.background import BackgroundScheduler
from sqlmodel import Session, create_engine
from backend.database import engine
from backend.pulse_logic import check_and_escalate_all

scheduler = BackgroundScheduler()

def pulse_job():
    """
    Wrapper to create a new session for each job execution.
    """
    with Session(engine) as session:
        check_and_escalate_all(session)

def start_scheduler():
    # Avoid adding duplicate jobs if reload is active
    if not scheduler.get_jobs():
        # check_and_escalate_all runs every hour (or every minute for testing)
        scheduler.add_job(pulse_job, 'interval', minutes=1, id='pulse_check')
        scheduler.start()
        print("⏰ Pulse Scheduler Started")

def stop_scheduler():
    scheduler.shutdown()
    print("⏰ Pulse Scheduler Stopped")
