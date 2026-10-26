# Agent 09: API Response Standardization
**Priority:** P2 - MEDIUM
**Estimated Time:** 3-4 hours
**Dependencies:** 08-error-handling-standardization
**Category:** Technical Infrastructure

---

## OBJECTIVE

Standardize all API responses to consistent JSON structure with metadata, pagination, and success/error wrappers.

**Current Issues:**
- Inconsistent response formats across endpoints
- No pagination format standard
- No response metadata (timestamps, request IDs)
- Success responses sometimes return raw data, sometimes wrapped
- No standard for list vs single resource responses

**Expected Outcome:**
- Consistent JSON structure for all responses
- Standard success/error wrappers
- Pagination format for lists
- Response metadata (timestamps, request IDs, version)
- Type-safe response models
- Frontend knows what to expect

---

## FILES TO MODIFY

### Backend Files (Create):
1. `/backend/models/response.py` - Response wrapper models
2. `/backend/utils/response_builder.py` - Response builder utilities

### Backend Files (Modify):
3. All `/backend/routers/*.py` - Use response wrappers
4. `/backend/main.py` - Add response middleware

### Frontend Files (Create):
5. `/frontend/src/lib/types/api.ts` - TypeScript response types

### Frontend Files (Modify):
6. `/frontend/src/lib/api/client.ts` - Handle standardized responses
7. All pages - Use standardized response structure

---

## IMPLEMENTATION

### Step 1: Create Response Models

**File:** `/backend/models/response.py`

```python
from typing import Generic, TypeVar, Optional, List, Any, Dict
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar('T')

class ResponseMetadata(BaseModel):
    """
    Metadata included in every API response
    """
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = None
    api_version: str = "1.0.0"
    execution_time_ms: Optional[float] = None


class SuccessResponse(BaseModel, Generic[T]):
    """
    Standard success response wrapper

    Usage:
        return SuccessResponse(data=user, message="User created successfully")
    """
    success: bool = True
    data: T
    message: Optional[str] = None
    metadata: ResponseMetadata = Field(default_factory=ResponseMetadata)

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {"id": 1, "name": "John Doe"},
                "message": "Operation completed successfully",
                "metadata": {
                    "timestamp": "2024-01-20T10:30:00Z",
                    "request_id": "req_abc123",
                    "api_version": "1.0.0"
                }
            }
        }


class ErrorResponse(BaseModel):
    """
    Standard error response wrapper

    Usage:
        return ErrorResponse(message="User not found", error_code="NOT_FOUND")
    """
    success: bool = False
    error: bool = True
    message: str
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    metadata: ResponseMetadata = Field(default_factory=ResponseMetadata)

    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "error": True,
                "message": "We couldn't find that resource",
                "error_code": "NOT_FOUND",
                "metadata": {
                    "timestamp": "2024-01-20T10:30:00Z",
                    "request_id": "req_abc123"
                }
            }
        }


class PaginationMeta(BaseModel):
    """
    Pagination metadata
    """
    page: int = Field(ge=1, description="Current page number")
    page_size: int = Field(ge=1, le=100, description="Items per page")
    total_items: int = Field(ge=0, description="Total number of items")
    total_pages: int = Field(ge=0, description="Total number of pages")
    has_next: bool = Field(description="Whether there are more pages")
    has_previous: bool = Field(description="Whether there are previous pages")


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Standard paginated response wrapper

    Usage:
        return PaginatedResponse(
            data=items,
            pagination=PaginationMeta(page=1, page_size=20, total_items=100)
        )
    """
    success: bool = True
    data: List[T]
    pagination: PaginationMeta
    message: Optional[str] = None
    metadata: ResponseMetadata = Field(default_factory=ResponseMetadata)

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": [{"id": 1}, {"id": 2}],
                "pagination": {
                    "page": 1,
                    "page_size": 20,
                    "total_items": 100,
                    "total_pages": 5,
                    "has_next": True,
                    "has_previous": False
                },
                "metadata": {
                    "timestamp": "2024-01-20T10:30:00Z"
                }
            }
        }


class BulkOperationResponse(BaseModel):
    """
    Response for bulk operations (create multiple, delete multiple, etc.)

    Usage:
        return BulkOperationResponse(
            success_count=8,
            failure_count=2,
            failures=[{"id": 5, "error": "Not found"}]
        )
    """
    success: bool = True
    success_count: int = Field(ge=0)
    failure_count: int = Field(ge=0)
    total_count: int = Field(ge=0)
    failures: Optional[List[Dict[str, Any]]] = None
    message: Optional[str] = None
    metadata: ResponseMetadata = Field(default_factory=ResponseMetadata)
```

