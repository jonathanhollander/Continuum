"""
Audit Log Model for tracking sensitive operations
"""
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class AuditLog(SQLModel, table=True):
    """
    Tracks sensitive operations for security and compliance.

    Logged operations include:
    - Authentication (login, logout, failed attempts)
    - Data deletion
    - Configuration changes
    - Permission changes
    - Pulse escalations
    - Data exports
    """
    __tablename__ = "audit_logs"

    id: Optional[int] = Field(default=None, primary_key=True)

    # Who performed the action
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
    user_email: Optional[str] = None  # Cached for deleted users
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

    # What action was performed
    action: str = Field(index=True)  # e.g., "login", "delete_contact", "pulse_escalation"
    resource_type: Optional[str] = None  # e.g., "contact", "document", "pulse_settings"
    resource_id: Optional[str] = None

    # Additional context
    details: Optional[str] = None  # JSON string with additional details
    success: bool = True  # Whether the action succeeded
    error_message: Optional[str] = None

    # When it happened
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 1,
                "user_email": "user@example.com",
                "ip_address": "192.168.1.1",
                "action": "delete_contact",
                "resource_type": "contact",
                "resource_id": "123",
                "success": True,
                "timestamp": "2026-01-21T12:00:00Z"
            }
        }
