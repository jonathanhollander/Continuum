"""
Audit logging utilities for tracking sensitive operations.
"""
from backend.models.audit_log import AuditLog
from sqlmodel import Session
from fastapi import Request
from typing import Optional


from backend.utils.logger import get_logger
from backend.limiter import client_ip

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
    details: Optional[str] = None,
    commit: bool = True
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
        commit: False adds the row to the session only; the caller's own commit
            writes it together with the change it records (one transaction).
    """
    try:
        audit = AuditLog(
            user_id=user_id,
            user_email=user_email,
            ip_address=client_ip(request),
            user_agent=request.headers.get("user-agent"),
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            success=success,
            error_message=error_message,
            details=details
        )
        session.add(audit)
        if commit:
            session.commit()
    except Exception as e:
        # Don't fail the main operation if audit logging fails
        logger.error(f"Audit logging failed for action '{action}': {e}")


def log_auth_success(
    session: Session,
    request: Request,
    user_id: int,
    user_email: str,
    auth_method: str,
    commit: bool = True
) -> None:
    """Log successful authentication. commit=False: the caller's next commit writes it."""
    log_audit(
        session=session,
        request=request,
        action=f"auth_{auth_method}",
        user_id=user_id,
        user_email=user_email,
        resource_type="authentication",
        success=True,
        commit=commit
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
    resource_id: int,
    commit: bool = True
) -> None:
    """Log data deletion. commit=False: the caller's commit writes it with the delete."""
    log_audit(
        session=session,
        request=request,
        action=f"delete_{resource_type}",
        user_id=user_id,
        user_email=user_email,
        resource_type=resource_type,
        resource_id=str(resource_id),
        success=True,
        commit=commit
    )
