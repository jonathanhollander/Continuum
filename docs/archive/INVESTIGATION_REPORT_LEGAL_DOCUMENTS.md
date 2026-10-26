# Investigation Report #001
**Date**: 2026-01-26 | **URL**: http://localhost:5173/modules/legal-documents | **Status**: Analysis Complete

## Executive Summary
- **Issue**: "Legal Documents" page appears but fails to load/save documents
- **Root Cause**: FastAPI router registration order conflict - generic route captures requests before specific route
- **Impact**: Users cannot create, view, update, or delete legal documents in the Document Vault
- **Issues Found**: 1 critical backend routing issue

## Context Discovered
- **Application Type**: End-of-life planning SaaS (Continuum)
- **Technologies**: SvelteKit 5 (frontend) + FastAPI (backend) + SQLModel + SQLite/PostgreSQL
- **Intended Functionality**:
  - Document Vault module allows users to upload and manage legal documents (wills, trusts, deeds, insurance)
  - Frontend uses SyncManager pattern for optimistic updates with server sync
  - Backend provides CRUD API at `/api/data/vault_documents`

## Browser Evidence

### API Response
```
GET http://localhost:8000/api/data/vault_documents
Response: 400 Bad Request
{
  "error": {
    "message": "Invalid type: vault_documents",
    "code": "HTTP_ERROR",
    "details": {},
    "timestamp": "2026-01-26T17:10:11.449630"
  },
  "_technical": "HTTP 400: Invalid type: vault_documents"
}
```

### Server Status
- Frontend: Running on http://localhost:5173 (SvelteKit dev server)
- Backend: Running on http://localhost:8000 (FastAPI - healthy)
- Authentication: Working (dev bypass login successful)

### Visual Evidence
- Page renders with header "Document Vault - The secure home for your legal life"
- Shows "Peace of Mind Score: 100%" (because no documents detected)
- Empty state shows "Let's secure your first document" with ghost rows
- Data sync silently fails (no visible error to user due to SyncManager's optimistic pattern)

## Root Cause Analysis

### Primary Issue: Router Registration Order Conflict

**Location**: `/Users/jonathanhollander/AI Code/Notion Template/Continuum_SaaS/backend/main.py`

**Technical Explanation**:

1. Two routers handle `/api/data/*` routes:
   - `estate_data.router` - prefix: `/api/data` - has generic route `/{data_type}`
   - `documents.router` - prefix: `/api/data/vault_documents` - specific document routes

2. In `main.py`, routers are registered in this order (lines 113-125):
   ```python
   app.include_router(estate_data.router)  # Line 117 - FIRST
   ...
   app.include_router(documents.router)    # Line 125 - LAST
   ```

3. When a request arrives for `/api/data/vault_documents`:
   - FastAPI checks `estate_data.router` first (registered first)
   - Route `/{data_type}` matches with `data_type = "vault_documents"`
   - The generic handler checks `MODEL_MAP` for `vault_documents`
   - `vault_documents` is NOT in `MODEL_MAP` (it has `documents` instead)
   - Returns 400: "Invalid type: vault_documents"

4. The specific `documents.router` never gets a chance to handle the request.

### Evidence in Code

**estate_data.py (lines 106-136)**:
```python
MODEL_MAP = {
    ...
    "documents": Document,  # Note: "documents" NOT "vault_documents"
    ...
}
```

**estate_data.py (lines 189-196)**:
```python
@router.get("/{data_type}", summary="Get estate items", response_model=List[Any])
def get_items(data_type: str, ...):
    model = MODEL_MAP.get(data_type)
    if not model:
        raise HTTPException(status_code=400, detail=f"Invalid type: {data_type}")
```

**documents.py (line 9)**:
```python
router = APIRouter(prefix="/api/data/vault_documents", tags=["documents"])
```

### Why This Matters
- Users uploading critical legal documents (wills, trusts) will lose their work
- The error is silent on the frontend (optimistic updates appear to succeed)
- This affects a high-value module for end-of-life planning users

## Investigation Steps

1. Verified frontend serves `/modules/legal-documents` page correctly
2. Verified backend health endpoint returns healthy status
3. Obtained auth token using dev bypass (`jh@continuum.estate`)
4. Tested API endpoint `/api/data/vault_documents` with valid auth token
5. Received 400 error: "Invalid type: vault_documents"
6. Traced error to `estate_data.py` generic handler
7. Identified `MODEL_MAP` does not contain `vault_documents` key
8. Discovered router registration order in `main.py` causes route conflict
9. Verified `documents.router` exists but is registered after `estate_data.router`

## Files Involved

| File | Purpose | Issue |
|------|---------|-------|
| `backend/main.py` | App configuration & router registration | Wrong router order |
| `backend/routers/estate_data.py` | Generic data CRUD | Catches requests meant for documents.router |
| `backend/routers/documents.py` | Document-specific CRUD | Never receives requests |
| `frontend/src/lib/components/archetypes/DocumentVault.svelte` | UI component | Correctly requests `vault_documents` endpoint |
| `frontend/src/lib/services/sync.svelte.ts` | Data synchronization | Correctly handles API errors |

---

## Appendix: Solution Options

### Option A: Reorder Router Registration (Recommended)
Move `documents.router` registration BEFORE `estate_data.router` in main.py.

**Pros**: Minimal change, follows FastAPI best practices (specific routes before generic)
**Cons**: Need to audit other specific routers for similar issues

### Option B: Add vault_documents to MODEL_MAP
Add `"vault_documents": Document` to the MODEL_MAP in estate_data.py.

**Pros**: Simple one-line change
**Cons**: Creates redundant routing, documents.router becomes dead code

### Option C: Rename Frontend Endpoint
Change DocumentVault.svelte to use `documents` instead of `vault_documents`.

**Pros**: Works with existing MODEL_MAP
**Cons**: Breaking change for any existing local storage data, requires data migration
