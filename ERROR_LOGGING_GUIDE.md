# Error Logging & User Visibility Guide

## Overview

This guide covers Continuum's comprehensive error logging and user visibility system, implemented to address the core pain point: **"I tested email signup. I did not get an email. I have no idea what happened or where to look."**

The system provides:
- **Structured backend logging** with Python's logging module
- **Request correlation** via unique request IDs
- **Email delivery tracking** with queryable API
- **Compassionate user-facing error messages** via global notification system
- **Developer-friendly log format** for debugging

---

## Table of Contents

1. [Backend Logging System](#backend-logging-system)
2. [Using the Logger](#using-the-logger)
3. [Log Context and Structure](#log-context-and-structure)
4. [Request Correlation](#request-correlation)
5. [Email Status API](#email-status-api)
6. [Frontend Error Handling](#frontend-error-handling)
7. [Querying Logs](#querying-logs)
8. [Common Error Patterns](#common-error-patterns)
9. [Troubleshooting](#troubleshooting)

---

## Backend Logging System

### Architecture

**Location**: `backend/utils/logger.py`

The logging system provides:
- **Colored console output** for development (easier to scan)
- **File logging** with automatic rotation (10MB max, 5 backups)
- **JSON formatting** for production (machine-parseable)
- **Contextual logging** with request IDs, user IDs, error details

### Configuration

Logging is configured automatically on application startup in `backend/main.py`:

```python
from backend.utils.logger import setup_logging, get_logger

@app.on_event("startup")
def on_startup():
    setup_logging(
        log_level="DEBUG" if settings.DEBUG else "INFO",
        use_json=settings.ENVIRONMENT == "production"
    )
```

**Parameters**:
- `log_level`: "DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"
- `log_dir`: Directory for log files (default: `backend/logs/`)
- `max_bytes`: Max log file size before rotation (default: 10MB)
- `backup_count`: Number of backup files to keep (default: 5)
- `use_json`: Use JSON format for logs (default: False, True in production)

### Log Files

**Location**: `backend/logs/continuum.log`

**Rotation**: Automatic when file reaches 10MB
- `continuum.log` - Current log file
- `continuum.log.1` - Most recent backup
- `continuum.log.2` - Older backup
- ... up to `continuum.log.5`

---

## Using the Logger

### Basic Usage

```python
from backend.utils.logger import get_logger

logger = get_logger(__name__)

# Different log levels
logger.debug("Detailed diagnostic information")
logger.info("General informational message")
logger.warning("Warning: something unexpected happened")
logger.error("Error: operation failed")
logger.critical("Critical: system cannot continue")
```

### DO NOT Use print()

**❌ NEVER DO THIS:**
```python
print(f"User {user_id} logged in")
print(f"⚠️ Email failed: {error}")
```

**✅ ALWAYS DO THIS:**
```python
logger.info("User logged in", extra={"context": {"user_id": user_id}})
logger.error("Email send failed", extra={"context": {
    "user_id": user_id,
    "error": str(error),
    "error_type": type(error).__name__
}})
```

---

## Log Context and Structure

### Adding Context

All logs should include a `context` dictionary with relevant details:

```python
logger.error(
    "Failed to send welcome email",
    extra={
        "context": {
            "user_id": new_user.id,
            "email": new_user.email,
            "error": str(e),
            "error_type": type(e).__name__,
            "request_id": request.state.request_id,
            "endpoint": request.url.path
        }
    }
)
```

### Standard Context Fields

**Always include when available**:
- `user_id`: Integer - The authenticated user's ID
- `request_id`: String (UUID) - Unique ID for this request (from middleware)
- `error`: String - Error message text
- `error_type`: String - Exception class name (e.g., "ValueError")

**Include when relevant**:
- `email`: Email address (for signup/login/email operations)
- `endpoint`: API endpoint path
- `resource_type`: Type of resource (e.g., "contact", "document")
- `resource_id`: ID of affected resource
- `provider`: External service (e.g., "postmark", "smtp")
- `provider_message_id`: External tracking ID

### Exception Logging

When logging exceptions, include `exc_info=True` to capture the full traceback:

```python
try:
    result = dangerous_operation()
except Exception as e:
    logger.error(
        "Operation failed",
        extra={"context": {
            "user_id": user_id,
            "error": str(e),
            "error_type": type(e).__name__
        }},
        exc_info=True  # Captures full stack trace
    )
```

---

## Request Correlation

### How It Works

Every HTTP request gets a unique request ID (UUID) via middleware:

```python
# backend/main.py
class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id

        return response
```

### Using Request IDs

**In routers**:
```python
@router.post("/api/auth/signup")
def signup(request: Request, signup_data: SignupRequest, session: Session = Depends(get_session)):
    logger.info(
        "Signup attempt",
        extra={"context": {
            "email": signup_data.email,
            "request_id": request.state.request_id
        }}
    )
```

**In frontend** (response header):
```typescript
const response = await apiPost('/api/auth/signup', data);
const requestId = response.headers.get('X-Request-ID');
console.log('Request ID:', requestId);
```

### Correlating Logs

To find all logs for a specific request:

```bash
# Find all logs with request ID
grep "e7f8a9b2-1234-5678-9abc-def012345678" backend/logs/continuum.log

# View full context around request
grep -B 5 -A 10 "e7f8a9b2-1234-5678-9abc-def012345678" backend/logs/continuum.log
```

---

## Email Status API

### Endpoints

#### GET /api/emails/status

Query email send status for debugging/support.

**Query Parameters**:
- `user_id` (int, optional): Filter by user ID (admin only)
- `recipient` (string, optional): Filter by recipient email
- `status` (string, optional): Filter by status (sent, failed, pending)
- `limit` (int, optional): Max results (1-100, default 10)

**Response**:
```json
[
  {
    "id": 1,
    "user_id": 42,
    "recipient_email": "user@example.com",
    "recipient_name": "John Doe",
    "subject": "Welcome to Continuum!",
    "template_name": "welcome",
    "status": "sent",
    "provider": "postmark",
    "provider_message_id": "abc-123-xyz",
    "error_message": null,
    "created_at": "2026-01-21T10:30:00Z",
    "sent_at": "2026-01-21T10:30:05Z"
  }
]
```

**Security**: Non-admin users can only see their own emails. Admin users (user_id=1) can see all emails.

**Example Usage**:
```bash
# Check your own email status
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/emails/status?limit=20"

# Check specific recipient (admin only)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/emails/status?recipient=user@example.com"

# Check failed emails only
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/emails/status?status=failed"
```

#### GET /api/emails/status/{email_log_id}

Get detailed status of a specific email by ID.

**Security**: Users can only access their own email logs.

#### POST /api/emails/resend/{email_log_id}

Retry sending a failed email (admin only).

---

## Frontend Error Handling

### Global Notification System

**Location**: `frontend/src/lib/stores/notificationStore.ts`

All errors should be displayed via the global notification system:

```typescript
import { notifications } from '$lib/stores/notificationStore';

// Success notification
notifications.showSuccess(
    'Your changes have been saved',
    'Success'
);

// Info notification
notifications.showInfo(
    'Email was saved locally (development mode)',
    'Account Created'
);

// Warning notification
notifications.showWarning(
    'We couldn\'t send the welcome email. Check your email settings.',
    'Account Created'
);

// Error notification
notifications.showError(
    'Please enter your email address',
    'Email Required'
);
```

### Using apiPost Instead of fetch

**❌ NEVER DO THIS:**
```typescript
const response = await fetch(`${API_BASE_URL}/api/endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});

if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
}
```

**✅ ALWAYS DO THIS:**
```typescript
import { apiPost } from '$lib/api/client';

try {
    const result = await apiPost('/api/endpoint', data);

    // Check for warnings from backend
    if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(warning => {
            notifications.showWarning(warning.message, 'Notice');
        });
    }

    notifications.showSuccess('Operation completed', 'Success');
} catch (e) {
    // apiPost already shows error notification
    console.error('Operation failed:', e);
}
```

### Backend Warning System

When operations succeed but with caveats, return warnings in the response:

**Backend** (`backend/routers/auth.py`):
```python
class WarningMessage(BaseModel):
    code: str
    message: str
    severity: str = "warning"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    warnings: List[WarningMessage] = []

# In endpoint
warnings = []
try:
    email_service.send_welcome_email(...)
except Exception as e:
    warnings.append(WarningMessage(
        code="EMAIL_FAILED",
        message="Your account was created, but we couldn't send the welcome email."
    ))

return {
    "access_token": token,
    "token_type": "bearer",
    "warnings": warnings
}
```

**Frontend** (handles warnings automatically):
```typescript
const result = await apiPost('/api/auth/signup', data);

// Warnings automatically displayed as notifications
```

---

## Querying Logs

### Local Development

**View logs in real-time**:
```bash
tail -f backend/logs/continuum.log
```

**Search for specific user**:
```bash
grep "user_id.*42" backend/logs/continuum.log
```

**Search for errors**:
```bash
grep "ERROR" backend/logs/continuum.log
grep "CRITICAL" backend/logs/continuum.log
```

**Search for email failures**:
```bash
grep -i "email.*failed" backend/logs/continuum.log
```

**Search by request ID**:
```bash
grep "request_id.*e7f8a9b2-1234-5678-9abc-def012345678" backend/logs/continuum.log
```

**View context around error** (5 lines before, 10 after):
```bash
grep -B 5 -A 10 "ERROR.*email" backend/logs/continuum.log
```

### Production (JSON Logs)

In production, logs are in JSON format for easier parsing:

```bash
# Parse JSON logs with jq
cat backend/logs/continuum.log | jq 'select(.level == "ERROR")'

# Find all errors for user
cat backend/logs/continuum.log | jq 'select(.context.user_id == 42 and .level == "ERROR")'

# Find all errors by request ID
cat backend/logs/continuum.log | jq 'select(.context.request_id == "e7f8a9b2-1234-5678-9abc-def012345678")'

# Count errors by type
cat backend/logs/continuum.log | jq -r 'select(.level == "ERROR") | .context.error_type' | sort | uniq -c
```

---

## Common Error Patterns

### 1. Email Send Failures

**Symptom**: User signs up but doesn't receive email

**Log Pattern**:
```
ERROR | backend.services.email_service | Failed to send welcome email | {'user_id': 42, 'email': 'user@example.com', 'error': 'Invalid API key', 'error_type': 'PostmarkError'}
```

**Check**:
1. Email status API: `GET /api/emails/status?recipient=user@example.com`
2. Look for `status: "failed"` and check `error_message`
3. Verify email service configuration:
   - `POSTMARK_API_KEY` set correctly
   - `POSTMARK_FROM_EMAIL` is verified
   - Or SMTP credentials if using SMTP

**Solution**:
- Update `.env` with correct API key
- Resend email: `POST /api/emails/resend/{email_log_id}`

### 2. Authentication Failures

**Symptom**: User can't log in

**Log Pattern**:
```
WARNING | backend.routers.auth | Login failed | {'email': 'user@example.com', 'reason': 'Invalid password', 'request_id': '...'}
```

**Check**:
1. Look for `auth_failure` events in logs
2. Check `reason` field
3. Verify user exists in database

### 3. WebAuthn Registration Failures

**Symptom**: Passkey creation fails

**Log Pattern**:
```
ERROR | backend.routers.auth | WebAuthn registration verification failed | {'user_id': 42, 'error': 'Challenge expired', 'error_type': 'WebAuthnError'}
```

**Check**:
1. Challenge may have expired (stored in memory, not persistent)
2. Browser may not support WebAuthn
3. User may have cancelled the prompt

### 4. Database Connection Errors

**Symptom**: "Internal Server Error" on all requests

**Log Pattern**:
```
CRITICAL | backend.database | Database connection failed | {'error': 'Connection refused', 'error_type': 'OperationalError'}
```

**Check**:
1. Database is running: `pg_isready` (PostgreSQL) or check SQLite file
2. `DATABASE_URL` in `.env` is correct
3. Database migrations are up to date: `alembic current`

---

## Troubleshooting

### No Logs Appearing

**Check**:
1. Log directory exists: `mkdir -p backend/logs`
2. Permissions: Ensure app can write to `backend/logs/`
3. Logger initialized: Check `setup_logging()` called in startup
4. Using `get_logger(__name__)` not `print()`

### Logs Missing Context

**Check**:
1. Using `extra={"context": {...}}` parameter
2. Request ID middleware is registered
3. Accessing `request.state.request_id` in routes

### Frontend Errors Not Showing

**Check**:
1. `NotificationContainer` is rendered in `+layout.svelte`
2. Using `apiPost()` instead of `fetch()`
3. Check browser console for JavaScript errors
4. Verify `notificationStore` is imported correctly

### Email Status API Returns Empty

**Check**:
1. User is authenticated (JWT token valid)
2. Emails were actually sent (check `EmailLog` table in database)
3. Non-admin users can only see their own emails
4. Correct endpoint: `/api/emails/status` not `/api/email/status`

### Request IDs Not Appearing in Logs

**Check**:
1. Middleware is registered: `app.add_middleware(RequestIdMiddleware)`
2. Middleware is early in chain (before other middlewares)
3. Using `request.state.request_id` in log context
4. Request object is available (dependency injection working)

---

## Best Practices

### 1. Always Log Errors with Context

```python
# ❌ Bad: No context
logger.error("Operation failed")

# ✅ Good: Full context
logger.error(
    "Operation failed",
    extra={"context": {
        "user_id": user_id,
        "operation": "create_contact",
        "error": str(e),
        "error_type": type(e).__name__,
        "request_id": request.state.request_id
    }},
    exc_info=True
)
```

### 2. Log at Appropriate Levels

- **DEBUG**: Detailed diagnostic info (variable values, flow control)
- **INFO**: General informational messages (user logged in, email sent)
- **WARNING**: Unexpected but recoverable (email failed but account created)
- **ERROR**: Operation failed (user action blocked)
- **CRITICAL**: System cannot continue (database down)

### 3. Include Request IDs in All Logs

```python
@router.post("/api/endpoint")
def endpoint(request: Request, ...):
    logger.info(
        "Processing request",
        extra={"context": {
            "request_id": request.state.request_id,
            # ... other context
        }}
    )
```

### 4. Use Warnings for Non-Blocking Failures

When an operation succeeds partially, return warnings:

```python
warnings = []
try:
    email_service.send_email(...)
except Exception:
    warnings.append(WarningMessage(
        code="EMAIL_FAILED",
        message="Account created, but email failed to send."
    ))

return {"success": True, "warnings": warnings}
```

### 5. Always Check Email Status for Debugging

When users report "didn't get email":

1. Check email status API: `/api/emails/status?recipient=user@example.com`
2. Look at `status` and `error_message` fields
3. Check logs with request ID: `grep "request_id.*abc-123" logs/continuum.log`

---

## Summary

**Error Visibility System**:
- ✅ Backend logs all errors with context
- ✅ Request IDs correlate logs across system
- ✅ Email delivery tracked and queryable
- ✅ Frontend displays all errors via notifications
- ✅ Users see compassionate messages, devs see technical details

**Key Components**:
- `backend/utils/logger.py` - Logging infrastructure
- `backend/main.py` - Request ID middleware
- `backend/routers/email.py` - Email status API
- `frontend/src/lib/stores/notificationStore.ts` - Notification system
- `frontend/src/lib/api/client.ts` - Error-aware API client

**When Users Report Issues**:
1. Get request ID from response header
2. Search logs: `grep "request_id.*{id}" logs/continuum.log`
3. Check email status: `GET /api/emails/status?recipient={email}`
4. Review full context around error

**For Developers**:
- NEVER use `print()` - ALWAYS use `logger.info/error/etc`
- ALWAYS include context with user_id, request_id, error details
- ALWAYS use `apiPost()` in frontend (not raw `fetch()`)
- ALWAYS display errors via `notifications` store

---

_Last Updated: January 21, 2026_
