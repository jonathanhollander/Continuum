# Error Handling Guide

Comprehensive guide to error handling in Continuum SaaS.

## Overview

The error handling system provides:
- **Consistent error formats** across backend and frontend
- **Compassionate, user-friendly messages** appropriate for end-of-life planning
- **Automatic error logging** and monitoring
- **Global exception handlers** that catch all errors
- **Type-safe error handling** with TypeScript
- **Retry logic** for transient failures

## Backend Error Handling

### Custom Exception Classes

Located in `/backend/errors.py`, these provide specific error types with compassionate messages:

#### Authentication Errors

```python
from backend.errors import AuthenticationError, AuthorizationError, TokenExpiredError

# Authentication failed
raise AuthenticationError()
# → User sees: "We couldn't verify your identity. Please try signing in again."

# User doesn't have permission
raise AuthorizationError(resource="contacts")
# → User sees: "You don't have permission to access contacts."

# Token expired
raise TokenExpiredError()
# → User sees: "Your session has expired. Please sign in again to continue."
```

#### Resource Errors

```python
from backend.errors import ResourceNotFoundError, ResourceAlreadyExistsError

# Resource not found
raise ResourceNotFoundError(resource_type="contact", resource_id="123")
# → User sees: "We couldn't find that contact. It may have been moved or deleted."

# Duplicate resource
raise ResourceAlreadyExistsError(resource_type="email", field="email address")
# → User sees: "An email with this email address already exists."
```

#### Validation Errors

```python
from backend.errors import ValidationError, InvalidDataTypeError

# Field validation failed
raise ValidationError(field="email", reason="Please use a valid email address")
# → User sees: "Please check the email field. Please use a valid email address"

# Invalid data type
raise InvalidDataTypeError(data_type="contacts", valid_types=["pets", "documents"])
# → User sees: "We encountered an issue with your request. Please try again or contact support."
```

#### Database Errors

```python
from backend.errors import DatabaseError

try:
    session.add(item)
    session.commit()
except Exception as e:
    raise DatabaseError(operation="saving contact", original_error=e)
# → User sees: "We're having trouble saving your changes right now. Please try again in a moment."
```

#### File Upload Errors

```python
from backend.errors import FileUploadError, FileTooLargeError, InvalidFileTypeError

# Generic upload error
raise FileUploadError(reason="File corrupted", filename="photo.jpg")

# File too large
raise FileTooLargeError(size=15_000_000, max_size=10_000_000, filename="video.mp4")
# → User sees: "This file is too large (14.3MB). Please choose a file under 9.5MB."

# Invalid file type
raise InvalidFileTypeError(file_type="exe", allowed_types=["jpg", "png", "pdf"])
# → User sees: "This file type isn't supported. Please use one of: jpg, png, pdf"
```

#### External Service Errors

```python
from backend.errors import EmailSendError, ExternalServiceError

# Email failed to send
raise EmailSendError(recipient="user@example.com", original_error=smtp_error)
# → User sees: "We couldn't send that email right now. We'll retry automatically."

# External API failure
raise ExternalServiceError(service_name="Postmark", original_error=api_error)
# → User sees: "We're having trouble connecting to Postmark. Please try again in a moment."
```

#### Rate Limiting

```python
from backend.errors import RateLimitError

raise RateLimitError(retry_after=60)
# → User sees: "You're doing that too quickly. Please try again in 60 seconds. Take your time—we're here when you're ready."
```

### Using in FastAPI Endpoints

```python
from fastapi import APIRouter, Depends
from backend.errors import ResourceNotFoundError, AuthorizationError, DatabaseError
from backend.auth import get_current_user
from backend.database import get_session

router = APIRouter()

@router.get("/api/contacts/{contact_id}")
def get_contact(contact_id: int, user = Depends(get_current_user), session = Depends(get_session)):
    # Find contact
    contact = session.get(Contact, contact_id)

    # Check if exists
    if not contact:
        raise ResourceNotFoundError(resource_type="contact", resource_id=str(contact_id))

    # Check authorization
    if contact.user_id != user.id:
        raise AuthorizationError(resource="this contact")

    return contact

@router.post("/api/contacts")
def create_contact(data: dict, user = Depends(get_current_user), session = Depends(get_session)):
    try:
        contact = Contact(**data, user_id=user.id)
        session.add(contact)
        session.commit()
        session.refresh(contact)
        return contact
    except Exception as e:
        raise DatabaseError(operation="creating contact", original_error=e)
```

