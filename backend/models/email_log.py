"""
Email delivery tracking and logging.
Tracks all emails sent through the system for audit and troubleshooting.
"""
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional


class EmailLog(SQLModel, table=True):
    """
    Tracks email delivery for audit trail and debugging.

    Attributes:
        id: Unique identifier
        user_id: Associated user (optional - some emails may be system-wide)
        recipient_email: Email address of recipient
        recipient_name: Name of recipient
        subject: Email subject line
        template_name: Template used (e.g., "magic_link", "pulse_tier1")
        status: Delivery status (pending, sent, failed, bounced, spam_complaint, unsubscribed)
        provider: Email provider used (postmark, smtp, local)
        provider_message_id: External message ID from email provider
        error_message: Error details if delivery failed
        sent_at: Timestamp when email was sent
        created_at: Record creation timestamp
    """
    __tablename__ = "email_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, index=True)
    recipient_email: str = Field(index=True)
    recipient_name: str
    subject: str
    template_name: str = Field(index=True)
    status: str = Field(default="pending", index=True)  # pending, sent, failed, bounced, spam_complaint, unsubscribed
    provider: str = Field(default="postmark")  # postmark, smtp, local
    provider_message_id: Optional[str] = Field(default=None)
    error_message: Optional[str] = Field(default=None)
    sent_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 1,
                "recipient_email": "guardian@example.com",
                "recipient_name": "Jane Doe",
                "subject": "Continuum Pulse: Standard Welfare Check",
                "template_name": "pulse_tier1",
                "status": "sent",
                "provider": "postmark",
                "provider_message_id": "abc-123-xyz"
            }
        }