---

### Step 2: Create Response Builder Utility

**File:** `/backend/utils/response_builder.py`

```python
from typing import TypeVar, List, Optional, Any, Dict
from backend.models.response import (
    SuccessResponse,
    ErrorResponse,
    PaginatedResponse,
    PaginationMeta,
    BulkOperationResponse
)
from fastapi.responses import JSONResponse
import math

T = TypeVar('T')

class ResponseBuilder:
    """
    Utility class for building standardized API responses
    """

    @staticmethod
    def success(
        data: Any,
        message: Optional[str] = None,
        status_code: int = 200
    ) -> JSONResponse:
        """
        Build success response

        Example:
            return ResponseBuilder.success(user, "User created successfully", 201)
        """
        response = SuccessResponse(data=data, message=message)

        return JSONResponse(
            content=response.dict(),
            status_code=status_code
        )

    @staticmethod
    def error(
        message: str,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        status_code: int = 400
    ) -> JSONResponse:
        """
        Build error response

        Example:
            return ResponseBuilder.error("User not found", "NOT_FOUND", status_code=404)
        """
        response = ErrorResponse(
            message=message,
            error_code=error_code,
            details=details
        )

        return JSONResponse(
            content=response.dict(),
            status_code=status_code
        )

    @staticmethod
    def paginated(
        data: List[Any],
        page: int,
        page_size: int,
        total_items: int,
        message: Optional[str] = None
    ) -> JSONResponse:
        """
        Build paginated response

        Example:
            return ResponseBuilder.paginated(
                data=items,
                page=1,
                page_size=20,
                total_items=100
            )
        """
        total_pages = math.ceil(total_items / page_size) if page_size > 0 else 0

        pagination = PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1
        )

        response = PaginatedResponse(
            data=data,
            pagination=pagination,
            message=message
        )

        return JSONResponse(content=response.dict())

    @staticmethod
    def bulk_operation(
        success_count: int,
        failure_count: int,
        failures: Optional[List[Dict[str, Any]]] = None,
        message: Optional[str] = None
    ) -> JSONResponse:
        """
        Build bulk operation response

        Example:
            return ResponseBuilder.bulk_operation(
                success_count=8,
                failure_count=2,
                failures=[{"id": 5, "error": "Not found"}],
                message="Processed 10 items"
            )
        """
        response = BulkOperationResponse(
            success_count=success_count,
            failure_count=failure_count,
            total_count=success_count + failure_count,
            failures=failures,
            message=message
        )

        return JSONResponse(content=response.dict())

    @staticmethod
    def created(data: Any, message: Optional[str] = None) -> JSONResponse:
        """Shortcut for 201 Created responses"""
        return ResponseBuilder.success(data, message, status_code=201)

    @staticmethod
    def no_content(message: Optional[str] = None) -> JSONResponse:
        """Shortcut for 204 No Content responses"""
        return ResponseBuilder.success(None, message, status_code=204)

    @staticmethod
    def not_found(resource: str) -> JSONResponse:
        """Shortcut for 404 Not Found responses"""
        return ResponseBuilder.error(
            message=f"We couldn't find that {resource}",
            error_code="NOT_FOUND",
            status_code=404
        )

    @staticmethod
    def unauthorized(message: str = "Please sign in to continue") -> JSONResponse:
        """Shortcut for 401 Unauthorized responses"""
        return ResponseBuilder.error(
            message=message,
            error_code="UNAUTHORIZED",
            status_code=401
        )

    @staticmethod
    def forbidden(message: str = "You don't have permission to do that") -> JSONResponse:
        """Shortcut for 403 Forbidden responses"""
        return ResponseBuilder.error(
            message=message,
            error_code="FORBIDDEN",
            status_code=403
        )

    @staticmethod
    def validation_error(details: Dict[str, Any]) -> JSONResponse:
        """Shortcut for 422 Validation Error responses"""
        return ResponseBuilder.error(
            message="We need a bit more information. Please check your input.",
            error_code="VALIDATION_ERROR",
            details=details,
            status_code=422
        )
```

---

### Step 3: Update Router to Use Response Wrappers

**File:** `/backend/routers/family.py` (example)

**Before:**
```python
@router.get("/members")
async def get_family_members(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    members = session.exec(
        select(FamilyMember).where(FamilyMember.user_id == current_user.id)
    ).all()
    return members  # Raw list
```