### Global Exception Handlers

Located in `/backend/main.py`, these automatically catch all exceptions:

```python
from backend.errors import ContinuumException, handle_exception

@app.exception_handler(ContinuumException)
async def continuum_exception_handler(request: Request, exc: ContinuumException):
    """Handle all ContinuumException errors with consistent formatting."""
    error_response = exc.to_error_response()
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.to_dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catch-all handler for unexpected errors."""
    error_response = handle_exception(exc, context=f"{request.method} {request.url.path}")
    return JSONResponse(
        status_code=error_response.status_code,
        content=error_response.to_dict()
    )
```

**Result**: All errors are automatically formatted consistently, even if you forget to use custom exceptions.

### Error Response Format

All backend errors return this JSON structure:

```json
{
  "error": {
    "message": "We couldn't find that contact. It may have been moved or deleted.",
    "code": "NOT_FOUND",
    "details": {
      "resource_type": "contact",
      "resource_id": "123"
    },
    "timestamp": "2026-01-21T22:00:00.000Z"
  },
  "_technical": "contact not found: 123"
}
```

- `error.message`: Compassionate, user-facing message
- `error.code`: Error code for programmatic handling
- `error.details`: Additional context (resource IDs, field names, etc.)
- `_technical`: Technical details (only in dev mode)

## Frontend Error Handling

### Error Handler Service

Located in `/frontend/src/lib/services/errorHandler.ts`:

#### Basic Usage

```typescript
import { handleApiRequest, parseApiError } from '$lib/services/errorHandler';

// Method 1: Using handleApiRequest
const result = await handleApiRequest(async () => {
	const res = await fetch('/api/contacts', {
		headers: { Authorization: `Bearer ${token}` }
	});
	return res;
});

if (result.ok) {
	const data = await result.response.json();
	// Use data
} else {
	// Show error to user
	console.error(result.error.message);
	notifications.showError(result.error);
}

// Method 2: Using apiFetch (simpler)
import { apiFetch } from '$lib/services/errorHandler';

try {
	const contacts = await apiFetch('/api/contacts', {
		headers: { Authorization: `Bearer ${token}` }
	});
	// Use contacts
} catch (error) {
	// error is ErrorDetails
	notifications.showError(error);
}
```

#### Error Details Interface

```typescript
interface ErrorDetails {
	message: string; // User-facing message
	code?: string; // Error code (e.g., "NOT_FOUND", "AUTH_FAILED")
	details?: Record<string, any>; // Additional context
	timestamp?: string;
}
```

#### Error Actions

Get recommended actions based on error code:

```typescript
import { getErrorAction } from '$lib/services/errorHandler';

const { action, canRetry } = getErrorAction(error.code);

switch (action) {
	case 'redirect_to_login':
		goto('/login');
		break;
	case 'show_retry_button':
		// Show retry button
		break;
	case 'highlight_field':
		// Highlight the field with error
		break;
}
```

#### Retry Logic

```typescript
import { retryWithBackoff } from '$lib/services/errorHandler';

const data = await retryWithBackoff(
	async () => {
		return await fetch('/api/contacts');
	},
	3, // max retries
	1000 // initial delay (ms)
);
```

### Notification System

#### Notification Store

Located in `/frontend/src/lib/stores/notificationStore.ts`:

```typescript
import { notifications } from '$lib/stores/notificationStore';

// Show error
notifications.showError({
	message: 'We couldn't save your changes.',
	code: 'DATABASE_ERROR'
});

// Show error with retry
notifications.showError(
	{
		message: 'Connection failed.',
		code: 'NETWORK_ERROR'
	},
	() => {
		// Retry logic
		saveData();
	}
);

// Show success
notifications.showSuccess('Your changes have been saved.');

// Show info
notifications.showInfo('Your account will expire in 7 days.');

// Dismiss specific notification
notifications.dismiss(notificationId);

// Dismiss all
notifications.dismissAll();
```

