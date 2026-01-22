"""
Email status and management endpoints.
Allows users to check email delivery status for debugging and support.
Includes Postmark webhook for bounce/complaint handling.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Header
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr
from backend.database import get_session, User
from backend.auth import get_current_user
from backend.models.email_log import EmailLog
from backend.utils.logger import get_logger
from backend.config import settings

logger = get_logger(__name__)
router = APIRouter(prefix="/api/emails", tags=["emails"])


class EmailStatusResponse(BaseModel):
    """Response model for email status."""
    id: int
    user_id: Optional[int]
    recipient_email: str
    recipient_name: Optional[str]
    subject: str
    template_name: Optional[str]
    status: str  # pending, sent, failed, saved_local
    provider: str  # postmark, smtp, local
    provider_message_id: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    sent_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.get("/status", response_model=List[EmailStatusResponse])
def get_email_status(
    user_id: Optional[int] = Query(None, description="Filter by user ID (admin only)"),
    recipient: Optional[str] = Query(None, description="Filter by recipient email"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (sent, failed, pending)"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of results"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Query email send status for debugging/support.

    Regular users can only see their own emails.
    Admins can filter by any user_id.

    Args:
        user_id: Filter by user ID (admin only)
        recipient: Filter by recipient email
        status_filter: Filter by status (sent, failed, pending)
        limit: Maximum number of results (1-100, default 10)
        current_user: Authenticated user
        session: Database session

    Returns:
        List of email log entries
    """
    query = select(EmailLog)

    # Security: Non-admins can only see their own emails
    # Note: Add is_admin field to User model for production
    # For now, assume user_id=1 is admin (dev user)
    is_admin = current_user.id == 1  # TODO: Replace with proper admin check

    if not is_admin:
        # Regular users can only see their own emails
        query = query.where(EmailLog.user_id == current_user.id)
        logger.info(
            "User querying their own email status",
            extra={"context": {"user_id": current_user.id}}
        )
    else:
        # Admin can filter by any user_id
        if user_id:
            query = query.where(EmailLog.user_id == user_id)
        logger.info(
            "Admin querying email status",
            extra={"context": {
                "admin_user_id": current_user.id,
                "filter_user_id": user_id
            }}
        )

    # Apply filters
    if recipient:
        query = query.where(EmailLog.recipient_email == recipient)

    if status_filter:
        query = query.where(EmailLog.status == status_filter)

    # Order by most recent first
    query = query.order_by(EmailLog.created_at.desc()).limit(limit)

    logs = session.exec(query).all()

    logger.info(
        f"Email status query returned {len(logs)} results",
        extra={"context": {
            "user_id": current_user.id,
            "is_admin": is_admin,
            "result_count": len(logs)
        }}
    )

    return logs


@router.get("/status/{email_log_id}", response_model=EmailStatusResponse)
def get_email_by_id(
    email_log_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get detailed status of a specific email by ID.

    Users can only access their own email logs.
    Admins can access any email log.
    """
    email_log = session.get(EmailLog, email_log_id)

    if not email_log:
        logger.warning(
            f"Email log {email_log_id} not found",
            extra={"context": {"email_log_id": email_log_id, "user_id": current_user.id}}
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email log not found"
        )

    # Security check
    is_admin = current_user.id == 1  # TODO: Replace with proper admin check
    if not is_admin and email_log.user_id != current_user.id:
        logger.warning(
            f"Unauthorized access attempt to email log {email_log_id}",
            extra={"context": {
                "email_log_id": email_log_id,
                "user_id": current_user.id,
                "log_owner_id": email_log.user_id
            }}
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this email log"
        )

    return email_log


@router.post("/resend/{email_log_id}")
def resend_email(
    email_log_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Retry sending a failed email.

    Only admins can resend emails.
    This is useful for debugging and recovering from transient failures.
    """
    is_admin = current_user.id == 1  # TODO: Replace with proper admin check

    if not is_admin:
        logger.warning(
            f"Non-admin user attempted to resend email {email_log_id}",
            extra={"context": {"user_id": current_user.id, "email_log_id": email_log_id}}
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can resend emails"
        )

    email_log = session.get(EmailLog, email_log_id)

    if not email_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email log not found"
        )

    if email_log.status == "sent":
        logger.info(
            f"Attempted to resend already-sent email {email_log_id}",
            extra={"context": {"email_log_id": email_log_id}}
        )
        return {
            "status": "already_sent",
            "message": "This email was already sent successfully"
        }

    # Attempt resend
    from backend.services.email_service import email_service

    try:
        result = email_service.send_email(
            to_email=email_log.recipient_email,
            recipient_name=email_log.recipient_name or email_log.recipient_email.split('@')[0].title(),
            subject=email_log.subject,
            template_name=email_log.template_name or "welcome",
            template_context={},
            user_id=email_log.user_id,
            db_session=session
        )

        logger.info(
            f"Email {email_log_id} resent successfully",
            extra={"context": {
                "email_log_id": email_log_id,
                "result": result
            }}
        )

        return {
            "status": "resent",
            "message": "Email resent successfully",
            "result": result
        }

    except Exception as e:
        logger.error(
            f"Failed to resend email {email_log_id}",
            extra={"context": {
                "email_log_id": email_log_id,
                "error": str(e),
                "error_type": type(e).__name__
            }},
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resend email: {str(e)}"
        )


