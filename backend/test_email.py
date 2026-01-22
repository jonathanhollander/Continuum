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


def test_email_service():
    """Test email service configuration and templates."""
    print("=" * 60)
    print("CONTINUUM EMAIL INTEGRATION TEST")
    print("=" * 60)

    # Check provider
    print(f"\n✓ Active Provider: {email_service.provider}")

    # Check configuration
    if email_service.provider == "postmark":
        print(f"✓ Postmark configured")
        print(f"  From: {settings.POSTMARK_FROM_EMAIL}")
        if settings.POSTMARK_API_KEY:
            print(f"  API Key: {settings.POSTMARK_API_KEY[:8]}...{settings.POSTMARK_API_KEY[-4:]}")
    elif email_service.provider == "smtp":
        print(f"✓ SMTP configured")
        print(f"  Host: {settings.SMTP_HOST}:{settings.SMTP_PORT}")
        print(f"  From: {settings.SMTP_FROM_EMAIL}")
        print(f"  TLS: {settings.SMTP_USE_TLS}")
    else:
        print(f"⚠️  Using local file storage (development mode)")
        print(f"  Outbox: {settings.OUTBOX_DIR}")

    # Get test email
    test_email = sys.argv[1] if len(sys.argv) > 1 else "test@continuum.im"
    print(f"\n📧 Test recipient: {test_email}")

    # Initialize database
    print("\n🔄 Initializing database...")
    create_db_and_tables()

    # Get database session
    session = next(get_session())

    print("\n" + "=" * 60)
    print("TESTING EMAIL TEMPLATES")
    print("=" * 60)

    # Test 1: Welcome Email
    print("\n[1/6] Testing Welcome Email...")
    try:
        result = email_service.send_welcome_email(
            to_email=test_email,
            user_id=1,
            dashboard_url=f"{settings.get_frontend_url()}/dashboard",
            db_session=session
        )
        print(f"  ✅ Status: {result.get('status')}")
        if result.get('message_id'):
            print(f"  Message ID: {result.get('message_id')}")
        if result.get('file_path'):
            print(f"  Saved to: {result.get('file_path')}")
    except Exception as e:
        print(f"  ❌ Error: {e}")

    # Test 2: Magic Link
    print("\n[2/6] Testing Magic Link Email...")
    try:
        magic_url = f"{settings.get_frontend_url()}/auth/verify?token=test-token-123"
        result = email_service.send_magic_link(
            to_email=test_email,
            magic_link_url=magic_url,
            db_session=session
        )
        print(f"  ✅ Status: {result.get('status')}")
        if result.get('message_id'):
            print(f"  Message ID: {result.get('message_id')}")
    except Exception as e:
        print(f"  ❌ Error: {e}")

    # Test 3-6: Pulse Alerts (All Tiers)
    for tier in range(1, 5):
        print(f"\n[{tier+2}/6] Testing Pulse Alert Tier {tier}...")
        try:
            result = email_service.send_pulse_alert(
                to_email=test_email,
                recipient_name="Test Guardian",
                tier_number=tier,
                user_id=1,
                user_name="John Doe",
                portal_url=f"{settings.get_frontend_url()}/portal/test-token",
                additional_context={
                    "last_checkin_date": "January 15, 2026 at 10:30 AM UTC",
                    "expected_checkin_date": "January 20, 2026",
                    "escalation_date": "January 21, 2026 at 02:00 PM UTC"
                },
                db_session=session
            )
            print(f"  ✅ Status: {result.get('status')}")
            if result.get('message_id'):
                print(f"  Message ID: {result.get('message_id')}")
        except Exception as e:
            print(f"  ❌ Error: {e}")

    # Summary
    print("\n" + "=" * 60)
    print("EMAIL LOG SUMMARY")
    print("=" * 60)

    from sqlmodel import select
    from backend.models.email_log import EmailLog

    logs = session.exec(select(EmailLog).order_by(EmailLog.created_at.desc()).limit(10)).all()

    if logs:
        print(f"\nRecent {len(logs)} emails:")
        for log in logs:
            status_icon = "✅" if log.status == "sent" else "📧" if log.status == "saved_local" else "❌"
            print(f"  {status_icon} {log.template_name:30s} → {log.recipient_email:30s} [{log.status}]")

        # Status counts
        from collections import Counter
        status_counts = Counter(log.status for log in logs)
        print(f"\nStatus breakdown:")
        for status, count in status_counts.items():
            print(f"  {status}: {count}")
    else:
        print("\n⚠️  No email logs found")

    # Local files
    if email_service.provider == "local":
        print("\n" + "=" * 60)
        print("LOCAL EMAIL FILES")
        print("=" * 60)
        import os
        outbox_files = sorted(os.listdir(settings.OUTBOX_DIR))[-6:]  # Last 6 files
        print(f"\nRecent files in {settings.OUTBOX_DIR}:")
        for filename in outbox_files:
            print(f"  📄 {filename}")

    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
    print("\nNext steps:")
    if email_service.provider == "local":
        print("  1. Configure POSTMARK_API_KEY or SMTP settings in .env")
        print("  2. Run this test again to verify actual email delivery")
        print("  3. Check email templates in backend/templates/emails/")
    else:
        print("  1. Check your email inbox for test messages")
        print("  2. Review email_logs table for delivery status")
        print("  3. Update templates if needed in backend/templates/emails/")

    session.close()


if __name__ == "__main__":
    test_email_service()