#### Notification Components

**ErrorNotification.svelte**: Displays individual error with retry button

**NotificationContainer.svelte**: Container that displays all notifications (add to layout)

```svelte
<!-- Add to /frontend/src/routes/+layout.svelte -->
<script>
	import NotificationContainer from '$lib/components/NotificationContainer.svelte';
</script>

<NotificationContainer />
<slot />
```

### Using in SyncManager

Update sync operations to use error handling:

```typescript
import { notifications } from '$lib/stores/notificationStore';
import { handleApiRequest } from '$lib/services/errorHandler';

async sync() {
    this.status = "syncing";
    this.error = null;

    const result = await handleApiRequest(async () => {
        const token = get(auth).token;
        if (!token) throw new Error("No auth token");

        return await fetch(`${BASE_URL}${this.apiBase}/${this.endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    });

    if (!result.ok) {
        this.status = "error";
        this.error = result.error.message;

        // Show error to user
        notifications.showError(result.error, () => this.sync());
        return;
    }

    const data = await result.response.json();
    this.updateLocal(data);
    this.status = "synced";
}
```

### Using in Form Components

```svelte
<script lang="ts">
	import { apiFetch } from '$lib/services/errorHandler';
	import { notifications } from '$lib/stores/notificationStore';

	let saving = $state(false);

	async function handleSubmit() {
		saving = true;
		try {
			const result = await apiFetch('/api/contacts', {
				method: 'POST',
				body: JSON.stringify(formData)
			});

			notifications.showSuccess('Contact saved successfully!');
			goto('/contacts');
		} catch (error) {
			// Error automatically shown by notification system
			notifications.showError(error);
		} finally {
			saving = false;
		}
	}
</script>
```

## Error Codes Reference

### Authentication & Authorization

- `AUTH_FAILED`: Authentication failed
- `TOKEN_EXPIRED`: Session expired
- `NOT_AUTHORIZED`: Permission denied

### Resources

- `NOT_FOUND`: Resource doesn't exist
- `ALREADY_EXISTS`: Duplicate resource

### Validation

- `VALIDATION_ERROR`: Field validation failed
- `INVALID_TYPE`: Invalid data type

### Database

- `DATABASE_ERROR`: Database operation failed

### Files

- `UPLOAD_FAILED`: File upload failed
- `FILE_TOO_LARGE`: File exceeds size limit
- `INVALID_FILE_TYPE`: File type not allowed

### External Services

- `EMAIL_FAILED`: Email delivery failed
- `SERVICE_UNAVAILABLE`: External service down

### Network

- `NETWORK_ERROR`: Network connection failed
- `RATE_LIMITED`: Too many requests

## Best Practices

### Backend

1. **Use specific exception classes** instead of generic HTTPException
2. **Always provide context** (resource type, field name, etc.)
3. **Include original error** when wrapping exceptions
4. **Log technical details** but show compassionate messages to users
5. **Never expose sensitive information** in error messages

```python
# ❌ Bad
raise HTTPException(status_code=404, detail="Contact not found")

# ✅ Good
raise ResourceNotFoundError(resource_type="contact", resource_id=contact_id)
```

### Frontend

1. **Always handle errors** - don't let them go unnoticed
2. **Show compassionate messages** appropriate for the context
3. **Provide retry options** for transient failures
4. **Auto-dismiss success messages** but let errors stay until dismissed
5. **Log errors** for monitoring (production)

```typescript
// ❌ Bad
fetch('/api/contacts')
	.then((res) => res.json())
	.catch(console.error);

// ✅ Good
try {
	const contacts = await apiFetch('/api/contacts');
	// Use contacts
} catch (error) {
	notifications.showError(error, () => loadContacts());
}
```

### Error Messages

1. **Be compassionate**, not technical
2. **Explain what happened** in plain language
3. **Suggest next steps** when possible
4. **Use "we"** language (we're in this together)
5. **Acknowledge feelings** for death planning context

```
❌ "500 Internal Server Error"
✅ "We're having trouble saving your changes right now. Please try again in a moment."

❌ "Authentication failed: Invalid JWT token"
✅ "Your session has expired. Please sign in again to continue."