**After:**
```python
from backend.utils.response_builder import ResponseBuilder

@router.get("/members")
async def get_family_members(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
    page: int = 1,
    page_size: int = 20
):
    # Calculate pagination
    offset = (page - 1) * page_size

    # Get total count
    total_count = session.exec(
        select(func.count(FamilyMember.id))
        .where(FamilyMember.user_id == current_user.id)
    ).one()

    # Get paginated data
    members = session.exec(
        select(FamilyMember)
        .where(FamilyMember.user_id == current_user.id)
        .offset(offset)
        .limit(page_size)
    ).all()

    return ResponseBuilder.paginated(
        data=members,
        page=page,
        page_size=page_size,
        total_items=total_count
    )


@router.post("/members")
async def create_family_member(
    member: FamilyMember,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    member.user_id = current_user.id
    session.add(member)
    session.commit()
    session.refresh(member)

    return ResponseBuilder.created(
        data=member,
        message="Family member added successfully"
    )


@router.delete("/members/{member_id}")
async def delete_family_member(
    member_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    member = session.get(FamilyMember, member_id)

    if not member or member.user_id != current_user.id:
        return ResponseBuilder.not_found("family member")

    session.delete(member)
    session.commit()

    return ResponseBuilder.success(
        data=None,
        message="Family member removed successfully"
    )
```

---

### Step 4: Create Frontend Response Types

**File:** `/frontend/src/lib/types/api.ts`

```typescript
/**
 * Standard API response types matching backend
 */

export interface ResponseMetadata {
  timestamp: string;
  request_id?: string;
  api_version: string;
  execution_time_ms?: number;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  metadata: ResponseMetadata;
}

export interface ErrorResponse {
  success: false;
  error: true;
  message: string;
  error_code?: string;
  details?: Record<string, any>;
  metadata: ResponseMetadata;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  message?: string;
  metadata: ResponseMetadata;
}

export interface BulkOperationResponse {
  success: true;
  success_count: number;
  failure_count: number;
  total_count: number;
  failures?: Array<Record<string, any>>;
  message?: string;
  metadata: ResponseMetadata;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
```

---

### Step 5: Update Frontend API Client

**File:** `/frontend/src/lib/api/client.ts`

