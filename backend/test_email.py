#!/usr/bin/env python3
"""
Email Integration Test Script

Tests all email templates and delivery mechanisms.
Run this script to verify email configuration.

Usage:
    python backend/test_email.py [email@example.com]
"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.services.email_service import email_service
from backend.database import get_session, create_db_and_tables
from backend.config import settings


from backend.utils.logger import get_logger

logger = get_logger(__name__)

def test_email_service():
    """Test email service configuration and templates."""
    logger.info("=" * 60)
    logger.info("CONTINUUM EMAIL INTEGRATION TEST")
    logger.info("=" * 60)

    # Check provider
    logger.info(f"Active Provider: {email_service.provider}")

    # Check configuration
    if email_service.provider == "postmark":
        logger.info(f"Postmark configured")
        logger.info(f"  From: {settings.POSTMARK_FROM_EMAIL}")
        if settings.POSTMARK_API_KEY:
            logger.info(f"  API Key: {settings.POSTMARK_API_KEY[:8]}...{settings.POSTMARK_API_KEY[-4:]}")
    elif email_service.provider == "smtp":
        logger.info(f"SMTP configured")
        logger.info(f"  Host: {settings.SMTP_HOST}:{settings.SMTP_PORT}")
        logger.info(f"  From: {settings.SMTP_FROM_EMAIL}")
        logger.info(f"  TLS: {settings.SMTP_USE_TLS}")
    else:
        logger.info(f"Using local file storage (development mode)")
        logger.info(f"  Outbox: {settings.OUTBOX_DIR}")

    # Get test email
    test_email = sys.argv[1] if len(sys.argv) > 1 else "test@continuum.im"
    logger.info(f"Test recipient: {test_email}")

    # Initialize database
    logger.info("Initializing database...")
    create_db_and_tables()

    # Get database session
    session = next(get_session())

    # Get test user ID dynamically
    from sqlmodel import select
    from backend.database import User
    
    test_user_email = "test@continuum.estate"
    statement = select(User).where(User.email == test_user_email)
    test_user = session.exec(statement).first()
    
    if test_user:
        target_user_id = test_user.id
        target_user_name = "Test User"
        logger.info(f"Found test user: {test_user_email} (ID: {target_user_id})")
    else:
        target_user_id = 1
        target_user_name = "John Doe"
        logger.warning(f"Test user {test_user_email} not found! Falling back to user_id=1")

    logger.info("=" * 60)
    logger.info("TESTING EMAIL TEMPLATES")
    logger.info("=" * 60)

    # Test 1: Welcome Email
    logger.info("Testing Welcome Email...")
    try:
        result = email_service.send_welcome_email(
            to_email=test_email,
            user_id=target_user_id,
            dashboard_url=f"{settings.get_frontend_url()}/dashboard",
            db_session=session
        )
        logger.info(f"  Status: {result.get('status')}")
        if result.get('message_id'):
            logger.info(f"  Message ID: {result.get('message_id')}")
        if result.get('file_path'):
            logger.info(f"  Saved to: {result.get('file_path')}")
    except Exception as e:
        logger.error(f"  Error: {e}")

    # Test 2: Magic Link
    logger.info("Testing Magic Link Email...")
    try:
        magic_url = f"{settings.get_frontend_url()}/auth/verify?token=test-token-123"
        result = email_service.send_magic_link(
            to_email=test_email,
            magic_link_url=magic_url,
            db_session=session
        )
        logger.info(f"  Status: {result.get('status')}")
        if result.get('message_id'):
            logger.info(f"  Message ID: {result.get('message_id')}")
    except Exception as e:
        logger.error(f"  Error: {e}")

    # Test 3-6: Pulse Alerts (All Tiers)
    for tier in range(1, 5):
        logger.info(f"Testing Pulse Alert Tier {tier}...")
        try:
            result = email_service.send_pulse_alert(
                to_email=test_email,
                recipient_name="Test Guardian",
                tier_number=tier,
                user_id=target_user_id,
                user_name=target_user_name,
                portal_url=f"{settings.get_frontend_url()}/portal/test-token",
                additional_context={
                    "last_checkin_date": "January 15, 2026 at 10:30 AM UTC",
                    "expected_checkin_date": "January 20, 2026",
                    "escalation_date": "January 21, 2026 at 02:00 PM UTC"
                },
                db_session=session
            )
            logger.info(f"  Status: {result.get('status')}")
            if result.get('message_id'):
                logger.info(f"  Message ID: {result.get('message_id')}")
        except Exception as e:
            logger.error(f"  Error: {e}")

    # Summary
    logger.info("=" * 60)
    logger.info("EMAIL LOG SUMMARY")
    logger.info("=" * 60)

    from sqlmodel import select
    from backend.models.email_log import EmailLog

    logs = session.exec(select(EmailLog).order_by(EmailLog.created_at.desc()).limit(10)).all()

    if logs:
        logger.info(f"Recent {len(logs)} emails:")
        for log in logs:
            status_prev = "sent" if log.status == "sent" else "local" if log.status == "saved_local" else "failed"
            logger.info(f"  {log.template_name:30s} → {log.recipient_email:30s} [{status_prev}]")

        # Status counts
        from collections import Counter
        status_counts = Counter(log.status for log in logs)
        logger.info(f"Status breakdown:")
        for status, count in status_counts.items():
            logger.info(f"  {status}: {count}")
    else:
        logger.info("No email logs found")

    # Local files
    if email_service.provider == "local":
        logger.info("=" * 60)
        logger.info("LOCAL EMAIL FILES")
        logger.info("=" * 60)
        import os
        outbox_files = sorted(os.listdir(settings.OUTBOX_DIR))[-6:]  # Last 6 files
        logger.info(f"Recent files in {settings.OUTBOX_DIR}:")
        for filename in outbox_files:
            logger.info(f"  📄 {filename}")

    logger.info("=" * 60)
    logger.info("TEST COMPLETE")
    logger.info("=" * 60)
    logger.info("Next steps:")
    if email_service.provider == "local":
        logger.info("  1. Configure POSTMARK_API_KEY or SMTP settings in .env")
        logger.info("  2. Run this test again to verify actual email delivery")
        logger.info("  3. Check email templates in backend/templates/emails/")
    else:
        logger.info("  1. Check your email inbox for test messages")
        logger.info("  2. Review email_logs table for delivery status")
        logger.info("  3. Update templates if needed in backend/templates/emails/")

    session.close()


if __name__ == "__main__":
    test_email_service()
