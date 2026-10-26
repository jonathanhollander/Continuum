# Agent 08: Error Handling Standardization
**Priority:** P1 - HIGH
**Estimated Time:** 4-6 hours (1 day)
**Dependencies:** 05-configuration-management
**Category:** Technical Infrastructure

---

## OBJECTIVE

Standardize error handling across backend and frontend with compassionate, user-friendly error messages appropriate for death planning context.

**Current Issues:**
- Silent error handling (bare `except: pass` clauses)
- Generic error messages with no user feedback
- Technical jargon in error messages ("500 Internal Server Error")
- No retry logic for failed operations
- Console errors with no UI feedback
- Error tone inappropriate for death planning context

**Expected Outcome:**
- Compassionate exception classes for backend
- Global error handler middleware
- User-friendly error messages (no technical jargon)
- Frontend ErrorHandler service and ErrorDisplay component
- Death-planning appropriate error tone
- Consistent error format across application

---

## FILES TO MODIFY

### Backend Files (Create):
1. `/backend/exceptions.py` - Custom exception classes
2. `/backend/middleware/error_handler.py` - Global error handler
3. `/backend/utils/error_messages.py` - Compassionate error messages

### Backend Files (Modify):
4. `/backend/main.py` - Register error handler middleware
5. All `/backend/routers/*.py` - Use custom exceptions

### Frontend Files (Create):
6. `/frontend/src/lib/services/errorHandler.ts` - Error handling service
7. `/frontend/src/lib/components/ErrorDisplay.svelte` - Error UI component
8. `/frontend/src/lib/components/ErrorBoundary.svelte` - React-style error boundary

### Frontend Files (Modify):
9. `/frontend/src/lib/api/client.ts` - Better error handling
10. All pages - Use ErrorHandler service

---

## IMPLEMENTATION

### Step 1: Create Custom Exception Classes

**File:** `/backend/exceptions.py`

```python
from typing import Optional, Any, Dict
from fastapi import HTTPException, status

class ContinuumException(HTTPException):
    """
    Base exception for Continuum application.

    All exceptions should be user-friendly and compassionate,
    appropriate for a death planning application.
    """

    def __init__(
        self,
        status_code: int,
        user_message: str,
        detail: Optional[str] = None,
        internal_message: Optional[str] = None,
        error_code: Optional[str] = None
    ):
        self.user_message = user_message  # What user sees
        self.internal_message = internal_message or detail  # What logs show
        self.error_code = error_code

        super().__init__(
            status_code=status_code,
            detail={
                "message": user_message,
                "error_code": error_code,
                "compassionate": True  # Flag for special handling
            }
        )


class NotFoundError(ContinuumException):
    """Resource not found - compassionate messaging"""

    def __init__(self, resource: str, resource_id: Optional[Any] = None):
        user_message = f"We couldn't find that {resource}."

        if resource == "family_member":
            user_message = "We couldn't find that family member in your records."
        elif resource == "document":
            user_message = "We couldn't find that document. It may have been removed."
        elif resource == "contact":
            user_message = "We couldn't find that contact in your Circle of Trust."

        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            user_message=user_message,
            internal_message=f"{resource} not found: {resource_id}",
            error_code="NOT_FOUND"
        )


class ValidationError(ContinuumException):
    """Input validation failed - help user fix it"""

    def __init__(self, field: str, message: str):
        user_message = f"We need a bit more information: {message}"

        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            user_message=user_message,
            internal_message=f"Validation error on field '{field}': {message}",
            error_code="VALIDATION_ERROR"
        )


class AuthenticationError(ContinuumException):
    """Authentication failed - compassionate for stressed users"""

    def __init__(self, message: str = "We couldn't verify your identity"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            user_message=message + ". Please sign in again.",
            error_code="AUTH_ERROR"
        )


class PermissionError(ContinuumException):
    """User lacks permission - explain gently"""

    def __init__(self, resource: str):
        user_message = f"You don't have permission to access this {resource}."

        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            user_message=user_message,
            error_code="PERMISSION_DENIED"
        )


class DataLossPreventionError(ContinuumException):
    """
    Prevent accidental data deletion - extra compassionate

    Death planning data is precious and irreplaceable.
    """

    def __init__(self, resource: str, reason: str):
        user_message = (
            f"We prevented deletion of your {resource} to protect your data. "
            f"{reason}"
        )

        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            user_message=user_message,
            error_code="DATA_PROTECTION"
        )


class FileTooLargeError(ContinuumException):
    """File upload too large - explain limit kindly"""

    def __init__(self, max_size_mb: int):
        user_message = (
            f"That file is too large to upload. "
            f"The maximum file size is {max_size_mb}MB. "
            f"You might need to compress the image or video."
        )

        super().__init__(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            user_message=user_message,
            error_code="FILE_TOO_LARGE"
        )


class ServiceUnavailableError(ContinuumException):
    """
    Service temporarily down - reassure user data is safe

    This is scary for users with important estate planning data.
    """

    def __init__(self, service: str = "service"):
        user_message = (
            f"We're having temporary trouble with our {service}. "
            f"Your data is safe, and we're working to restore service. "
            f"Please try again in a few minutes."
        )

        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            user_message=user_message,
            error_code="SERVICE_UNAVAILABLE"
        )


class RateLimitError(ContinuumException):
    """Rate limit exceeded - ask user to slow down gently"""

    def __init__(self, retry_after: int = 60):
        user_message = (
            f"You're moving a bit too fast for our system. "
            f"Please wait {retry_after} seconds and try again. "
            f"Your data is safe - we're just protecting the system."
        )

        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            user_message=user_message,
            error_code="RATE_LIMIT"
        )
```

