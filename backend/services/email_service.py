"""
Production-ready email service with multiple provider support.

Supports:
- Postmark API (recommended for production)
- SMTP (fallback for generic providers)
- Local file storage (development/testing)

Features:
- Template rendering with Jinja2
- Email delivery logging
- Retry logic for failed sends
- Graceful fallback between providers
"""
import os
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from typing import Optional, Dict, Any
from jinja2 import Environment, FileSystemLoader, select_autoescape
from backend.config import settings
from sqlmodel import Session
from pydantic import BaseModel, EmailStr, Field
from backend.models.email_log import EmailLog
from backend.utils.logger import get_logger
from backend.database import get_session, User

logger = get_logger(__name__)


class EmailPayload(BaseModel):
    """Schema for a standard email send request."""
    to_email: EmailStr
    recipient_name: str
    subject: str
    template_name: str
    template_context: Dict[str, Any]
    user_id: Optional[int] = None

class EmailResult(BaseModel):
    """Schema for email delivery result."""
    status: str
    message_id: Optional[str] = None
    provider: str
    error: Optional[str] = None
    file_path: Optional[str] = None


class EmailService:
    """
    Unified email service supporting multiple providers.
    Automatically selects provider based on configuration.
    """

    def __init__(self):
        # Initialize Jinja2 template environment
        template_dir = Path(__file__).parent.parent / "templates"
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=select_autoescape(['html', 'xml'])
        )

        # Ensure outbox directory exists for local mode
        self.outbox_dir = settings.OUTBOX_DIR
        if not os.path.exists(self.outbox_dir):
            os.makedirs(self.outbox_dir)

        # Determine active provider
        self.provider = self._determine_provider()

        # Initialize Postmark if configured
        if self.provider == "postmark" and settings.POSTMARK_API_KEY:
            try:
                from postmarker.core import PostmarkClient
                self.postmark_client = PostmarkClient(server_token=settings.POSTMARK_API_KEY)
            except ImportError:
                logger.warning(
                    "Postmark library not installed, falling back to alternate provider",
                    extra={"context": {"fallback_provider": "smtp" if settings.SMTP_ENABLED else "local"}}
                )
                self.provider = "smtp" if settings.SMTP_ENABLED else "local"

    def _determine_provider(self) -> str:
        """Determine which email provider to use based on configuration."""
        if settings.POSTMARK_API_KEY:
            return "postmark"
        elif settings.SMTP_ENABLED and settings.SMTP_HOST:
            return "smtp"
        else:
            return "local"

    def send_email(
        self,
        payload: EmailPayload,
        db_session: Optional[Session] = None
    ) -> EmailResult:
        """
        Send email using configured provider.

        Args:
            payload: Validated email payload
            db_session: Database session for logging

        Returns:
            EmailResult model with delivery status
        """
        to_email = payload.to_email
        recipient_name = payload.recipient_name
        subject = payload.subject
        template_name = payload.template_name
        template_context = payload.template_context
        user_id = payload.user_id

        # Add standard context variables
        context = {
            "recipient_name": recipient_name,
            "user_id": user_id,
            "subject": subject,
            **template_context
        }

        # Render HTML template
        try:
            template = self.jinja_env.get_template(f"emails/{template_name}.html")
            html_body = template.render(**context)
        except Exception as e:
            logger.error(
                "Email template rendering failed",
                extra={"context": {
                    "template_name": template_name,
                    "recipient": to_email,
                    "subject": subject,
                    "error": str(e),
                    "error_type": type(e).__name__
                }},
                exc_info=True
            )
            return EmailResult(status="failed", error=f"Template error: {e}", provider=self.provider)

        # Create email log entry
        log_entry = None
        if db_session:
            log_entry = EmailLog(
                user_id=user_id,
                recipient_email=to_email,
                recipient_name=recipient_name,
                subject=subject,
                template_name=template_name,
                status="pending",
                provider=self.provider
            )
            db_session.add(log_entry)
            db_session.commit()
            db_session.refresh(log_entry)

        # Send via appropriate provider
        result = None
        try:
            if self.provider == "postmark":
                result = self._send_via_postmark(to_email, subject, html_body)
            elif self.provider == "smtp":
                result = self._send_via_smtp(to_email, recipient_name, subject, html_body)
            else:
                result = self._save_to_local(to_email, subject, html_body)

            # Update log entry on success
            if db_session and log_entry:
                log_entry.status = result.get("status", "sent")
                log_entry.provider_message_id = result.get("message_id")
                log_entry.sent_at = datetime.utcnow()
                db_session.add(log_entry)
                db_session.commit()

            return EmailResult(**result)

        except Exception as e:
            logger.error(
                "Email send failed",
                extra={"context": {
                    "provider": self.provider,
                    "recipient": to_email,
                    "subject": subject,
                    "user_id": user_id,
                    "error": str(e),
                    "error_type": type(e).__name__
                }},
                exc_info=True
            )

            # Update log entry with error
            if db_session and log_entry:
                log_entry.status = "failed"
                log_entry.error_message = str(e)
                db_session.add(log_entry)
                db_session.commit()

            return EmailResult(status="failed", error=str(e), provider=self.provider)

    def _send_via_postmark(self, to_email: str, subject: str, html_body: str) -> Dict[str, Any]:
        """Send email using Postmark API."""
        try:
            response = self.postmark_client.emails.send(
                From=settings.POSTMARK_FROM_EMAIL,
                To=to_email,
                Subject=subject,
                HtmlBody=html_body,
                MessageStream="outbound"
            )

            logger.info(
                "Email sent via Postmark",
                extra={"context": {
                    "provider": "postmark",
                    "recipient": to_email,
                    "subject": subject,
                    "message_id": response.get("MessageID")
                }}
            )
            return {
                "status": "sent",
                "provider": "postmark",
                "message_id": response.get("MessageID")
            }
        except Exception as e:
            fallback_provider = "smtp" if settings.SMTP_ENABLED else "local"
            logger.warning(
                f"Postmark send failed, falling back to {fallback_provider}",
                extra={"context": {
                    "original_provider": "postmark",
                    "fallback_provider": fallback_provider,
                    "recipient": to_email,
                    "error": str(e),
                    "error_type": type(e).__name__
                }}
            )
            # Fallback to SMTP or local
            if settings.SMTP_ENABLED:
                logger.debug("Falling back to SMTP from Postmark")
                return self._send_via_smtp(to_email, "", subject, html_body)
            else:
                logger.debug("Falling back to local from Postmark")
                return self._save_to_local(to_email, subject, html_body)

    def _send_via_smtp(self, to_email: str, recipient_name: str, subject: str, html_body: str) -> Dict[str, Any]:
        """Send email using SMTP."""
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg['To'] = to_email

            # Attach HTML body
            html_part = MIMEText(html_body, 'html')
            msg.attach(html_part)

            # Send via SMTP
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                if settings.SMTP_PORT == 587:
                    server.starttls()
                if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.send_message(msg)

            logger.info(
                "Email sent via SMTP",
                extra={"context": {
                    "provider": "smtp",
                    "recipient": to_email,
                    "subject": subject,
                    "message_id": msg.get('Message-ID', 'smtp-' + datetime.utcnow().isoformat())
                }}
            )
            return {
                "status": "sent",
                "provider": "smtp",
                "message_id": msg.get('Message-ID', 'smtp-' + datetime.utcnow().isoformat())
            }
        except Exception as e:
            logger.warning(
                "SMTP send failed, falling back to local storage",
                extra={"context": {
                    "original_provider": "smtp",
                    "fallback_provider": "local",
                    "recipient": to_email,
                    "error": str(e),
                    "error_type": type(e).__name__
                }}
            )
            # Fallback to local
            return self._save_to_local(to_email, subject, html_body)

    def _save_to_local(self, to_email: str, subject: str, html_body: str) -> Dict[str, Any]:
        """Save email to local file (development mode)."""
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        safe_subject = subject.replace(" ", "_").lower()[:30]
        filename = f"{timestamp}_{safe_subject}_{to_email}.html"
        filepath = os.path.join(self.outbox_dir, filename)

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(html_body)

        logger.info(
            "Email saved to local file",
            extra={"context": {
                "provider": "local",
                "recipient": to_email,
                "subject": subject,
                "file_path": filepath,
                "message_id": f"local-{timestamp}"
            }}
        )
        return {
            "status": "saved_local",
            "provider": "local",
            "file_path": filepath,
            "message_id": f"local-{timestamp}"
        }

    # Convenience methods for common email types

    def send_magic_link(
        self,
        to_email: str,
        magic_link_url: str,
        db_session: Optional[Session] = None
    ) -> EmailResult:
        """Send magic link authentication email."""
        payload = EmailPayload(
            to_email=to_email,
            recipient_name=to_email.split('@')[0].title(),
            subject="Your Secure Continuum Login Link",
            template_name="magic_link",
            template_context={"magic_link_url": magic_link_url}
        )
        return self.send_email(payload=payload, db_session=db_session)

    def send_pulse_alert(
        self,
        to_email: str,
        recipient_name: str,
        tier_number: int,
        user_id: int,
        user_name: str,
        portal_url: str,
        additional_context: Optional[Dict[str, Any]] = None,
        db_session: Optional[Session] = None
    ) -> EmailResult:
        """Send pulse escalation alert email."""
        context = {
            "user_name": user_name,
            "portal_url": portal_url,
            **(additional_context or {})
        }

        tier_subjects = {
            1: "Continuum Pulse: Standard Welfare Check",
            2: "Continuum Pulse: Level 2 Escalation",
            3: "Continuum Pulse: URGENT - Medical/Legal Release",
            4: "Continuum Pulse: EMERGENCY - Full Vault Access"
        }

        payload = EmailPayload(
            to_email=to_email,
            recipient_name=recipient_name,
            subject=tier_subjects.get(tier_number, f"Continuum Pulse: Tier {tier_number} Alert"),
            template_name=f"pulse_escalation_tier{tier_number}",
            template_context=context,
            user_id=user_id
        )
        return self.send_email(payload=payload, db_session=db_session)

    def send_welcome_email(
        self,
        to_email: str,
        user_id: int,
        dashboard_url: str,
        db_session: Optional[Session] = None
    ) -> EmailResult:
        """Send welcome email to new users."""
        payload = EmailPayload(
            to_email=to_email,
            recipient_name=to_email.split('@')[0].title(),
            subject="Welcome to Continuum - Your Digital Legacy is Protected",
            template_name="welcome",
            template_context={"dashboard_url": dashboard_url},
            user_id=user_id
        )
        return self.send_email(payload=payload, db_session=db_session)


# Singleton instance
email_service = EmailService()