```typescript
import type { SuccessResponse, PaginatedResponse, ApiResponse } from '$lib/types/api';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${config.apiUrl}${endpoint}`;
  const auth = get(authStore);

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (auth.isAuthenticated && auth.token) {
    headers['Authorization'] = `Bearer ${auth.token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  // Parse standardized response
  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

/**
 * Helper to extract data from success response
 */
export function getData<T>(response: ApiResponse<T>): T {
  if (response.success) {
    return response.data;
  }
  throw new Error(response.message);
}

/**
 * Helper for paginated requests
 */
export async function apiRequestPaginated<T>(
  endpoint: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<T>> {
  const url = `${endpoint}?page=${page}&page_size=${pageSize}`;
  return apiRequest<T[]>(url) as Promise<PaginatedResponse<T>>;
}
```

---

### Step 6: Update Frontend Usage

**File:** `/frontend/src/routes/modules/family/+page.svelte` (example)

**Before:**
```typescript
const response = await apiRequest('/api/family/members');
familyMembers = await response.json();  // Unclear format
```

**After:**
```typescript
const response = await apiRequestPaginated<FamilyMember>(
  '/api/family/members',
  currentPage,
  pageSize
);

familyMembers = response.data;
pagination = response.pagination;

// Show success message if provided
if (response.message) {
  showToast(response.message);
}
```

---

## VALIDATION

### Pre-Commit Checks:

```bash
# Backend validation
cd backend
python -m pytest tests/test_response_models.py
python -m pytest tests/test_response_builder.py

# Test response models
python -c "from models.response import SuccessResponse, PaginatedResponse; print('✓ Response models valid')"

# Frontend validation
cd frontend
npm run check
npm run build

# Test TypeScript types
npm run type-check
```

---

## SUCCESS CRITERIA

- [ ] Response models created (Success, Error, Paginated, Bulk)
- [ ] ResponseBuilder utility with helper methods
- [ ] All endpoints return standardized responses
- [ ] Pagination implemented consistently
- [ ] Frontend TypeScript types match backend
- [ ] API client handles standardized responses
- [ ] Metadata included in all responses
- [ ] Success messages included where appropriate
- [ ] Error responses consistent with error handler

---

## TESTING

### Manual Testing:

1. **List Endpoint:**
   - Call `/api/family/members?page=1&page_size=20`
   - Verify response includes: data, pagination, metadata
   - Check pagination values: total_items, has_next, etc.

2. **Create Endpoint:**
   - Create new family member
   - Verify response includes: success=true, data, message
   - Check status code is 201

3. **Error Response:**
   - Try accessing non-existent resource
   - Verify response includes: success=false, error=true, message, error_code

### Automated Testing:

```python
# backend/tests/test_response_builder.py
from backend.utils.response_builder import ResponseBuilder

def test_success_response():
    response = ResponseBuilder.success({"id": 1}, "Success")
    data = response.body.decode()
    assert '"success": true' in data
    assert '"id": 1' in data

def test_paginated_response():
    response = ResponseBuilder.paginated(
        data=[{"id": 1}, {"id": 2}],
        page=1,
        page_size=20,
        total_items=100
    )
    data = json.loads(response.body)
    assert data['pagination']['total_pages'] == 5
    assert data['pagination']['has_next'] is True
```

```typescript
// frontend/tests/api.test.ts
import { getData } from '$lib/api/client';

test('extracts data from success response', () => {
  const response = {
    success: true,
    data: { id: 1, name: 'Test' },
    metadata: { timestamp: '2024-01-20', api_version: '1.0.0' }
  };

  const data = getData(response);
  expect(data).toEqual({ id: 1, name: 'Test' });
});
```

---

## ROLLBACK

### If Issues Occur:

```bash
# Remove response standardization
git checkout HEAD -- backend/models/response.py
git checkout HEAD -- backend/utils/response_builder.py
rm -rf backend/utils/response_builder.py

# Revert routers
git checkout HEAD -- backend/routers/

# Revert frontend
git checkout HEAD -- frontend/src/lib/types/api.ts
git checkout HEAD -- frontend/src/lib/api/client.ts
```

---

## COMMIT MESSAGE

```
feat(api): standardize API response format across all endpoints

Implement consistent JSON response structure with metadata and pagination.

Issues Fixed:
- Inconsistent response formats across endpoints
- No pagination format standard
- No response metadata
- Success/error responses varied by endpoint

Implementation:

Response Models:
- backend/models/response.py: Standard response wrappers
  - SuccessResponse: Generic success wrapper with data
  - ErrorResponse: Error wrapper with error_code
  - PaginatedResponse: List responses with pagination
  - BulkOperationResponse: Bulk operations with success/failure counts
  - ResponseMetadata: Timestamp, request_id, version

Response Builder:
- backend/utils/response_builder.py: Helper utilities
  - success(): Build success response
  - error(): Build error response
  - paginated(): Build paginated response
  - created(): Shortcut for 201 responses
  - not_found(): Shortcut for 404 responses

Pagination:
- Consistent pagination format across all list endpoints
- Includes: page, page_size, total_items, total_pages
- has_next and has_previous flags
- Query parameters: ?page=1&page_size=20

Response Metadata:
- Every response includes metadata
- Timestamp (ISO 8601)
- Request ID (for debugging)
- API version
- Execution time (optional)

Frontend Types:
- frontend/src/lib/types/api.ts: TypeScript interfaces
- Matches backend response models exactly
- Type-safe response handling

Frontend API Client:
- Updated to handle standardized responses
- getData() helper to extract data
- apiRequestPaginated() for list endpoints
- Type-safe request/response

Router Updates:
- All endpoints use ResponseBuilder
- Consistent success messages
- Paginated list endpoints
- Standard error responses

Examples:

Success Response:
{
  "success": true,
  "data": {"id": 1, "name": "John"},
  "message": "Family member added successfully",
  "metadata": {
    "timestamp": "2024-01-20T10:30:00Z",
    "api_version": "1.0.0"
  }
}

Paginated Response:
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 100,
    "total_pages": 5,
    "has_next": true,
    "has_previous": false
  },
  "metadata": {...}
}

Testing:
- Unit tests for response builders
- Integration tests for endpoints
- Frontend type checking
- Pagination logic tests

Impact:
- P2-MEDIUM: Improves consistency and developer experience
- Frontend knows what to expect
- Easy pagination implementation
- Better debugging with metadata
- Type-safe responses

Future Enhancements:
- HATEOAS links
- Response caching headers
- GraphQL support
- WebSocket responses

Closes: API response standardization
```

---

## NOTES

- Improves frontend/backend contract clarity
- Makes pagination trivial to implement
- Request IDs help with debugging
- Metadata useful for monitoring
- Type safety prevents errors

### Best Practices:
- Always include message for user feedback
- Use appropriate status codes (201, 204, etc.)
- Include request_id for support tickets
- Log metadata for monitoring
- Keep response size reasonable

### Pagination Guidelines:
- Default page_size: 20
- Max page_size: 100
- Always include total_items
- Provide has_next/has_previous for UX

---

**READY TO EXECUTE**

Claude: Read this specification and execute after error handling is implemented.