---

### Step 2: Create Global Error Handler

**File:** `/backend/middleware/error_handler.py`

```python
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from backend.exceptions import ContinuumException
import logging
import traceback

logger = logging.getLogger(__name__)

async def error_handler_middleware(request: Request, call_next):
    """
    Global error handler middleware

    Catches all exceptions and returns compassionate error messages.
    """
    try:
        return await call_next(request)
    except Exception as exc:
        return handle_exception(request, exc)


def handle_exception(request: Request, exc: Exception) -> JSONResponse:
    """
    Convert any exception to user-friendly JSON response

    Always compassionate and appropriate for death planning context.
    """

    # Log exception for debugging
    logger.error(
        f"Error handling request {request.method} {request.url.path}",
        exc_info=True
    )

    # Continuum custom exceptions (already user-friendly)
    if isinstance(exc, ContinuumException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": True,
                "message": exc.user_message,
                "error_code": exc.error_code,
                "compassionate": True
            }
        )

    # FastAPI validation errors
    if isinstance(exc, RequestValidationError):
        errors = exc.errors()
        field = errors[0]["loc"][-1] if errors else "unknown"
        message = errors[0]["msg"] if errors else "Invalid input"

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": True,
                "message": f"We need a bit more information about the {field}. {message}",
                "error_code": "VALIDATION_ERROR",
                "details": errors
            }
        )

    # Database errors
    if isinstance(exc, SQLAlchemyError):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": True,
                "message": (
                    "We encountered a problem saving your data. "
                    "Your information is safe, but please try again. "
                    "If this continues, please contact support."
                ),
                "error_code": "DATABASE_ERROR",
                "compassionate": True
            }
        )

    # Generic exceptions (shouldn't happen, but just in case)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "message": (
                "Something unexpected happened, but your data is safe. "
                "We've been notified and are looking into it. "
                "Please try again in a moment."
            ),
            "error_code": "UNEXPECTED_ERROR",
            "compassionate": True
        }
    )
```

---

### Step 3: Create Frontend Error Handler

**File:** `/frontend/src/lib/services/errorHandler.ts`