❌ "Validation error: field 'email' is required"
✅ "Please check the email field. This information is required."
```

## Testing Error Handling

### Backend Tests

```python
import pytest
from backend.errors import ResourceNotFoundError, AuthorizationError

def test_resource_not_found():
    with pytest.raises(ResourceNotFoundError) as exc_info:
        raise ResourceNotFoundError(resource_type="contact", resource_id="123")

    assert exc_info.value.status_code == 404
    assert "contact" in exc_info.value.user_message.lower()

def test_error_response_format():
    error = ResourceNotFoundError(resource_type="contact", resource_id="123")
    response = error.to_error_response()

    assert response.user_message
    assert response.error_code == "NOT_FOUND"
    assert "contact" in response.details["resource_type"]
```

### Frontend Tests

```typescript
import { describe, it, expect } from 'vitest';
import { parseApiError, getErrorTitle } from '$lib/services/errorHandler';

describe('Error Handler', () => {
	it('parses API error response', async () => {
		const response = new Response(
			JSON.stringify({
				error: {
					message: 'Not found',
					code: 'NOT_FOUND'
				}
			}),
			{ status: 404 }
		);

		const error = await parseApiError(response);
		expect(error.message).toBe('Not found');
		expect(error.code).toBe('NOT_FOUND');
	});

	it('provides compassionate error titles', () => {
		expect(getErrorTitle('AUTH_FAILED')).toBe('Session Expired');
		expect(getErrorTitle('NOT_FOUND')).toBe('Not Found');
		expect(getErrorTitle('RATE_LIMITED')).toBe('Take Your Time');
	});
});
```

## Migration Guide

### Updating Existing Endpoints

**Before**:

```python
@router.get("/{data_type}/{item_id}")
def get_item(data_type: str, item_id: int, user = Depends(get_current_user)):
    model = MODEL_MAP.get(data_type)
    if not model:
        raise HTTPException(status_code=400, detail="Invalid type")

    db_item = session.get(model, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Not found")
    if db_item.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return db_item
```

**After**:

```python
from backend.errors import InvalidDataTypeError, ResourceNotFoundError, AuthorizationError

@router.get("/{data_type}/{item_id}")
def get_item(data_type: str, item_id: int, user = Depends(get_current_user)):
    model = MODEL_MAP.get(data_type)
    if not model:
        raise InvalidDataTypeError(data_type, valid_types=list(MODEL_MAP.keys()))

    db_item = session.get(model, item_id)
    if not db_item:
        raise ResourceNotFoundError(resource_type=data_type, resource_id=str(item_id))
    if db_item.user_id != user.id:
        raise AuthorizationError(resource=f"this {data_type}")

    return db_item
```

### Updating Frontend Components

**Before**:

```typescript
async function loadContacts() {
	try {
		const res = await fetch('/api/contacts');
		if (!res.ok) throw new Error('Failed to load');
		contacts = await res.json();
	} catch (e) {
		console.error(e);
	}
}
```

**After**:

```typescript
import { apiFetch } from '$lib/services/errorHandler';
import { notifications } from '$lib/stores/notificationStore';

async function loadContacts() {
	try {
		contacts = await apiFetch('/api/contacts');
	} catch (error) {
		notifications.showError(error, () => loadContacts());
	}
}
```

## Additional Resources

- Backend errors: `/backend/errors.py`
- Frontend error handler: `/frontend/src/lib/services/errorHandler.ts`
- Notification store: `/frontend/src/lib/stores/notificationStore.ts`
- Error component: `/frontend/src/lib/components/ErrorNotification.svelte`
- Global handlers: `/backend/main.py`

## Summary

The error handling system provides:

✅ **Consistent error formats** across the entire stack
✅ **Compassionate, user-friendly messages** for end-of-life planning
✅ **Type-safe error handling** with custom exception classes
✅ **Global exception handlers** that catch everything
✅ **Automatic retry logic** for transient failures
✅ **Beautiful UI components** for displaying errors
✅ **Error logging** and monitoring integration
✅ **Comprehensive documentation** and examples

Users now see helpful, compassionate messages instead of technical jargon, creating a more supportive experience during difficult planning tasks.