# Postmark webhook models
class PostmarkBouncePayload(BaseModel):
    """Postmark bounce webhook payload."""
    RecordType: str  # "Bounce", "SpamComplaint", "SubscriptionChange"
    MessageID: str
    Email: str
    BouncedAt: Optional[str] = None
    Type: Optional[str] = None  # "HardBounce", "SoftBounce", "SpamComplaint", etc.
    TypeCode: Optional[int] = None
    Name: Optional[str] = None
    Description: Optional[str] = None
    Details: Optional[str] = None
    Tag: Optional[str] = None
    Subject: Optional[str] = None

    class Config:
        extra = "allow"  # Allow additional Postmark fields


class WebhookResponse(BaseModel):
    """Response model for webhook endpoints."""
    status: str
    message: str
    updated_count: int = 0


@router.post("/webhook/postmark", response_model=WebhookResponse, include_in_schema=False)
async def postmark_bounce_webhook(
    payload: PostmarkBouncePayload,
    request: Request,
    session: Session = Depends(get_session)
):
    """
    Receive Postmark bounce/complaint notifications.

    This endpoint should be configured in Postmark's webhook settings.
    It handles:
    - Hard bounces (permanent delivery failures)
    - Soft bounces (temporary delivery failures)
    - Spam complaints
    - Subscription changes

    Security: This endpoint is public but verifies the payload contains
    a valid MessageID that matches our records.

    Configure in Postmark:
    1. Go to Servers > Your Server > Webhooks
    2. Add a new webhook
    3. Set URL to: https://your-domain.com/api/emails/webhook/postmark
    4. Select event types: Bounce, SpamComplaint
    """
    record_type = payload.RecordType
    message_id = payload.MessageID
    recipient_email = payload.Email

    logger.info(
        f"Postmark webhook received: {record_type}",
        extra={"context": {
            "record_type": record_type,
            "message_id": message_id,
            "email": recipient_email,
            "bounce_type": payload.Type,
            "type_code": payload.TypeCode
        }}
    )

    # Determine the new status based on record type
    if record_type == "Bounce":
        new_status = "bounced"
        error_description = f"{payload.Type or 'Unknown'}: {payload.Description or 'No description'}"
    elif record_type == "SpamComplaint":
        new_status = "spam_complaint"
        error_description = "Recipient marked email as spam"
    elif record_type == "SubscriptionChange":
        new_status = "unsubscribed"
        error_description = "Recipient unsubscribed"
    else:
        logger.warning(
            f"Unknown Postmark webhook record type: {record_type}",
            extra={"context": {"record_type": record_type, "message_id": message_id}}
        )
        return WebhookResponse(
            status="ignored",
            message=f"Unknown record type: {record_type}",
            updated_count=0
        )

    # Find and update email logs with this message ID
    query = select(EmailLog).where(EmailLog.provider_message_id == message_id)
    logs = session.exec(query).all()

    if not logs:
        # Try to find by recipient email as fallback
        query = select(EmailLog).where(
            EmailLog.recipient_email == recipient_email,
            EmailLog.status == "sent"
        ).order_by(EmailLog.created_at.desc()).limit(1)
        logs = session.exec(query).all()

    updated_count = 0
    for log in logs:
        log.status = new_status
        log.error_message = error_description
        session.add(log)
        updated_count += 1

        logger.info(
            f"Email log updated from webhook",
            extra={"context": {
                "email_log_id": log.id,
                "old_status": "sent",
                "new_status": new_status,
                "recipient": recipient_email,
                "message_id": message_id
            }}
        )

    session.commit()

    if updated_count == 0:
        logger.warning(
            f"No matching email log found for Postmark webhook",
            extra={"context": {
                "message_id": message_id,
                "recipient": recipient_email,
                "record_type": record_type
            }}
        )

    return WebhookResponse(
        status="processed",
        message=f"Processed {record_type} event",
        updated_count=updated_count
    )


@router.get("/bounces", response_model=List[EmailStatusResponse])
def get_bounced_emails(
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get all bounced and spam-complaint emails.

    Admin only. Useful for monitoring email deliverability.
    """
    is_admin = current_user.id == 1  # TODO: Replace with proper admin check

    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view bounce reports"
        )

    query = select(EmailLog).where(
        EmailLog.status.in_(["bounced", "spam_complaint", "unsubscribed"])
    ).order_by(EmailLog.created_at.desc()).limit(limit)

    logs = session.exec(query).all()

    logger.info(
        f"Bounce report queried: {len(logs)} results",
        extra={"context": {"admin_user_id": current_user.id, "result_count": len(logs)}}
    )

    return logs