```typescript
/**
 * Error handling service for Continuum frontend
 *
 * Provides compassionate error messages appropriate for death planning.
 */

export interface ErrorDetails {
  message: string;
  errorCode?: string;
  statusCode?: number;
  compassionate?: boolean;
  technicalDetails?: any;
}

export class ErrorHandler {
  /**
   * Handle API error response
   */
  static async handleApiError(response: Response): Promise<ErrorDetails> {
    try {
      const data = await response.json();

      // If backend provided compassionate error, use it
      if (data.compassionate && data.message) {
        return {
          message: data.message,
          errorCode: data.error_code,
          statusCode: response.status,
          compassionate: true
        };
      }

      // Otherwise, generate user-friendly message
      return this.generateUserFriendlyError(response.status, data);
    } catch {
      // Failed to parse JSON - use status code
      return this.generateUserFriendlyError(response.status);
    }
  }

  /**
   * Generate user-friendly error message from status code
   */
  private static generateUserFriendlyError(
    statusCode: number,
    data?: any
  ): ErrorDetails {
    let message: string;

    switch (statusCode) {
      case 400:
        message = "We need a bit more information. Please check your input and try again.";
        break;

      case 401:
        message = "Your session has expired. Please sign in again to continue.";
        break;

      case 403:
        message = "You don't have permission to do that.";
        break;

      case 404:
        message = "We couldn't find what you're looking for. It may have been removed.";
        break;

      case 413:
        message = "That file is too large to upload. Please try a smaller file or compress it.";
        break;

      case 429:
        message = "You're moving a bit too fast for our system. Please wait a moment and try again.";
        break;

      case 500:
        message = "Something unexpected happened on our end. Your data is safe. Please try again.";
        break;

      case 503:
        message = "We're having temporary trouble with our service. Please try again in a few minutes.";
        break;

      default:
        message = "Something went wrong. Your data is safe. Please try again.";
    }

    return {
      message,
      statusCode,
      compassionate: true,
      technicalDetails: data
    };
  }

  /**
   * Handle network error (no response from server)
   */
  static handleNetworkError(): ErrorDetails {
    return {
      message: (
        "We couldn't connect to our servers. " +
        "Please check your internet connection and try again. " +
        "Your data is saved locally and will sync when you're back online."
      ),
      errorCode: 'NETWORK_ERROR',
      compassionate: true
    };
  }

  /**
   * Handle unexpected JavaScript errors
   */
  static handleUnexpectedError(error: Error): ErrorDetails {
    console.error('Unexpected error:', error);

    return {
      message: (
        "Something unexpected happened, but your data is safe. " +
        "Please refresh the page and try again. " +
        "If this continues, please contact support."
      ),
      errorCode: 'UNEXPECTED_ERROR',
      compassionate: true,
      technicalDetails: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    };
  }

  /**
   * Log error to monitoring service (Sentry, LogRocket, etc.)
   */
  static logError(error: ErrorDetails, context?: any) {
    // In production, send to error monitoring service
    if (import.meta.env.PROD) {
      // TODO: Send to Sentry
      console.error('Error logged:', error, context);
    } else {
      console.error('Error:', error, context);
    }
  }
}
```

---

### Step 4: Create Error Display Component

**File:** `/frontend/src/lib/components/ErrorDisplay.svelte`

```svelte
<script lang="ts">
  import { AlertCircle, X } from 'lucide-svelte';
  import type { ErrorDetails } from '$lib/services/errorHandler';

  export let error: ErrorDetails | null;
  export let onDismiss: (() => void) | null = null;

  $: hasError = error !== null;
</script>

{#if hasError && error}
  <div class="error-container">
    <div class="error-box">
      <div class="error-icon">
        <AlertCircle size={24} />
      </div>

      <div class="error-content">
        <p class="error-message">{error.message}</p>

        {#if error.errorCode}
          <p class="error-code">Error code: {error.errorCode}</p>
        {/if}
      </div>

      {#if onDismiss}
        <button class="error-dismiss" on:click={onDismiss}>
          <X size={20} />
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .error-container {
    margin: 1rem 0;
  }

  .error-box {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    position: relative;
  }

  .error-icon {
    color: #dc2626;
    flex-shrink: 0;
  }

  .error-content {
    flex: 1;
  }

  .error-message {
    margin: 0;
    color: #991b1b;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .error-code {
    margin: 0.5rem 0 0 0;
    color: #7f1d1d;
    font-size: 0.75rem;
    font-family: monospace;
  }

  .error-dismiss {
    background: none;
    border: none;
    color: #991b1b;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
  }

  .error-dismiss:hover {
    color: #7f1d1d;
  }
</style>
```

---

### Step 5: Update API Client with Error Handling

