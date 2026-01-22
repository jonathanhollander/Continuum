"""
Audit logging utilities for tracking sensitive operations.
"""
from backend.models.audit_log import AuditLog
from sqlmodel import Session
from fastapi import Request
from typing import Optional


from backend.utils.logger import get_logger

logger = get_logger(__name__)

def log_audit(
    session: Session,
    request: Request,
    action: str,
    user_id: Optional[int] = None,
    user_email: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    success: bool = True,
    error_message: Optional[str] = None,
    details: Optional[str] = None
) -> None:
    """
    Log an audit event to the database.

    Args:
        session: Database session
        request: FastAPI Request object for extracting IP and user agent
        action: Action being performed (e.g., "login", "delete_contact", "pulse_escalation")
        user_id: ID of user performing the action
        user_email: Email of user (cached for deleted users)
        resource_type: Type of resource being acted upon (e.g., "contact", "document")
        resource_id: ID of the resource
        success: Whether the action succeeded
        error_message: Error message if action failed
        details: Additional context as JSON string
    """
    try:
        audit = AuditLog(
            user_id=user_id,
            user_email=user_email,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            success=success,
            error_message=error_message,
            details=details
        )
        session.add(audit)
        session.commit()
    except Exception as e:
        # Don't fail the main operation if audit logging fails
        logger.error(f"Audit logging failed for action '{action}': {e}")


def log_auth_success(
    session: Session,
    request: Request,
    user_id: int,
    user_email: str,
    auth_method: str
) -> None:
    """Log successful authentication."""
    log_audit(
        session=session,
        request=request,
        action=f"auth_{auth_method}",
        user_id=user_id,
        user_email=user_email,
        resource_type="authentication",
        success=True
    )


def log_auth_failure(
    session: Session,
    request: Request,
    user_email: str,
    auth_method: str,
    error: str
) -> None:
    """Log failed authentication attempt."""
    log_audit(
        session=session,
        request=request,
        action=f"auth_{auth_method}_failed",
        user_email=user_email,
        resource_type="authentication",
        success=False,
        error_message=error
    )


def log_deletion(
    session: Session,
    request: Request,
    user_id: int,
    user_email: str,
    resource_type: str,
    resource_id: int
) -> None:
    """Log data deletion."""
    log_audit(
        session=session,
        request=request,
        action=f"delete_{resource_type}",
        user_id=user_id,
        user_email=user_email,
        resource_type=resource_type,
        resource_id=str(resource_id),
        success=True
    )


def log_config_change(
    session: Session,
    request: Request,
    user_id: int,
    user_email: str,
    config_type: str,
    details: Optional[str] = None
) -> None:
    """Log configuration change."""
    log_audit(
        session=session,
        request=request,
        action=f"config_change_{config_type}",
        user_id=user_id,
        user_email=user_email,
        resource_type="configuration",
        success=True,
        details=details
    )


def log_pulse_escalation(
    session: Session,
    request: Request,
    user_id: int,
    tier_number: int,
    details: Optional[str] = None
) -> None:
    """Log Pulse escalation event."""
    log_audit(
        session=session,
        request=request,
        action="pulse_escalation",
        user_id=user_id,
        resource_type="pulse",
        resource_id=str(tier_number),
        success=True,
        details=details
    )


def log_data_export(
    session: Session,
    request: Request,
    user_id: int,
    user_email: str,
    export_type: str
) -> None:
    """Log data export event."""
    log_audit(
        session=session,
        request=request,
        action=f"export_{export_type}",
        user_id=user_id,
        user_email=user_email,
        resource_type="export",
        success=True
    )