**File:** `/frontend/src/lib/api/client.ts`

```typescript
import { config } from '$lib/config';
import { authStore } from '$lib/stores/authStore';
import { ErrorHandler } from '$lib/services/errorHandler';
import { get } from 'svelte/store';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${config.apiUrl}${endpoint}`;
  const auth = get(authStore);

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (auth.isAuthenticated && auth.token) {
    headers['Authorization'] = `Bearer ${auth.token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle authentication errors
    if (response.status === 401) {
      authStore.logout();
      throw new Error('Session expired. Please login again.');
    }

    // Return response if successful
    if (response.ok) {
      return response;
    }

    // Handle error responses
    const errorDetails = await ErrorHandler.handleApiError(response);
    ErrorHandler.logError(errorDetails, { endpoint, options });

    throw new Error(errorDetails.message);

  } catch (error) {
    // Network error or other exception
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      const errorDetails = ErrorHandler.handleNetworkError();
      ErrorHandler.logError(errorDetails, { endpoint });
      throw new Error(errorDetails.message);
    }

    // Re-throw if already handled
    throw error;
  }
}
```

---

### Step 6: Register Error Handler Middleware

**File:** `/backend/main.py`

```python
from fastapi import FastAPI
from backend.middleware.error_handler import error_handler_middleware

app = FastAPI()

# Register global error handler
app.middleware("http")(error_handler_middleware)
```

---

## VALIDATION

### Pre-Commit Checks:

```bash
# Backend validation
cd backend
python -m pytest tests/test_exceptions.py
python -m pytest tests/test_error_handler.py

# Test exception imports
python -c "from exceptions import NotFoundError, ValidationError; print('✓ Exceptions valid')"

# Frontend validation
cd frontend
npm run check
npm run build

# Test error handler
npm test -- errorHandler.test.ts
```

---

## SUCCESS CRITERIA

- [ ] Custom exception classes created with compassionate messages
- [ ] Global error handler middleware catches all exceptions
- [ ] User-friendly error messages (no technical jargon)
- [ ] Frontend ErrorHandler service created
- [ ] ErrorDisplay component created
- [ ] API client uses error handler
- [ ] All error messages appropriate for death planning context
- [ ] Error logging to monitoring service
- [ ] Consistent error format across application
- [ ] No silent failures (all errors shown to user)

---

## TESTING

### Manual Testing:

1. **404 Error:**
   - Try accessing non-existent family member
   - Should see: "We couldn't find that family member in your records."

2. **Validation Error:**
   - Submit form with missing required field
   - Should see: "We need a bit more information: [field] is required"

3. **Network Error:**
   - Disconnect internet, try API call
   - Should see: "We couldn't connect to our servers..."

4. **500 Error:**
   - Trigger internal server error
   - Should see: "Something unexpected happened, but your data is safe..."

### Automated Testing:

```python
# backend/tests/test_exceptions.py
from backend.exceptions import NotFoundError, ValidationError

def test_not_found_error():
    error = NotFoundError("family_member", 123)
    assert error.status_code == 404
    assert "couldn't find" in error.user_message
    assert "family member" in error.user_message

def test_validation_error():
    error = ValidationError("email", "Email is required")
    assert error.status_code == 400
    assert "need a bit more information" in error.user_message
```

```typescript
// frontend/tests/errorHandler.test.ts
import { ErrorHandler } from '$lib/services/errorHandler';

test('handles 404 error', async () => {
  const response = new Response(null, { status: 404 });
  const error = await ErrorHandler.handleApiError(response);

  expect(error.statusCode).toBe(404);
  expect(error.message).toContain("couldn't find");
  expect(error.compassionate).toBe(true);
});

test('handles network error', () => {
  const error = ErrorHandler.handleNetworkError();

  expect(error.errorCode).toBe('NETWORK_ERROR');
  expect(error.message).toContain("couldn't connect");
  expect(error.compassionate).toBe(true);
});
```

---

## ROLLBACK

### If Issues Occur:

```bash
# Remove error handling files
git checkout HEAD -- backend/exceptions.py
git checkout HEAD -- backend/middleware/error_handler.py
rm -rf backend/middleware/

# Revert frontend
git checkout HEAD -- frontend/src/lib/services/errorHandler.ts
git checkout HEAD -- frontend/src/lib/components/ErrorDisplay.svelte
git checkout HEAD -- frontend/src/lib/api/client.ts

# Revert main.py
git checkout HEAD -- backend/main.py
```

---

## COMMIT MESSAGE

```
feat(errors): standardize error handling with compassionate messaging

Implement consistent, user-friendly error handling across application.

Issues Fixed:
- Silent error handling (bare except: pass clauses)
- Generic error messages with no user feedback
- Technical jargon in error messages
- No retry logic or error recovery
- Error tone inappropriate for death planning

Implementation:

Backend Custom Exceptions:
- backend/exceptions.py: Compassionate exception classes
  - ContinuumException: Base class with user-friendly messages
  - NotFoundError: "We couldn't find that family member"
  - ValidationError: "We need a bit more information"
  - AuthenticationError: "Please sign in again"
  - FileTooLargeError: "Please compress the image"
  - ServiceUnavailableError: "Your data is safe"
  - DataLossPreventionError: Extra protection for deletion

Global Error Handler:
- backend/middleware/error_handler.py: Catches all exceptions
  - Converts technical errors to user-friendly messages
  - Logs errors for debugging
  - Always returns compassionate JSON response
  - Special handling for database errors
  - Validation error formatting

Frontend Error Handler:
- frontend/src/lib/services/errorHandler.ts:
  - handleApiError(): Parse backend error responses
  - handleNetworkError(): Offline state handling
  - handleUnexpectedError(): JavaScript error handling
  - logError(): Send to monitoring service
  - Consistent error format

Frontend Error Display:
- frontend/src/lib/components/ErrorDisplay.svelte:
  - Beautiful error UI component
  - Dismissible error messages
  - Shows error code for support
  - Consistent styling

API Client Integration:
- frontend/src/lib/api/client.ts:
  - Automatic error handling for all API calls
  - Network error detection
  - Authentication error handling
  - Error logging

Compassionate Tone:
- All errors acknowledge difficulty of death planning
- No technical jargon (no "500", "SQL", "undefined")
- Reassures user data is safe
- Provides clear next steps
- Appropriate emotional tone

Examples:
- Generic: "500 Internal Server Error"
- Continuum: "Something unexpected happened, but your data is safe."

- Generic: "Unauthorized"
- Continuum: "Your session has expired. Please sign in again to continue."

- Generic: "File too large"
- Continuum: "That file is too large to upload. You might need to compress the image."

Error Categories:
- Not Found (404): Resource missing
- Validation (400): Input errors
- Authentication (401): Session expired
- Permission (403): Access denied
- File Size (413): Upload too large
- Rate Limit (429): Too many requests
- Server Error (500): System issues
- Service Down (503): Temporary outage

Testing:
- Unit tests for all exception types
- Integration tests for error handling
- Manual testing of error messages
- Error logging verification

Impact:
- P1-HIGH: Improves user experience dramatically
- Reduces user confusion and frustration
- Provides clear error recovery paths
- Appropriate tone for sensitive context
- Better debugging with structured logging

Future Enhancements:
- Error recovery suggestions
- Automatic retry for transient errors
- Offline queue with error handling
- Error analytics dashboard

Closes: Error handling standardization
Ref: CODEBASE_REVIEW_REPORT.md issue #12
```

---

## NOTES

- Critical for user experience in death planning context
- Errors should NEVER feel cold or technical
- Always reassure user their data is safe
- Provide clear recovery steps
- Log technical details but show compassionate message to user

### Error Message Guidelines:
1. **Acknowledge Difficulty:** "We know this is hard..."
2. **Reassure Safety:** "Your data is safe..."
3. **Clear Action:** "Please try again..." or "Contact support at..."
4. **No Jargon:** Never say "500", "SQL", "undefined", "null"
5. **Compassionate:** Appropriate for grieving/stressed users

### Monitoring Integration:
- Send errors to Sentry or similar
- Include user context (but not PII)
- Track error rates by type
- Alert on critical errors
- Create error dashboards

---

**READY TO EXECUTE**

Claude: Read this specification and execute after configuration management.
